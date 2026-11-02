"""Optional asset authoring: requires Pillow; the deployed site has no dependencies."""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser()
parser.add_argument("--font", default="/System/Library/Fonts/Supplemental/Courier New.ttf")
args = parser.parse_args()
scale = 2
image = Image.new("RGB", (1200 * scale, 630 * scale), "white")
draw = ImageDraw.Draw(image)


def text(position, value, size):
    font = ImageFont.truetype(args.font, size * scale)
    draw.text(tuple(coordinate * scale for coordinate in position), value, fill="black", font=font)


def rule(y):
    draw.line((64 * scale, y * scale, 1136 * scale, y * scale), fill="black", width=scale)


text((64, 42), "lisa luo", 22)
rule(96)
text((64, 192), "hi i'm lisa :)", 52)
text((64, 294), "i like distilling complexity into joy.", 34)
rule(518)
text((64, 548), "lisaluo.com", 22)
image = image.resize((1200, 630), Image.Resampling.LANCZOS)
output = Path(__file__).resolve().parent.parent / "social-card.png"
image.save(output, optimize=True)
print(output)
