// Fixed scenes for screenshots and headless checks.
// ?shot=cover shows the exported cover alone, at a real post size.
// ?shot=editor shows the page with a sample photo loaded.
// ?shot=exporttest renders the export path and reports the PNG it wrote
// (size, bytes, PNG header) into #test-output for a headless check.
// window.__shotReady is set once the scene is painted.
import { POST_SIZES, renderExport } from './cover.js';

function paint(canvas, state, sizeKey) {
  const exported = renderExport(state, sizeKey);
  canvas.width = exported.width;
  canvas.height = exported.height;
  canvas.getContext('2d').drawImage(exported, 0, 0);
  return exported;
}

function markReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

export async function runShot(shot, query, state, helpers) {
  const { loadImage, redraw } = helpers;
  const canvas = document.getElementById('cover');
  const photo = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const subtitle = query.get('subtitle') ?? 'Vice City';
  const sizeKey = POST_SIZES[query.get('size')] ? query.get('size') : '1920x1080';
  state.caption = caption;
  state.subtitle = subtitle;
  document.getElementById('caption').value = caption;
  document.getElementById('subtitle').value = subtitle;

  if (shot === 'cover' || shot === 'exporttest') {
    document.body.classList.add('shot-cover');
    if (query.get('layout')) state.layout = query.get('layout');
    if (query.get('grade')) state.grade = query.get('grade');
    state.size = sizeKey;
    const first = await loadImage(`samples/${photo}.jpg`);
    state.photos[0] = first;
    state.photoNames[0] = `${photo}.jpg (sample)`;
    state.panels.forEach((p) => { p.photo = 0; });
    // Optional crop for the shot (?fy=0.32 frames faces higher in the panels).
    const fxParam = query.get('fx');
    const fyParam = query.get('fy');
    const fx = fxParam === null ? NaN : Number(fxParam);
    const fy = fyParam === null ? NaN : Number(fyParam);
    if (Number.isFinite(fx)) state.panels.forEach((p) => { p.fx = fx; });
    if (Number.isFinite(fy)) state.panels.forEach((p) => { p.fy = fy; });
    if (query.get('photo2')) {
      const second = await loadImage(`samples/${query.get('photo2')}.jpg`);
      state.photos[1] = second;
      state.photoNames[1] = `${query.get('photo2')}.jpg (sample)`;
      state.panels.forEach((p, i) => { p.photo = i % 2; });
    }
    const exported = paint(canvas, state, sizeKey);
    if (shot === 'exporttest') {
      const info = await new Promise((resolve) => {
        exported.toBlob(async (blob) => {
          const buf = new Uint8Array(await blob.arrayBuffer());
          const pngOk = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
          resolve({
            shot: 'exporttest', size: sizeKey, width: exported.width, height: exported.height,
            bytes: blob.size, pngOk, type: blob.type,
          });
        }, 'image/png');
      });
      window.__exportInfo = info;
      const pre = document.getElementById('test-output');
      if (pre) pre.textContent = JSON.stringify(info);
    }
    markReady();
    return;
  }

  // 'editor': the normal page, with a sample photo already loaded.
  const first = await loadImage(`samples/${photo}.jpg`);
  state.photos[0] = first;
  state.photoNames[0] = `${photo}.jpg (sample)`;
  state.panels.forEach((p) => { p.photo = 0; });
  const fxParam = query.get('fx');
  const fyParam = query.get('fy');
  const fx = fxParam === null ? NaN : Number(fxParam);
  const fy = fyParam === null ? NaN : Number(fyParam);
  if (Number.isFinite(fx)) state.panels.forEach((p) => { p.fx = fx; });
  if (Number.isFinite(fy)) state.panels.forEach((p) => { p.fy = fy; });
  if (query.get('photo2')) {
    const second = await loadImage(`samples/${query.get('photo2')}.jpg`);
    state.photos[1] = second;
    state.photoNames[1] = `${query.get('photo2')}.jpg (sample)`;
    state.panels.forEach((p, i) => { p.photo = i % 2; });
  }
  redraw();
  markReady();
}
