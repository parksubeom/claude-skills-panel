# Changelog

All notable changes to this extension are documented here.

## [0.25.0] — 2026-05-01

### Added — Plugin Marketplace Browser
- New 🛒 toolbar button opens a modal that aggregates **every plugin from every marketplace you've added** (`/plugin marketplace add …`). Shows ~243 plugins from `claude-plugins-official` out of the box, plus any third-party marketplaces you register.
- Each card shows name, category, description, author, marketplace, and homepage link.
- Search by name/description/author/category, filter by category dropdown, "Installed only" toggle.
- **One-click install** — fires `/plugin install <name>@<marketplace>` through your current execution mode (clipboard / auto-paste / terminal). Installed plugins show a green check instead.
- Lazy-loaded — catalog isn't parsed until the modal is opened.

### Added — Settings export/import
- New ⚙ toolbar button.
- Export: copies the full `~/.claude/skills-panel-config.json` to clipboard (aliases, groups, Quick Bar, achievements, theme, locale). Share via gist or sync via dotfiles.
- Import: paste JSON, confirms before overwriting, validates shape.

### Added — Telemetry opt-in
- First-run banner above the toolbar asks once whether to allow anonymous usage counters. Disappears after the choice is recorded in `meta.telemetry`.
- Toggle anytime from the Settings modal.
- No personal data, no skill names — feature counters only. Hooks for backend dispatch are in place; activation is a separate change.

### Added — Discoverability
- `docs/MAKING_DEMO_GIF.md` — step-by-step guide for recording the canonical 10-second demo, with optimal ffmpeg/gifski pipeline and target size (820px / <600KB).
- README has a placeholder line ready to uncomment once `docs/screenshots/demo.gif` exists.

## [0.24.0] — 2026-05-01

### Added — usability burst
- **Onboarding empty state** — when no skills are discovered, three numbered guide cards appear. Card 1 ("Install superpowers") is one-click: copies the install command, then auto-paste / terminal-send according to your exec mode.
- **Fuzzy search** — score-based ranking. Alias matches outweigh name matches (×1.5), note matches downweighted (×0.4). Subsequence matching catches typos.
- **Keyboard navigation** — `↓` / `↑` from the search bar walks visible cards (with auto-scroll), `Enter` fires the focused card, `Esc` clears.
- **Slash-prefix mode** — typing `/anything` in the search bar makes Enter dispatch that literal command, even when nothing matches. Lets you trigger commands you haven't memorized without leaving the panel.
- **Auto-focus search** on panel mount.
- **Footer links** — `★ Rate` (jumps to VS Marketplace review page) and `Issue` (jumps to GitHub Issues new).

### Added — discoverability
- **Marketplace listing rewrite** — `package.json` description now leads with the value prop ("The fastest way to use Claude Code slash commands…"). New keywords: `command-launcher`, `ai-coding`, `developer-experience`, `agent`, `agents`.
- **README hero** — pain → solution opening, bulleted feature ladder.

### Fixed
- **CI publish workflow** — release job now checks out the repo so `gh release` can resolve git context (the v0.23.0 release-attach failure).

## [0.23.0] — 2026-05-01

### Added
- **Custom groups** — define your own groups with emoji + name in the new `📁` modal (toolbar). Assign skills via the edit modal's `Group` dropdown. Reorder with ↑↓, delete with ✕. Auto groups (My / Project / Plugin) still show below.
- **Theme toggle** — three pixel themes via the new `🎨` button: **Dark** (default), **Retro** (amber CRT), **LCD** (Gameboy DMG green).
- **Quick Bar drag-and-drop**
  - Drag a filled slot onto another slot → swap (atomic, single write).
  - Drag a filled slot outside the Quick Bar → clear that slot.
  - Card → empty slot still works as before.
- **Weekly report export** — new `📋 Copy as Markdown` and `💾 Save as .md` buttons in the report modal. Markdown includes summary, 7-day table, and Top 5.
- **Plugin source attribution** — hover any card to see which plugin and marketplace it came from (e.g. `🧩 superpowers @claude-plugins-official`).
- **Per-plugin discovery** — the panel now walks `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/` per plugin instead of treating the cache as one bucket.
- **GitHub Actions release pipeline** ([.github/workflows/publish.yml](.github/workflows/publish.yml)) — push a `vX.Y.Z` tag to package and publish to OpenVSX + VS Code Marketplace in parallel, plus attach the `.vsix` to a GitHub Release.
- **CI workflow** ([.github/workflows/ci.yml](.github/workflows/ci.yml)) — runs `npm run verify` on every PR.
- **`scripts/check-i18n.js`** — verifies no stray Korean in `extension.js`, no missing translation keys, and EN/KO key parity. Runs as part of `npm run verify` and is blocked on `npm run package`.
- **VS Code Marketplace** distribution alongside OpenVSX.

### Changed
- **Polished English strings** — fixed awkward direct translations in toolbar tooltips, exec mode labels, achievement descriptions, footer hint, and toasts. Korean strings unchanged.
- `package.json` — expanded `keywords` (added `claude-code-plugin`, `superpowers`, `mcp`, `slash-command`, `8-bit`, `dotfiles`, etc.), added `galleryBanner`, `qna`, `pricing`, `sponsor`. Description now leads with auto-discovery + plugin support.
- README — dynamic version/download badges, dual marketplace install links, expanded discovery table, releasing guide.
- Plugin group sub-text now shows live count (`{N} plugins`) instead of static `superpowers / etc.`.

## [0.22.0] — 2026-04-30

- i18n (en/ko) infrastructure with footer toggle.
- Spark preset search input in the edit modal.
- Locale resolved as `cfg.meta.locale → vscode.env.language → 'en'`.

## [0.21.1] — 2026-04-30

- Spark preset icon picker grid in the edit modal.
- New `activity-icon.svg` for the activity bar.
- 30-icon Spark preset set under `assets/pixel-icons/spark/`.

## [0.20.x] — 2026-04-29

- Initial OpenVSX release: aliases, custom icons, Quick Bar, Buddy character, achievements, weekly report, three execution modes.
