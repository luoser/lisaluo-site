"""Export standard web icon sizes from the generated master. Requires Pillow."""
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent
source = Image.open(root / "assets/favicon-orbit-heart-master.png").convert("RGBA")
if source.width != source.height:
    raise ValueError("Favicon master must be square")

for size in (32, 48):
    source.resize((size, size), Image.Resampling.LANCZOS).save(
        root / f"favicon-orbit-heart-{size}.png", optimize=True
    )
source.save(root / "favicon-orbit-heart.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print("Exported transparent 32px and 48px PNGs and a 16/32/48px ICO.")
