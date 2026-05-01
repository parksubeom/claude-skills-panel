# Press Kit — Claude Code Skills Panel

미디어, 인플루언서, Anthropic Devrel 등 외부에서 한 곳에서 정보를 가져갈 수 있도록 정리한 자료.

---

## 한 줄 (60자 이하)

```
The fastest way to use Claude Code slash commands.
```

```
Claude Code 슬래시 커맨드를 가장 빠르게 트리거하는 패널.
```

## 짧은 설명 (260자 이하, Marketplace 한도)

```
A VS Code / Cursor panel that auto-discovers every Claude Code slash
command on your machine — your custom skills, project commands, and
all installed plugins (superpowers, code-review, …). One click to
copy, auto-paste, or run in terminal. Quick Bar with keys 1–6.
Built-in plugin browser. Optional pixel-art gamification.
```

## 긴 설명 (블로그/PR/리뷰 본문용)

```
Claude Code Skills Panel is a free VS Code / Cursor / Codium /
Windsurf extension that gives Claude Code users a graphical home for
their slash commands.

Once you install superpowers, code-review, and a few of your own
custom commands, your ~/.claude/ folder grows past 50 entries fast,
and Claude Code itself has no UI for browsing them. This panel scans
all sources — user-level skills, project-level commands, every
installed plugin — and presents them as a fuzzy-searchable card grid.
Click a card to copy the slash command to your clipboard, or auto-
paste, or send straight to the active terminal. Bind your top six to
keys 1–6 via the Quick Bar.

The panel also ships a built-in plugin marketplace browser — the
official catalog has 243+ plugins, and the panel is the only way to
search and one-click-install them today. Dark, Retro CRT, and Gameboy
LCD themes ship in the box. Localized in English, Korean, and
Japanese.

For users who want it, the panel doubles as a tiny pixel-art game: a
buddy character that branches into one of 10 RPG classes (Codey the
Swordsman, Docly the Cleric, Debuggo the Detective, …) based on which
commands you use most. Every gamification element is opt-out from a
single toggle.

Free, MIT, ~120 KB packaged. Works in any VS Code-compatible IDE.
```

---

## 핵심 사실 (Fact sheet)

| 항목 | 값 |
|---|---|
| **Name** | Claude Code Skills Panel |
| **Publisher** | parksubeom |
| **License** | MIT |
| **Price** | Free |
| **Size** | ~120 KB packaged |
| **Languages** | English · 한국어 · 日本語 |
| **Backend** | None (100% local file system + clipboard) |
| **Telemetry** | Off by default; opt-in banner shown once |
| **First release** | 2026-04-29 (v0.20.0 on OpenVSX) |
| **Latest version** | See https://open-vsx.org/extension/parksubeom/claude-skills-panel |
| **Source** | github.com/parksubeom/claude-skills-panel |
| **VS Marketplace** | marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel |
| **OpenVSX** | open-vsx.org/extension/parksubeom/claude-skills-panel |
| **Built with** | Claude Code itself (full-flow skill, ~5 days) |

---

## 차별화 포인트

| 포인트 | 한 줄 설명 |
|---|---|
| **Plugin Marketplace browser** | Claude Code의 `/plugin` 시스템을 그래픽으로 보여주는 첫 도구. 243+ 플러그인 검색·필터·한 클릭 설치. |
| **Branching pet** | 단일 진화가 아닌, 사용자 행동에 따라 10 클래스 중 분기. RPG 메타포. |
| **Trilingual** | 영문/한국어/일본어 (en/ko/ja) — 동일 기능 동등 지원. |
| **Zero backend** | 인증·서버·텔레메트리 의무 없음. 패널 mount 후 file system 1회 walk가 전부. |
| **Pixel-art aesthetic** | 8-bit 톤 + 토글로 끌 수 있음. "디자인이 강하지만 강요 아님". |
| **CI/CD 자동화** | 태그 push 한 번에 OpenVSX + VS Code Marketplace 두 마켓 동시 게시. |

---

## 자주 받는 질문 / 응답

### Q. Cursor에서도 되나?
A. 네 — Cursor, Windsurf, Codium 모두 OpenVSX에서 동일하게 설치됩니다.

### Q. JetBrains 지원?
A. 현재는 VS Code 호환 IDE만. JetBrains는 백로그.

### Q. Anthropic 공식?
A. 아니요. 커뮤니티 도구. Anthropic의 Claude Code 데이터 모델 (`~/.claude/`, `/plugin`)을 그대로 활용.

### Q. 데이터 수집?
A. 기본 OFF. 첫 실행 banner에서 익명 카운터 opt-in 한 번 묻고, 거부하면 그걸로 끝. 스킬 이름·내용 절대 수집 안 함.

### Q. 게이미피케이션 끌 수 있나?
A. 모든 항목 토글로 끔 (사운드, CRT, 캐릭터 시트, 테마). 평범한 패널 1초 만에.

### Q. 라이선스?
A. MIT. fork·기여·재배포 모두 OK.

### Q. 만든 사람?
A. parksubeom (sooknise@naver.com). 사이드 프로젝트로 시작, 1주 만에 V1 릴리스.

---

## 인용 (영문 / 한국어)

미디어가 인용하기 좋은 한 마디:

### EN
> "I kept forgetting which Claude Code slash commands I had installed —
> so I built a panel that finds them all."

> "There's no marketplace UI in Claude Code. So I added one."

> "Built mostly with Claude Code, which felt right. Recursion: I'm
> using a panel for a tool that built the panel."

### KO
> "내가 설치한 Claude Code 커맨드를 자꾸 까먹어서, 다 찾아주는 패널을 만들었습니다."

> "Claude Code엔 마켓플레이스 UI가 없어서, 패널 안에 만들었습니다."

> "대부분 Claude Code로 만들었습니다. 도구가 도구를 만든 셈이죠."

---

## 이미지 자료

`docs/screenshots/` 폴더에서 가져가실 수 있습니다. CDN 직접 링크:

- **Buddy lineup** (가장 임팩트 큼) — `https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/buddy-lineup.png`
- **Activity Bar (narrow)** — `https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/panel-main.png`
- **Bottom Panel (wide)** — `https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/panel-bottom.png`
- **Demo GIF** (제작 시) — `https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/demo.gif`

라이선스: 모든 이미지는 본 익스텐션 홍보 목적의 자유 사용 OK. 별도 허락 불필요.

---

## 연락처

- **GitHub**: https://github.com/parksubeom (issue / discussion / PR)
- **Email**: sooknise@naver.com
- **VS Marketplace publisher**: parksubeom

응답 평균: 24시간 내. 인터뷰·기사 요청 환영.

---

## GitHub 저장소 메타데이터 (관리자용)

GitHub repo 페이지의 **About** 영역에 다음을 설정해두세요 (검색·노출에 영향):

### Description
```
The fastest way to use Claude Code slash commands. Pixel-art panel for VS Code / Cursor that auto-discovers your skills, commands, and plugins.
```

### Website
```
https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel
```

### Topics (최대 20개)
```
claude-code
claude
vscode-extension
cursor
slash-commands
ai-coding
developer-tools
pixel-art
gamification
typescript
javascript
mcp
anthropic
productivity
extensions
8-bit
plugin-marketplace
agent
agents
dotfiles
```

### Social preview (1280×640 PNG)
- GitHub Settings → General → Social preview → Edit
- 추천: `docs/screenshots/buddy-lineup.png`을 1280×640으로 잘라서 업로드. 텍스트 오버레이 1줄 (예: "Pixel-art panel for Claude Code") 추가하면 임팩트 ↑

---

## 외부 노출 체크리스트

`docs/marketing/`의 다른 문서들과 함께:

- [SCREENSHOT_PLAN.md](SCREENSHOT_PLAN.md) — 6장 핵심 스크린샷 컴포지션
- [X_TWITTER.md](X_TWITTER.md) — 트윗 thread 영/한
- [REDDIT_HN.md](REDDIT_HN.md) — Show HN, r/ClaudeAI, r/vscode, r/cursor
- [PRODUCT_HUNT.md](PRODUCT_HUNT.md) — taglines, description, Q&A 30개
- [BLOG_OUTLINE.md](BLOG_OUTLINE.md) — 블로그 글 3종 outline
- [BLOG_POST_BUILD_RETRO.md](BLOG_POST_BUILD_RETRO.md) — 1주 빌드 회고 본문 (영/한, 게시 즉시 가능)
- [ONE_PAGER.md](ONE_PAGER.md) — 짧은 소개 자료 (이메일·DM 첨부용)
- [OUTREACH.md](OUTREACH.md) — 이메일/DM outreach 템플릿
- [PRESS_KIT.md](PRESS_KIT.md) — 본 문서
