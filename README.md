# Slopblock

See more signal, less noise on LinkedIn. Slopblock is a Chrome extension that automatically collapses engagement-bait posts in your LinkedIn feed using local, deterministic rules — no AI, no servers, no tracking.

---

## Installation

### Step 1 — Download the prebuilt release

Go to the **[Releases page](https://github.com/PulastTiwari/palt-slopblock/releases)** and download **slopblock-extension.zip** from the latest release.

### Step 2 — Extract the ZIP

Unzip the downloaded file. You will get a folder named `slopblock-extension` (or similar).

### Step 3 — Load into Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** using the toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the folder you just extracted.

### Step 4 — Done

Visit [linkedin.com/feed](https://www.linkedin.com/feed/) — Slopblock activates automatically.

---

## Updating to a new version

1. Download the new ZIP from the [Releases page](https://github.com/PulastTiwari/palt-slopblock/releases).
2. Extract it, replacing the old folder.
3. Go to `chrome://extensions/` and click the **↺ refresh** icon on the Slopblock card.

---

## What it does

Slopblock scores every post in your LinkedIn home feed against a set of configurable signals (emoji density, short-line stacking, CTA endings, hashtag overuse, etc.). Posts that exceed your chosen threshold are silently collapsed with a small banner. You stay in control — you can always reveal a post with a single click.

**In-feed controls on every collapsed post:**
- **Why?** — shows which signals triggered the collapse
- **Show** — reveals the post for this session

**Popup controls:**
- Toggle filtering on/off
- Adjust strictness level (Very strict → Very relaxed)

**Options page** (`...` → Extension options):
- Set an exact threshold score
- Enable/disable individual signals and tune their weights
- Edit custom phrase and regex pattern lists
- Whitelist specific authors by profile path

---

## How it works

All processing happens locally in your browser. No post text ever leaves your device.

Each post is scored by a set of configurable signals:

| Signal | Default weight | Description |
|--------|---------------|-------------|
| Emoji density | +2 | High emoji-to-word ratio |
| Emoji/bullet lines | +2 | Lines prefixed by emoji or bullets |
| Inline phrase matches | +2 | Matches from your phrase list |
| CTA ending | +3 | Post ends with a call-to-action |
| Excess line breaks | +2 | Many line breaks in a short post |
| Em-dash overuse | +1 | Em-dashes present |
| Hashtag overuse | +2 | High hashtag density |
| Short-line stacking | +3 | 4+ consecutive short lines |
| Technical tokens | −3 | Code keywords detected (reduces false positives) |
| Long paragraph | −2 | Post has a long, dense paragraph |
| No-CTA / no-stack | −2 | Short post with no CTA and no stacking |

Default threshold: **10**. Adjust it from the popup or options page.

---

## Privacy

All filtering is done locally. No data leaves your browser. See [PRIVACY.md](PRIVACY.md) for details.

---

## For developers

> Everything below is for contributors building from source. Regular users do not need any of this.

**Requirements:** Node.js v18+ and npm.

```bash
git clone https://github.com/PulastTiwari/palt-slopblock.git
cd palt-slopblock
npm install
npm run build        # produces the dist/ folder
```

```bash
npm run dev          # watch build
npm run typecheck    # TypeScript checks
npm test             # unit tests (Jest)
npm run test:e2e     # Playwright E2E tests
npm run ci           # full local CI (typecheck + lint + test + build)
npm run package:zip  # build and package → release/slopblock-extension.zip
```

**Cutting a release** — push a version tag and GitHub Actions builds and attaches the prebuilt ZIP to the release automatically:

```bash
git tag v0.2.0
git push origin v0.2.0
```

---

## License

MIT — see [LICENSE](LICENSE).
