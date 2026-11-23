#!/usr/bin/env python3
"""
Validates DevLocator Native Messaging Host sanitization and security logic.
"""
import sys
import os
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import Mock, patch

# Import companion module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../native-companion')))
from devlocator_host import sanitize_and_validate, find_executable, launch_editor
from project_source import find_project_source

passed = 0
failed = 0

def test(name, fn):
    global passed, failed
    try:
        fn()
        print(f"  ✓ {name}")
        passed += 1
    except Exception as e:
        print(f"  ✗ {name}")
        print(f"    {e}")
        failed += 1

print("\n=== Native Companion Security Test Suite ===\n")

def test_valid_payload():
    valid, err, data = sanitize_and_validate({
        'file': '/home/user/project/src/App.tsx',
        'line': 42,
        'column': 10,
        'ide': 'antigravity'
    })
    assert valid is True
    assert data['line'] == 42
    assert data['column'] == 10
    assert data['ide'] == 'antigravity'
test("Accepts clean, valid file and line payload", test_valid_payload)

def test_command_injection():
    injection_payloads = [
        "/tmp/file.ts; rm -rf /",
        "/tmp/file.ts && cat /etc/passwd",
        "/tmp/file.ts | whoami",
        "/tmp/`id`.ts",
        "/tmp/$(whoami).ts",
        "/tmp/file\nls",
    ]
    for bad_path in injection_payloads:
        valid, err, data = sanitize_and_validate({'file': bad_path})
        assert valid is False, f"Failed to reject: {bad_path}"
test("Strictly blocks command injection vectors in file paths", test_command_injection)

def test_ide_whitelist():
    valid, err, data = sanitize_and_validate({
        'file': '/tmp/test.js',
        'ide': 'evil_shell_command'
    })
    assert valid is True
    assert data['ide'] == 'antigravity', f"Expected fallback to 'antigravity', got {data['ide']}"
test("Enforces IDE whitelist and safely defaults unknown editors", test_ide_whitelist)

def test_invalid_line_col():
    valid, err, data = sanitize_and_validate({
        'file': '/tmp/test.js',
        'line': -5,
        'column': 0
    })
    assert valid is True
    assert data['line'] == 1
    assert data['column'] == 1
test("Normalizes non-positive line and column numbers to 1", test_invalid_line_col)

def test_antigravity_cli_wrapper():
    with TemporaryDirectory() as directory:
        binary = Path(directory) / 'antigravity-ide'
        wrapper = binary.parent / 'bin' / binary.name
        wrapper.parent.mkdir()
        for executable in (binary, wrapper):
            executable.touch(mode=0o755)
        with patch('devlocator_host.get_binary_from_desktop', return_value=str(binary)):
            assert find_executable('antigravity') == str(wrapper)
test("Prefers the Antigravity CLI wrapper paired with the desktop executable", test_antigravity_cli_wrapper)

def test_launch_uses_selected_editor():
    for ide, executable in {
        'vscode': '/usr/bin/code',
        'cursor': '/usr/bin/cursor',
        'antigravity': '/usr/bin/antigravity-ide',
    }.items():
        file = str(Path(__file__).resolve())
        payload = {'file': file, 'line': 42, 'column': 10, 'ide': ide}
        process = Mock()
        process.wait.return_value = 0
        with (
            patch('devlocator_host.find_executable', return_value=executable) as find,
            patch('devlocator_host.subprocess.Popen', return_value=process) as launch,
        ):
            assert launch_editor(payload)[0]
            find.assert_called_once_with(ide)
            assert launch.call_args.args[0] == [executable, '--goto', f'{file}:42:10']

test("Passes the source location to the selected editor's executable", test_launch_uses_selected_editor)

def test_missing_editor_does_not_fall_back():
    payload = {'file': __file__, 'line': 1, 'column': 1, 'ide': 'vscode'}
    with (
        patch('devlocator_host.find_executable', return_value=None),
        patch('devlocator_host.subprocess.Popen') as launch,
    ):
        success, message = launch_editor(payload)
        assert not success
        assert 'VS Code could not be found' in message
        launch.assert_not_called()

test("Unavailable VS Code reports an error without launching a URL handler", test_missing_editor_does_not_fall_back)

def test_project_template_search():
    templates = {
        'resources/views/cart.blade.php': '<button id="checkout" class="primary">{{ $label }}</button>',
        'shop/templates/product.html': '<button data-testid="add-item">{{ label }}</button>',
        'src/app/menu.component.html': '<nav aria-label="Main menu">{{ title }}</nav>',
        'src/App.vue': '<section class="hero">Welcome &amp; enjoy</section>',
        'src/App.svelte': '<main class="dashboard">{title}</main>',
        'src/App.tsx': '<button className={"save-button"}>Save</button>',
        'public/index.html': '<a class="learn-more" href="/docs">Learn more</a>',
        'public/main.js': 'const link = document.createElement("a");\nlink.id = "js-link";',
    }
    with TemporaryDirectory() as directory:
        root = Path(directory)
        for name, source in templates.items():
            path = root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('\n  ' + source, encoding='utf-8')

        targets = [
            ('button', {'id': 'checkout'}, ['primary'], 'Checkout'),
            ('button', {'data-testid': 'add-item'}, [], 'Add item'),
            ('nav', {'aria-label': 'Main menu'}, [], ''),
            ('section', {}, ['hero'], 'Welcome & enjoy'),
            ('main', {}, ['dashboard'], 'Home'),
            ('button', {}, ['save-button'], 'Save'),
            ('a', {}, ['learn-more'], 'Learn more'),
            ('a', {'id': 'js-link'}, [], ''),
        ]
        for name, (tag, attrs, classes, text) in zip(templates, targets):
            result = find_project_source({
                'projectRoot': directory, 'pagePath': '/cart',
                'element': {'tag': tag, 'attributes': attrs, 'classes': classes, 'text': text},
            })
            assert result.get('location') == {'file': str(root / name), 'line': 2, 'column': 3}, result

test('Finds markup in Blade, Django, Angular, Vue, Svelte, JSX, HTML and JavaScript files', test_project_template_search)

def test_local_file_search():
    with TemporaryDirectory() as directory:
        path = Path(directory) / 'my page.html'
        path.write_text('<button>First</button>\n<!-- <button>Second</button> -->\n<button>Second</button>')
        result = find_project_source({
            'localFile': True, 'pagePath': path.as_uri().removeprefix('file://'),
            'element': {'tag': 'button', 'text': 'Second'},
        })
        assert result.get('location') == {'file': str(path), 'line': 3, 'column': 1}, result

test('Locates an element directly in the HTML file opened by Chrome', test_local_file_search)

def test_ambiguous_project_search():
    with TemporaryDirectory() as directory, TemporaryDirectory() as outside:
        root = Path(directory)
        external = Path(outside) / 'external.html'
        external.write_text('<button id="target">Click</button>')
        (root / 'external.html').symlink_to(external)
        vendor = root / 'vendor'
        vendor.mkdir()
        (vendor / 'dependency.html').write_text(external.read_text())
        request = {'projectRoot': directory, 'element': {'tag': 'button', 'attributes': {'id': 'target'}}}
        assert 'No matching' in find_project_source(request)['error']
        (root / 'one.html').write_text(external.read_text())
        (root / 'two.html').write_text(external.read_text())
        assert 'Several' in find_project_source(request)['error']
        valid, _, data = sanitize_and_validate({'file': 'one.html', 'projectRoot': directory})
        assert valid and data['file'] == str(root / 'one.html')
        for path in ('external.html', '../outside.html'):
            assert not sanitize_and_validate({'file': path, 'projectRoot': directory})[0]

test('Rejects tied matches and keeps project-relative lookup inside the configured folder', test_ambiguous_project_search)

def test_duplicate_images_use_ancestor_context():
    with TemporaryDirectory() as directory:
        root = Path(directory)
        navbar = root / 'navbar.html'
        footer = root / 'footer.html'
        image = '<img class="brand-name" src="logo.png">'
        navbar.write_text(f'<header><a><span><img src="icon.png">\n  {image}</span></a></header>')
        footer.write_text(f'<footer><a><span>\n  {image}</span></a></footer>')
        element = {'tag': 'img', 'classes': ['brand-name']}
        request = {'projectRoot': directory, 'pagePath': '/', 'element': element}
        assert 'Several' in find_project_source(request)['error']

        for tag, path in (('header', navbar), ('footer', footer)):
            element['ancestors'] = [{'tag': 'span'}, {'tag': 'a'}, {'tag': tag}]
            result = find_project_source(request)
            assert result.get('location') == {'file': str(path), 'line': 2, 'column': 3}, result

        footer.write_text(navbar.read_text())
        element['ancestors'][-1] = {'tag': 'header'}
        assert 'Several' in find_project_source(request)['error']

test('Uses the surrounding HTML to distinguish identical images in shared components', test_duplicate_images_use_ancestor_context)

print(f"\n============================")
print(f"Results: {passed} passed, {failed} failed")
print(f"============================\n")

if failed > 0:
    sys.exit(1)

