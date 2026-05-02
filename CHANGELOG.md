# Changelog

All notable changes to this extension are documented here.

## [0.36.0] — 2026-05-02

### Removed — dead `stage` plumbing

After v0.35 collapsed the buddy system to "always class from action 0", several constants and helpers were carrying weight for a flow that no longer exists. This release sweeps them out.

userConfig.js:
- `BRANCH_AT_LEVEL` constant (was already 0; checked nowhere meaningful) — deleted.
- `STAGE_NAMES_GENERIC` → renamed to `STAGE_NAMES_EN` and made internal-only. The webview already renders the localized `stage.<n>.name` key per locale; this stays as a host-side fallback for `c.stageName` only.
- `stageNameFor()` helper — its branch-aware logic was vestigial. Replaced with a direct `STAGE_NAMES_EN[stage]` lookup at the two call sites.
- `BUDDY_NAMES`, `STAGE_NAMES_GENERIC`, `BRANCH_AT_LEVEL`, `stageNameFor` removed from the exports object.

extension.js:
- `const BUDDY_NAMES = userConfig.BUDDY_NAMES` import removed.
- Quick Bar locked-slot tooltip switched from `BUDDY_NAMES[i]` to `t('stage.' + i + '.name')` so the unlock-stage hint is now properly localized in ko/ja/zh (was English-only before).

No behavior change; just less surface area.

## [0.35.0] — 2026-05-02

### Changed — Buddy starts as a class from the very first action

The pre-branch Egg / Hatchling phase (LV.1-2 generic sprites in v0.29-0.34) is gone. Class is now decided **on the first slash-command click**, and every level uses the class sprite.

#### Stage renames
| LV | Threshold | v0.34 name | v0.35 name |
|---|---|---|---|
| 1 | 0 | Egg / Hatchling generic | **Apprentice [Class]** |
| 2 | 10 | Novice / Adept | **Adept [Class]** |
| 3 | 50 | branch point | **Skilled [Class]** |
| 4 | 150 | Adept | **Master [Class]** |
| 5 | 500 | Master | **Legend [Class]** |

#### Removed
- `assets/pixel-icons/buddy/stage0.png` / `stage1.png` (Egg, Hatchling) — no longer referenced
- `scripts/build-buddy-icons.js` retired; `npm run build:buddy` now only invokes `build-buddy-classes.js`
- `assets/pixel-icons/buddy/stages.json` (was unused at runtime anyway)
- i18n keys `modal.buddy.preBranch`, `modal.buddy.skillStatsBefore`, `modal.buddy.skillStatsAfter` (replaced by `modal.buddy.skillStats`)

#### Added
- `stage.0.name` … `stage.4.name` keys per locale (en/ko/ja/zh) — `Apprentice` / `견습` / `見習い` / `学徒` etc.
- New toast.classBranch wording: `"⚔️ {name} starts as {class} the {role}!"` (en) — fires on first action, not LV.3
- New toast.evolution wording: `"🎉 {name} reached {stage}!"` (LV-up within the same class)

#### Migration
Existing users with `actions > 0` but no `class` set are auto-decided on next `getCharacter()` read using their current `skillStats` (or default to `codey` if empty).

#### Sprite resolver simplification
`extension.js` buddy resolver dropped the multi-stage fallback ladder. Single line: `assets/pixel-icons/buddy/class/<id>.png` always. Default `codey` for the brief moment before the first action.

## [0.34.0] — 2026-05-01

### Listing rewrite — first-time visitor focus

Both the Marketplace `description` and the README hero are rewritten around the question "what does a first-time visitor see in 5 seconds?"

**`package.json` description**:
- Was: feature-list ("Auto-discovers every /command, /skill, …")
- Now: pain-then-solution hook ("Stop typing /commit-prepare from memory. Finds every Claude Code slash command on your machine — your skills, project commands, all installed plugins — and fires it with one click or keys 1–6. Built-in plugin marketplace browser. Free, MIT.")

**README hero**:
- Headline `## Stop typing /full-flow from memory.` opens the README
- One-line context for visitors who don't know Claude Code yet (links to the official docs)
- Reframed as "Three things you get the moment you install" (concrete value) followed by "And then the side-project gravity hits" (the gamification)
- Cropped buddy-lineup.png positioned higher, with sharper alt text ("your usage pattern decides which of 10 RPG classes your buddy becomes")
- "All gamification is one toggle off" reassurance directly under the gamification list — addresses the most common objection (e.g. "I just want a clean launcher")
- Tagline carried in three languages on the same line so non-English visitors see immediate value

No code changes. The image asset already swapped to the cropped version in v0.33-era; this release makes the listing copy match.

## [0.33.0] — 2026-05-01

### Removed — unused legacy buddy sprites

The pre-v0.29 single-evolution buddy line (Kitten, Cat, Monkey, Dragon at `buddy/stage{2..5}.png`) was kept around as a fallback when class PNGs were still placeholders. With all 10 artist class PNGs in place since v0.30, those four stages were dead weight.

- `assets/pixel-icons/buddy/stage{2,3,4,5}.{png,svg}` deleted (8 files).
- `scripts/build-buddy-icons.js` no longer ships their grid definitions; the legacy-cleanup loop at the top of `build()` will remove them automatically if they reappear from a stale build.
- `extension.js` buddy sprite resolver simplified — the `stage5.png` last-resort fallback (which only fired when both the class PNG and the stage PNG were missing) is replaced by `stage1.png` (Hatchling), which is always shipped.
- `stages.json` now lists only Egg and Hatchling.

Behavior is unchanged: LV.1 → Egg, LV.2 → Hatchling, LV.3+ → class PNG.

## [0.32.0] — 2026-05-01

### Added — Chinese (zh) locale + extra discovery surface

- **Full Simplified Chinese translation** of all 209 keys, at parity with en/ko/ja. The 🌐 footer toggle now cycles `en → ko → ja → zh → en`. `vscode.env.language === 'zh-cn'` (or any zh-* variant) auto-detects.
- The 10 buddy classes get Chinese names: 科迪 (Codey), 文档师 (Docly), 调试侠 (Debuggo), 测试拉 (Testra), 表格师 (Sheety), 幻灯侠 (Slidey), PDF 狐 (PDFox), 网页师 (Webbie), 达提娅 (Datia), 吉托 (Gitto).

### Marketplace exposure
- `package.json` `description` now ends with `English · 한국어 · 日本語 · 中文` so the localization story is visible on listing.
- New `keywords`: `i18n`, `中文`, `한국어`, `日本語` — non-English search terms hit non-English browsers.
- New `badges` field — VS Marketplace renders these on the listing's metadata sidebar (OpenVSX downloads, GitHub stars, MIT license).
- README adds a multilingual one-liner under the badges so non-English visitors instantly see "this is for me."
- Trust badge added: GitHub stars (live count).

## [0.31.0] — 2026-05-01

### Added — External-launch infrastructure

This release is mostly marketing/launch assets. The code change is a single
README hero strengthening; the rest is `docs/marketing/` content designed to
be copy-pasted into external channels.

- **Press kit** ([docs/marketing/PRESS_KIT.md](docs/marketing/PRESS_KIT.md)) — one-line / short / long descriptions, fact sheet, differentiators, FAQs, quotable lines (en/ko), image asset CDN links, GitHub repo metadata recipe (About / Topics / Social preview).
- **One-pager** ([docs/marketing/ONE_PAGER.md](docs/marketing/ONE_PAGER.md)) — a 30-second markdown summary attachable to email, DM, Slack.
- **Outreach templates** ([docs/marketing/OUTREACH.md](docs/marketing/OUTREACH.md)) — email/DM copy for Anthropic Devrel, AI/devtool influencers, sub moderators, AI tool directories, Korean dev communities.
- **Blog post body** ([docs/marketing/BLOG_POST_BUILD_RETRO.md](docs/marketing/BLOG_POST_BUILD_RETRO.md)) — full ~5000-char retrospective in en + ko, ready to paste into dev.to / Hashnode / Medium / velog.
- Marketing index rewritten with a 14-step launch timeline (T+0 → T+1m).

### README
- Hero now opens with the buddy lineup image as the visual anchor
- Three-language tagline added ("English · 한국어 · 日本語")
- Plugin Marketplace browser, Quick Bar, and trilingual support promoted to top-level bullets
- "Built with Claude Code itself" tagline added — recursion as marketing angle

## [0.30.0] — 2026-05-01

### Added — Final buddy class artwork

The 10 placeholder class sprites shipped in v0.29.0 are replaced with the real artist designs:

- Codey 🗡️ (Swordsman) · Docly 📜 (Cleric) · Debuggo 🔍 (Detective)
- Testra 🛡️ (Paladin) · Sheety 📊 (Merchant) · Slidey 🎤 (Bard)
- PDFox 🦊 (Rogue) · Webbie 🕸️ (Wizard) · Datia 🧙‍♀️ (Astrologer) · Gitto ⚔️ (Ninja)

`docs/screenshots/buddy-lineup.png` — full lineup card (now linked from the README's Buddy section as a hero image for the Marketplace listing).

### Build pipeline
- `scripts/build-buddy-classes.js` skip threshold lowered to 700 bytes so future placeholder rebuilds correctly identify and skip the artist PNGs (~900–1200 bytes) without overwriting them. Placeholder SVGs no longer regenerate when an artist PNG is in place.

### README
- Buddy section completely rewritten to reflect the class-branch system (the lineup image, the 5-stage table, the 10 class table with their trigger keywords, the Reincarnate option).

## [0.29.0] — 2026-05-01

### Buddy system: class-branch evolution

Big buddy mechanic change. The single 6-stage Egg → Dragon line is gone, replaced by a 5-stage system that **branches into one of 10 classes** based on the user's slash-command usage pattern.

#### Stages
- **LV.1 Egg** (action 0–9) — common
- **LV.2 Hatchling** (action 10–49) — common
- **LV.3 [Class]** (action 50–149) — class is decided here, by max-count category in `skillStats`
- **LV.4 [Class] Adept** (150–499) — same sprite, code-side aura overlay (planned)
- **LV.5 [Class] Master** (500+) — strongest aura

#### 10 classes
Codey 🗡️ Swordsman · Docly 📜 Cleric · Debuggo 🔍 Detective · Testra 🛡️ Paladin · Sheety 📊 Merchant · Slidey 🎤 Bard · PDFox 🦊 Rogue · Webbie 🕸️ Wizard · Datia 🧙‍♀️ Astrologer · Gitto ⚔️ Ninja

Each tied to a regex over the slash-command name. `/code-review` → Testra, `/full-flow` → Codey (default), `/git-commit` → Gitto, etc.

#### Data model additions
- `character.skillStats` — per-class action counters
- `character.class` — locked once at LV.3, can be reset via Reincarnate
- `character.classLockedAt` — ISO timestamp
- Migration: existing users past 50 actions auto-decide on next render

#### UI
- Character sheet now shows the locked class (emoji + role + LV) or, pre-branch, a "X more uses until class is decided" hint.
- New `skillStats` bar chart per class, sorted by count, current class highlighted.
- New `🔄 Reincarnate` button — clears the class, keeps the counts.
- Class-branch toast (`⚔️ {name} has chosen the path of the {role} — {stage}!`) fires on the action that triggers the branch.

#### Sprite resolution
- LV.1/2 use `assets/pixel-icons/buddy/stage{0,1}.png` (existing Egg/Hatchling sprites — kept).
- LV.3+ uses `assets/pixel-icons/buddy/class/<id>.png`. Falls back to legacy stage PNG if missing.
- New `scripts/build-buddy-classes.js` ships **placeholder pixel sprites** for all 10 classes (chibi silhouettes in each class's signature color). The script auto-detects when a real artist PNG (>2KB) is dropped at the same path and skips overwriting.
- Final class designs are being produced externally; this PR ships the working system so swapping in the real PNGs is a one-commit follow-up.

#### i18n
- 10 × 2 keys for class names and roles (en/ko/ja).
- New buddy modal copy + `toast.classBranch`.
- `check-i18n.js` updated to ignore dynamic key prefixes (`t('class.' + id + '.name')`).

## [0.28.0] — 2026-05-01

### Added — 32 new Spark preset icons
- 30 → 62 icons. New entries cover generic developer/UI categories the
  previous set was missing: `search`, `settings`, `terminal`, `file`,
  `folder`, `save`, `star`, `heart`, `lightbulb`, `rocket`, `fire`,
  `lock`, `key`, `clock`, `mail`, `chat`, `branch`, `merge`, `tag`,
  `flag`, `play`, `stop`, `refresh`, `sync`, `upload`, `download`,
  `share`, `bookmark`, `magic`, `plus`, `check`, `cross`.
- Each is a 12×12 pixel grid built into a 96×96 PNG with the same
  Spark frame as the original 30. Available via the Spark preset
  picker in the skill edit modal — search filter already handles them.

### Added — Buddy design workflow
- `docs/BUDDY_DESIGN.md` — concept options (Animal / Slime / Robot /
  Wizard / Pixel pet), recommended palettes per stage, Piskel
  workflow, blank stage template, threshold tuning notes.
- Lays the groundwork for the planned full-buddy redesign — the actual
  pixel art will land in a follow-up once the new design is finalized.

## [0.27.0] — 2026-05-01

### Added — Japanese (ja) locale
- Full ja translation across all 183 keys (parity with en/ko).
- `i18n.SUPPORTED` now lists `['en', 'ko', 'ja']`. The 🌐 toggle cycles through all three. `vscode.env.language === 'ja'` auto-detects on first run.
- `scripts/check-i18n.js` now iterates over `i18n.SUPPORTED` instead of hard-coding en/ko, so adding a fourth locale is just a strings.js edit.

### Added — Marketing assets (docs/marketing/)
- `README.md` — index with recommended posting timeline (T+0 → T+1m).
- `SCREENSHOT_PLAN.md` — 6 essential screenshots with composition + tooling notes.
- `X_TWITTER.md` — V0 single tweet + V1 7-tweet thread, en + ko.
- `REDDIT_HN.md` — Show HN, r/ClaudeAI, r/vscode, r/cursor copy with anticipated comment templates.
- `PRODUCT_HUNT.md` — final tagline, descriptions (short + long), maker comment, 30 prepared Q&A.
- `BLOG_OUTLINE.md` — three blog post outlines (1-week build retro, marketplace deep-dive, gamification design).

### Note
Code changes are minimal in this version — the work is in marketing infra so the existing v0.22–v0.26 features can actually be discovered. The marketing docs are designed to be copy-paste-ready.

## [0.26.0] — 2026-05-01

### Added — Visual polish (every interaction now has a tactile response)
- **Click ripple** — clicking a card or Quick Bar slot spawns an expanding pixel ring anchored at the click point.
- **Hover sparkle particles** — 4–6 random pixel glyphs (`✦ ✧ ⋆ · ◆`) burst from a card on `mouseenter`, throttled at ~5 fps so dragging doesn't flood the DOM.
- **Quick Bar pulse** — slot glows when it receives a card, swaps with another slot, or is registered via keyboard.
- **Achievement unlock screen flash** — a soft amber radial flash overlays the panel each time an achievement fires its toast, layered with the existing 3-note chime.

### Why
Every move the user makes now produces a small visual confirmation. The 6–10 second demo GIF (recipe in `docs/MAKING_DEMO_GIF.md`) is what converts marketplace impressions into installs, and these flourishes are deliberately recordable.

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
