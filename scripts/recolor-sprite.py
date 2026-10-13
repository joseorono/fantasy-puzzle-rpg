"""
Recolours a flat-palette pixel sprite onto a tonal ramp.

Every distinct opaque colour in the source is ranked by luminance and mapped onto a
ramp of hex stops, darkest to lightest; a sprite with as many colours as the ramp has
stops gets an exact one-to-one swap, otherwise the ramp is interpolated. Alpha is kept
as is. Optionally also writes a nearest-neighbour downscale for use on the overworld
canvas, where enemies are drawn at their natural pixel size.

Usage:
    python scripts/recolor-sprite.py SRC OUT
    python scripts/recolor-sprite.py SRC OUT --ramp 2b2e35 5d626c 9aa0ab d9dde4
    python scripts/recolor-sprite.py SRC OUT --map-out MAP_OUT --map-scale 0.5

The Stone Golem was made with:
    python scripts/recolor-sprite.py public/assets/enemy-sprites/gollux_idle.png \\
        public/assets/enemy-sprites/stone_golem_idle.png \\
        --map-out public/assets/enemy-sprites/stone_golem_map.png

Requires Pillow: `pip install -r scripts/requirements.txt`.
"""

import argparse
import sys

from PIL import Image

# A cool stone grey, darkest to lightest.
DEFAULT_RAMP = ["2b2e35", "5d626c", "9aa0ab", "d9dde4"]


def parse_hex(value):
    value = value.lstrip("#")
    if len(value) != 6:
        raise argparse.ArgumentTypeError(f"expected a 6-digit hex colour, got {value!r}")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def luminance(rgb):
    r, g, b = rgb
    return 0.299 * r + 0.587 * g + 0.114 * b


def ramp_at(ramp, t):
    """Linear interpolation along the ramp for t in [0, 1]."""
    if len(ramp) == 1:
        return ramp[0]
    scaled = t * (len(ramp) - 1)
    index = min(int(scaled), len(ramp) - 2)
    frac = scaled - index
    a, b = ramp[index], ramp[index + 1]
    return tuple(round(a[i] + (b[i] - a[i]) * frac) for i in range(3))


def recolor(image, ramp):
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size

    colours = set()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 0:
                colours.add((r, g, b))

    ordered = sorted(colours, key=luminance)
    if not ordered:
        sys.exit("source has no opaque pixels")
    mapping = {}
    for rank, colour in enumerate(ordered):
        t = rank / (len(ordered) - 1) if len(ordered) > 1 else 0.0
        mapping[colour] = ramp_at(ramp, t)

    out = Image.new("RGBA", image.size)
    out_pixels = out.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            out_pixels[x, y] = (*mapping[(r, g, b)], a) if a > 0 else (0, 0, 0, 0)
    return out, len(ordered)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("src")
    parser.add_argument("out")
    parser.add_argument("--ramp", nargs="+", type=parse_hex, default=[parse_hex(c) for c in DEFAULT_RAMP])
    parser.add_argument("--map-out", help="also write a downscaled copy for the overworld canvas")
    parser.add_argument("--map-scale", type=float, default=0.5)
    args = parser.parse_args()

    source = Image.open(args.src)
    result, colour_count = recolor(source, args.ramp)
    result.save(args.out)
    print(f"{args.out}: {result.size[0]}x{result.size[1]}, {colour_count} colours -> {len(args.ramp)}-stop ramp")

    if args.map_out:
        size = (max(1, round(result.size[0] * args.map_scale)), max(1, round(result.size[1] * args.map_scale)))
        result.resize(size, Image.NEAREST).save(args.map_out)
        print(f"{args.map_out}: {size[0]}x{size[1]}")


if __name__ == "__main__":
    main()
