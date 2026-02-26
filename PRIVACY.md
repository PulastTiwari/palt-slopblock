# Privacy Policy — Slopblock

Effective date: 2026-02-25

Slopblock processes LinkedIn feed post content locally in your browser to apply deterministic filtering rules.

## What this extension does
- Observes LinkedIn Home Feed posts in your browser.
- Applies local, rule-based scoring (regex, structure, emoji/token signals).
- Collapses posts that match configured thresholds.

## Data handling
- Post text does not leave your device.
- The extension does not send post text to any remote server.
- Settings and local feedback data are stored using `chrome.storage.local` on your device only.

## Data stored locally
- Scoring settings (threshold, signal toggles, weights, phrase/regex lists)
- Whitelisted author keys
- Local action history used for reversible behavior

## Permissions used
- `storage`: to persist your local settings and feedback metadata.
- `https://www.linkedin.com/*`: to run on LinkedIn feed pages only.

## Contact
For support or privacy questions: pulast2022@gmail.com
