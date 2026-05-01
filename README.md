# Claude Code Skills Panel

[![OpenVSX Version](https://img.shields.io/open-vsx/v/parksubeom/claude-skills-panel?style=flat-square&label=OpenVSX&color=7dd3fc&logo=vscodium)](https://open-vsx.org/extension/parksubeom/claude-skills-panel)
[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/parksubeom.claude-skills-panel?style=flat-square&label=VS%20Marketplace&color=2563eb&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel)
[![OpenVSX Downloads](https://img.shields.io/open-vsx/dt/parksubeom/claude-skills-panel?style=flat-square&label=Downloads&color=22c55e)](https://open-vsx.org/extension/parksubeom/claude-skills-panel)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)

> **Stop typing `/full-flow`, `/commit-prepare`, `/code-review` from memory.** This panel finds every Claude Code slash command on your machine and lets you fire it with one click — or one keystroke.

The fastest way to use Claude Code:

- 🔍 **Auto-discovers everything** — your `~/.claude/commands/`, project-level `.claude/commands/`, and every plugin you install via `/plugin install …` (superpowers, code-review, skill-creator, …)
- ⚡ **One-click copy** (or auto-paste, or send-to-terminal) — pick the mode that fits your flow
- 🔢 **Quick Bar with keys 1–6** — bind your top commands and never type them again
- 🔎 **Fuzzy search + keyboard nav** — `↓` to skim, `Enter` to fire, `/name` to send any command (even ones you haven't memorized)
- 🎨 **Three pixel themes** — Dark, Retro CRT, Gameboy LCD
- 🏆 **Optional gamification** — character that levels up, 16 achievements, weekly report (export as Markdown)
- 🌐 **English · 한국어** — switch with one click

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

**Cursor / Windsurf / VS Codium** — install from [OpenVSX](https://open-vsx.org/extension/parksubeom/claude-skills-panel)
**VS Code** — install from [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel)

> Or open the Extensions tab (`Cmd+Shift+X`), search `Claude Code Skills Panel`, and click **Install**.

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
| Click card | Copy `/skill` to clipboard (or auto-execute) |
| Right-click card | Open `SKILL.md` |
| Drag to Quick Bar | Register to slot (keyboard 1–6) |
| Hover ✎ | Edit alias / icon / note |
| Click buddy | Open character sheet |

### ⚡ Quick Bar — unlocked by evolution

Drag your most-used skills to 6 slots and trigger them with number keys. Each slot unlocks as your buddy evolves.

```json
// keybindings.json — trigger from anywhere, even without the panel open
{ "key": "cmd+shift+1", "command": "claudeSkills.quickSlot1" }
```

### 🚀 Execution Modes (`▶` button)

| Mode | Behavior |
|---|---|
| **▶ Paste** | Copy to clipboard only (default) |
| **▶ Auto** | Focus input + auto-paste + send Enter (mac/win/linux) |
| **▶ Term** | Send directly to active terminal |

### ✏️ Customization

- **Alias** — rename any skill with a shorter label
- **Note** — shown in the hover popover
- **Custom icon** — upload your own image (PNG/SVG/JPG/GIF)
- **Hide** — declutter skills you rarely use

All settings saved to `~/.claude/skills-panel-config.json` — version-controllable via dotfiles.

---

### 🐾 Claude Skills Buddies — class-branch evolution

A pixel-art companion that **branches into one of 10 RPG classes** based on your most-used slash-command category. Everyone starts the same; your usage decides who you become.

![Buddy lineup](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/buddy-lineup.png)

| Stage | Threshold | Result |
|---|---|---|
| LV.1 Egg | 0 actions | common |
| LV.2 Hatchling | 10+ | common |
| **LV.3 [Class]** | **50+** | **branch — class is locked here from your skill usage** |
| LV.4 [Class] Adept | 150+ | same class, stronger aura |
| LV.5 [Class] Master | 500+ | final form |

| Class | Role | Triggers on slash commands containing… |
|---|---|---|
| **Codey** 🗡️ | Swordsman | `code`, `refactor`, `simpl`, `implement` |
| **Docly** 📜 | Cleric | `doc`, `write`, `markdown`, `readme` |
| **Debuggo** 🔍 | Detective | `debug`, `bug`, `fix`, `trace` |
| **Testra** 🛡️ | Paladin | `test`, `spec`, `verify`, `check`, `review` |
| **Sheety** 📊 | Merchant | `xlsx`, `csv`, `sheet`, `excel` |
| **Slidey** 🎤 | Bard | `slide`, `pptx`, `present` |
| **PDFox** 🦊 | Rogue | `pdf` |
| **Webbie** 🕸️ | Wizard | `web`, `frontend`, `css`, `react`, `figma` |
| **Datia** 🧙‍♀️ | Astrologer | `analyze`, `chart`, `metric`, `dashboard` |
| **Gitto** ⚔️ | Ninja | `git`, `commit`, `branch`, `push`, `pr`, `merge` |

Don't like your class? Hit **🔄 Reincarnate** — the locked class clears, your counts stay, and the next action picks fresh.

**Stats**: 🧠 INT (brainstorm/review skills) · ⚡ DEX (Quick Bar usage) · ❤️ VIT (daily streak) · 🍀 LCK (achievements)

---

### 🏆 Metagame

- **16 achievements** — volume / variety / streaks / mastery / customization
- **Weekly report** (`📊`) — 7-day activity chart + TOP 5 skills
- **Mastery ★** — LV.1–5 per skill, with level-up animation and sound
- **Daily streak** — 🔥 N days tracked in footer

---

### 🎨 Pixel-art UI

- **Pixel fonts**: DotGothic16 (Korean) + Press Start 2P (English)
- **30 custom spark-style icons** — one per skill category, consistent dark frame
- **CRT effects** — scanlines + vignette (toggleable)
- **8-bit sounds** — hover, click, level-up (toggleable)
- **Animations** — chamfer corners, sparkle hover, shake on click, staggered card entrance

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
npm run build:spark    # 30 spark-style skill icons
npm run build:buddy    # 6-stage buddy character
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
