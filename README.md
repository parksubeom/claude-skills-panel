# Claude Code Skills Panel

[![OpenVSX Version](https://img.shields.io/open-vsx/v/parksubeom/claude-skills-panel?style=flat-square&label=OpenVSX&color=7dd3fc&logo=vscodium)](https://open-vsx.org/extension/parksubeom/claude-skills-panel)
[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/parksubeom.claude-skills-panel?style=flat-square&label=VS%20Marketplace&color=2563eb&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel)
[![OpenVSX Downloads](https://img.shields.io/open-vsx/dt/parksubeom/claude-skills-panel?style=flat-square&label=Downloads&color=22c55e)](https://open-vsx.org/extension/parksubeom/claude-skills-panel)
[![GitHub stars](https://img.shields.io/github/stars/parksubeom/claude-skills-panel?style=flat-square&color=fbbf24&logo=github)](https://github.com/parksubeom/claude-skills-panel)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)

## Manage your Claude Code skills like a game.

> **New here?** [Claude Code](https://docs.claude.com/en/docs/claude-code) is Anthropic's AI coding CLI. It runs in your terminal (or inside Cursor / VS Code) and is driven by *slash commands* (`/commit`, `/review`, …). Once you install a plugin or two, those commands pile up fast — and that's the problem this panel solves.

A pixel-art skill launcher for Claude Code. **Click to fire, right-click to edit, watch your buddies fight while you work, see exactly which commands eat your tokens.**

![Buddy lineup — your usage pattern decides which of 10 RPG classes your buddy becomes](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/buddy-lineup.png)

### The five things you actually use it for

1. **🎮 Manage custom skills like a game.** Every slash command on your machine becomes a card. Click to fire. **Right-click to open and edit `SKILL.md` in place.** Drag to the Quick Bar for keyboard 1–6 shortcuts. Aliases, custom icons, hidden cards, custom groups — all from a single edit modal.

2. **🐾 Cute pixel buddies make work less lonely.** Above the Quick Bar lives a yard where your invoked classes idle, walk around, and *fight monsters while Claude is actually busy* (mtime polling — no prompt content read). When the task ends, they cheer with a 3-tone chime + ✓! bubble. Click any buddy to see its role and stats. (All optional — one toggle off.)

3. **📊 See which commands you actually use.** The 📊 weekly report shows a 7-day activity chart, your TOP 5 most-fired commands, and exports to Markdown. Mastery levels (LV.0 → LV.5) per skill, achievements, daily streaks — your skill belt grows visibly.

4. **⚡ Find token hogs instantly.** Opt-in token tracking reads only `message.usage` from Claude Code's session transcripts (never prompt text) and surfaces **per-skill totals on every card**, a `⚡ Most tokens` sort, and a "Top 5 by Tokens" report section. Now you know which command is costing you 12k tokens per use.

5. **🛒 Browse 243+ official plugins inside the panel.** Search, filter, install with one click — the GUI Claude Code itself never shipped.

### Where to dock it

Pick the spot that fits how you run Claude Code:

| You use Claude Code via… | Recommended panel location | Why |
|---|---|---|
| **Claude Code IDE extension** (sidebar agent) | **Bottom panel** (View → Appearance → Move Panel Position → Bottom) | Sits next to your terminal so cards + chat are visible together |
| **Claude Code CLI** in your terminal | **Activity Bar** (left side, narrow) | Cards stay one click away while the terminal owns the main area |

Both modes auto-adapt — wide layouts get the full yard, narrow ones collapse the yard into a `🐾 View buddies` button.

> Stop memorizing — one click · 외워서 타이핑하지 말고 한 번에 클릭 · もう打たないで、ワンクリックで起動 · 别再死记斜杠命令,一键触发

> Built mostly *with* Claude Code itself. Free, MIT, ~200 KB, no telemetry by default.

---

## Who is this for?

**You'll feel the value within 10 seconds if any of these are true:**

- ✅ You use Claude Code and have installed at least one plugin (`superpowers`, `code-review`, …)
- ✅ Your `~/.claude/commands/` or `~/.claude/skills/` has 5+ custom entries
- ✅ You moved from VS Code to Cursor / Windsurf and miss the plugin GUI
- ✅ You'd rather hit `1`–`6` than retype `/commit-prepare` every time
- ✅ You've ever wondered "which of my skills is burning the most tokens?"

**You probably don't need this if:**

- ❌ You haven't tried Claude Code yet — start [there](https://docs.claude.com/en/docs/claude-code) first
- ❌ You only have 1–2 slash commands and remember them fine

---

## Preview

<!-- A 6–10s demo GIF is the highest-leverage thing you can add to a Marketplace listing. -->
<!-- See docs/MAKING_DEMO_GIF.md for a recording recipe. -->
<!-- ![Demo](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/demo.gif) -->

### Activity Bar (narrow)
![Claude Code Skills Panel — Sidebar](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/panel-main.png)

### Bottom Panel (wide)
![Claude Code Skills Panel — Bottom Panel](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/panel-bottom.png)

---

## Install

| IDE | Where |
|---|---|
| **VS Code** | [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel) |
| **Cursor** | [OpenVSX](https://open-vsx.org/extension/parksubeom/claude-skills-panel) |
| **Windsurf** | [OpenVSX](https://open-vsx.org/extension/parksubeom/claude-skills-panel) |
| **VS Codium** | [OpenVSX](https://open-vsx.org/extension/parksubeom/claude-skills-panel) |

> Or open the Extensions tab (`Cmd+Shift+X`), search `Claude Code Skills Panel`, and click **Install** — it shows up in all four IDEs.

---

## Features

### 🔍 Auto-discovery
Scans every slash command source on your machine, no setup required:

| Source | What it finds |
|---|---|
| `~/.claude/skills/` | Your user-level skills |
| `~/.claude/commands/` | Your custom slash commands |
| `<project>/.claude/skills/` and `commands/` | Project-level overrides |
| `~/.claude/plugins/cache/**` | Every plugin installed via `/plugin install …` (superpowers, code-review, skill-creator, …) — hover a card to see which **plugin@marketplace** it came from |

New plugin? Just install with `/plugin install <name>@<marketplace>` and it shows up on the next refresh.

### 🎮 Interactions

| Action | Result |
|---|---|
| **Click card body** | Fire — copies `/skill` to clipboard, optionally pipes to active terminal |
| **Right-click card** | Opens `SKILL.md` for editing |
| Click ✎ on card | Edit modal — alias / note / icon / prompt template / hide / group |
| Click 💬 on card | (terminal mode only) Edit the prompt before sending — append context, then Send |
| Drag card → Quick Bar | Register to slot (keyboard 1–6) |
| Click any yard buddy | Per-buddy info modal — class, role, invocation count, trigger keywords |
| Click 🪄 character button | User character sheet (your locked class, stats, reincarnate) |
| Click 🛒 in toolbar | Plugin marketplace browser (243+ plugins, one-click install) |
| Click 📊 in toolbar | Weekly report (activity chart + Top 5 + tokens, exportable) |
| Click ⚙ in toolbar | Settings (telemetry, token tracking, buddy actions, settings export/import) |

### ⚡ Quick Bar — unlocked by evolution

Drag your most-used skills to 6 slots and trigger them with number keys. Each slot unlocks as your buddy evolves.

```json
// keybindings.json — trigger from anywhere, even without the panel open
{ "key": "cmd+shift+1", "command": "claudeSkills.quickSlot1" }
```

### 🚀 Execution Modes (`▶` button)

| Mode | Behavior |
|---|---|
| **▶ Paste** | Copy `/skill` to clipboard only (default — most reliable) |
| **▶💬 Term** | Send `/skill` directly to the active terminal. Cards with a saved **prompt template** show a 💬 button — click it to edit the final text (e.g. `review this file /code-review`) before send |

> v0.41 dropped the previous `▶ Auto` mode (osascript / SendKeys / xdotool keystroke automation) — it was unreliable against React-driven inputs in Cursor / VS Code, and `Term` mode covers the same automation use case far more reliably.

### ✏️ Customization

- **Alias** — rename any skill with a shorter label
- **Note** — shown in the hover popover
- **Prompt template** — preset wrapper text (e.g. `"review this file"`) that prefills before send in terminal mode
- **Custom icon** — upload your own image (PNG/SVG/JPG/GIF)
- **Hide** — declutter skills you rarely use
- **Custom groups** — emoji + name; drag-reorder; assign skills via the edit modal

All settings saved to `~/.claude/skills-panel-config.json` — version-controllable via dotfiles. Settings export/import via the ⚙ panel for one-click sync to another machine.

### 📊 Stats & token tracking (opt-in)

- **Weekly report (📊)** — 7-day activity chart + Top 5 most-fired commands + Markdown export. See exactly which skills you actually run.
- **Token usage** — when enabled in Settings, the panel reads only `message.usage` from `~/.claude/projects/*.jsonl` (never prompt content) and surfaces:
  - Per-card label under the mastery stars (e.g. `12.4k tok`)
  - Toolbar `⚡ Most tokens` sort
  - Weekly report "Top 5 by Tokens (all-time)" section
- **Mastery ★** — LV.0 → LV.5 per skill with level-up animation
- **Daily streak** — 🔥 N days in the footer
- **16 achievements** — volume / variety / streaks / mastery / customization

### 🛒 Plugin marketplace browser

The `🛒` button opens an in-panel browser of every plugin from every marketplace you've added (`/plugin marketplace add …`). Search by name / description / author, filter by category, toggle "installed only," and one-click install — the install command flows through your current execution mode (clipboard or terminal).

---

## 🐾 Buddy Yard — pixel companions that work alongside you

> Everything in this section is **opt-in eye candy**. Toggle it off in Settings → Buddy actions if you only want a clean launcher. The serious launcher half above is fully self-contained.

![Buddy lineup](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/buddy-lineup.png)

### Class-branch buddies

A pixel-art companion that **branches into one of 10 RPG classes** based on your most-used slash-command category. From the very first slash command you fire, the buddy starts as a class — no waiting through generic stages.

| Stage | Threshold (total actions) |
|---|---|
| LV.1 [Class] **Apprentice** | 0+ (your first action picks the class) |
| LV.2 [Class] **Adept** | 10+ |
| LV.3 [Class] **Skilled** | 50+ |
| LV.4 [Class] **Master** | 150+ |
| LV.5 [Class] **Legend** | 500+ |

| Class | Role | Attack | Triggers on |
|---|---|---|---|
| **Codey** 🗡️ | Swordsman | ⚔ sword swing (melee) | `code`, `refactor`, `simpl`, `implement`, `build`, `compile` |
| **Docly** 📜 | Cleric | ✨×5 divine aura | `doc`, `write`, `markdown`, `readme`, `note` |
| **Debuggo** 🔍 | Detective | 🔍 magnifying pulse (melee) | `debug`, `bug`, `fix`, `trace`, `stacktrace`, `logs` |
| **Testra** 🛡️ | Paladin | ⚒ hammer stamp (melee) | `test`, `spec`, `verify`, `check`, `review`, `audit` |
| **Sheety** 📊 | Merchant | 🪙×2 coin toss (projectile) | `xlsx`, `csv`, `sheet`, `excel`, `table`, `tsv` |
| **Slidey** 🎤 | Bard | 🎵×3 note volley (projectile) | `slide`, `pptx`, `present`, `pitch`, `keynote` |
| **PDFox** 🦊 | Rogue | 🗡×4 dagger barrage (projectile) | `pdf` |
| **Webbie** 🕸️ | Wizard | 🔥 fireball (projectile) | `web`, `frontend`, `ui`, `css`, `react`, `tailwind`, `figma`, `design` |
| **Datia** 🧙‍♀️ | Astrologer | ⭐ star spell (aura) | `analyze`, `chart`, `viz`, `metric`, `dashboard`, `stats` |
| **Gitto** ⚔️ | Ninja | ✦×3 shuriken volley (projectile) | `git`, `commit`, `branch`, `push`, `pr`, `merge`, `rebase` |

Don't like your class? Hit **🔄 Reincarnate** — the locked class clears, your counts stay, and the next action picks fresh.

**Stats**: 🧠 INT (brainstorm/review skills) · ⚡ DEX (Quick Bar usage) · ❤️ VIT (daily streak) · 🍀 LCK (achievements)

### The yard above the Quick Bar

Every class your buddy has ever invoked lives in a small pixel diorama above the Quick Bar. They idle, walk back and forth, react to clicks. Wide panels show it inline; narrow panels (Activity Bar) collapse the yard into a `🐾 View buddies` button that opens a modal version.

**Click any buddy** → see *that buddy's* class info (sprite, role, invocation count, trigger keywords, "★ Your current class" if it matches yours).

**Custom backdrop** — drop an image at `assets/buddy-yard-bg.{png,jpg,jpeg,webp,gif}` and the panel auto-applies it as a `cover`-fitted background. Forest, dusk, dungeon — your call.

### 🗡️ Side-scroller fights while Claude works

Enable **Settings → Buddy actions** and the yard reacts to whether Claude Code is actually busy:

- The panel polls `~/.claude/projects/*.jsonl` mtime every 5s (metadata only, no content read)
- While Claude is working: a **red pixel monster** fades in on the left, the **active fighter** (the buddy whose class matches the running command) dashes from the right cluster to the monster's side and runs its class strike (sword swing / fireball / shuriken volley / …), the others cheer in place. Yellow damage numbers float up — and 18% of the time you get a pink **CRIT**.
- When the task ends: monster fades out, every buddy plays a celebrate hop, a **✓!** bubble floats above each, a 3-tone 8-bit chime fires, and a `🎉 Task complete!` toast appears.

Works with both the Claude Code CLI and the Claude Code IDE extension — both write to the same `~/.claude/projects/` tree.

### 🎨 Pixel-art UI

- **Pixel fonts**: DotGothic16 (Korean) + Press Start 2P (English)
- **62 custom spark-style icons** — one per skill category, consistent dark frame
- **3 themes** — Dark / Retro CRT / Gameboy LCD (toggle in toolbar)
- **CRT effects** — scanlines + vignette (toggleable)
- **8-bit sounds** — hover, click, level-up, task-complete chime (toggleable)
- **Animations** — chamfer corners, sparkle hover, ripple on click, staggered card entrance, side-scroller combat

---

## Keyboard Shortcuts (optional)

Add to `Preferences: Open Keyboard Shortcuts (JSON)`:

```json
[
  { "key": "cmd+shift+1", "command": "claudeSkills.quickSlot1" },
  { "key": "cmd+shift+2", "command": "claudeSkills.quickSlot2" },
  { "key": "cmd+shift+3", "command": "claudeSkills.quickSlot3" },
  { "key": "cmd+shift+4", "command": "claudeSkills.quickSlot4" },
  { "key": "cmd+shift+5", "command": "claudeSkills.quickSlot5" },
  { "key": "cmd+shift+6", "command": "claudeSkills.quickSlot6" }
]
```

---

## Development

```bash
git clone https://github.com/parksubeom/claude-skills-panel
cd claude-skills-panel
npm install

npm run build:pixels   # pixel icon set
npm run build:spark    # 62 spark-style skill icons
npm run build:buddy    # 10-class buddy sprites (apprentice → legend share the same art)
npm run package        # build all + package .vsix

# Manual publish (CI handles this on tagged releases)
npx ovsx publish -p $OVSX_PAT       # OpenVSX (Cursor / Windsurf / VS Codium)
npx vsce publish -p $VSCE_PAT       # VS Code Marketplace
```

### Releasing

Push a `vX.Y.Z` tag — GitHub Actions builds, packages, and publishes to **both marketplaces** in parallel.
See [.github/workflows/publish.yml](.github/workflows/publish.yml) for the full pipeline.

---

## Links

- **Issues / feature requests** — [GitHub Issues](https://github.com/parksubeom/claude-skills-panel/issues)
- **Changelog** — [CHANGELOG.md](CHANGELOG.md)
- **OpenVSX listing** — https://open-vsx.org/extension/parksubeom/claude-skills-panel
- **VS Marketplace listing** — https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel

---

## License

MIT © [parksubeom](https://github.com/parksubeom)
