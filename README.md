# Claude Code Skills Panel

[![Version](https://img.shields.io/badge/version-0.20.1-f59e0b?style=flat-square)](https://open-vsx.org/extension/parksubeom/claude-skills-panel)
[![OpenVSX](https://img.shields.io/badge/OpenVSX-Install-7dd3fc?style=flat-square&logo=vscodium)](https://open-vsx.org/extension/parksubeom/claude-skills-panel)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)

> Built because memorizing slash commands is annoying. Turned into a tiny game along the way.

A pixel-art panel for **Claude Code** that lets you browse, search, and instantly trigger all your skills and commands — with character growth, achievements, and a free-roaming buddy included.

---

## Preview

### Activity Bar (narrow)
![Claude Code Skills Panel — Sidebar](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/panel-main.png)

### Bottom Panel (wide)
![Claude Code Skills Panel — Bottom Panel](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/panel-bottom.png)

---

## Install

**Cursor / VSCode**

> Open the Extensions tab (`Cmd+Shift+X`), search for `Claude Code Skills Panel`, and click **Install**.

Or install directly from [OpenVSX Marketplace](https://open-vsx.org/extension/parksubeom/claude-skills-panel).

---

## Features

### 🔍 Auto-discovery
Scans all skill sources automatically:
- `~/.claude/skills/` — user-defined skills
- `<project>/.claude/skills/` — project-level skills
- `~/.claude/plugins/cache/**` — all installed plugins (superpowers, etc.) including both `SKILL.md` and `commands/*.md`

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

### 🐾 Claude Buddy

A pixel-art companion that grows as you use skills. Wanders freely around the panel and runs toward the card you just clicked.

| Stage | Threshold | Name |
|---|---|---|
| 0 | 0 actions | 🥚 Egg |
| 1 | 10+ | 🟢 Hatchling |
| 2 | 30+ | 🐱 Kitten |
| 3 | 100+ | 🐈 Cat |
| 4 | 300+ | 🐒 Monkey |
| 5 | 1000+ | 🐲 Dragon |

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

# Publish
npx ovsx publish -p <token>   # OpenVSX (Cursor)
npx vsce publish              # VS Code Marketplace
```

---

## License

MIT © [parksubeom](https://github.com/parksubeom)
