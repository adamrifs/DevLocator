#!/usr/bin/env python3
"""
DevLocator Chrome Native Messaging Host (Linux companion)
Receives open-in-IDE commands from the DevLocator Chrome extension and launches
the user's chosen editor (Antigravity, VS Code, Cursor) at the exact file, line, and column.
"""

import sys
import os
import json
import struct
import shutil
import subprocess

EDITOR_NAMES = {'antigravity': 'Antigravity', 'vscode': 'VS Code', 'cursor': 'Cursor'}
WHITELISTED_IDES = EDITOR_NAMES.keys()

def send_message(message_dict):
    """Encodes and writes length-prefixed JSON message to stdout."""
    try:
        encoded = json.dumps(message_dict).encode('utf-8')
        sys.stdout.buffer.write(struct.pack('<I', len(encoded)))
        sys.stdout.buffer.write(encoded)
        sys.stdout.buffer.flush()
    except Exception as e:
        sys.stderr.write(f"[DevLocator Host] Failed to send message: {e}\n")

def read_message():
    """Reads length-prefixed JSON message from stdin."""
    try:
        raw_length = sys.stdin.buffer.read(4)
        if len(raw_length) < 4:
            return None
        message_length = struct.unpack('<I', raw_length)[0]
        if message_length == 0 or message_length > 10 * 1024 * 1024:
            return None
        raw_data = sys.stdin.buffer.read(message_length)
        return json.loads(raw_data.decode('utf-8'))
    except Exception as e:
        sys.stderr.write(f"[DevLocator Host] Error reading message: {e}\n")
        return None

def get_binary_from_desktop(desktop_name):
    """Extracts the executable path from a .desktop file."""
    for base in ['~/.local/share/applications', '/usr/share/applications', '/usr/local/share/applications']:
        path = os.path.expanduser(os.path.join(base, desktop_name))
        if os.path.isfile(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.startswith('Exec='):
                            cmd_part = line[5:].strip()
                            if cmd_part.startswith('"'):
                                end = cmd_part.find('"', 1)
                                if end != -1:
                                    bin_path = cmd_part[1:end]
                                    if os.path.exists(bin_path):
                                        return bin_path
                            else:
                                bin_path = cmd_part.split()[0]
                                if os.path.exists(bin_path):
                                    return bin_path
            except Exception:
                pass
    return None

def find_executable(ide_name):
    """Locates the binary executable for the given IDE."""
    candidates = []

    if ide_name == 'vscode':
        candidates = [
            'code',
            get_binary_from_desktop('code.desktop'),
            '/usr/bin/code',
            '/snap/bin/code',
            '/usr/local/bin/code',
            os.path.expanduser('~/.local/bin/code'),
        ]
    elif ide_name == 'cursor':
        candidates = [
            'cursor',
            get_binary_from_desktop('cursor.desktop'),
            '/usr/bin/cursor',
            '/snap/bin/cursor',
            os.path.expanduser('~/.local/bin/cursor'),
            '/opt/Cursor/cursor',
        ]
    elif ide_name == 'antigravity':
        candidates = [
            # Check dynamic desktop file on host
            get_binary_from_desktop('antigravity-ide.desktop'),
            get_binary_from_desktop('antigravity.desktop'),
            os.path.expanduser('~/Downloads/Antigravity IDE/antigravity-ide'),
            os.path.expanduser('~/Downloads/Antigravity/antigravity'),
            'antigravity-ide',
            'antigravity',
            '/usr/bin/antigravity-ide',
            '/usr/bin/antigravity',
            os.path.expanduser('~/.local/bin/antigravity-ide'),
            os.path.expanduser('~/.local/bin/antigravity'),
            os.path.expanduser('~/.gemini/bin/agy'),
        ]

    for candidate in candidates:
        if not candidate:
            continue
        if candidate.startswith('/'):
            if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
                if ide_name == 'antigravity':
                    directory, name = os.path.split(os.path.realpath(candidate))
                    wrapper = os.path.join(directory, 'bin', name)
                    if os.path.isfile(wrapper) and os.access(wrapper, os.X_OK):
                        return wrapper
                return candidate
        else:
            found = shutil.which(candidate)
            if found:
                return found

    return None

def sanitize_and_validate(payload):
    """Validates and sanitizes message payload from extension."""
    if not isinstance(payload, dict):
        return False, "Payload must be a JSON object", None

    file_path = payload.get('file')
    if not file_path or not isinstance(file_path, str):
        return False, "Missing or invalid 'file' path", None

    # Strict check against command injection characters
    forbidden_chars = [';', '&', '|', '`', '$', '<', '>', '\n', '\r', '\0']
    if any(char in file_path for char in forbidden_chars):
        return False, "Illegal characters detected in file path", None

    # Validate line and column
    try:
        line = int(payload.get('line', 1))
        column = int(payload.get('column', 1))
        if line < 1:
            line = 1
        if column < 1:
            column = 1
    except (ValueError, TypeError):
        return False, "Invalid line or column number", None

    ide = str(payload.get('ide', 'antigravity')).lower()
    if ide not in WHITELISTED_IDES:
        ide = 'antigravity'

    # Resolve relative path if within current working directory or user home
    clean_path = os.path.expanduser(file_path)
    if not os.path.isabs(clean_path):
        clean_path = os.path.abspath(clean_path)

    return True, "", {
        'file': clean_path,
        'line': line,
        'column': column,
        'ide': ide,
    }

def launch_editor(clean_payload):
    """Launches the selected editor at the specified file, line, and column."""
    ide = clean_payload['ide']
    file_path = clean_payload['file']
    line = clean_payload['line']
    column = clean_payload['column']

    if not os.path.isfile(file_path):
        return False, f"Source file does not exist at {file_path}"

    editor_name = EDITOR_NAMES[ide]
    binary = find_executable(ide)
    if not binary:
        return False, f"{editor_name} could not be found. Install it or make its command available to DevLocator."

    location_arg = f"{file_path}:{line}:{column}"
    location_label = f"{os.path.basename(file_path)}:{line}:{column}"
    env = os.environ.copy()
    # Use the selected CLI's local instance even if Chrome was started from an IDE terminal.
    env.pop('VSCODE_IPC_HOOK_CLI', None)

    try:
        process = subprocess.Popen(
            [binary, '--goto', location_arg],
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        if process.wait(timeout=2) == 0:
            return True, f"Sent to {editor_name} at {location_label}"
    except subprocess.TimeoutExpired:
        return True, f"Launch started for {editor_name} at {location_label}"
    except OSError as error:
        return False, f"Could not start {editor_name}. {error.strerror or error}"

    return False, f"{editor_name} did not accept the request to open {location_label}."

def main():
    while True:
        message = read_message()
        if message is None:
            break

        valid, error_msg, clean_data = sanitize_and_validate(message)
        if not valid:
            send_message({'success': False, 'error': error_msg})
            continue

        success, launch_msg = launch_editor(clean_data)
        if success:
            send_message({'success': True, 'message': launch_msg})
        else:
            send_message({'success': False, 'error': launch_msg})

if __name__ == '__main__':
    main()

