// Vice Cover Studio — the cover renderer.
// Draws a GTA-style multi-panel poster: a sunset/neon background with a retro
// slatted sun, photo panels with crop + position each, a bold outlined caption
// and a subtitle, in any of the three post sizes. No network, no fonts to
// download: lettering is system bold with stroke, gradient and glow.

export const POST_SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

export const GRADES = {
  sunset: { top: 'rgba(255, 122, 61, 0.00)', mid: 'rgba(255, 90, 90, 0.16)', bottom: 'rgba(214, 38, 140, 0.34)' },
  neon: { top: 'rgba(0, 229, 255, 0.16)', mid: 'rgba(120, 60, 255, 0.14)', bottom: 'rgba(255, 0, 128, 0.34)' },
  noir: { top: 'rgba(0, 0, 0, 0.10)', mid: 'rgba(0, 0, 0, 0.22)', bottom: 'rgba(0, 0, 0, 0.42)' },
};

/** Panel rectangles (fractions of the cover) for each layout. */
export function layoutPanels(layout, w, h) {
  const f = (x, y, pw, ph) => ({ x: x * w, y: y * h, w: pw * w, h: ph * h });
  if (layout === 'quad') {
    return [
      f(0.02, 0.02, 0.475, 0.37),
      f(0.505, 0.02, 0.475, 0.37),
      f(0.02, 0.41, 0.475, 0.37),
      f(0.505, 0.41, 0.475, 0.37),
    ];
  }
  // 'poster': one hero panel, one tall side panel, three along the bottom.
  return [
    f(0.02, 0.02, 0.58, 0.54),
    f(0.62, 0.02, 0.36, 0.54),
    f(0.02, 0.58, 0.31, 0.20),
    f(0.345, 0.58, 0.31, 0.20),
    f(0.67, 0.58, 0.31, 0.20),
  ];
}

export function panelCount(layout) {
  return layout === 'quad' ? 4 : 5;
}

/** A fresh panel: no photo yet, centred, unzoomed. */
export function emptyPanel() {
  return { photo: -1, zoom: 1, fx: 0.5, fy: 0.5 };
}

/** Draws the retro slatted sun rising from the foot of the cover. */
export function drawRetroSun(ctx, w, h) {
  const cx = w * 0.5;
  const cy = h * 0.985;
  const r = w * 0.17;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const sun = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  sun.addColorStop(0, '#ffe259');
  sun.addColorStop(0.55, '#ff7e3d');
  sun.addColorStop(1, '#ff2e88');
  ctx.fillStyle = sun;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Slats: the lower half of the sun is cut into stripes.
  ctx.fillStyle = '#2a0a3d';
  let y = cy - r * 0.1;
  let gap = r * 0.045;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap + r * 0.085;
    gap *= 1.45;
  }
  ctx.restore();
}

/** The Vice City dusk behind the panels: purple sky melting into orange. */
export function drawBackdrop(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#160a2e');
  sky.addColorStop(0.45, '#4b1158');
  sky.addColorStop(0.72, '#c22a72');
  sky.addColorStop(1, '#ff7a3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // Faint diagonal light beams, for the neon-night feel.
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#ffd76a';
  for (let i = 0; i < 5; i++) {
    const x0 = w * (0.05 + i * 0.22);
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    ctx.lineTo(x0 + w * 0.06, 0);
    ctx.lineTo(x0 + w * 0.22, h);
    ctx.lineTo(x0 + w * 0.12, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  drawRetroSun(ctx, w, h);
}

/** Draws one photo into a panel, cropped by zoom + focal point. */
export function drawPanelPhoto(ctx, panel, img, grade) {
  const { x, y, w, h } = panel;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = panel.zoom ?? 1;
  const fx = panel.fx ?? 0.5;
  const fy = panel.fy ?? 0.5;
  const scale = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  // Cover-fit focal point, clamped so the photo always fills the panel:
  // panning is only possible inside the slack zoom leaves.
  let dx = x + w / 2 - fx * dw;
  let dy = y + h / 2 - fy * dh;
  dx = dw > w ? Math.min(x, Math.max(x + w - dw, dx)) : x + (w - dw) / 2;
  dy = dh > h ? Math.min(y, Math.max(y + h - dh, dy)) : y + (h - dh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (grade === 'noir') ctx.filter = 'grayscale(0.92) contrast(1.12)';
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  // Sunset / neon grade wash + vignette, so every photo feels like one poster.
  const g = GRADES[grade] || GRADES.sunset;
  const wash = ctx.createLinearGradient(0, y, 0, y + h);
  wash.addColorStop(0, g.top);
  wash.addColorStop(0.55, g.mid);
  wash.addColorStop(1, g.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  const vig = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.32, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(10, 2, 20, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** An empty panel: dark glass with a plus and an invitation. */
export function drawEmptyPanel(ctx, panel) {
  const { x, y, w, h } = panel;
  ctx.save();
  ctx.fillStyle = '#241533';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = Math.max(2, w * 0.006);
  ctx.setLineDash([w * 0.03, w * 0.02]);
  ctx.strokeRect(x + w * 0.04, y + h * 0.06, w * 0.92, h * 0.88);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const plus = Math.min(w, h) * 0.28;
  ctx.font = `300 ${plus}px sans-serif`;
  ctx.fillText('+', x + w / 2, y + h * 0.42);
  const label = Math.max(10, Math.min(w, h) * 0.085);
  ctx.font = `700 ${label}px sans-serif`;
  ctx.fillText('ADD PHOTO', x + w / 2, y + h * 0.78);
  ctx.restore();
}

/** Bold genre lettering: gradient fill, dark outline, neon glow. */
export function drawCaption(ctx, w, h, caption, subtitle) {
  const bandTop = h * 0.80;
  const shade = ctx.createLinearGradient(0, bandTop - h * 0.04, 0, h);
  shade.addColorStop(0, 'rgba(16, 4, 28, 0)');
  shade.addColorStop(0.35, 'rgba(16, 4, 28, 0.72)');
  shade.addColorStop(1, 'rgba(16, 4, 28, 0.92)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, bandTop - h * 0.04, w, h - bandTop + h * 0.04);

  const text = (caption || '').trim().toUpperCase();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (subtitle && subtitle.trim()) {
    const sub = subtitle.trim().toUpperCase();
    const subSize = h * 0.026;
    ctx.font = `700 ${subSize}px "Arial Black", sans-serif`;
    try { ctx.letterSpacing = `${subSize * 0.42}px`; } catch { /* older canvas: no letter-spacing */ }
    ctx.fillStyle = '#ff5da2';
    ctx.shadowColor = 'rgba(255, 45, 150, 0.8)';
    ctx.shadowBlur = subSize * 0.6;
    ctx.fillText(sub, w / 2, h * 0.855);
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* reset */ }
  }
  if (!text) return;
  let size = h * 0.088;
  const setFont = () => { ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", sans-serif`; };
  setFont();
  while (ctx.measureText(text).width > w * 0.92 && size > 14) {
    size -= 2;
    setFont();
  }
  const baseline = h * 0.955;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.14);
  ctx.strokeStyle = '#14081f';
  ctx.shadowColor = 'rgba(255, 46, 136, 0.85)';
  ctx.shadowBlur = size * 0.28;
  ctx.strokeText(text, w / 2, baseline);
  const fill = ctx.createLinearGradient(0, baseline - size, 0, baseline + size * 0.12);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(0.55, '#ffe08a');
  fill.addColorStop(1, '#ff8a3d');
  ctx.fillStyle = fill;
  ctx.fillText(text, w / 2, baseline);
  ctx.shadowBlur = 0;
}

/**
 * Draws the whole cover onto `canvas` (which must already be the export size).
 * `state` is { layout, caption, subtitle, grade, photos, panels } where
 * photos is an array of images (or null) and panels[i].photo indexes into it.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  drawBackdrop(ctx, w, h);
  const rects = layoutPanels(state.layout, w, h);
  const border = Math.max(2, Math.round(w * 0.0022));
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || emptyPanel();
    const img = panel.photo >= 0 ? state.photos[panel.photo] : null;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = Math.max(4, w * 0.008);
    ctx.shadowOffsetY = Math.max(2, w * 0.003);
    ctx.fillStyle = '#000';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    if (img) drawPanelPhoto(ctx, { ...rect, zoom: panel.zoom, fx: panel.fx, fy: panel.fy }, img, state.grade);
    else drawEmptyPanel(ctx, rect);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = border;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });
  // Thin poster frame around the whole cover.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = Math.max(2, w * 0.0016);
  ctx.strokeRect(w * 0.008, h * 0.008, w * 0.984, h * 0.984);
  drawCaption(ctx, w, h, state.caption, state.subtitle);
}

/** Renders the cover at a post size and returns the canvas (for export). */
export function renderExport(state, sizeKey) {
  const [w, h] = POST_SIZES[sizeKey] || POST_SIZES['1080x1080'];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, state);
  return canvas;
}
