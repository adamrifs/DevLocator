"""Find likely markup for an inspected element inside a local project."""

import html
from html.parser import HTMLParser
import os
from pathlib import Path
import re
import stat
from time import monotonic
from urllib.parse import unquote

HTML_SUFFIXES = {'.html', '.htm', '.xhtml'}
SOURCE_SUFFIXES = HTML_SUFFIXES | {
    '.astro', '.aspx', '.cshtml', '.ctp', '.ejs', '.erb', '.go', '.gsp', '.handlebars',
    '.hbs', '.heex', '.jinja', '.jinja2', '.js', '.jsp', '.jsx', '.liquid', '.mdx',
    '.mjs', '.mts', '.njk', '.php', '.phtml', '.py', '.razor', '.rb', '.rs',
    '.svelte', '.ts', '.tsx', '.twig', '.vue',
}
SKIP_DIRECTORIES = {
    'bower_components', 'build', 'coverage', 'dist', 'node_modules',
    'target', 'vendor', 'venv', '__pycache__',
}
MAX_FILE_BYTES = 512 * 1024
MAX_PROJECT_BYTES = 24 * 1024 * 1024
MAX_PROJECT_ENTRIES = 12000

MARKUP = re.compile(
    r'<!--.*?(?:-->|\Z)|\{#.*?(?:#\}|\Z)|\{\{--.*?(?:--\}\}|\Z)|'
    r'<(?P<tag>[a-z][\w:-]*)(?=[\s/>])(?P<attributes>(?:"[^"]*"|\'[^\']*\'|[^"\'<>])*)>',
    re.IGNORECASE | re.DOTALL,
)
ATTRIBUTE = re.compile(
    r'''(?:^|\s)([\w:-]+)\s*=\s*(?:["']([^"']*)["']|\{\s*["']([^"']*)["']\s*\}|([^\s"'`=<>\{\}]+))'''
)
ATTRIBUTE_WEIGHTS = {'id': 10, 'name': 5, 'data-testid': 10, 'data-test': 10, 'data-cy': 10, 'aria-label': 6}
JS_SUFFIXES = {'.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx'}
DOM_CREATION_SUFFIXES = JS_SUFFIXES | HTML_SUFFIXES
VOID_TAGS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
JS_ELEMENT = re.compile(r'''\b(?:const|let|var)\s+(?P<name>[$\w]+)\s*=\s*document\.createElement\(\s*(['"])(?P<tag>[\w:-]+)\2\s*\)''')


def resolve_project_root(raw_root):
    if not isinstance(raw_root, str) or not raw_root.strip():
        return None
    try:
        path = Path(raw_root).expanduser()
        if not path.is_absolute():
            return None
        path = path.resolve(strict=True)
        if path.is_dir() and path != Path(path.anchor) and path != Path.home().resolve():
            return path
    except (OSError, RuntimeError, ValueError):
        pass
    return None


def read_source(path):
    try:
        info = path.lstat()
        if not stat.S_ISREG(info.st_mode) or info.st_size > MAX_FILE_BYTES:
            return ''
        with path.open('rb') as source:
            data = source.read(MAX_FILE_BYTES + 1)
        if len(data) <= MAX_FILE_BYTES and b'\x00' not in data:
            return data.decode('utf-8-sig')
    except (OSError, ValueError, UnicodeError):
        pass
    return ''


def compact_text(value):
    return ' '.join(html.unescape(value).split())


def match_score(values, attributes, classes, source_text, text):
    if values.get('id') and attributes.get('id') and values['id'] != attributes['id']:
        return None
    source_classes = set(values.get('class', values.get('classname', '')).split())
    score = min(8, 3 * len(classes & source_classes))
    for key, weight in ATTRIBUTE_WEIGHTS.items():
        if attributes.get(key) and values.get(key) == attributes[key]:
            score += weight
    if text and compact_text(source_text) == text:
        score += 6
    return score


def find_markup(source, element, search_js=False):
    tag = element.get('tag')
    if not isinstance(tag, str) or not re.fullmatch(r'[a-z][\w:-]{0,79}', tag):
        return
    attributes = element.get('attributes')
    if not isinstance(attributes, dict):
        attributes = {}
    classes = element.get('classes')
    classes = {value for value in classes[:24] if isinstance(value, str)} if isinstance(classes, list) else set()
    text = element.get('text')
    text = compact_text(text[:160]) if isinstance(text, str) else ''

    for match in MARKUP.finditer(source):
        source_tag = match.group('tag')
        if not source_tag or source_tag.lower() != tag:
            continue

        values = {}
        for attribute in ATTRIBUTE.finditer(match.group('attributes')):
            name, *options = attribute.groups()
            values[name.lower()] = html.unescape(next(value for value in options if value is not None))
        following = source[match.end():match.end() + 220].split('<', 1)[0] if text else ''
        score = match_score(values, attributes, classes, following, text)
        if score is not None:
            yield score, match.start()

    if not search_js:
        return

    for match in JS_ELEMENT.finditer(source):
        if match.group('tag').lower() != tag:
            continue
        name = re.escape(match.group('name'))
        assignments = re.finditer(
            rf'''(?<![\w$]){name}\.(id|className|textContent|innerText)\s*=\s*(['"])([^\n]*?)\2''',
            source[match.end():match.end() + 700],
        )
        values = {assignment[1].lower(): assignment[3] for assignment in assignments}
        score = match_score(values, attributes, classes, values.get('textcontent', values.get('innertext', '')), text)
        if score:
            yield score, match.start()


class MarkupContext(HTMLParser):
    def __init__(self, source, offsets, ancestors):
        super().__init__()
        self.offsets = offsets
        self.ancestors = ancestors
        self.line_starts = [0, *(match.end() for match in re.finditer('\n', source))]
        self.parents = []
        self.scores = {}
        self.feed(source)
        self.close()

    def handle_starttag(self, tag, attrs):
        self.handle_startendtag(tag, attrs)
        if tag not in VOID_TAGS:
            self.parents.append((tag, dict(attrs)))

    def handle_startendtag(self, tag, attrs):
        line, column = self.getpos()
        offset = self.line_starts[line - 1] + column
        if offset not in self.offsets:
            return

        score = 0
        for (source_tag, values), ancestor in zip(reversed(self.parents), self.ancestors):
            if source_tag != ancestor.get('tag'):
                break
            source_id = values.get('id')
            ancestor_id = ancestor.get('id')
            if source_id and ancestor_id and source_id != ancestor_id:
                break
            classes = ancestor.get('classes')
            shared = 0
            if isinstance(classes, list):
                expected = {name for name in classes[:12] if isinstance(name, str)}
                shared = len(expected & set((values.get('class') or '').split()))
            score += 1 + min(shared, 3) + (6 if source_id and source_id == ancestor_id else 0)
        self.scores[offset] = score

    def handle_endtag(self, tag):
        for index in range(len(self.parents) - 1, -1, -1):
            if self.parents[index][0] == tag:
                del self.parents[index:]
                break


def ranked_matches(path, source, element):
    suffix = path.suffix.lower()
    matches = list(find_markup(source, element, search_js=suffix in DOM_CREATION_SUFFIXES))
    scores = {}
    ancestors = element.get('ancestors')
    if matches and suffix in HTML_SUFFIXES and isinstance(ancestors, list) and ancestors:
        offsets = {offset for _, offset in matches}
        context = [ancestor for ancestor in ancestors[:8] if isinstance(ancestor, dict)]
        try:
            scores = MarkupContext(source, offsets, context).scores
        except AssertionError:
            # Template fragments can contain declarations that HTMLParser rejects.
            pass
    return [(score, scores.get(offset, 0), offset) for score, offset in matches]


def project_files(root, deadline):
    pending = [root]
    entries = 0
    while pending:
        with os.scandir(pending.pop()) as directory:
            for item in directory:
                entries += 1
                if entries > MAX_PROJECT_ENTRIES or monotonic() > deadline:
                    raise TimeoutError
                if item.name.startswith('.'):
                    continue
                if item.is_dir(follow_symlinks=False) and item.name not in SKIP_DIRECTORIES:
                    pending.append(Path(item.path))
                elif Path(item.name).suffix.lower() in SOURCE_SUFFIXES and item.is_file(follow_symlinks=False):
                    yield Path(item.path)


def source_location(path, source, offset):
    return {
        'location': {
            'file': str(path),
            'line': source.count('\n', 0, offset) + 1,
            'column': offset - source.rfind('\n', 0, offset),
        },
    }


def find_project_source(message):
    element = message.get('element')
    if not isinstance(element, dict):
        return {'error': 'Invalid element details.'}
    page_path = message.get('pagePath')
    page_path = unquote(page_path) if isinstance(page_path, str) else ''
    root = resolve_project_root(message.get('projectRoot'))

    if message.get('localFile') is True and page_path.startswith('/') and '\0' not in page_path:
        path = Path(page_path)
        if path.suffix.lower() in HTML_SUFFIXES:
            source = read_source(path)
            matches = sorted(ranked_matches(path, source, element), reverse=True)
            if matches and (len(matches) == 1 or matches[0][:2] > matches[1][:2]):
                return source_location(path, source, matches[0][2])

    if root is None:
        if message.get('projectRoot'):
            return {'error': 'Set an existing absolute project folder in DevLocator Settings.'}
        return {'error': 'Set a local project folder for this site in DevLocator Settings.'}

    route = page_path.lstrip('/')
    direct_paths = set()
    if '..' not in Path(route).parts and '\0' not in route:
        if Path(route).suffix.lower() in HTML_SUFFIXES:
            direct_paths = {root / base / route for base in ('', 'public', 'static')}
        elif not Path(route).suffix:
            direct_paths = {root / base / route / 'index.html' for base in ('', 'public', 'static')}

    best_rank = (0, 0)
    best_result = None
    ambiguous = False
    remaining_bytes = MAX_PROJECT_BYTES
    deadline = monotonic() + 2
    try:
        for path in project_files(root, deadline):
            source = read_source(path)
            remaining_bytes -= len(source)
            if remaining_bytes < 0:
                raise TimeoutError
            matches = ranked_matches(path, source, element)
            for score, context_score, offset in matches:
                if path in direct_paths and (score or len(matches) == 1):
                    score += 1
                rank = (score, context_score)
                if not score or rank < best_rank:
                    continue
                if rank == best_rank:
                    ambiguous = True
                    continue
                best_rank = rank
                best_result = source_location(path, source, offset)
                ambiguous = False
    except TimeoutError:
        return {'error': 'Project search hit its limit. Choose a smaller project folder or add source metadata.'}
    except OSError:
        return {'error': 'DevLocator could not read the project folder.'}

    if ambiguous:
        return {'error': 'Several source locations match. Add source metadata to identify this element.'}
    return best_result or {'error': 'No matching markup found in the project. Add source metadata for this element.'}
