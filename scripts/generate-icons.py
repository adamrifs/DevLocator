import zlib
import struct
import os

def create_png(width, height, draw_fn):
    # RGBA format
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # Filter type 0: None
        for x in range(width):
            r, g, b, a = draw_fn(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(chunk(b'IHDR', ihdr_data))
    # IDAT
    compressed = zlib.compress(bytes(raw_data), 9)
    png.extend(chunk(b'IDAT', compressed))
    # IEND
    png.extend(chunk(b'IEND', b''))
    return bytes(png)

def draw_icon(x, y, w, h):
    # Normalized coords from -1 to 1
    nx = (x / (w - 1.0)) * 2.0 - 1.0
    ny = (y / (h - 1.0)) * 2.0 - 1.0
    dist = (nx*nx + ny*ny)**0.5
    
    # Background rounded rect
    corner = max(abs(nx), abs(ny))
    if abs(nx) > 0.85 or abs(ny) > 0.85:
        if (abs(nx) - 0.7)**2 + (abs(ny) - 0.7)**2 > 0.3**2 and (abs(nx) > 0.7 and abs(ny) > 0.7):
            return (0, 0, 0, 0)

    # Base background: Deep dark slate (#0f172a)
    bg_r, bg_g, bg_b = 15, 23, 42
    
    # Outer ring / crosshair circle: cyan (#38bdf8)
    # Circle radius around 0.55, thickness 0.12
    ring = abs(dist - 0.55) < 0.12
    # Crosshair ticks: horizontal and vertical lines with a center gap
    crosshair_h = abs(ny) < 0.08 and (0.25 < abs(nx) < 0.85)
    crosshair_v = abs(nx) < 0.08 and (0.25 < abs(ny) < 0.85)
    # Center dot: radius 0.15
    center_dot = dist < 0.18
    
    if ring or crosshair_h or crosshair_v or center_dot:
        # Sky blue #38bdf8 -> (56, 189, 248)
        return (56, 189, 248, 255)
    
    return (bg_r, bg_g, bg_b, 255)

os.makedirs('/home/adam/Documents/DevLocator/public/icons', exist_ok=True)
for size in [16, 32, 48, 128]:
    data = create_png(size, size, draw_icon)
    with open(f'/home/adam/Documents/DevLocator/public/icons/icon-{size}.png', 'wb') as f:
        f.write(data)
print("Icons generated successfully!")
