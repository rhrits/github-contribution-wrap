#!/usr/bin/env python3
"""Generate compact WRAP. PNG/ICO brand assets without Pillow."""

from __future__ import annotations

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


def og_pixels(width: int = 1200, height: int = 630) -> list[list[tuple[int, int, int]]]:
    pixels = [[BG for _ in range(width)] for _ in range(height)]
    mark = 280
    logo = logo_pixels(mark)
    ox, oy = 80, (height - mark) // 2
    for y in range(mark):
        for x in range(mark):
            pixels[oy + y][ox + x] = logo[y][x]
    # Simple "WRAP." wordmark as block letters.
    accent = hex_rgb("#39d353")
    white = (244, 255, 246)
    muted = hex_rgb("#8eab97")
    start_x, start_y = 400, 210
    scale = 8

    def stamp(mask: list[str], x: int, y: int, color: tuple[int, int, int]) -> None:
        for row, line in enumerate(mask):
            for col, ch in enumerate(line):
                if ch != "#":
                    continue
                for dy in range(scale):
                    for dx in range(scale):
                        px, py = x + col * scale + dx, y + row * scale + dy
                        if 0 <= px < width and 0 <= py < height:
                            pixels[py][px] = color

    w = [
        "#     #",
        "#     #",
        "#  #  #",
        "# # # #",
        "##   ##",
        "#     #",
        "#     #",
    ]
    r = [
        "##### ",
        "#    #",
        "#    #",
        "##### ",
        "#  #  ",
        "#   # ",
        "#    #",
    ]
    a = [
        "  ###  ",
        " #   # ",
        "#     #",
        "#######",
        "#     #",
        "#     #",
        "#     #",
    ]
    p = [
        "###### ",
        "#     #",
        "#     #",
        "###### ",
        "#      ",
        "#      ",
        "#      ",
    ]
    dot = [
        "  ",
        "  ",
        "  ",
        "  ",
        "  ",
        "##",
        "##",
    ]
    stamp(w, start_x, start_y, white)
    stamp(r, start_x + 8 * scale, start_y, white)
    stamp(a, start_x + 16 * scale, start_y, white)
    stamp(p, start_x + 24 * scale, start_y, white)
    stamp(dot, start_x + 32 * scale, start_y, accent)
    sub = "GITHUB CONTRIBUTION WRAP  ·  INDIA"
    # Underline bar instead of a bitmap font for the subtitle.
    bar_y = start_y + 8 * scale + 28
    for x in range(start_x, start_x + 34 * scale):
        for y in range(bar_y, bar_y + 4):
            pixels[y][x] = accent if (x - start_x) % 18 < 12 else muted
    _ = sub
    return pixels


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
    write_png(PUBLIC / "og.png", og_pixels())
    favicon_png = png_bytes(logo_pixels(32))
    write_png(PUBLIC / "favicon-32.png", logo_pixels(32))
    write_ico(PUBLIC / "favicon.ico", favicon_png)
    write_ico(APP / "favicon.ico", favicon_png)


if __name__ == "__main__":
    main()
