# Reddit 후킹 게시글 — 복사 즉시 게시 가능

> 메인 타깃: **r/ClaudeAI** (Claude Code 사용자 직접 도달)
> 보조: r/vscode, r/cursor (24시간 간격으로 이후 게시)
>
> **이미지 첨부 (필수)**: 라인업 PNG
> `https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/buddy-lineup.png`
> 게시 시 본문 위에 이 이미지 직접 업로드해도 좋고, Reddit이 자동 카드 만들어줍니다.

---

## 제목 후보 (가장 위가 추천)

1. **I built a panel that finds every Claude Code slash command on your machine — it accidentally became a tiny RPG**
2. Tired of forgetting which Claude Code slash commands I had — built a free VS Code/Cursor panel + plugin marketplace browser
3. Free Claude Code companion that turns your slash command usage into a class-branching pixel buddy

---

## 본문 (그대로 복사)

```markdown
After installing **superpowers**, **code-review**, and writing a few of my own
custom commands, my `~/.claude/commands/` had ~50 slash commands and I'd
already forgotten which ones I had. Half the time I'd start typing
`/commit-` and get autocomplete-ambushed by 4 things I'd never used.

So I built a panel.

**It does the boring useful stuff first:**
- Auto-finds every slash command on your machine — `~/.claude/skills/`,
  `~/.claude/commands/`, project-level `.claude/`, and **every plugin
  you've installed via `/plugin install`** (superpowers, code-review,
  skill-creator, …)
- Click → command goes to clipboard. Or auto-paste + Enter. Or straight
  to the active terminal.
- Quick Bar with **keys 1–6** so I can fire my top six from anywhere
- Fuzzy search with arrow-key nav (`↓ Enter`)
- A **🛒 plugin marketplace browser inside the panel** — the official
  catalog has 243+ plugins and Claude Code has no GUI for browsing
  them. One-click install for any of them.

**Then the side-project gravity hit:**

The buddy character branches into one of **10 RPG classes** based on
which slash commands you actually use most. Use a lot of `/git-*`?
You become **Gitto the Ninja**. Heavy on `/code-review`? **Testra
the Paladin**. The matching is just regex over the command names —
`code-review` hits review before code, so it goes Paladin not Swordsman.

![Buddy lineup](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/buddy-lineup.png)

The branching happens at action 50. Before that you're an Egg →
Hatchling. After that you can hit **🔄 Reincarnate** to re-pick based
on your current usage if your workflow has shifted (no penalty).

There's also:
- 3 pixel themes: **Dark / Retro CRT / Gameboy LCD**
- Skills level up like RPG abilities (LV.0 → LV.5)
- 16 achievements
- Weekly Markdown report you can copy or save
- 4 languages: **English / 한국어 / 日本語 / 中文**

**All gamification is one-toggle off** if you just want a clean command
launcher. The "boring panel" mode is one click away.

**Free, MIT, ~120 KB, no telemetry by default**:

- VS Code: https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel
- Cursor / Codium / Windsurf (OpenVSX): https://open-vsx.org/extension/parksubeom/claude-skills-panel
- Source: https://github.com/parksubeom/claude-skills-panel

Built mostly with Claude Code itself — full-flow plugin's
brainstorm → plan → execute → verify cycle is what made it possible
to ship in a week. Recursion: I'm using a panel for a tool that
built the panel.

I'd genuinely love to know which slash commands everyone here uses
most. The class-matching regex only knows the keywords I've seen so
far — your set probably teaches me categories I'm missing.
```

---

## OP 첫 댓글 (게시 후 즉시 달기 — 알고리즘 가속)

Reddit은 OP가 첫 댓글에 추가 정보 다는 게 매우 효과적입니다. 본문에 다 안 넣은 디테일 1~2개:

```markdown
Few extra notes I didn't want to clutter the post with:

- The plugin browser pulls directly from
  `~/.claude/plugins/marketplaces/<name>/.claude-plugin/marketplace.json`
  + joins with `installed_plugins.json` to compute install state. So
  it works for *any* marketplace you've added via
  `/plugin marketplace add`, not just the official one.
- The "auto-paste + Enter" execution mode uses osascript on macOS,
  PowerShell SendKeys on Windows, xdotool on Linux. macOS one needs
  Accessibility permission on first run.
- Settings are in `~/.claude/skills-panel-config.json` — version-
  controllable via dotfiles, exportable as JSON from the ⚙ menu.

Happy to dig into any of the implementation if it's interesting,
or just take feature requests.
```

---

## 자주 받는 댓글에 미리 준비된 응답

### 🟢 긍정 / 호기심
> **"This is sick, installing now"**
- "Hope it works for you. If you hit anything weird, GitHub Issues is the fastest way to get it fixed — I usually respond within a day."

> **"How does the class branching actually decide?"**
- "It's straightforward — every slash command gets categorized by name regex (`/git-*` → Gitto, `/code-review` → Testra, etc.), and at action 50 it picks the category with the highest count. Tie-breaker is alphabetical so it's deterministic. You can hit Reincarnate any time to re-pick."

> **"Built with Claude Code? How meta"**
- "Yeah, almost the whole thing. The full-flow skill (brainstorm → plan → execute → verify) is basically what kept the iteration speed up. There's a docs/ folder in the repo with daily summaries if you're curious about the build process."

### 🟡 중립적 / 비판적
> **"Why not just use the built-in `/` autocomplete?"**
- "Autocomplete only fires once you're already in the chat input. The panel works from anywhere — bind a Quick Bar slot to `Cmd+Shift+1` and you can fire your favorite command without opening chat first. Plus the visual map of *what's installed* is something autocomplete doesn't give you."

> **"I don't want pixel-art / gamification"**
- "Totally fair. Hit the ⚙ Settings button, turn off sound, scanlines, and theme to Dark. The character can be ignored — it just lives in the corner. The panel works fine as a plain command launcher."

> **"What about telemetry?"**
- "Off by default. First run shows a single banner asking permission for anonymous feature counters (no slash command names, no content). Say no and that's it forever. There's no backend to even send to right now — the consent UI is wired but dispatch is a separate change I haven't made yet."

> **"Why VS Code / Cursor only?"**
- "Just where I work. JetBrains is in the backlog but it's a separate codebase. If anyone wants to take a stab at it, the data model is small — could be a weekend port."

### 🔴 트롤 / 빈정거림 (대응 안 하는 게 정답)
> **"why so much pixel-art shit lol"**
- (대답 안 함. 또는 짧게: "Toggle's off by default if you want — no hard feelings.")

---

## r/vscode 변형 (24시간 후 게시)

거의 같지만 r/vscode 톤은 "Claude Code 모를 수도 있는 사람들"용으로 한 줄 추가:

**제목**: `[Free Extension] Pixel-art panel for Claude Code users — auto-discovers slash commands + plugin browser inside the IDE`

본문 첫 단락만 교체:

```markdown
For VS Code users who use **Claude Code** as their AI coding assistant
— this gives you a panel for managing all the slash commands you've
accumulated. If you're not on Claude Code, this won't apply to you.

(원래 본문 그대로 이어서)
```

---

## r/cursor 변형 (24시간 후 게시)

**제목**: `Cursor users on Claude Code: free panel that finds every /command on your machine, with one-click plugin install`

본문 첫 단락:

```markdown
**Cursor + Claude Code combo users**: This installs from OpenVSX
exactly like in VS Code. Auto-finds every slash command (custom +
plugin), Quick Bar with keys 1–6, built-in browser for the
claude-plugins-official catalog (243 plugins, one-click install).

(원래 본문 그대로 이어서)
```

---

## 한국어 버전 (r/Korea_dev / OKKY 등)

**제목**: `Claude Code 슬래시 커맨드 매번 까먹어서 패널 만들었습니다 (오픈소스, RPG 진화 버디 보너스)`

```markdown
superpowers·code-review·skill-creator + 직접 만든 ~/.claude/commands/
까지 합치니 슬래시 커맨드가 50개를 넘었고, 절반은 이름이 헷갈려서
재타이핑하거나 자동완성에 ambush 당하기 일쑤였습니다.

그래서 패널을 만들었습니다.

**먼저 본 기능부터:**
- ~/.claude/skills, ~/.claude/commands, 프로젝트 레벨 .claude/, 그리고
  `/plugin install`로 설치한 모든 플러그인까지 **자동 스캔**
- 카드 클릭 → 클립보드 복사. 또는 자동 붙여넣기 + Enter. 또는 활성
  터미널로 직접 전송.
- **키 1-6 Quick Bar**로 자주 쓰는 6개 즉시 트리거 (어디서든)
- Fuzzy 검색 + 키보드 네비 (`↓ Enter`)
- **🛒 플러그인 마켓플레이스 브라우저** — claude-plugins-official 공식
  카탈로그(243개)를 패널 안에서 검색·필터·**한 클릭 설치**.
  Claude Code는 GUI 마켓이 없어서 이게 사실상 최초 GUI 마켓입니다.

**그러다 사이드 프로젝트답게 게임이 됐습니다:**

버디 캐릭터가 사용자 슬래시 커맨드 사용 패턴에 따라 **10개 RPG 클래스
중 하나로 분기 진화**합니다. `/git-*` 많이 쓰면 **Gitto 닌자**, `/code-
review` 많이 쓰면 **Testra 팔라딘**. 매칭은 커맨드명 regex로 — `code-
review`는 code보다 review가 먼저 매치되어 팔라딘이 됩니다.

![버디 라인업](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/buddy-lineup.png)

분기는 50회 사용 시점. 그 전엔 알 → 부화 단계. 분기 후엔 **🔄 Reincarnate**
버튼으로 다시 패턴 기반 결정 가능 (페널티 없음).

추가:
- 3개 픽셀 테마: **Dark / Retro CRT / Gameboy LCD**
- 스킬 레벨업 (LV.0 → LV.5)
- 16개 업적
- 위클리 마크다운 리포트
- 4개 언어: **English / 한국어 / 日本語 / 中文**

**게이미피케이션은 토글로 다 OFF 가능** — 깔끔한 평범 패널 1초 만에.

**무료·MIT·~120KB·기본 텔레메트리 OFF**:

- VS Code: https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel
- Cursor: https://open-vsx.org/extension/parksubeom/claude-skills-panel
- 소스: https://github.com/parksubeom/claude-skills-panel

대부분 Claude Code의 풀플로우 스킬 (브레인스토밍 → 플랜 → 실행 → 검증)
사이클로 만들었습니다. 도구가 도구를 만든 셈이네요.

여러분이 가장 많이 쓰는 슬래시 커맨드가 궁금합니다 — 클래스 매칭 regex가
제가 본 키워드만 알고 있어서, 새 카테고리 의견 환영합니다.
```

---

## 게시 직전 체크리스트

- [ ] 라인업 이미지가 본문 자동 카드 또는 직접 업로드로 보이는가
- [ ] 두 마켓 링크 모두 작동 (404 아님)
- [ ] 게시 후 1시간 내 댓글 모니터링 준비됨
- [ ] OP 첫 댓글 미리 준비됨 (게시 후 5분 내 달기)
- [ ] 욱해서 답할 만한 트롤 있어도 무시 / 짧게 한 줄 답변

## 게시 시간 (r/ClaudeAI)

- 가장 좋음: **미국 ET 09:00–11:00** (한국 22:00–24:00 KST)
- 차선: **토요일 오전 ET** (개발자들 retro 시간)
- 피해야 할: 금요일 저녁 (트래픽 낮음), 일요일 오후 (하강)

## 후속

- 24시간 후: r/vscode 변형 게시
- 48시간 후: r/cursor 변형 게시
- 게시 후 받은 feature request → GitHub Issues로 분류
- upvote 50+ 받으면 Show HN 본격 준비
