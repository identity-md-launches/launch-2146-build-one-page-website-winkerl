# winkerl design system

## Overview

winkerl is a one-page Vienna home-finding concept. The implemented character is warm and editorial: a quiet off-white canvas, deep plum text, lilac accents, a drawn corner-house mark, and large interior photographs. All listings are explicitly illustrative.

The page gives browsing priority. A short headline leads directly into search, home-type controls, and a flat listing grid. At 390px, the main action and the first home's identity fit on the first screen. Desktop photography uses three shared columns; the explanatory lilac section comes after the product. These are this page's composition choices, not a requirement to put a hero on every future page.

Source of truth: [src/styles.css](src/styles.css), [src/App.tsx](src/App.tsx), and [src/components](src/components). This document describes the final implementation; validation and remaining limitations are in [artifacts/validation.md](artifacts/validation.md).

## Colors

Colors use hexadecimal primitives and semantic CSS custom properties in `src/styles.css:10`. Components consume the semantic layer.

| Semantic token              | Value     | Implemented role                                                 |
| --------------------------- | --------- | ---------------------------------------------------------------- |
| `--color-page`              | `#f8f7f4` | Page and dialog canvas                                           |
| `--color-surface`           | `#ffffff` | Search surface, photo labels, heart controls, native form fields |
| `--color-subtle`            | `#eeece8` | Image placeholder and close-control fill                         |
| `--color-line`              | `#d9d5d9` | Structural separators and input outlines                         |
| `--color-text`              | `#322239` | Headings, primary copy, icons                                    |
| `--color-muted`             | `#665e6a` | Secondary copy, captions, metadata                               |
| `--color-accent-soft`       | `#e8dff7` | Explanatory section, saved-state fill, count badge               |
| `--color-accent-wash`       | `#f1ecf8` | Demo notice, filter chips, subtle control hover                  |
| `--color-accent-decorative` | `#d6c4ef` | Hand-drawn headline underline                                    |
| `--color-accent`            | `#62407f` | Primary button fill, selected hearts, feature text               |
| `--color-accent-hover`      | `#77549a` | Primary-button hover                                             |
| `--color-on-accent`         | `#ffffff` | Primary-button text and icons                                    |
| `--color-focus`             | `#62407f` | Default focus outline                                            |

There is one light theme. No unused status-color system or dark variant is implied. Selected state also has an underline, filled heart, count, or `aria-pressed`; color alone does not communicate selection.

Measured rendered pairs include plum on page at **13.77:1**, white on the primary fill at **8.21:1**, muted text on page at **5.81:1**, and muted text on the lilac section at **4.84:1**. Opaque white photo labels use plum at **14.75:1**. These are identified solid pairs, not a claim that every photograph or every possible state was measured.

## Typography

One local variable font: **Manrope**, supplied by `public/fonts/manrope-latin-variable.woff2`. The face provides weights 200–800; the interface uses **400, 500, and 700**. The fallback stack is `Manrope, Arial, sans-serif`. `font-display: swap`, root font smoothing, and `font-synthesis: none` are implemented. The browser validation confirmed the Manrope face loaded. Its SIL Open Font License is bundled beside it.

| Token            | Desktop | ≤1120px | ≤650px | Role                                        |
| ---------------- | ------- | ------- | ------ | ------------------------------------------- |
| `--text-small`   | 13px    | 13px    | 13px   | Captions, price suffix, listing facts       |
| `--text-label`   | 14px    | 14px    | 14px   | Navigation, buttons, descriptions           |
| `--text-body`    | 16px    | 16px    | 16px   | Inputs, body copy                           |
| `--text-card`    | 18px    | 18px    | 18px   | Listing titles, subordinate dialog headings |
| `--text-section` | 28px    | 28px    | 24px   | Section/dialog headings and brand text      |
| `--text-display` | 72px    | 56px    | 44px   | Main headline                               |

The root size is 16px; these sizes are defined in rem. At 390px the results heading uses the 18px card step. The probe found six used text sizes at both 390 and 1440px.

Headline line-height is 1.07, changing to 1.12 on phones, with `-0.06em` tracking. Section headings generally use 1.2–1.25 and `-0.035em`; listing titles use 1.5 and `-0.025em`. Body text uses 1.5–1.6, with the desktop hero aside at 1.7. Heading wrapping is balanced; descriptions use `text-wrap: pretty`. Long descriptions cap their measure at 60–65ch. Prices and counts use tabular numerals. Inputs remain 16px on phones. No interface text is ellipsized.

## Layout

`.page-width` is the shared alignment primitive: maximum outer width **1328px**, centered, with **48px** inline padding. Padding becomes 32px at 1120px, 20px at 650px, and 16px below 360px. At 1440px this gives 104px from the viewport edge to content.

Spacing tokens are 4, 8, 12, 16, 20, 24, 32, 40, 48, and 64px. Component geometry also has contextual values such as the 30px mobile card gap and 17px mobile browsing inset; these are explicit rules in the stylesheet, not additional type or spacing tokens.

| Width rule      | Implemented adaptation                                                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default desktop | Hero headline and illustration/description sit side by side; three listing columns with 28px column and 40px row gaps; inline search with neighborhood, budget, and action                                                               |
| ≤1120px         | 56px headline, smaller illustration, 22px listing column gap, metadata can wrap                                                                                                                                                          |
| ≤850px          | Two listing columns with 24px column and 36px row gaps; hero aside replaced by its plain description; shorter search action layout                                                                                                       |
| ≤650px          | Single listing column; header navigation removed while brand and saved collection remain; neighborhood and action form a wrapping search row; budget stays available in Filters; compact icon filter control; explanatory section stacks |
| ≤359px          | Saved label hides while its icon, count, and accessible name remain; narrower margins; filter fields and detail amenities stack                                                                                                          |
| ≥1440px         | Hero receives additional vertical breathing room                                                                                                                                                                                         |

On phones, the search uses a flexible 11rem neighborhood basis. When text grows, the action wraps below it. Sort width is expressed in em so selected text can grow. Filter fields use an auto-fitting 9rem minimum at phone widths. Long search strings wrap in result copy and filter chips.

Listing photography is cropped with `object-fit: cover`: card ratio 1.4 on larger screens, 1.55 on phones. Detail photography has an explicit automatic block size and ratio 1.8, changing to 1.4 on phones. The HTML image dimensions cannot force a tall detail crop.

The export was observed at 320, 390, 650, 850, 1120, and 1440px. Text enlargement to 200%, CSS zoom, and an RTL robustness mirror were also checked for overflow. The shipped language is English; the RTL mirror is not a translated product. Browser-native zoom and physical devices remain unverified.

## Elevation & Depth

Listing cards have no enclosing surface or shadow. Their photographs carry a subtle `1px solid rgb(0 0 0 / 0.1)` inset outline. Search and filter controls use structural borders without shadows.

Dialogs use the native top layer, a `0 20px 90px rgb(28 14 34 / 0.18)` shadow, and a translucent `rgb(25 17 30 / 0.46)` backdrop with 4px blur. The dialog itself has no border. The skip link is the only fixed page control; normal page content and navigation do not stick over text.

## Shapes

Radius tokens: **8px** for buttons, fields, and notices; **14px** for listing photography; **22px** for desktop dialogs. Search uses 18px on desktop and 14px on phones. Photo labels use 6px; saved counts and heart controls are circular. Phone dialogs use an 18px radius and retain 12px around the viewport.

The corner-house brand mark, favicon, and larger hero drawing use related rounded, open line work. Interface icons share one 24px SVG grid, a 1.7px stroke, and `currentColor`; artwork uses separate drawing strokes. A filled heart marks the saved variant.

## Components

| Component or pattern | Source                        | Behavior and reuse                                                                                                                                                                                                                                                                                   |
| -------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Icon`, `BrandMark`  | `src/components/Icon.tsx`     | `Icon` takes `name`, optional `size`, `className`, and `style`; decorative SVGs are hidden from assistive technology. Label the parent control. `BrandMark` accepts `className`.                                                                                                                     |
| `HomeCard`           | `src/components/HomeCard.tsx` | Takes `home`, `saved`, `onSave`, `onOpen`, and optional `eager`. Photo and title open details; the independent heart toggles saving with an accessible name and pressed state. First visible images load eagerly; later rows are lazy.                                                               |
| `Modal`              | `src/components/Modal.tsx`    | Takes `title`, `children`, `onClose`, and optional `className`. Calls native `showModal`, locks background scrolling, contains Tab/Shift+Tab, supports Escape/backdrop/close, restores its trigger, and resets scroll/focus when the title changes. Scrollable content stays within `100dvh` limits. |
| Search and filters   | `src/App.tsx`, `src/data.ts`  | Native labeled search/select/checkbox controls. Search submits on Enter. Modal edits are drafts until applied; cancellation discards them. Result count, removable chips, sort, and home-type buttons update the same local data. Zero results offer a reset.                                        |
| Saved collection     | `src/App.tsx`                 | Local-storage-backed IDs with malformed-data recovery. Header count and hearts reflect the same collection. Removing a saved row moves focus to a remaining control or the empty-state action. Storage failures switch the explanation to current-visit saving.                                      |
| Buttons              | `src/styles.css`              | `.button.primary` is the filled action; `.button` is the outlined variant; `.text-button` is an underlined secondary action; `.icon-button` is a circular utility. Primary and outlined buttons have no shared shadow.                                                                               |
| Listing details      | `src/App.tsx`                 | Actual sample data, an illustrative-use notice, facts, amenities, and a working save control. No simulated contact, booking, or availability controls.                                                                                                                                               |
| Shortlist download   | `src/App.tsx`                 | Builds a UTF-8 text file from the current saved homes using a Blob and revokes its object URL after download. No service call.                                                                                                                                                                       |

Focus uses a 2px outline, normally offset 4px; the search input uses a 2px offset. Primary buttons use the text-colored focus outline against the surrounding page. Forced-colors mode uses the system Highlight color and adds control boundaries where needed.

Hover styles run only on devices with hover. Motion is entirely inside `prefers-reduced-motion: no-preference`: 150ms transitions name color, background, transform, opacity, or filter; pressing a button scales it to 0.96. There are no entrance sequences, autoplay, or endless animations. Reduced motion keeps static selection feedback.

## Do's and Don'ts

- Start a related surface with `.page-width`, semantic headings, the existing type roles, and the semantic color tokens.
- Keep one filled primary action per visible task. Keep utility controls visually distinct and label icon-only actions.
- Add a listing through the `Home` type and `homes` array; use the card and detail patterns, supply descriptive photo alt text, and preserve the illustrative-data disclosure.
- Keep new flows keyboard-complete and return focus when a control or overlay disappears. Use the existing dialog rather than recreating its focus handling.
- Preserve complete local runtime assets and relative production URLs. Rebuild `dist/` after a source or asset change.
- Do not imply real availability, agent replies, cross-device saving, or bookings without implementing that service and replacing the demo content.
- Do not add independent card shadows, extra font families, tracked uppercase labels, or decorative motion to fill space.

For another page, reuse `Icon`, `BrandMark`, `Modal`, the button classes, and `.page-width`; choose existing type roles; keep the DOM reading order aligned with the visual order; then repeat the mobile, keyboard, and export checks documented in validation.
