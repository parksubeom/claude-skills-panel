# Changelog

All notable changes to this extension are documented here.

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
