from PIL import Image, ImageDraw
import os

BG     = (32, 51, 44, 255)    # #20332C
ACCENT = (143, 168, 122, 230) # #8FA87A sage green

def make_icon(size):
    scale = 4
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    r = int(s * 0.22)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=r, fill=BG)

    cx = s // 2
    bar_h = max(2, int(s * 0.075))
    gap = int(s * 0.115)
    widths = [0.60, 0.40, 0.22]
    total_h = 3 * bar_h + 2 * gap
    y0 = (s - total_h) // 2

    for i, w_frac in enumerate(widths):
        half_w = int(s * w_frac / 2)
        y = y0 + i * (bar_h + gap)
        rx_bar = bar_h // 2
        d.rounded_rectangle(
            [cx - half_w, y, cx + half_w, y + bar_h],
            radius=rx_bar,
            fill=ACCENT,
        )

    return img.resize((size, size), Image.LANCZOS)

base = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
for sz in [16, 48, 128]:
    make_icon(sz).save(os.path.join(base, f"icon{sz}.png"), "PNG")
    print(f"  icon{sz}.png saved")

print("Done.")
