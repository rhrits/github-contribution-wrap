#!/usr/bin/env python3
"""Generate compact WRAP. PNG/ICO brand assets without Pillow."""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
APP = ROOT / "src" / "app"

CELLS = [
    "#161b22",
    "#0e4429",
    "#26a641",
    "#0e4429",
    "#161b22",
    "#006d32",
    "#39d353",
    "#26a641",
    "#39d353",
    "#0e4429",
    "#161b22",
    "#26a641",
    "#39d353",
    "#006d32",
    "#161b22",
    "#0e4429",
    "#39d353",
    "#26a641",
    "#39d353",
    "#006d32",
    "#161b22",
    "#0e4429",
    "#006d32",
    "#0e4429",
    "#161b22",
]
BG = (5, 10, 7)
PAD_RATIO = 0.12
GAP_RATIO = 0.03


def hex_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)


def png_bytes(pixels: list[list[tuple[int, int, int]]], alpha: int = 255) -> bytes:
    height = len(pixels)
    width = len(pixels[0])
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for r, g, b in row:
            raw.extend((r, g, b, alpha))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


def logo_pixels(size: int) -> list[list[tuple[int, int, int]]]:
    pad = max(2, int(size * PAD_RATIO))
    gap = max(1, int(size * GAP_RATIO))
    inner = size - pad * 2
    cell = (inner - gap * 4) // 5
    used = cell * 5 + gap * 4
    origin = pad + (inner - used) // 2
    pixels = [[BG for _ in range(size)] for _ in range(size)]
    for index, color in enumerate(CELLS):
        row, col = divmod(index, 5)
        x0 = origin + col * (cell + gap)
        y0 = origin + row * (cell + gap)
        rgb = hex_rgb(color)
        for y in range(y0, y0 + cell):
            for x in range(x0, x0 + cell):
                pixels[y][x] = rgb
    return pixels


LEVELS = [
    (22, 27, 34),
    (14, 68, 41),
    (0, 109, 50),
    (38, 166, 65),
    (57, 211, 83),
]


def blend(base: tuple[int, int, int], color: tuple[int, int, int], amount: float) -> tuple[int, int, int]:
    amount = max(0.0, min(1.0, amount))
    return (
        min(255, int(base[0] + (color[0] - base[0]) * amount)),
        min(255, int(base[1] + (color[1] - base[1]) * amount)),
        min(255, int(base[2] + (color[2] - base[2]) * amount)),
    )


def add_light(base: tuple[int, int, int], color: tuple[int, int, int], amount: float) -> tuple[int, int, int]:
    amount = max(0.0, min(1.0, amount))
    return (
        min(255, int(base[0] + color[0] * amount)),
        min(255, int(base[1] + color[1] * amount)),
        min(255, int(base[2] + color[2] * amount)),
    )


def cell_level(week: int, day: int) -> int:
    n = (week * 13 + day * 29 + (week // 7) * 11) % 100
    wave = abs(((week % 18) - 9))
    peak = 18 - wave * 2 + (4 if 2 <= day <= 4 else 0)
    score = n // 4 + peak
    if score > 38:
        return 4
    if score > 28:
        return 3
    if score > 18:
        return 2
    if score > 10:
        return 1
    return 0


def scene_pixels(width: int, height: int, *, wordmark: bool = True) -> list[list[tuple[int, int, int]]]:
    pixels = [[BG for _ in range(width)] for _ in range(height)]
    accent = hex_rgb("#39d353")
    glow = hex_rgb("#6dff8a")
    deep = hex_rgb("#022c16")
    teal = hex_rgb("#14b8a6")

    def put(x: int, y: int, color: tuple[int, int, int]) -> None:
        if 0 <= x < width and 0 <= y < height:
            pixels[y][x] = color

    def radial(cx: int, cy: int, radius: int, color: tuple[int, int, int], strength: float) -> None:
        r2 = radius * radius
        y0, y1 = max(0, cy - radius), min(height, cy + radius)
        x0, x1 = max(0, cx - radius), min(width, cx + radius)
        for y in range(y0, y1):
            dy = y - cy
            row = pixels[y]
            for x in range(x0, x1):
                d2 = (x - cx) * (x - cx) + dy * dy
                if d2 >= r2:
                    continue
                t = 1.0 - d2 / r2
                row[x] = add_light(row[x], color, t * t * strength)

    radial(int(width * 0.78), int(height * 0.18), int(width * 0.55), deep, 0.85)
    radial(int(width * 0.22), int(height * 0.72), int(width * 0.42), teal, 0.18)
    radial(int(width * 0.62), int(height * 0.48), int(width * 0.38), accent, 0.22)
    radial(int(width * 0.88), int(height * 0.82), int(width * 0.32), glow, 0.12)

    # Contribution-field texture: a huge year graph filling the banner.
    pad_x, pad_y = int(width * 0.03), int(height * 0.12)
    cols, rows = 53, 7
    gap = max(3, height // 90)
    cell = max(10, (height - pad_y * 2 - gap * (rows - 1)) // rows)
    field_w = cols * cell + (cols - 1) * gap
    field_h = rows * cell + (rows - 1) * gap
    ox = width - int(width * 0.03) - field_w
    oy = (height - field_h) // 2
    for week in range(cols):
        for day in range(rows):
            color = LEVELS[cell_level(week, day)]
            x0 = ox + week * (cell + gap)
            y0 = oy + day * (cell + gap)
            x1 = min(width, x0 + cell)
            y1 = min(height, y0 + cell)
            x0c = max(0, x0)
            y0c = max(0, y0)
            if x1 <= x0c or y1 <= y0c:
                continue
            for y in range(y0c, y1):
                row = pixels[y]
                for x in range(x0c, x1):
                    row[x] = blend(row[x], color, 0.88)

    # Soft horizon sheen.
    for y in range(height):
        fall = 1.0 - abs(y / height - 0.46) * 2.2
        if fall <= 0:
            continue
        amount = fall * fall * 0.08
        row = pixels[y]
        for x in range(width):
            row[x] = add_light(row[x], glow, amount)

    # Vignette.
    cx, cy = width / 2, height / 2
    max_d = (cx * cx + cy * cy) ** 0.5
    for y in range(height):
        dy = y - cy
        row = pixels[y]
        for x in range(width):
            d = ((x - cx) * (x - cx) + dy * dy) ** 0.5 / max_d
            row[x] = blend(row[x], (0, 0, 0), max(0.0, d - 0.45) * 1.4)

    mark = min(height - 80, int(height * 0.46))
    logo = logo_pixels(mark)
    lx, ly = int(width * 0.055), (height - mark) // 2
    for y in range(mark):
        for x in range(mark):
            put(lx + x, ly + y, logo[y][x])
    radial(lx + mark // 2, ly + mark // 2, mark, accent, 0.16)

    draw_harbor(pixels, width, height, accent, glow, teal)

    if not wordmark:
        return pixels

    white = (244, 255, 246)
    muted = hex_rgb("#8eab97")
    start_x = lx + mark + int(width * 0.04)
    start_y = height // 2 - int(height * 0.12)
    scale = max(6, height // 78)

    def stamp(mask: list[str], x: int, y: int, color: tuple[int, int, int]) -> None:
        for row_i, line in enumerate(mask):
            for col, ch in enumerate(line):
                if ch != "#":
                    continue
                for dy in range(scale):
                    for dx in range(scale):
                        put(x + col * scale + dx, y + row_i * scale + dy, color)

    w = ["#     #", "#     #", "#  #  #", "# # # #", "##   ##", "#     #", "#     #"]
    r = ["##### ", "#    #", "#    #", "##### ", "#  #  ", "#   # ", "#    #"]
    a = ["  ###  ", " #   # ", "#     #", "#######", "#     #", "#     #", "#     #"]
    p = ["###### ", "#     #", "#     #", "###### ", "#      ", "#      ", "#      "]
    dot = ["  ", "  ", "  ", "  ", "  ", "##", "##"]
    stamp(w, start_x, start_y, white)
    stamp(r, start_x + 8 * scale, start_y, white)
    stamp(a, start_x + 16 * scale, start_y, white)
    stamp(p, start_x + 24 * scale, start_y, white)
    stamp(dot, start_x + 32 * scale, start_y, accent)
    bar_y = start_y + 8 * scale + int(scale * 0.7)
    for x in range(start_x, start_x + 34 * scale):
        for y in range(bar_y, bar_y + max(3, scale // 3)):
            put(x, y, accent if (x - start_x) % (scale * 2) < scale else muted)
    return pixels


def fill_triangle(
    pixels: list[list[tuple[int, int, int]]],
    a: tuple[int, int],
    b: tuple[int, int],
    c: tuple[int, int],
    color: tuple[int, int, int],
) -> None:
    xs = [a[0], b[0], c[0]]
    ys = [a[1], b[1], c[1]]
    min_x, max_x = max(0, min(xs)), min(len(pixels[0]) - 1, max(xs))
    min_y, max_y = max(0, min(ys)), min(len(pixels) - 1, max(ys))
    denom = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
    if denom == 0:
        return
    for y in range(min_y, max_y + 1):
        row = pixels[y]
        for x in range(min_x, max_x + 1):
            w1 = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / denom
            w2 = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / denom
            w3 = 1 - w1 - w2
            if w1 >= 0 and w2 >= 0 and w3 >= 0:
                row[x] = color


def draw_ship(
    pixels: list[list[tuple[int, int, int]]],
    left: int,
    water_y: int,
    width: int,
    height: int,
    sail: tuple[int, int, int],
    hull: tuple[int, int, int],
    mast: tuple[int, int, int],
) -> None:
    hull_top = water_y - int(height * 0.30)
    hull_bot = water_y + int(height * 0.10)
    max_y = len(pixels) - 1
    max_x = len(pixels[0]) - 1
    x0, x1 = left, left + width
    top_l = left + int(width * 0.10)
    top_r = left + int(width * 0.90)
    for y in range(max(0, hull_top), min(max_y, hull_bot) + 1):
        t = 0 if hull_bot == hull_top else (y - hull_top) / (hull_bot - hull_top)
        xa = int(top_l + (x0 - top_l) * t)
        xb = int(top_r + (x1 - top_r) * t)
        for x in range(max(0, xa), min(max_x, xb) + 1):
            pixels[y][x] = hull
    mast_x = left + int(width * 0.38)
    sail_top = water_y - height
    if 0 <= mast_x <= max_x:
        for y in range(max(0, sail_top), max(0, hull_top)):
            pixels[y][mast_x] = mast
            if mast_x + 1 <= max_x:
                pixels[y][mast_x + 1] = mast
    fill_triangle(
        pixels,
        (mast_x + 2, sail_top + 2),
        (mast_x + 2, hull_top - 1),
        (left + int(width * 0.98), hull_top - int(height * 0.08)),
        sail,
    )


def draw_harbor(
    pixels: list[list[tuple[int, int, int]]],
    width: int,
    height: int,
    accent: tuple[int, int, int],
    glow: tuple[int, int, int],
    teal: tuple[int, int, int],
) -> None:
    water_y = int(height * 0.78)
    deep_water = (4, 18, 28)
    for y in range(water_y - 18, height):
        depth = (y - (water_y - 18)) / max(1, height - (water_y - 18))
        row = pixels[y]
        for x in range(width):
            wave = 0.5 + 0.5 * math.sin(x / 28.0 + y / 18.0)
            color = blend(deep_water, teal, 0.18 + wave * 0.22)
            row[x] = blend(row[x], color, 0.35 + depth * 0.55)
            if y < water_y + int(6 * math.sin(x / 22.0)):
                row[x] = add_light(row[x], glow, 0.08 * (1 - depth))

    hull = hex_rgb("#0b3d2e")
    mast = hex_rgb("#d7ffe3")
    sizes = [52, 78, 40, 96, 58, 34, 110, 46, 70, 88, 36, 64, 54, 92]
    start_x = int(width * 0.28)
    span = width - start_x - int(width * 0.04)
    for index, size in enumerate(sizes):
        left = start_x + int(span * index / max(1, len(sizes) - 1)) - size // 2
        bob = int(6 * math.sin(index * 1.3))
        sail = accent if index % 3 else glow
        draw_ship(pixels, left, water_y + bob, size, int(size * 0.78), sail, hull if index % 4 else accent, mast)


def write_png(path: Path, pixels: list[list[tuple[int, int, int]]]) -> None:
    path.write_bytes(png_bytes(pixels))
    print(f"wrote {path} ({path.stat().st_size} bytes)")


def write_ico(path: Path, png: bytes) -> None:
    # PNG-in-ICO (Windows Vista+)
    header = struct.pack("<HHH", 0, 1, 1)
    entry = struct.pack("<BBBBHHII", 32, 32, 0, 0, 1, 32, len(png), 22)
    path.write_bytes(header + entry + png)
    print(f"wrote {path} ({path.stat().st_size} bytes)")


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    APP.mkdir(parents=True, exist_ok=True)
    write_png(PUBLIC / "icon.png", logo_pixels(512))
    write_png(PUBLIC / "logo.png", logo_pixels(256))
    write_png(PUBLIC / "apple-icon.png", logo_pixels(180))
    write_png(PUBLIC / "og.png", scene_pixels(1200, 630, wordmark=True))
    write_png(PUBLIC / "banner.png", scene_pixels(1920, 960, wordmark=True))
    favicon_png = png_bytes(logo_pixels(32))
    write_ico(PUBLIC / "favicon.ico", favicon_png)
    write_ico(APP / "favicon.ico", favicon_png)


if __name__ == "__main__":
    main()
