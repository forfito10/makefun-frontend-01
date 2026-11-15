// makefun-frontend-01: hands the frontend in.
//
// The grader runs this in a sandbox with no network. It copies the app (app/) and the three
// screenshots (screenshots/) of this repository into /output, then writes /output/dossier.json —
// the judge's sheet — with buildDossier from the kit's vendored library, which must stay byte for
// byte the library the scorer uses, so vendor/makefun-frontend.ts is never edited.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

// app/ is the whole frontend: index.html, six ES modules and one stylesheet, plain files,
// no build step. A symbolic link or a special file in it would fail the gate's first check,
// so a recursive copy is exactly right.
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });

// Three PNG or JPEG renders of the running app on live make.fun data, taken by its maker;
// the first by name is the judge's cover. Each is at most 256 KiB, its long side at most
// 1280 and its short side at least 360 pixels.
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the dossier's text;
// the others refuse an entry the scorer would refuse (more than 3 screenshots or one over
// 256 KiB; more than 993 files and directories in app/ or 16 MiB of app files — app/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 3, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 }),
);
