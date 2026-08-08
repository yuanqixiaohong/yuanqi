from PIL import Image, ImageDraw

# Reference spec:
# - Moon diameter = ~21% of canvas (radius = ~10.5%) — refined from previous 46% to ~46% of that
# - Left (shadow) side:  #344658 -> RGB(52, 70, 88)
# - Right (light) side: #e1d2b2 -> RGB(225, 210, 178)
# - Craters on left:    #2b3a49 -> RGB(43, 58, 73)
# - Craters on right:   #cdbe9e -> RGB(205, 190, 158)
# - Background:         #d9a0a0 -> RGB(217, 160, 160)

BG_COLOR = (217, 160, 160)
LEFT_COLOR = (52, 70, 88)        # #344658
RIGHT_COLOR = (225, 210, 178)  # #e1d2b2
CRATER_LEFT = (43, 58, 73)      # slightly lighter than left base
CRATER_RIGHT = (205, 190, 158)  # slightly darker than right base

CRATERS_LEFT = [
    (-0.38, -0.28, 0.24, 0.20),
    (-0.28, 0.32, 0.20, 0.17),
    (-0.42, 0.05, 0.16, 0.14),
    (-0.18, -0.42, 0.14, 0.12),
    (-0.32, 0.42, 0.12, 0.10),
    (-0.08, 0.08, 0.09, 0.07),
]

CRATERS_RIGHT = [
    (0.38, -0.22, 0.26, 0.22),
    (0.28, 0.28, 0.22, 0.18),
    (0.42, 0.05, 0.16, 0.14),
    (0.18, -0.42, 0.14, 0.12),
    (0.32, 0.42, 0.12, 0.10),
    (0.08, -0.08, 0.09, 0.07),
]


def draw_moon(size, corner_radius_ratio=0.22, moon_ratio=0.21, maskable=False):
    """Generate the moon app icon matching the reference screenshot."""
    img = Image.new('RGBA', (size, size), BG_COLOR)
    draw = ImageDraw.Draw(img)

    if not maskable:
        # Rounded square background to match the launcher icon shape
        corner_radius = int(size * corner_radius_ratio)
        draw.rounded_rectangle([0, 0, size, size], radius=corner_radius, fill=BG_COLOR)

    center = size // 2
    radius = int(size * moon_ratio / 2)

    # Full moon circle (left/dark side by default)
    draw.ellipse(
        [center - radius, center - radius, center + radius, center + radius],
        fill=LEFT_COLOR,
    )

    # Right/light half
    draw.pieslice(
        [center - radius, center - radius, center + radius, center + radius],
        start=270, end=90, fill=RIGHT_COLOR,
    )

    # Craters - drawn in the same color-space as each half
    for x_ratio, y_ratio, rx_ratio, ry_ratio in CRATERS_LEFT:
        cx = int(center + x_ratio * radius)
        cy = int(center + y_ratio * radius)
        rx = max(2, int(rx_ratio * radius))
        ry = max(2, int(ry_ratio * radius))
        draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=CRATER_LEFT)

    for x_ratio, y_ratio, rx_ratio, ry_ratio in CRATERS_RIGHT:
        cx = int(center + x_ratio * radius)
        cy = int(center + y_ratio * radius)
        rx = max(2, int(rx_ratio * radius))
        ry = max(2, int(ry_ratio * radius))
        draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=CRATER_RIGHT)

    return img


# Standard PWA icons (rounded corners)
draw_moon(192).save('icon-192.png')
draw_moon(512).save('icon-512.png')
draw_moon(180).save('apple-touch-icon.png')

# Maskable icons (full-bleed background for Android adaptive icon cropping)
draw_moon(192, maskable=True).save('icon-192-maskable.png')
draw_moon(512, maskable=True).save('icon-512-maskable.png')

print('Icons generated successfully:')
print('  icon-192.png, icon-512.png, apple-touch-icon.png')
print('  icon-192-maskable.png, icon-512-maskable.png')
