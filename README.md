# Vice Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Iqblhkim/gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Iqblhkim/gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

A GTA 6-style cover art maker for the [make.fun gta6-cover-art-01 bounty](https://make.fun/c/gta6-cover-art-01): turn your photo and a caption into a multi-panel Vice City poster, exported as a PNG to share.

## How it works

1. Load up to 3 photos from your machine (FileReader only — nothing is ever uploaded).
2. Fill 5 poster panels or 4 quad panels with one photo or several; click any panel in the live preview to crop (zoom) and position it.
3. Write a caption and subtitle, pick a sunset / neon / noir colour grade.
4. Export PNG at 1080 × 1080, 1080 × 1350, or 1920 × 1080 — or all three at once.

Everything runs offline in the browser: static files under `app/`, no build step, no network request. Try it with `node serve.ts`, then open http://localhost:8080.

## Originality

All art and lettering is original and made in the browser: a sunset gradient backdrop with a slatted retro sun, bold system lettering with outline, gradient fill and neon glow. No Rockstar Games logo, wordmark, official artwork, character, or game font is used anywhere. The two sample photos under `app/samples/` were made for make.fun with an image model and are free to use.

## License

MIT — see [LICENSE](LICENSE).
