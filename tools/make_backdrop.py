"""Renders images/left.png and images/right.png: the dotted backdrop that sits
on each side of the game window in the viewer.

Designed at 1080 px high (same numbers the old canvas code used), saved at 2x.
Transparent PNGs with black dots; the viewer's #262626 shows through.
right.png: its LEFT edge touches the game window, dots fade out going right.
left.png : the mirror image, its RIGHT edge touches the game window.

Run:  python3 tools/make_backdrop.py
"""
from PIL import Image, ImageDraw

DOT_RAMP = [(0, 8.6), (95, 8.6), (105, 7.6), (125, 6.9), (145, 6.6), (165, 5.9),
            (185, 5.7), (205, 5.3), (225, 5.0), (245, 4.7), (265, 4.2), (285, 3.8),
            (305, 3.2), (325, 2.8), (345, 1.9), (365, 1.4), (385, 0.5), (400, 0)]
CELL, WIDTH, HEIGHT = 16, 400, 1080     # design units
OUT = 2                                  # output pixels per design unit
SS = 4                                   # supersampling for smooth dot edges


def radius(d):
    if d >= WIDTH:
        return 0.0
    for (d0, r0), (d1, r1) in zip(DOT_RAMP, DOT_RAMP[1:]):
        if d <= d1:
            return r0 + (r1 - r0) * (d - d0) / (d1 - d0)
    return 0.0


k = OUT * SS
mask = Image.new("L", (WIDTH * k, HEIGHT * k), 0)
draw = ImageDraw.Draw(mask)
for row in range(-1, HEIGHT // CELL + 2):
    for half in (0, 1):                          # second set offset half a cell
        y = (row + half * 0.5) * CELL
        d = half * 0.5 * CELL
        while d < WIDTH:
            r = radius(d)
            if r > 0.2:
                draw.ellipse([(d - r) * k, (y - r) * k, (d + r) * k, (y + r) * k], fill=255)
            d += CELL
mask = mask.resize((WIDTH * OUT, HEIGHT * OUT), Image.LANCZOS)

right = Image.new("RGBA", mask.size, (0, 0, 0, 0))
right.putalpha(mask)
left = right.transpose(Image.FLIP_LEFT_RIGHT)
right.save("images/right.png", optimize=True)
left.save("images/left.png", optimize=True)
print("wrote images/left.png and images/right.png", right.size)
