# Contributing

Thanks for considering a contribution! Issues, PRs, translations, and ideas are all welcome.

## Quick reference

- **Bug or feature request** → [open an issue](https://github.com/parksubeom/claude-skills-panel/issues/new)
- **Code change** → fork, branch from `main`, PR back to `main`
- **Translation** → see *Adding a new locale* below
- **New buddy class / pixel art / theme** → see *Adding a buddy class*

## Local setup

```bash
git clone https://github.com/parksubeom/claude-skills-panel
cd claude-skills-panel
npm install

npm run verify        # i18n parity + JS syntax
npm run package       # builds + packages claude-skills-panel-X.Y.Z.vsix
code --install-extension claude-skills-panel-X.Y.Z.vsix   # try it locally
```

After install, **Cmd+Shift+P → "Developer: Reload Window"** picks up the new build.

## Project layout

| File | What lives there |
|---|---|
| `extension.js` | Host + the entire webview HTML/CSS/JS template (it's intentionally one file — easier to grep than 20) |
| `userConfig.js` | Persisted state at `~/.claude/skills-panel-config.json` (skills overrides, character, quickbar, groups, achievements) |
| `tokenUsage.js` | Optional opt-in JSONL parser for `~/.claude/projects/*.jsonl` token metadata |
| `iconMap.js` | Default category → emoji icon picker |
| `achievements.js` | 16 achievement rules + status |
| `i18n/strings.js` | English / 한국어 / 日本語 / 中文 keys (must stay parity — `npm run verify` enforces) |
| `assets/pixel-icons/` | Spark icons + buddy class sprites + manifest |
| `scripts/build-*.js` | Pixel icon / spark / buddy class build scripts (sharp-based) |
| `docs/screenshots/` | README/Marketplace listing assets (excluded from `.vsix`) |

## Working on the webview

The webview is built by `renderHtml()` in `extension.js`. It re-renders fully on every refresh — no React, no diffing. State that needs to survive across re-renders lives in `~/.claude/skills-panel-config.json` (host-side) or `vscode.setState()` (webview-side, e.g. exec mode).

The webview talks to the host through `vscode.postMessage()` — every interaction is a one-way message; the host responds by updating config and either pushing a `postMessage` back or refreshing the whole webview.

## Adding a new locale

1. In `i18n/strings.js`, copy the `en` block as a new top-level locale and translate values. Keep keys identical.
2. Add the locale code to `SUPPORTED` at the bottom of the same file.
3. Run `npm run verify` — the i18n parity checker fails the build if any locale is missing keys present in `en`.
4. Test by changing your VS Code language (`Configure Display Language`) or clicking the `🌐` toggle in the panel.

## Adding a buddy class

1. In `userConfig.js`, append to `BUDDY_CLASSES` (id / role / emoji) and `CATEGORY_RULES` (regex → class).
2. Drop a 32×32 PNG (or larger, panel scales) at `assets/pixel-icons/buddy/class/<id>.png`.
3. Add `class.<id>.name` and `class.<id>.role` translations to `i18n/strings.js` for all four locales.
4. (Optional) Add an `ATTACK_EFFECTS[<id>]` entry in `extension.js` for the side-scroller fight glyph/count/type.

## Testing

There's no automated test suite — verification is manual + the `npm run verify` parity check (no stray Korean in `extension.js`, all i18n keys cover all locales, JS syntax is valid in the five entry files).

When you submit a PR, please describe what you tested:

- Which themes (Dark / Retro / LCD)?
- Which locales (EN / KO / JA / ZH)?
- Narrow Activity Bar AND wide Bottom Panel?
- Both modes (Paste / Term)?
- Any flag combinations (token tracking on/off, buddy actions on/off)?

## Commit style

We follow conventional commit prefixes loosely: `feat`, `fix`, `docs`, `chore`, `refactor`. Tag every release with `vX.Y.Z` — pushing the tag triggers GitHub Actions to publish to OpenVSX + VS Marketplace.

## Releasing (maintainers)

```bash
# bump version in package.json + CHANGELOG.md
npm run package
git commit -m "feat: ... · vX.Y.Z"
git push origin main
git tag vX.Y.Z <commit>
git push origin vX.Y.Z   # triggers CI publish
```

## Code of Conduct

Be kind. The bar is low and there's no formal CoC — this is a side project. If something feels off, just open an issue.
