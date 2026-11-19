// Vice Cover Studio — a gta6-cover-art-01 entry (Node 22, standard library only).
// The app is this directory's app/ folder: plain static files a desktop browser
// loads offline (app/index.html and its ES modules, no library and no network
// request). It hands the app in by copying app/ and screenshots/ from beside
// this file to /output and writing /output/dossier.json, the summary the judge
// reads, with the vendored make.fun library.
//
// What the app does (built fresh in this session, replacing the starter's
// one-photo Cover Snap): a GTA 6-style multi-panel cover maker. Load up to 3
// photos from your machine (never uploaded), fill 5 poster panels or 4 quad
// panels with one photo or several, crop + position each panel by clicking it,
// write a bold outlined caption + subtitle, pick a sunset / neon / noir grade,
// and export PNGs at 1080x1080, 1080x1350 and 1920x1080. The lettering is a
// system bold with stroke, gradient and glow — no Rockstar logo, artwork or
// font anywhere. Its two sample photos (app/samples/) were made for make.fun
// with an image model and are free to use.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
