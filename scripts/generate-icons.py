#!/usr/bin/env python3
"""Generate Chrome extension icons from the supplied DevLocator logo."""

from pathlib import Path
import subprocess

project_dir = Path(__file__).resolve().parent.parent
logo = project_dir / 'assets' / 'Logo.png'
output_dir = project_dir / 'public' / 'icons'
output_dir.mkdir(parents=True, exist_ok=True)

for size in (16, 32, 48, 128):
    subprocess.run([
        'ffmpeg', '-v', 'error', '-i', str(logo),
        '-vf', f'crop=760:760:388:132,scale={size}:{size}:flags=lanczos',
        '-frames:v', '1', '-y', str(output_dir / f'icon-{size}.png'),
    ], check=True)

print('DevLocator icons generated.')
