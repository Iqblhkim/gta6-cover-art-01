// Vice Cover Studio — the editor.
// State: 3 photo slots, one panel setup per layout, caption + subtitle, grade
// and post size. Click a panel in the preview to select it, then crop and
// position that panel. Photos never leave the machine: FileReader / object
// URLs only, no upload, no network. A `?shot=` query sets up a fixed scene
// for a screenshot instead (./shots.js).
import { POST_SIZES, drawCover, emptyPanel, layoutPanels, panelCount, renderExport } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');

// Up to 3 photos in the library; panels point at them by index (-1 = empty).
const state = {
  layout: 'poster',
  caption: 'Sunset Heist',
  subtitle: 'Vice City',
  grade: 'sunset',
  size: '1920x1080',
  photos: [null, null, null],
  photoNames: ['', '', ''],
  panels: [emptyPanel(), emptyPanel(), emptyPanel(), emptyPanel(), emptyPanel()],
};
let selectedPanel = 0;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function previewScale() {
  const [w, h] = POST_SIZES[state.size];
  const s = Math.min(760 / w, 760 / h);
  return [Math.round(w * s), Math.round(h * s)];
}

function redraw() {
  const [pw, ph] = previewScale();
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  drawCover(canvas, state);
  syncPanelControls();
  syncPhotoSlots();
}

/** Keeps the panel strip and sliders showing the selected panel. */
function syncPanelControls() {
  const count = panelCount(state.layout);
  document.querySelectorAll('.panel-chip').forEach((chip, i) => {
    chip.style.display = i < count ? '' : 'none';
    chip.classList.toggle('selected', i === selectedPanel);
    chip.classList.toggle('empty', (state.panels[i] || emptyPanel()).photo < 0);
    chip.textContent = `Panel ${i + 1}${(state.panels[i] || emptyPanel()).photo < 0 ? ' · empty' : ` · Photo ${(state.panels[i].photo + 1)}`}`;
  });
  const panel = state.panels[selectedPanel];
  document.getElementById('panel-photo').value = String(panel.photo);
  document.getElementById('panel-zoom').value = String(panel.zoom);
  document.getElementById('panel-x').value = String(panel.fx);
  document.getElementById('panel-y').value = String(panel.fy);
  document.getElementById('panel-label').textContent = `Panel ${selectedPanel + 1} of ${panelCount(state.layout)}`;
}

/** Keeps the three photo slots showing what is loaded. */
function syncPhotoSlots() {
  state.photos.forEach((img, i) => {
    const label = document.getElementById(`slot-label-${i}`);
    if (label) label.textContent = img ? `Photo ${i + 1}: ${state.photoNames[i]}` : `Photo ${i + 1}: empty`;
    const fill = document.getElementById(`fill-${i}`);
    if (fill) fill.disabled = !img;
  });
}

function setStatus(text) {
  status.textContent = text;
}

/** Puts an image into a library slot and points empty panels at it. */
async function setPhoto(slot, img, name) {
  state.photos[slot] = img;
  state.photoNames[slot] = name;
  // First photo fills every empty panel, so one photo already makes a cover.
  state.panels.forEach((p) => { if (p.photo < 0) p.photo = slot; });
  redraw();
  setStatus(`${name} loaded into Photo ${slot + 1} — it fills the empty panels.`);
}

async function loadFileIntoSlot(slot, file) {
  if (!file) return;
  try {
    const img = await loadImage(URL.createObjectURL(file));
    await setPhoto(slot, img, file.name);
  } catch {
    setStatus(`Could not read ${file.name} as an image.`);
  }
}

async function loadSampleIntoSlot(slot, sample) {
  try {
    const img = await loadImage(`samples/${sample}.jpg`);
    await setPhoto(slot, img, `${sample}.jpg (sample)`);
  } catch {
    setStatus(`Could not load the ${sample} sample.`);
  }
}

// --- photo slots -----------------------------------------------------------
state.photos.forEach((_, i) => {
  document.getElementById(`photo-${i}`).addEventListener('change', (e) => {
    loadFileIntoSlot(i, e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById(`fill-${i}`).addEventListener('click', () => {
    state.panels.forEach((p) => { p.photo = i; });
    redraw();
    setStatus(`All panels now use Photo ${i + 1}.`);
  });
});
document.getElementById('sample-boulevard').addEventListener('click', () => loadSampleIntoSlot(0, 'boulevard'));
document.getElementById('sample-pier').addEventListener('click', () => loadSampleIntoSlot(1, 'pier'));
document.getElementById('sample-both').addEventListener('click', async () => {
  await loadSampleIntoSlot(0, 'boulevard');
  await loadSampleIntoSlot(1, 'pier');
  // Mix the two photos across the panels for a two-photo cover.
  state.panels.forEach((p, i) => { p.photo = i % 2; });
  redraw();
  setStatus('Boulevard in Photo 1, pier in Photo 2, mixed across the panels.');
});

// --- caption, layout, grade, size ------------------------------------------
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
document.querySelectorAll('[data-layout]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.layout = btn.dataset.layout;
    while (state.panels.length < panelCount(state.layout)) state.panels.push(emptyPanel());
    selectedPanel = 0;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b === btn));
    redraw();
    setStatus(`Layout: ${btn.textContent.trim()}.`);
  });
});
document.querySelectorAll('[data-grade]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.grade = btn.dataset.grade;
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b === btn));
    redraw();
  });
});
document.querySelectorAll('[data-size]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.size = btn.dataset.size;
    document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b === btn));
    redraw();
    setStatus(`Previewing ${state.size.replace('x', ' × ')}.`);
  });
});

// --- panel selection + crop -------------------------------------------------
document.querySelectorAll('.panel-chip').forEach((chip, i) => {
  chip.addEventListener('click', () => { selectedPanel = i; redraw(); });
});
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const rects = layoutPanels(state.layout, canvas.width, canvas.height);
  const hit = rects.findIndex((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
  if (hit >= 0) {
    selectedPanel = hit;
    redraw();
    setStatus(`Panel ${hit + 1} selected — crop and position it below.`);
  }
});
document.getElementById('panel-photo').addEventListener('change', (e) => {
  state.panels[selectedPanel].photo = Number(e.target.value);
  redraw();
});
document.getElementById('panel-zoom').addEventListener('input', (e) => {
  state.panels[selectedPanel].zoom = Number(e.target.value);
  redraw();
});
document.getElementById('panel-x').addEventListener('input', (e) => {
  state.panels[selectedPanel].fx = Number(e.target.value);
  redraw();
});
document.getElementById('panel-y').addEventListener('input', (e) => {
  state.panels[selectedPanel].fy = Number(e.target.value);
  redraw();
});
document.getElementById('panel-reset').addEventListener('click', () => {
  state.panels[selectedPanel] = { ...state.panels[selectedPanel], zoom: 1, fx: 0.5, fy: 0.5 };
  redraw();
});
document.getElementById('panel-photo-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const free = state.photos.findIndex((p) => !p);
  const slot = free >= 0 ? free : 0;
  const img = await loadImage(URL.createObjectURL(file));
  state.photos[slot] = img;
  state.photoNames[slot] = file.name;
  state.panels[selectedPanel].photo = slot;
  redraw();
  setStatus(`${file.name} is now in Panel ${selectedPanel + 1}.`);
  e.target.value = '';
});

// --- drag and drop onto the preview ----------------------------------------
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) loadFileIntoSlot(0, file);
});

// --- export -----------------------------------------------------------------
function downloadCanvas(exportCanvas, sizeKey) {
  exportCanvas.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — the browser could not make the PNG.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${sizeKey}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved vice-cover-${sizeKey}.png (${exportCanvas.width} × ${exportCanvas.height}).`);
  }, 'image/png');
}

document.getElementById('export').addEventListener('click', () => {
  downloadCanvas(renderExport(state, state.size), state.size);
});
document.getElementById('export-all').addEventListener('click', () => {
  Object.keys(POST_SIZES).forEach((sizeKey, i) => {
    setTimeout(() => downloadCanvas(renderExport(state, sizeKey), sizeKey), i * 400);
  });
  setStatus('Exporting all three post sizes…');
});

// --- shot mode / normal start ------------------------------------------------
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, state, { loadImage, setPhoto, redraw });
} else {
  redraw();
}
