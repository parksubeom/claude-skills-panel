# Changelog

All notable changes to this extension are documented here.

## [0.44.4] — 2026-05-07

### Security — defense-in-depth pass on three medium-severity surfaces

A self-review pass with a security-reviewer hat on. No known exploit
chains; all three findings are defensive hardening against future
mistakes or compromised inputs.

#### 1. Prototype-pollution guard on `saveConfig` and `importSettings`

`saveConfig` accepts `msg.name` from the webview and uses it as a
dynamic key (`cfg.skills[msg.name]`). If an attacker could deliver a
crafted message with `msg.name === '__proto__'`, the assignment would
target Object.prototype rather than `cfg.skills`. Today there's no
known path to deliver such a message (webviews are sandboxed and the
only producer is our own UI), but the cost of guarding is one Set
membership check.

- New `DANGEROUS_KEYS` set (`__proto__`, `constructor`, `prototype`).
- `saveConfig` early-returns when `msg.name` is in the set.
- `importSettings` now runs every parsed object through
  `stripDangerousKeys()` before write — recursive walk that deletes
  any key in the set so a tampered settings export can't smuggle a
  prototype-polluting key onto disk.

#### 2. HTML-escape every field from third-party marketplace.json

`renderMarketList` and the category-filter populator both built
`innerHTML` with hand-rolled `[<>"']` filtering on some fields and
no filter at all on others (`category`, `marketplace`). Marketplaces
under `~/.claude/plugins/marketplaces/` are user-added but third-party
content; treating them as fully trusted is wrong.

- New webview-side `htmlEscape()` helper — full `& < > " '` coverage.
- Every marketplace catalog field that lands in `innerHTML`
  (`name`, `description`, `category`, `author`, `marketplace`,
  `homepage`, `installCmd`) now goes through `htmlEscape` first.
- i18n strings injected into innerHTML also escaped (mostly redundant
  since they're our own bundle, but consistent).

#### 3. `resolveIconPath` is no longer a free-form file probe

`resolveIconPath(iconRel)` was happy to return any absolute path the
config asked for, as long as `fs.existsSync` said it was a real file.
The webview wouldn't actually render a path outside `localResourceRoots`,
but other call sites (`fs.unlinkSync` on the previous icon, `fs.existsSync`
probes) used the resolved value directly.

- `resolveIconPath` now resolves the candidate, then enforces that the
  result lives inside `ICONS_DIR` (`~/.claude/skills-panel-icons/`).
- Both absolute paths and relative `../` traversal attempts return
  `null` if they escape the managed directory.

### What stayed unchanged (already safe)

- CSP: `default-src 'none'` + `connect-src 'none'` blocks all outbound
  network requests from the webview. No fetch / XHR call exists in
  webview JS either; CSP is the second layer.
- No secrets in the repo. CI uses `OVSX_PAT` / `VSCE_PAT` from GitHub
  Actions secrets.
- `child_process` was removed in v0.41 along with auto exec mode.
  No shell-injection surface remains.
- Token tracking (`tokenUsage.js`) reads only `message.usage`,
  `promptId`, `parentUuid`, `timestamp`, and the `<command-name>`
  marker regex. The full message body is parsed but never persisted.
- `pickIcon` already sanitizes the destination filename
  (`[^a-zA-Z0-9_-]/g → _`) and writes only into `ICONS_DIR`.
- `JSON.parse` callers all carry `try`/`catch` and fall back to a
  default object.
- Telemetry is display-only (`window.__telemetry` drives a banner +
  status text); nothing leaves the machine.

## [0.44.3] — 2026-05-07

### Fixed — Demo GIFs no longer have huge top/bottom padding

The five v0.44 demo GIFs were exported as 800×800 squares with the
actual panel content packed into the middle ~400px and the top/bottom
~200px each just black padding. Result: in the README hero, each GIF
sat in a roughly square-shaped block where most of the visual area
was empty space — the "where did all this whitespace come from"
effect users reported.

Re-cropped all five through ffmpeg + gifski:

- `crop=800:400:0:200` — drops the dead top and bottom bands
- gifski `--quality 80 --fps 24` — preserves clarity, smaller files
- 800×400 wide aspect = renders inline at proper proportion in the
  README hero and feature sections

Side benefit: the cropped GIFs are smaller too (avg 33% reduction):

| GIF | Before | After |
|---|---|---|
| demo-card-click | 882 KB | 612 KB |
| demo-edit-modal | 425 KB | 286 KB |
| demo-exec-mode | 524 KB | 369 KB |
| demo-locale | 594 KB | 365 KB |
| demo-theme | 586 KB | 364 KB |
| **Total** | **3.0 MB** | **2.0 MB** |

## [0.44.2] — 2026-05-07

### Changed — Discoverability sweep (keywords + categories + repo metadata)

A meta pass focused on Marketplace search ranking, GitHub repo
discoverability, and SEO surface area. No code changes.

- **`package.json` keywords**: 29 → 47. Added direct-brand searches
  (`claude-skills`, `claude-code-skills`, `anthropic-extension`),
  v0.40 feature surface (`token-tracker`, `token-usage`, `task-monitor`),
  buddy yard surface (`buddy`, `companion`, `pixel-buddies`,
  `pixel-game`), and IDE coverage (`windsurf`, `vscodium`,
  `terminal-companion`, `cli-ui`, `agent-panel`,
  `slash-command-launcher`).
- **`package.json` categories**: added `Snippets` (slash commands ARE
  snippets in spirit; widens search match).
- **`README.md`**: appended a Star History badge (visual traction
  signal) and a Translations section linking to the Korean README.
- **`README.ko.md`** (new): Korean translation of the hero, five
  use-loops, persona table, dock recommendation, and install table.
  Targets Korean-language Marketplace + GitHub search directly.
- **`.github/FUNDING.yml`** (new): adds the GitHub Sponsors button to
  the repo About panel — small trust signal, occupies otherwise empty
  panel real estate.
- **`CONTRIBUTING.md`** (new): project layout, "Adding a new locale"
  walkthrough, "Adding a buddy class" walkthrough, manual-test
  checklist. Active-maintainer signal for GitHub algorithm; lowers
  contribution barrier.

Marketplace freshness patch only.

## [0.44.1] — 2026-05-07

### Changed — Preview screenshots refreshed for v0.43+ visuals

The two Preview-section PNGs (`panel-main.png` Activity Bar narrow,
`panel-bottom.png` Bottom Panel wide) had been frozen on v0.20 captures
from late April — pre-yard, pre-tokens, pre-prompt-modal, pre-locale-
toggle, single-theme, Korean-only. They didn't match anything users
were actually installing.

The new captures show:

- **panel-main.png** — narrow Activity Bar with the buddy yard
  (pixel forest backdrop + monster + class-specific buddies idle-walking),
  the prompt-template hint banner, Quick Bar, recent / project / my
  skills sections all visible at once.
- **panel-bottom.png** — wide Bottom Panel with the **per-buddy info
  modal opened** (Webbie / Wizard / 4 invocations / triggers on
  web/frontend/ui/css/react/tailwind/figma/design / "★ Your current class"
  badge). Doubles as a feature showcase for the v0.43 buddy info modal.

Same filenames, so the README image references didn't change. No code
diff — listing-freshness patch only.

## [0.44.0] — 2026-05-07

### Added — Demo GIFs throughout the README

The Marketplace listing now leads with a real card-click demo instead of
a static buddy lineup, and four more GIFs anchor the feature sections
they describe. The yard / class-skill demo (the most distinctive single
visual the extension has) lives in the Buddy Yard section.

- **Hero**: `demo-card-click.gif` (882 KB) — every slash command on
  your machine, one click away.
- **Customization**: `demo-edit-modal.gif` (425 KB) — edit modal with
  alias / note / prompt template / icon / group / hide.
- **Execution Modes**: `demo-exec-mode.gif` (524 KB) — toggling between
  Paste and Term, with the 💬 prompt button appearing in Term mode.
- **Pixel-art UI**: `demo-theme.gif` (586 KB) + `demo-locale.gif`
  (594 KB) side-by-side — theme cycle (Dark / Retro / LCD) and locale
  switch (EN / 한국어 / 日本語 / 中文).

GIFs live under `docs/screenshots/` and are referenced via raw
GitHub URLs, so they don't bloat the `.vsix` package (`docs/**` is in
`.vscodeignore`). Marketplace listing CDN picks them up automatically
on the next listing refresh after the v0.44.0 tag publishes.

## [0.43.1] — 2026-05-07

### Changed — README brought up to date with everything that landed in v0.40-v0.43

The README's interaction tables, execution-mode list, buddy stage table,
and class table all referred to pre-v0.40 behavior:

- **Interactions table**: rewritten — card body click vs ✎ button vs 💬
  prompt-edit button (terminal mode) vs right-click `SKILL.md` vs yard
  buddy click (per-buddy info, not the user's own character sheet) vs
  toolbar 🛒 / 📊 / ⚙ / 🪄.
- **Execution Modes**: removed `▶ Auto` (deleted in v0.41 — was unreliable
  against React-driven inputs in Cursor/VS Code). Now documents `▶ Paste`
  + `▶💬 Term`, with the prompt-template flow.
- **Stages table**: was Egg → Hatchling → 50+ branch (pre-v0.35). Now
  Apprentice → Adept → Skilled → Master → Legend, all class-locked from
  the first action.
- **Class table**: added the per-class attack action column shipped in
  v0.43 (⚔ sword swing / ✦×3 shuriken / 🔥 fireball / etc.).
- **Bonus → Buddy Yard section**: re-promoted from "optional eye candy"
  to first-class feature documentation. Documents the yard staging,
  per-buddy info modal, custom backdrop, side-scroller combat with
  damage numbers + crits + completion chime.
- **Pixel-art UI**: 30 → 62 spark icons; 6-stage → 10-class buddy.
- **Customization**: added `Prompt template`, `Custom groups`, settings
  export/import.
- New "Stats & token tracking" subsection covers the v0.40 token-usage
  feature surface (per-card label, sort, weekly-report Top 5).
- New "Plugin marketplace browser" subsection covers the v0.25 feature
  that was missing from the features list entirely.

No code changes, so this is just a patch release for marketplace listing
freshness.

## [0.43.0] — 2026-05-07

A polish + game-feel sprint that turned the buddy yard from "buddies
walk back and forth" into "the buddies and a monster have a real
side-scroller fight," and tightened a handful of UX papercuts along
the way.

### Added — Class-specific attack actions

The active fighter now hits the monster in a way that matches its RPG
class. Each class has a distinct glyph, count, color, and attack type
(`melee` / `projectile` / `aura`), driven by a single `ATTACK_EFFECTS`
map and three keyframe animations (`attack-projectile` flies via CSS
custom properties `--dx` / `--dy` from fighter to monster, `attack-melee`
flashes at the monster body, `attack-aura` spreads multiple glyphs in
a small ring).

| Class | Role | Glyph × N | Type |
|---|---|---|---|
| codey | Swordsman | ⚔ × 1 | melee |
| gitto | Ninja | ✦ × 3 | projectile |
| testra | Paladin | ⚒ × 1 | melee |
| webbie | Wizard | 🔥 × 1 | projectile |
| docly | Cleric | ✨ × 5 | aura |
| debuggo | Detective | 🔍 × 1 | melee |
| sheety | Merchant | 🪙 × 2 | projectile |
| slidey | Bard | 🎵 × 3 | projectile |
| pdfox | Rogue | 🗡 × 4 | projectile |
| datia | Astrologer | ⭐ × 1 | aura |

### Added — Active fighter selection from the live task

Polling `~/.claude/projects/*.jsonl` mtime already told us *whether*
Claude Code was busy; v0.43 also captures *which slash command* is
running. The most recent `<command-name>` marker → `userConfig.classifySkill()`
→ class id is broadcast with every `buddyActivity` message. The
matching buddy on the right cluster slides leftward to the monster's
side and runs its class strike loop; everyone else cheers in place.
Falls back to the user's locked class, then `codey`, if no command
has been seen yet.

### Added — Per-buddy info modal

Clicking any sprite in the yard opens a dedicated info modal (sprite,
name, role, invocation count, trigger keywords, "★ Your current class"
badge if it matches the locked class). Previously every yard click
opened the user's own character sheet — same modal regardless of
which buddy was clicked. Now the character sheet stays for `Click
buddy → see *that* buddy`.

i18n: 3 new keys × 4 locales (`buddy.info.invocations`, `.triggers`,
`.currentClass`).

### Added — Buddies cluster on the right; monster on the left

The yard is now staged like a side-scroller: every invoked class
sprite parks on the right (`right: calc(8px + idx * 22px)`), and the
monster lives on the left (`left: 12%`). When fighting starts, the
active fighter overrides its `right` to `left: calc(12% + 38px)` and
the panel-wide `transition: right 0.55s, left 0.55s` makes the dash
read as "running over to attack."

### Added — Pink "invader" monster

The single SVG path was replaced with a chunky red Space-Invaders-ish
cube (12×10 body, two tall dark eye rectangles, three little legs).
Color is fixed `#ef4444` (was `var(--magenta)`, which collided with
some theme backgrounds). Slightly bigger (32 → 36px) and with a red
glow shadow for visibility.

### Added — Optional pixel forest backdrop

If the user drops an image at `assets/buddy-yard-bg.{png,jpg,jpeg,webp,gif}`,
the yard auto-applies it as a `cover`-fitted background (CSS variable
`--yard-bg-url` set inline; `.has-bg` class swaps the `background`
shorthand). Both the inline yard and the modal version pick it up.
With no file present the v0.42 sky→grass gradient stays unchanged.

### Added — Floating damage numbers + slash effects during fights

While `fighting`, a JS interval (every 850ms) spawns a yellow pixel
damage number above the monster (5–32, 18% chance crit at 40–100 in
pink) plus a class-specific attack glyph at the fighter→monster path.
The damage number floats up 36px and fades; attack glyphs auto-clean
after 360–520ms.

### Added — On-toggle demo fight

Flipping `Buddy actions` to On now immediately pushes a `busy` →
`completed` cycle (5 s) so the user can see the feature instead of
guessing what changed. Demo's active fighter is resolved from
`getMostRecentCommand()` → falls back to the locked class → `codey`.

### Added — Settings toggle pairs visibly indicate active state

The Enable / Disable button pairs in Settings now apply an `.active`
class to the currently-on side based on `cfg`. Active button gets
`var(--accent)` background, glow, and full opacity; the inactive side
dims to 0.55. Clicking flips the visual instantly (`flipTogglePair`
helper) before the host refresh roundtrips. No more reading the
"Currently: …" hint to know which side is the current state — pure
accessibility win.

### Changed — Toolbar toggle widths are now stable across labels

`.theme-toggle` (`min-width: 86px`), `.locale-toggle` (`min-width: 56px`),
and `.exec-mode-btn` (`min-width: 92px`) all carry a fixed minimum
width + `text-align: center` + `white-space: nowrap`. Switching theme
between Dark / Retro / LCD, locale between EN / KO / JA / ZH, or exec
mode between Paste / Term no longer resizes the search input next to
them.

### Changed — README leads with persona-specific dock recommendations

The hero rewrites away from "30+ slash commands" toward five concrete
use loops users actually run (manage skills like a game, pixel buddies
fight while Claude works, see usage stats, find token hogs, browse the
plugin marketplace inside the panel). A new "Where to dock it" table
recommends the **bottom panel** for users on the Claude Code IDE
extension and the **activity bar** for users on the Claude Code CLI.

### Changed — `package.json` description rewritten for the same audience

Was: "Stop typing slash commands from memory…"
Now: "Manage your Claude Code skills like a game: one-click triggers,
right-click edit, per-skill stats and live token usage. Cute pixel
buddies fight monsters while Claude works. CLI users → activity bar;
IDE users → bottom panel."

### Removed — Sort buttons next to the search bar

The `☷ default` / `⏱ recent` / `★ usage` / `⚡ tokens` toolbar controls
were deleted. In practice users searched by name (or scanned visually
by group); the sort group consumed valuable header real estate without
matching usage. Search and the existing group ordering cover the
remaining navigation needs. CSS, HTML, the `applySort` function, the
`SORT.mode` state, and the click handlers are all gone (~30 lines).

### Fixed — Theme toggle no longer reflows the search bar

(See toolbar widths above — direct fix for the user-reported "search
bar resizes when I change theme" jank.)

### Fixed — Monster reliably visible in fighting state

Pre-v0.43 the monster used `var(--magenta)` which on some themes
overlapped the yard background. Switched to a fixed `#ef4444` red
with `drop-shadow(0 0 4px rgba(239, 68, 68, 0.65))` glow. The fighting
class now also sets `transform: translateY(0) scale(1)` (was just
`translateY(0)` — it kept the entry-state scale of 0.8).

## [0.42.0] — 2026-05-06

### Removed — `cmd` badge on slash-command cards

Cards from `~/.claude/commands/<name>.md` (single-file command aliases,
as opposed to skills under `~/.claude/skills/<name>/SKILL.md`) had a
small uppercase `cmd` badge in the upper-right since v0.20-ish. The
badge classified the source format, but in practice users trigger both
identically with `/<name>` — the distinction never affected any
workflow, and the badge competed with the LV, ✎, and 💬 markers in
the same corner.

The hover popover already shows source attribution
(`🧩 superpowers @marketplace` etc.), so the hover answer covers any
remaining curiosity.

Removed:

- `<span class="kind-badge cmd">cmd</span>` emit from both card
  emitters.
- `.kind-badge`, `.kind-badge.cmd`, and the hover-fade rule from CSS.
- `kindBadge` template variable from both emitters.

## [0.41.0] — 2026-05-06

### Added — Buddy actions: monsters appear while Claude Code is busy

The yard now reacts to whether Claude Code is actively working. When
`buddyActions` is enabled in Settings, the panel polls the mtime of
your `~/.claude/projects/*.jsonl` files every 5 seconds (mtime only —
no file content is read, no prompt text touched). A simple state machine
flips between three modes:

- **idle**: nothing changed in the last 8s → the yard does its usual
  back-and-forth idle walk.
- **busy**: a JSONL was modified within 8s → a small pixel monster fades
  in on the right of the yard, the buddies switch to a 1.6s `dash`
  animation (forward lunge → flip → return), and a soft magenta vignette
  drapes the diorama. Visually unmistakable: Claude Code is doing work.
- **completed**: previous tick was busy, this tick isn't (one-shot) → the
  monster fades up and out, every buddy plays a one-time celebrate hop,
  a `✓!` bubble floats above each buddy with a 60ms stagger, a 3-tone
  8-bit chime fires (660 → 880 → 1180 Hz), and a "🎉 Task complete!"
  toast appears.

The signal is independent of token tracking — `cfg.meta.buddyActions`
is its own toggle, default **off**. You can run buddy actions without
token tracking and vice versa. Both are off by default; both share the
same `~/.claude/projects/` path but read different things (mtime
metadata vs. message.usage records).

The 8s busy window naturally debounces rapid back-to-back commands —
quick consecutive turns stay in `busy` instead of flickering through
`completed`.

i18n: 8 new keys × 4 locales (`modal.settings.buddyActions*`,
`toast.taskComplete`, `toast.buddyActions{Enabled,Disabled}`).

### Removed — Free-roaming buddy pet (the panel-floating one)

The single floating pet that wandered the panel and snapped to the
last-clicked card was redundant once the Buddy Yard arrived in v0.40 —
the yard already shows every class the user has invoked, all at once,
in a richer scene. Keeping the floating pet was just stacking two
buddy systems on top of each other.

Removed:

- `<div class="buddy-pet">` from `renderHtml`.
- `.buddy-pet`, `.buddy-pet img`, `.buddy-pet:hover img`, `.buddy-pet.flipped`,
  `.buddy-pet.cheering`, `@keyframes pet-bob`, `@keyframes pet-cheer` CSS.
- `petMove`, `petWanderLoop`, `petToCard`, `petWanderTimer`, the initial
  position setup, and the click handler.
- All three `petToCard()` call sites (card click, Quick Bar slot click,
  `triggerSkill`).

Net diff: ~120 lines removed, ~0.8 KB packaged size reduction. The
character sheet modal stays — opened by clicking any buddy in the yard.

## [0.40.0] — 2026-05-06

### Added — Per-skill token usage tracking (opt-in)

You can now see how many tokens each slash command has actually consumed
across all your Claude Code sessions. Settings → "Track skill token usage"
→ Enable, then every card grows a small line under its mastery stars
(`12.4k tok`), the toolbar gains a `⚡ Most tokens` sort option, and the
weekly report adds a "Top 5 by Tokens (all-time)" section.

How it works (and what it does NOT read):

- The panel scans `~/.claude/projects/<cwd-slug>/<sessionId>.jsonl`
  incrementally — these are the per-session transcripts Claude Code
  itself writes. Append-only, so the panel just reads new bytes since
  the last scan and re-uses byte offsets.
- Inside each line we ONLY look at: `type`, `message.usage`
  (`input_tokens` / `output_tokens` / `cache_creation_input_tokens` /
  `cache_read_input_tokens`), `promptId` / `parentUuid` (linkage), and
  `timestamp`. We never read prompt text, tool results, or any of your
  message content.
- A `<command-name>/skillname</command-name>` marker on a user line
  binds that line's `promptId` to a slash command; subsequent assistant
  lines with the same `promptId` get their usage attributed to that
  command.
- All data stays in memory on this machine — no persistence, no upload.
- Default OFF. Initial scan happens on enable; rescans every 30s.

Caveats: the `.jsonl` shape is undocumented (observed on Claude Code
v2.1.126). If Anthropic restructures it, the parser fails open (no
panic, just empty stats) until we adapt.

### Added — Buddy Yard above the Quick Bar

The empty header strip above the Quick Bar is now a pixel diorama
where every class your buddy has ever invoked idles and walks back
and forth. Sky-to-grass gradient, dots-of-grass texture, ~28px sprites
at the bottom, each with a staggered idle-walk animation (left ↔ right,
2.6s cycle, 270ms stagger between buddies). Only classes with
`character.skillStats[id] > 0` show up — the yard reflects your
actual usage pattern, not a static cast list.

- **Wide panels (≥420px)** → inline yard, capped at 600px wide,
  centered.
- **Narrow panels (Activity Bar)** → yard collapses to a `🐾 View
  buddies` button; clicking opens a modal version of the yard at
  larger sprite size.
- Click any buddy → opens the existing character sheet.
- Empty state if no skills used yet ("invoke a few skills and they'll
  show up here").

i18n: 3 new keys × 4 locales (`buddy.yard.*`).

### Fixed — Confirm dialogs replaced with custom pixel modal

VS Code/Cursor webviews silently block `window.confirm()` — clicking
🔄 Reincarnate, deleting a custom group, or pressing Import in
Settings would do nothing because the gating dialog never appeared.
v0.40 ships a custom confirm modal (same pixel styling as the prompt
modal) gated above other modals via a higher z-index, so all three
flows now actually run.

### Fixed — Card layout drift when toggling token tracking

Token tracking added a label line under the mastery stars, which
needed extra card padding. v0.39's first cut shifted stars on every
card (including those with no token data), causing long-name cards
("bump-and-publish") to overlap their stars. v0.40 gates the padding
behind `body[data-tokens-on="1"]` so the layout only changes when
tracking is on, and applies it uniformly to every card so heights
stay consistent across the grid.

## [0.39.0] — 2026-05-06

### Added — Edit prompts before sending in terminal mode

Terminal-mode users hit a sharp edge in v0.38 and earlier: clicking a card
auto-sent `/skill\n` to the active terminal — great for one-shot commands,
but `/review` or `/explain` usually want a target ("review **this file** for
security issues"). Once Enter went out, you couldn't sneak the context in.

v0.39 adds a dedicated **💬 prompt-edit button** on every card, visible only
when exec mode is `▶💬 Term`:

- **Click the card body** → fires immediately as before (consistent across modes).
- **Click the 💬 button** → opens a pre-send edit modal. Type any prefix
  ("review this file"), and `/skill` auto-appends at the end. Or save a per-
  skill **Prompt template** in the edit modal (`{cmd}` placeholder) so the
  modal pre-fills it for you.
- A panel-wide hint banner appears under the search bar in terminal mode,
  explaining the affordance ("each card now shows a 💬 button — tap it to
  edit the prompt before sending").
- `Cmd/Ctrl+Enter` sends from the modal, `Esc` cancels.

Implementation: optional `promptTemplate` field on `cfg.skills[name]` (no
migration needed), new webview modal mirroring the edit-modal pattern, new
host message `copyWithPrompt` that writes the user's final text to clipboard
or terminal — usage attribution still links back to the underlying skill name.

i18n: 9 new keys × 4 locales (`modal.edit.promptTemplate*`, `modal.prompt.*`,
`card.promptBtnTitle`, `panel.tplBannerHint`).

### Removed — Auto execution mode (`▶ Auto`)

The previous "auto" mode used `osascript` / `SendKeys` / `xdotool` to focus
the Claude Code input, paste from clipboard, and send Enter. In practice it
was unreliable against the Claude Code extension's React-driven input
component, so it was producing more confusion ("why isn't this working?")
than value. Removed in v0.39 in favor of the always-reliable `paste` + `terminal`
pair.

- Mode cycle is now `▶ Paste ↔ ▶💬 Term` (two-step toggle).
- `osKeystroke()`, `tryFocus()`, and the auto branches in `dispatchExec` /
  `copyWithPrompt` / `runRawCommand` are deleted.
- i18n keys `exec.auto` / `exec.prefixAuto` removed from all four locales.
- Migration: existing users with `cfg.meta.execMode === 'auto'` are silently
  migrated to `paste` on first render.

### Changed — README and Marketplace listing tuned for first-time visitors

Previous listing assumed the reader already knew Claude Code. v0.39 fixes that:

- **Hero defense line** — quick "What is Claude Code?" answer with a doc link,
  for visitors arriving cold from a Marketplace search.
- **"Who is this for?" section** — explicit ✅/❌ persona list. Tells you in
  10 seconds whether the panel will help you, and tells the wrong audience
  it's not for them (which is faster than installing and uninstalling).
- **Install table** lifts Cursor / Windsurf / VS Codium to the same row as
  VS Code. Previously buried under a one-liner; the four IDEs now read as
  equally first-class.
- **`## 🎮 Bonus: Pixel Adventure (optional)` heading** — the buddy / RPG
  / theme content now lives under an explicitly opt-in heading, signaling
  upfront that the serious-tool half and the pixel-game half are separable.
- **Tagline now in 4 languages** (English added) for parity with package.json.
- **`package.json` description** rewritten to lead with a non-command-specific
  pain hook (was "Stop typing /commit-prepare from memory" — a name only some
  users recognize) — now "Stop typing slash commands from memory."

No code changes for the listing tune.

## [0.38.0] — 2026-05-02

### Fixed — Quick Bar layout never collapses on empty slots

Empty / locked Quick Bar slots could visually overlap or shrink against filled ones, especially on narrow panels — a regression from `auto-fit` + `minmax(72px, 1fr)` behaving differently for `<div>` (empty/locked) vs `<button>` (filled) grid items, plus `all: unset` not setting `box-sizing` consistently across both.

- `.quickbar` now uses `grid-template-columns: repeat(6, minmax(0, 1fr))` — fixed 6-column grid that always lays out cleanly regardless of which slots are empty.
- `.qslot` gets explicit `box-sizing: border-box` and `min-width: 0` so empty `<div>` slots match the width of filled `<button>` slots and never shrink to content.
- Added a container query (`@container (max-width: 280px)`) that drops to a 2-row 3-column grid on activity-bar narrow mode, so slot contents stay legible instead of being squeezed into ~30px columns.

The Quick Bar is now demo-GIF-stable: open the panel with no slots assigned and you see a clean uniform 6-slot grid every time.

## [0.37.0] — 2026-05-02

### Changed — Reincarnate now actually reincarnates

The 🔄 Reincarnate button on the character sheet was almost a no-op
in v0.36 and earlier: it cleared `class` but kept `skillStats`, so
`decideClass()` re-elected the same winner on the next action. Users
who wanted to switch classes had to grind a new category until its
count overtook the previous one.

v0.37 makes Reincarnate do what users expect: **the next slash-command
click decides the new class from a fresh slate.**

`userConfig.reincarnate()` now also wipes `character.skillStats = {}`
in addition to nulling `class` and `classLockedAt`.

Preserved (no penalty):
- `actions` (so LV doesn't drop)
- `stats` (INT/DEX/VIT/LCK)
- `achievements`
- All earned content

Confirm dialog text updated in en/ko/ja/zh to reflect the broader
reset and the explicit list of what's preserved.

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
