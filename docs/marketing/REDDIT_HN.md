# Reddit / Hacker News 게시 카피

## 우선순위

1. **Show HN** — 가장 노출 큼. 다만 1일 1회 권장, 자정 PT 직후가 알고리즘상 유리.
2. **r/ClaudeAI** — 핵심 타깃. 기본 톤은 "내가 만들었어요" 보다 "이 문제를 풀어봤습니다"가 환영받음.
3. **r/vscode** — 일반 VS Code 사용자, 게이미피케이션 어필 가능.
4. **r/cursor** — Claude Code + Cursor 조합. Cursor에서도 된다는 점 강조.

---

## Show HN

### 제목
```
Show HN: A VS Code panel that auto-discovers every Claude Code slash command
```

### 본문
```
I kept forgetting which Claude Code slash commands I had installed —
between superpowers, code-review, my own ~/.claude/commands/, and
project-level commands, I'd built up ~50+ and was constantly retyping
or re-discovering them.

So I built a VS Code panel that scans every source on your machine
(skills, commands, all installed plugins) and lets you fire any of
them with one click. Or with keys 1–6 via a Quick Bar. Or directly
into the active terminal.

Bonus stuff that turned out fun:

* A built-in browser for the official plugin marketplace (~243
  plugins) — searchable, with one-click install
* Custom groups + aliases (organize commands the way you actually
  use them)
* Three pixel-art themes (Dark / Retro CRT / Gameboy LCD)
* Optional gamification — skills level up, you get achievements, a
  pixel buddy evolves. All toggle-off-able if you want a clean panel.

Install (free, MIT):

* VS Code: https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel
* Cursor / Codium / Windsurf (OpenVSX): https://open-vsx.org/extension/parksubeom/claude-skills-panel
* Source: https://github.com/parksubeom/claude-skills-panel

Built (mostly) with Claude Code, which felt right. Happy to answer
questions about the implementation.
```

### 자주 받는 질문 (대비)
> "Why a separate panel — isn't this what `/` autocomplete is for?"
- The autocomplete only fires when you're already in the chat input. The panel works from anywhere — bind a Quick Bar slot to `Cmd+Shift+1` and you can fire your favorite command without even opening the chat. It also gives you a visual map of what's installed (autocomplete just shows names).

> "How does it find plugins?"
- Walks `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/` per plugin. Reads `commands/*.md` and `SKILL.md` files via simple frontmatter parsing. No background processes, no daemon — just file-system scan on panel mount.

> "Telemetry?"
- Off by default. First run shows a single banner asking permission for anonymous feature counters (no skill names, no content). Toggle anytime.

> "Why pixel art?"
- Started as a side project on the train, drift toward 8-bit aesthetic was inevitable. Every visual flourish is toggleable — there's a clean professional mode if that's not your thing.

---

## r/ClaudeAI

### 제목 (몇 가지 후보, 톤 맞춰 골라 사용)
- `I kept forgetting my slash commands — built a VS Code panel that auto-finds them all`
- `Free VS Code/Cursor extension: see and trigger every Claude Code slash command in one panel`
- `Built a Marketplace browser inside VS Code — see all 243 official plugins, install with one click`

### 본문
```
**Problem**: I have ~50 Claude Code slash commands now, between
superpowers, code-review, skill-creator, and my own. I keep forgetting
exact names and retyping.

**Solution I built**: A VS Code/Cursor panel that:

* Auto-scans ~/.claude/skills, ~/.claude/commands, project-level
  .claude/, and every installed plugin
* Click any card → command goes to clipboard, or auto-paste, or
  straight to the terminal
* Quick Bar with keys 1–6 for the ones I fire all day
* Built-in plugin browser (search 243 plugins from
  claude-plugins-official, one-click install)
* Optional gamification — skills level up, achievements, a pixel
  buddy. All toggleable if you don't want it.

**Free, MIT**:

* VS Code Marketplace: [link]
* OpenVSX (Cursor/Windsurf/Codium): [link]
* GitHub: github.com/parksubeom/claude-skills-panel

**Stack**: Just a webview + file-system scanning. No background
processes, no telemetry on by default.

Curious what slash commands you all use the most — I'd love to
optimize the discovery flow if there are common patterns I'm missing.

[demo.gif]
```

### 코멘트 응답 톤
- 자랑보다 도구 자체 얘기. "이 기능이 어떻게 동작하는지" 디테일 환영받음.
- 비판/대안 제시에 방어적이지 말 것. "좋은 지적이라 백로그에 추가하겠다"가 가장 안전.

---

## r/vscode

### 제목
```
[Free Extension] Pixel-art skill panel for Claude Code — auto-discovers every slash command
```

### 본문
```
**For Claude Code users**: A panel that auto-finds every /command and
/skill on your machine (custom skills, project-level, all installed
plugins) and lets you fire them with one click or keys 1–6.

**Optional fun stuff**: 3 pixel themes, achievements, a buddy that
evolves through 6 stages, weekly Markdown reports. All toggleable.

**Install**: Search "Claude Code Skills Panel" in extensions, or
install from VS Marketplace.

**Source**: github.com/parksubeom/claude-skills-panel (MIT)

[hero.png + demo.gif]

Built mostly with Claude Code itself. The auto-discovery + plugin
browser stuff was the trickiest part — would love feedback from
anyone using it.
```

---

## r/cursor

### 제목
```
Free Cursor extension: every Claude Code slash command in one panel, with keyboard 1–6 shortcuts
```

### 본문 (r/vscode와 거의 동일하지만 Cursor 강조)
```
**Cursor users**: This works in Cursor (and Windsurf, Codium) via
OpenVSX. Installs Claude Code's slash commands as a clickable panel —
no more retyping /full-flow or /commit-prepare from memory.

* Auto-discovery (~/.claude/skills, project commands, plugins)
* Quick Bar with keys 1–6
* Built-in browser for claude-plugins-official (243 plugins,
  one-click install)
* 3 pixel themes (Dark / Retro CRT / Gameboy LCD)

OpenVSX: https://open-vsx.org/extension/parksubeom/claude-skills-panel
GitHub: github.com/parksubeom/claude-skills-panel

[demo.gif]

Built mostly with Claude Code. AMA.
```

---

## 게시 후 모니터링

- **첫 1시간**: 응답 빠르게. 답변 없는 댓글이 쌓이면 알고리즘이 dead post로 분류.
- **24시간**: 받은 피드백 → GitHub Issues로 분류. 댓글에서 "issue로 옮기겠습니다" 한 줄.
- **1주 후**: 어떤 코멘트/feature request가 가장 많이 upvote 됐는지 추출 → 다음 페이즈 우선순위 결정.

---

## 절대 하지 말 것

- 같은 글 여러 sub에 동시 업로드 — 자동 차단 트리거. 24시간씩 간격.
- 자기 글에 본인 추천 (vote manipulation) — 영구 ban 위험.
- "DM 보내주세요" 형태 — Reddit 모드들이 싫어함. 항상 공개 답변.
- 부정적 코멘트에 일대일 디펜스 — silent에서 update 한 줄로 답변.
