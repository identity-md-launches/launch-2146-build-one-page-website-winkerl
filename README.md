# winkerl

A one-page home-finding website for Vienna, built with React, TypeScript, and Vite. Explore six clearly labeled sample homes, search by neighborhood or postcode, combine filters, sort results, save favorites in your browser, and download a shortlist.

The complete production website is included in **`dist/`**. Photography, font, favicon, and share image are local. No account, backend, API key, wallet, or external runtime service is required. Listings are fictional examples, with no live availability or booking service.

## Install and develop

Use Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Dependencies come from the lockfile; do not include dependency folders or package caches in a submission.

## Rebuild and preview the export

```sh
npm run typecheck
npm run build
npm run preview
```

Vite previews `dist/` at `http://localhost:4173` by default. An alternative requiring only Python is:

```sh
python3 -m http.server 4173 --directory dist
```

Serve `dist/` over HTTP. Vite's `base: './'` produces relative asset URLs, and navigation uses same-page anchors. The export was also tested under `/preview/`, with external requests blocked. A static host can serve the folder without route rewrites or a rebuild.

## Validate interactions

```sh
npx playwright install chromium
npm run validate
```

The validator serves the actual export under `/preview/`, launches Chromium, exercises primary interactions, checks responsive layouts and accessibility, captures screenshots, and shuts down its server and browser. Its output goes to `test/scratch/interaction/`, which is disposable and excluded from the submission. On a host with WebKit's native libraries, run `npm run validate -- --webkit` for the second engine.

To regenerate the 1200 × 630 share image after a branding change:

```sh
node scripts/make-share.mjs
npm run build
```

The image generator uses local assets and a bounded Playwright session. The committed image is already complete; normal builds do not need to regenerate it.

## Actual validation results

Final checks on 2026-10-18:

| Check                                                     | Result                                                                           |
| --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Clean `npm ci` from `package-lock.json`                   | Passed; 0 reported vulnerabilities                                               |
| TypeScript `tsc --noEmit`                                 | Passed                                                                           |
| Production `vite build`                                   | Passed                                                                           |
| Chromium interaction scenarios                            | 19/19 passed                                                                     |
| Pinned taste@1 design probe, offline                      | 16/16 passed                                                                     |
| Axe scans: mobile, desktop, filters, details, saved homes | 0 violations across 5 states; incomplete contrast checks disclosed in validation |
| Reflow widths                                             | 320, 390, 650, 850, 1120, 1440px; no horizontal overflow                         |
| First 390 × 844 screen                                    | Search plus first home photo, price, title, and save control visible             |

Build dependencies were installed in a temporary directory outside the repository to respect the protected dependency-folder rule. The identical source was typechecked and built there, then the resulting repository export was served and tested. No dependency directory, registry archive, or cache is included.

The provided browser connector could not start because its Chrome executable was unavailable. Local Playwright Chromium supplied the rendered checks and screenshots. WebKit was downloaded but could not launch because native system libraries were missing. No physical-device, screen-reader, browser-native zoom, or browser Animations-panel session was performed. Text enlargement to 200%, CSS zoom, emulated touch, reduced motion, and forced colors were checked separately. These checks are the contributor's evidence, not independent certification.

See [the full validation and six-domain review](artifacts/validation.md), [implemented design system](DESIGN.md), [interaction results](artifacts/interaction-results.json), and [design probe results](artifacts/taste-results.json).

## Source and assets

- `src/App.tsx`: page, search/filter state, saved-home storage, overlays, and shortlist download.
- `src/data.ts`: sample home data and filtering.
- `src/components/`: icons, listing card, and accessible dialog.
- `src/styles.css`: implemented tokens, components, and breakpoints.
- `public/`: locally bundled photography, Manrope font, favicon, share image, and licenses.
- `scripts/`: bounded preview, browser validation, and share-image rendering.
- `dist/`: ready-to-serve production export, intentionally included.

Update the examples in `src/data.ts`; they are never presented as real inventory. Saved homes use the local-storage key `winkerl.saved-homes.v1` and are limited to this browser. If storage is unavailable, the collection works for the current visit and says so. There is no cross-device sync.

Asset sources and licensing are recorded in [artifacts/ASSETS.md](artifacts/ASSETS.md). The six-domain design review applied the pinned Better Interface guidance by Jakub Krehel (MIT) and the Impeccable documentation method by Paul Bakaus (Apache-2.0). Their supplied notices are retained in [artifacts/licenses/design-guidance.txt](artifacts/licenses/design-guidance.txt).

## Submission budget

The hard cap is 8,388,608 bytes. The final file and export sizes are recorded in [artifacts/submission-size.json](artifacts/submission-size.json). Source, lockfile, runtime assets, export, and review evidence are retained.

`.gitignore` assigns **0 submitted bytes** to each generated path pattern: `**/node_modules/`, `**/.vite/`, `**/.cache/`, `**/.npm/`, `**/coverage/`, `**/*.tsbuildinfo`, and `/test/scratch/`. The production `dist/` folder has no ignore rule. No vendored registry, package archives, symlinks, or submodules are needed.
