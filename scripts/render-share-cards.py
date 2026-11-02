"""Render static OG images from feed content passed on stdin. Requires Pillow."""
import base64
import io
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

FONT = os.environ.get("LISALUO_CARD_FONT", "/System/Library/Fonts/Supplemental/Courier New.ttf")
SCALE = 2


def render(page):
    image = Image.new("RGB", (1200 * SCALE, 630 * SCALE), "white")
    draw = ImageDraw.Draw(image)

    def font(size):
        return ImageFont.truetype(FONT, size * SCALE)

    def text(x, y, value, size, centered=False):
        draw.text((x * SCALE, y * SCALE), value, font=font(size), fill="black",
                  anchor="mm" if centered else "lt")

    def line(points):
        draw.line([(x * SCALE, y * SCALE) for x, y in points], fill="black", width=SCALE)

    text(64, 44, "lisaluo.com", 24)
    line([(64, 100), (1136, 100)])
    if page.get("counters"):
        counters = page["counters"]
        single = len(counters) == 1
        if not single:
            line([(600, 140), (600, 590)])
            line([(64, 365), (1136, 365)])
        for index, counter in enumerate(counters):
            x = 600 if single else 332 + (index % 2) * 536
            y = 345 if single else 247 + (index // 2) * 225
            text(x, y - 22, counter["label"], 48 if single else 30, True)
            text(x, y + 38, f'since {counter["since"]}', 28 if single else 24, True)
    else:
        writing = page.get("writing", [])
        value = "\n".join(writing) if isinstance(writing, list) else str(writing)
        if page.get("title"):
            value = page["title"] + "\n\n" + value
        # Preserve explicit breaks and wrap long words without clipping.
        for size in range(48, 19, -2):
            lines = []
            for paragraph in value.split("\n"):
                current = ""
                for word in paragraph.split():
                    candidate = (current + " " + word).strip()
                    if current and draw.textlength(candidate, font=font(size)) > 1072 * SCALE:
                        lines.append(current)
                        current = ""
                    for character in ((" " if current else "") + word):
                        if current and draw.textlength(current + character, font=font(size)) > 1072 * SCALE:
                            lines.append(current)
                            current = ""
                        current += character
                lines.append(current)
            height = len(lines) * size * 1.4
            orphan = len(lines) > 1 and len(lines[-1].split()) == 1
            if height <= 430 and not orphan:
                break
        if height > 430:
            raise ValueError(f'OG text is too long for {page["id"]}')
        top = 130 + (460 - height) / 2
        for index, value in enumerate(lines):
            text(64, top + index * size * 1.4, value, size)
    image = image.resize((1200, 630), Image.Resampling.LANCZOS)
    output = io.BytesIO()
    image.save(output, format="PNG", optimize=True)
    return base64.b64encode(output.getvalue()).decode("ascii")


print(json.dumps([render(page) for page in json.load(sys.stdin)]))
