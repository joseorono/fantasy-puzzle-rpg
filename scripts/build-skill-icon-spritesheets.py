"""
Packs the indigolay-mega skill icons into per-class spritesheets.

The source pack ships every icon twice (a coloured `01_Normal` tree and a greyed
`02_Disabled` tree) as hundreds of loose PNGs, at four resolutions. This tool
merges each class into a single sheet laid out as two identical grids side by
side: normal icons on the left, their disabled counterparts on the right at the
same row/column. A disabled cell is therefore always `disabledOffsetX` pixels to
the right of its normal cell.

Usage — the resolution defaults to 102, or pass another one the pack ships:
    python scripts/build-skill-icon-spritesheets.py
    python scripts/build-skill-icon-spritesheets.py 64
    python scripts/build-skill-icon-spritesheets.py 204 --cols 8

Outputs `indigolay-skills-<class>-<size>.png` plus a geometry manifest of the
same name into public/assets/skills. The `indigolay-` prefix is load-bearing:
src/styles/utilities.css opts every `indigolay-` asset out of the global
`image-rendering: pixelated`, which would otherwise wreck this art.

Requires Pillow. The source pack lives outside the repo, at
    <OneDrive>/Documents/assets/indigolay-mega/PixelSkillIconsBookUI_PNG_v1.0/SkillIcon
which is the default for --src.
"""

import argparse
import json
import os
import sys

from PIL import Image

NORMAL_DIR = "01_Normal"
DISABLED_DIR = "02_Disabled"

DEFAULT_SIZE = 102
DEFAULT_COLS = 10

# Keeps the sheets inside the `indigolay-` pixelation opt-out in utilities.css.
OUTPUT_PREFIX = "indigolay-skills-"

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_OUT = os.path.join(REPO_ROOT, "public", "assets", "skills")
DEFAULT_SRC = os.path.join(
    os.path.expanduser("~"),
    "OneDrive",
    "Documents",
    "assets",
    "indigolay-mega",
    "PixelSkillIconsBookUI_PNG_v1.0",
    "SkillIcon",
)


def fail(message):
    print(f"error: {message}", file=sys.stderr)
    sys.exit(1)


def list_dirs(path):
    """Immediate subdirectory names of `path`, sorted."""
    if not os.path.isdir(path):
        fail(f"not a directory: {path}")
    return sorted(name for name in os.listdir(path) if os.path.isdir(os.path.join(path, name)))


def list_pngs(path):
    """Immediate .png filenames of `path`, sorted.

    The pack zero-pads its indices (`..._01_`, `..._84_`), so lexical order is
    also numeric order.
    """
    if not os.path.isdir(path):
        fail(f"not a directory: {path}")
    return sorted(name for name in os.listdir(path) if name.lower().endswith(".png"))


def slugify_class(folder_name):
    """`01_Warrior_Berserker` -> `warrior-berserker`."""
    parts = folder_name.split("_")
    if parts and parts[0].isdigit():
        parts = parts[1:]
    return "-".join(part.lower() for part in parts)


def load_icon(path, size):
    with Image.open(path) as image:
        if image.size != (size, size):
            fail(f"expected {size}x{size} but got {image.size[0]}x{image.size[1]}: {path}")
        return image.convert("RGBA")


def build_class_sheet(src, size, class_folder, cols, out_dir):
    normal_dir = os.path.join(src, NORMAL_DIR, str(size), class_folder)
    disabled_dir = os.path.join(src, DISABLED_DIR, str(size), class_folder)

    normal_files = list_pngs(normal_dir)
    disabled_files = list_pngs(disabled_dir)

    if not normal_files:
        fail(f"no PNGs found in {normal_dir}")
    if normal_files != disabled_files:
        missing = sorted(set(normal_files) ^ set(disabled_files))
        fail(f"normal/disabled filenames differ for {class_folder} @ {size}: {missing[:5]}")

    icon_count = len(normal_files)
    rows = -(-icon_count // cols)
    half_width = cols * size
    sheet_width = half_width * 2
    sheet_height = rows * size

    sheet = Image.new("RGBA", (sheet_width, sheet_height), (0, 0, 0, 0))

    for index, filename in enumerate(normal_files):
        x = (index % cols) * size
        y = (index // cols) * size
        # Pasting without a mask copies the source alpha verbatim instead of
        # compositing it against the transparent canvas.
        sheet.paste(load_icon(os.path.join(normal_dir, filename), size), (x, y))
        sheet.paste(load_icon(os.path.join(disabled_dir, filename), size), (x + half_width, y))

    slug = slugify_class(class_folder)
    base = os.path.join(out_dir, f"{OUTPUT_PREFIX}{slug}-{size}")

    sheet.save(f"{base}.png", optimize=True)

    manifest = {
        "cellSize": size,
        "cols": cols,
        "rows": rows,
        "iconCount": icon_count,
        "sheetWidth": sheet_width,
        "sheetHeight": sheet_height,
        "halfWidth": half_width,
        "disabledOffsetX": half_width,
    }
    with open(f"{base}.json", "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")

    print(
        f"{slug:<18} {icon_count:>3} icons  {cols}x{rows} grid  "
        f"-> {OUTPUT_PREFIX}{slug}-{size}.png ({sheet_width}x{sheet_height})"
    )


def main():
    parser = argparse.ArgumentParser(description="Build skill icon spritesheets.")
    parser.add_argument(
        "size",
        type=int,
        nargs="?",
        default=DEFAULT_SIZE,
        help=f"icon resolution to pack, a subfolder of {NORMAL_DIR} (default {DEFAULT_SIZE})",
    )
    parser.add_argument("--cols", type=int, default=DEFAULT_COLS, help=f"columns per grid half (default {DEFAULT_COLS})")
    parser.add_argument("--src", default=DEFAULT_SRC, help="SkillIcon root of the source pack")
    parser.add_argument("--out", default=DEFAULT_OUT, help="output directory")
    args = parser.parse_args()

    if args.cols < 1:
        fail("--cols must be at least 1")

    available_sizes = list_dirs(os.path.join(args.src, NORMAL_DIR))
    if str(args.size) not in available_sizes:
        fail(f"size {args.size} not in the pack; available: {', '.join(available_sizes)}")

    class_folders = list_dirs(os.path.join(args.src, NORMAL_DIR, str(args.size)))
    if not class_folders:
        fail(f"no class folders under {NORMAL_DIR}/{args.size}")

    os.makedirs(args.out, exist_ok=True)

    for class_folder in class_folders:
        build_class_sheet(args.src, args.size, class_folder, args.cols, args.out)


if __name__ == "__main__":
    main()
