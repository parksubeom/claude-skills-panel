# X (Twitter) 게시 카피 — 복사 즉시 게시 가능

알고리즘 핵심: **본문에 외부 링크 X** (페널티). 링크는 자기 답글(reply self-thread)에. 이미지가 있는 트윗이 임프레션 ~3-5배.

---

# V0 — 단발 트윗 (가장 가벼운 시작)

## 🇺🇸 영문

```
Got tired of forgetting which Claude Code slash commands I had
installed (~50 between superpowers, code-review, and my own).

So I built a VS Code panel — with Claude Code itself — that
auto-finds them all. Click to fire. Keys 1–6 for the top six.

Free, MIT, side-project gravity included.
```

**첨부**: 라인업 이미지 (`docs/screenshots/buddy-lineup.png`)

**자기 답글** (게시 직후 self-reply):
```
Source / install:
github.com/parksubeom/claude-skills-panel
marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel
open-vsx.org/extension/parksubeom/claude-skills-panel (Cursor / Codium / Windsurf)
```

## 🇰🇷 한국어

```
Claude Code 슬래시 커맨드 50개 넘어가니까 매번 외워서 타이핑하기
귀찮아져서, Claude Code로 직접 VS Code 패널 만들었습니다.

자동으로 다 찾아주고 클릭으로 실행. Quick Bar 1-6 키.
사이드 프로젝트답게 도트 게임 보너스.

무료·MIT.
```

**첨부**: 라인업 이미지

**자기 답글**:
```
설치:
VS Code: marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel
Cursor: open-vsx.org/extension/parksubeom/claude-skills-panel
소스: github.com/parksubeom/claude-skills-panel
```

---

# V1 — Thread (7-tweet 풀버전)

게시 후 반응이 V0에서 RT 5+ / like 20+ 받으면 1주일 후 thread 발행.

## 🇺🇸 영문 7-tweet

### 1/7 (hook + GIF/lineup)
```
I built a VS Code panel for Claude Code that auto-finds every
slash command on your machine and lets me fire any of them with
one click — or keys 1–6.

Built almost entirely with Claude Code itself. 1 week, ~3000 lines.

🧵
```
첨부: demo.gif 또는 라인업 이미지

### 2/7 (the problem)
```
The pain that started this:

After installing superpowers, code-review, and writing a few of
my own custom commands in ~/.claude/commands/, I had ~50 slash
commands. Half of which I'd already forgotten existed.

Typing /comm- and getting ambushed by 4 things I'd never used.
```

### 3/7 (auto-discovery)
```
The panel walks every source on your machine, no setup:

• ~/.claude/skills/
• ~/.claude/commands/
• <project>/.claude/
• ~/.claude/plugins/cache/* (every plugin you've installed)

All grouped by source, fuzzy-searchable, keyboard-navigable.
```
첨부: HERO 스크린샷

### 4/7 (one-click execution)
```
Click a card → command goes to clipboard.
Or auto-paste + Enter.
Or send straight to your terminal.

Plus a Quick Bar that binds your top six to keys 1–6, fires
from anywhere.
```

### 5/7 (plugin browser)
```
The unexpectedly useful part:

A built-in browser for the /plugin marketplace. Claude Code's
official catalog has 240+ plugins and there's no GUI to discover
them. The panel reads marketplace.json directly, joins with
installed_plugins.json, and gives you search + one-click install.
```
첨부: marketplace browser 스크린샷

### 6/7 (gamification, optional)
```
Side-project gravity hit and the buddy character now branches
into 1 of 10 RPG classes based on your most-used category.

Codey if you're code-heavy. Gitto if it's mostly /git-*.
Testra (Paladin) if you're review-driven.

All gamification toggles off in one click.
```
첨부: 라인업 이미지

### 7/7 (install + CTA)
```
Free, MIT, ~120 KB, no telemetry by default. Trilingual+
(en/ko/ja/zh).

Install:
parksubeom.claude-skills-panel
github.com/parksubeom/claude-skills-panel

Curious what slash commands you reach for most — the class-
matching regex would learn from your set.
```

## 🇰🇷 한국어 5-tweet (간결 버전)

### 1/5
```
Claude Code 슬래시 커맨드 50개 넘어가니까 안 외워져서,
Claude Code로 직접 VS Code 패널 만들었습니다.

자동으로 다 찾아주고 클릭으로 실행. 1주, ~3000줄.

🧵
```
첨부: 라인업 이미지

### 2/5
```
~/.claude/commands, 프로젝트 .claude/, 그리고 /plugin install
한 모든 플러그인까지 자동 스캔.

카드 클릭 → 클립보드 복사. 또는 자동 붙여넣기 + Enter.
또는 터미널 직접 전송.

Quick Bar 1-6 키로 자주 쓰는 6개 어디서든.
```

### 3/5
```
의외의 핵심 기능: /plugin 마켓플레이스 브라우저.

Claude Code 공식 카탈로그가 240개+인데 검색 GUI가 없음.
패널이 marketplace.json 직접 파싱해서 검색·필터·한 클릭 설치.
```

### 4/5
```
사이드 프로젝트답게 도트 게임 됨:

버디 캐릭터가 사용 패턴 따라 10 클래스 분기. /git-* 많이 쓰면
Gitto 닌자, /code-review 많이 쓰면 Testra 팔라딘.

다 토글로 끌 수 있음.
```

### 5/5
```
무료·MIT·기본 텔레메트리 OFF. 4개 언어 (en/ko/ja/zh).

설치:
parksubeom.claude-skills-panel (VS Code Marketplace 검색)
github.com/parksubeom/claude-skills-panel

여러분 top 3 슬래시 커맨드 궁금합니다.
```

---

# 알고리즘 팁

| 행위 | 효과 |
|---|---|
| 본문에 외부 링크 | ❌ 임프레션 ~50% 감소 |
| 자기 답글에 링크 | ✅ 페널티 없음, 클릭 동선 명확 |
| 이미지/GIF 첨부 | ✅ 임프레션 3-5배 |
| 4장 carousel | ✅ V1 thread에서 임팩트 큼 |
| #BuildInPublic | 🟠 한국 dev엔 효과 적음, 영문엔 ~10% 도움 |
| @AnthropicAI 멘션 | ✅ Claude 팀이 종종 RT (Built with Claude Code 명시 시 ↑) |
| 게시 후 1시간 응답 | ✅ 알고리즘 가속 |

# 게시 시간

| 청중 | 시간 |
|---|---|
| 영문 글로벌 dev | 화·수·목 미국 ET 09:00–11:00 (한국 22:00–24:00 KST) |
| 한국 dev | 평일 21:00–23:00 KST (퇴근 후) |

# 응답 템플릿

> **"Cursor에서도 되나요?"**
- "네 — Cursor / Windsurf / Codium 모두 OpenVSX에서 동일하게 설치됩니다."

> **"Open source?"**
- "Yep, MIT. github.com/parksubeom/claude-skills-panel"

> **"Telemetry?"**
- "Off by default. First run shows a single banner asking permission for anonymous feature counters (no command names, no content). Say no and that's it."

> **"제일 많이 쓰는 커맨드 뭐예요?"**
- "/full-flow, /commit-prepare, /code-review가 압도적. 그래서 클래스 매칭 regex가 처음엔 그쪽으로 편향됐어요."
