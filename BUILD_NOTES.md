# BUILD NOTES — Vice Cover Studio (gta6-cover-art-01)

Entry: offline GTA 6-style multi-panel cover maker. NOT submitted, NOT pushed —
build + local validation + commit only; seal/check/submit are the parent's job.

## What was built (all written fresh in the recorded session)

- `app/index.html` — editor: 3 photo slots, caption + subtitle, layout/grade/size
  pickers, per-panel crop controls, export buttons, live preview canvas.
- `app/style.css` — dark neon editor theme, system fonts only, shot-cover mode.
- `app/src/cover.js` — renderer: `layoutPanels` (poster 5 / quad 4),
  `drawBackdrop` (sunset gradient + light beams + slatted retro sun),
  `drawPanelPhoto` (cover-fit crop with zoom + focal point, clamped so the
  photo always fills the panel), `drawEmptyPanel`, `drawCaption` (gradient
  fill, dark outline, neon glow), `drawCover`, `renderExport`.
- `app/src/main.js` — editor wiring: photo library (3 slots), fill-all,
  sample loaders, drag-and-drop, panel click-to-select, zoom/X/Y sliders,
  export one size / all 3 sizes, `?shot=` mode.
- `app/src/shots.js` — shot scenes: `cover` (export-size cover alone),
  `editor` (page with sample loaded), `exporttest` (renders the export path
  and reports PNG width/height/bytes/header into `#test-output`).
- `main.ts` — rewritten with own comments; same plumbing (copy app/ +
  screenshots/, write dossier.json via vendored `buildDossier`).
- `shots.json` — 4 shots (landscape cover first by name).
- `README.md` — make.fun badges (assumes github.com/Iqbal.../gta6-cover-art-01 —
  parent to confirm owner/repo at submit).
- `screenshots/` — 4 JPEGs taken headless from the running app (see below).
- `vendor/makefun-app.ts` — UNTOUCHED. `LICENSE` (MIT) — untouched.
- No Rockstar logo/wordmark/artwork/font anywhere; lettering is system bold
  with stroke + gradient + glow; samples are the kit's model-made photos.

## Bugs found by testing (and fixed)

1. `drawCover` passed the layout rect (no zoom/fx/fy) to `drawPanelPhoto`,
   so zoom/fx/fy were `undefined` → `drawImage` got NaN and silently drew
   nothing; panels showed only the grade wash over black. Fixed by merging
   the panel's crop settings into the rect, plus `??` defaults in
   `drawPanelPhoto`.
2. Focal-point panning could expose black background at a panel edge when
   zoom = 1. Fixed by clamping dx/dy so the photo always covers the panel.
3. Screenshots were retaken after each fix (3 rounds total).

## Local validation (all in headless Chrome for Testing 159, localhost:8080)

- Syntax: `node --check` on all three app modules — OK.
- No network references: no `http://`/`https://`/`//host` in index.html,
  style.css or src/*.js; no external fonts; photos via FileReader/object URL.
- Export (`?shot=exporttest`, real browser, `toBlob` path):
  - 1920×1080 → PNG OK, 2.903.324 bytes
  - 1080×1080 → PNG OK, 1.942.490 bytes
  - 1080×1350 (neon) → PNG OK, 2.152.960 bytes
- Pixel checks (CDP): panel centres show photo pixels after fix
  (e.g. hero [95,149,164] sea + wash); zoom slider changes panel pixels;
  grade switch changes pixels; panel click selects Panel 2; quad layout
  shows 4 panel chips; size switch resizes preview to 760×760; Export click
  sets status `Saved vice-cover-1080x1080.png (1080 × 1080).`
- Screenshots (all ≤ 256 KiB, long side ≤ 1280, short side ≥ 480):
  - `1-cover.jpg` 1280×720, 164.235 B — landscape cover, Sunset Heist
  - `2-editor.jpg` 1280×800, 150.934 B — editor with photo loaded
  - `3-cover-square.jpg` 1024×1024, 202.030 B — square cover
  - `4-cover-portrait.jpg` 1024×1280, 216.328 B — portrait cover, neon
- `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice → `diff -r` identical
  (dossier byte-identical); /output total 1,9 MB; dossier.json 1.012.324 B
  (< 1,5 MiB cap).
- `makefun.mjs check` BEFORE commit: 4 passed, 1 failed (entrypoint — the
  check reads the last commit, files were still uncommitted), 18 skipped,
  3 at-submission. Re-run after commit (below).

## `makefun.mjs check` AFTER commit

- Commit `2646eb0` (first version): **5 passed, 0 failed, 18 skipped,
  3 checked at submission** — pass: competition_open, snapshot
  (19 files, 953.939 bytes), license_osi, entrypoint (main.ts → node22),
  repo_created_after_open. All transcript checks skip locally (the site
  runs them on the sealed recordings). `transcripts_witnessed` can only be
  checked by the site at submit.

## Open points for parent

- `transcripts_witnessed` can only be checked by the site at submit.
- README badges assume repo `Iqblhkim/gta6-cover-art-01` — confirm at submit.
- `out/` and `out2/` build dirs were removed before committing; the dev
  server on :8080 was stopped after validation.
- This file is committed with the entry (repo root only — main.ts never
  copies it to /output, so it cannot affect the gate).
