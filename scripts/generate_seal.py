import math

n_petals = 20
r_inner = 45.0
r_outer = 50.0
cx = 54.0
cy = 54.0

points = []
for i in range(n_petals * 2):
    angle = i * math.pi / n_petals
    r = r_outer if i % 2 == 0 else r_inner
    x = cx + r * math.cos(angle)
    y = cy + r * math.sin(angle)
    points.append((x, y))

path_d = []
for i in range(len(points)):
    p1 = points[i]
    p2 = points[(i + 1) % len(points)]
    mid_x = (p1[0] + p2[0]) / 2.0
    mid_y = (p1[1] + p2[1]) / 2.0
    if i == 0:
        path_d.append(f"M {mid_x:.2f} {mid_y:.2f}")
    p_next = points[(i + 1) % len(points)]
    p_after = points[(i + 2) % len(points)]
    next_mid_x = (p_next[0] + p_after[0]) / 2.0
    next_mid_y = (p_next[1] + p_after[1]) / 2.0
    path_d.append(f"Q {p_next[0]:.2f} {p_next[1]:.2f} {next_mid_x:.2f} {next_mid_y:.2f}")

d_str = " ".join(path_d)

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" class="w-full h-full select-none">
  <defs>
    <radialGradient id="sealBg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1F2820" />
      <stop offset="65%" stop-color="#131A14" />
      <stop offset="100%" stop-color="#0B0F0C" />
    </radialGradient>
    <linearGradient id="sealGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F2E3C6" />
      <stop offset="50%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#8A6D4B" />
    </linearGradient>
    <linearGradient id="sealBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8EB486" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#D4AF37" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#5F7D59" stop-opacity="0.7" />
    </linearGradient>
    <filter id="sealShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.7" />
    </filter>
  </defs>

  <!-- Outer Scalloped Rosette -->
  <path d="{d_str} Z" fill="url(#sealBg)" stroke="url(#sealBorder)" stroke-width="1.6" filter="url(#sealShadow)" />

  <!-- Inner Concentric Rings -->
  <circle cx="54" cy="54" r="41.5" fill="none" stroke="url(#sealGold)" stroke-width="0.9" stroke-dasharray="2 1.2" opacity="0.7" />
  <circle cx="54" cy="54" r="39" fill="none" stroke="url(#sealGold)" stroke-width="0.5" opacity="0.35" />

  <!-- Mini Decorative Diamond Top -->
  <path d="M 54 24.5 L 56 26.5 L 54 28.5 L 52 26.5 Z" fill="url(#sealGold)" opacity="0.85" />

  <!-- Text -->
  <text x="54" y="41.5" text-anchor="middle" fill="#E2D7C3" font-family="'Cinzel', 'Playfair Display', Georgia, serif" font-size="7.2" font-weight="600" letter-spacing="1">17 AÑOS DE</text>
  <text x="54" y="53.5" text-anchor="middle" fill="url(#sealGold)" font-family="'Cinzel', 'Playfair Display', Georgia, serif" font-size="8.8" font-weight="800" letter-spacing="1.2">EXPERIENCIA</text>
  <text x="54" y="65.5" text-anchor="middle" fill="#E2D7C3" font-family="'Cinzel', 'Playfair Display', Georgia, serif" font-size="7.2" font-weight="600" letter-spacing="1.4">CLÍNICA</text>

  <!-- Mini Decorative Diamond Bottom -->
  <path d="M 54 73.5 L 56 75.5 L 54 77.5 L 52 75.5 Z" fill="url(#sealGold)" opacity="0.85" />
</svg>'''

with open('assets/sello_experiencia_clinica.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)
print("SVG generado con exito.")
