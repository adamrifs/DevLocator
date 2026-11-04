#!/usr/bin/env python3
"""
Validates DevLocator Native Messaging Host sanitization and security logic.
"""
import sys
import os

# Import companion module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../native-companion')))
from devlocator_host import sanitize_and_validate, WHITELISTED_IDES, find_executable

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

print(f"\n============================")
print(f"Results: {passed} passed, {failed} failed")
print(f"============================\n")

if failed > 0:
    sys.exit(1)

