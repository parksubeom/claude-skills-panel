# Claude Code Skills Panel

[![OpenVSX Version](https://img.shields.io/open-vsx/v/parksubeom/claude-skills-panel?style=flat-square&label=OpenVSX&color=7dd3fc&logo=vscodium)](https://open-vsx.org/extension/parksubeom/claude-skills-panel)
[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/parksubeom.claude-skills-panel?style=flat-square&label=VS%20Marketplace&color=2563eb&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel)
[![GitHub stars](https://img.shields.io/github/stars/parksubeom/claude-skills-panel?style=flat-square&color=fbbf24&logo=github)](https://github.com/parksubeom/claude-skills-panel)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)

> 🇺🇸 [English (README.md)](README.md)

## 클로드 코드 스킬을 게임처럼 관리하세요.

> **처음 들어보세요?** [Claude Code](https://docs.claude.com/en/docs/claude-code)는 Anthropic의 AI 코딩 CLI입니다. 터미널이나 Cursor / VS Code 안에서 동작하고, *슬래시 명령*(`/commit`, `/review` 등)으로 사용합니다. 플러그인 한두 개만 깔아도 명령어가 30개를 넘기 시작 — 그게 이 패널이 푸는 문제입니다.

Claude Code용 픽셀 아트 스킬 런처. **클릭으로 발사, 우클릭으로 편집, 작업 중에는 버디들이 몬스터와 싸우고, 어느 명령이 토큰을 가장 많이 먹는지 한눈에**.

![한 번 클릭으로 발사 — 머신 안의 모든 슬래시 명령](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/demo-card-click.gif)

### 실제로 사용하게 되는 다섯 가지

1. **🎮 커스텀 스킬을 게임처럼 관리.** 머신 안의 모든 슬래시 명령이 카드가 됩니다. 클릭하면 발사. **우클릭으로 `SKILL.md` 바로 열어 편집.** Quick Bar로 드래그하면 키보드 1–6 단축키로. Alias / 커스텀 아이콘 / 숨김 / 커스텀 그룹 — 모두 한 편집 모달에서.

2. **🐾 귀여운 픽셀 버디들이 작업이 지루하지 않게.** Quick Bar 위에는 정원이 있어 사용한 클래스의 버디들이 idle walk하고, *Claude Code가 실제로 작업 중일 때는 몬스터와 싸웁니다* (mtime 폴링 — 프롬프트 내용은 안 읽음). 작업이 끝나면 3-tone 차임 + ✓! 말풍선으로 알려줘요. 정원의 버디를 클릭하면 그 버디의 정보가 나옵니다. (전부 끄기 가능 — 토글 한 번이면.)

3. **📊 내가 어떤 명령을 자주 쓰는지 통계로 확인.** 📊 위클리 리포트는 7일 활동 차트 + TOP 5 명령 + Markdown export 제공. 스킬별 마스터리(LV.0 → LV.5), 16개 업적, 데일리 스트릭 — 내 스킬 belt가 눈에 보이게 자라납니다.

4. **⚡ 토큰 hog를 즉시 발견.** opt-in 토큰 추적은 `~/.claude/projects/*.jsonl`에서 `message.usage`만 읽고(프롬프트 내용은 절대 X) **카드마다 누적 토큰 표시**, `⚡ 토큰 많이` 정렬, 위클리 리포트 "토큰 사용 TOP 5"를 노출. 어느 명령이 한 번에 12k 토큰을 쓰는지 명확히.

5. **🛒 패널 안에서 243+ 공식 플러그인 검색·설치.** 검색 / 카테고리 필터 / 한 번 클릭 설치 — Claude Code 자체에는 없던 GUI.

### 어디에 도킹할까

Claude Code를 어떻게 쓰는지에 따라 권장 위치가 다릅니다:

| Claude Code를 쓰는 방식 | 권장 패널 위치 | 이유 |
|---|---|---|
| **Claude Code IDE 익스텐션** (사이드바 에이전트) | **하단 패널** (View → Appearance → Move Panel Position → Bottom) | 터미널 옆에 자리잡아 카드 + 채팅을 함께 볼 수 있음 |
| **Claude Code CLI** (터미널) | **Activity Bar** (좌측, 좁음) | 터미널이 메인 영역을 차지하고 카드는 한 클릭 거리에 |

두 모드 모두 자동 적응 — 넓은 layout은 정원 풀버전, 좁은 layout은 정원이 `🐾 버디들 보기` 버튼으로 collapse.

> 외워서 타이핑하지 말고 한 번에 클릭 · Stop memorizing — one click · もう打たないで、ワンクリックで起動 · 别再死记斜杠命令,一键触发

> 대부분 *Claude Code 자체로* 만들었습니다. 무료, MIT, 약 200KB, 텔레메트리 기본 OFF.

---

## 누구를 위한 도구?

**아래 중 하나라도 해당되면 10초 안에 가치 체감:**

- ✅ Claude Code를 쓰면서 플러그인 한 개 이상 설치 (`superpowers`, `code-review` 등)
- ✅ `~/.claude/commands/` 또는 `~/.claude/skills/`에 5개 이상의 커스텀 명령
- ✅ VS Code → Cursor / Windsurf 옮겨와서 플러그인 GUI가 그리워짐
- ✅ `/commit-prepare`를 매번 다시 치느니 `1`–`6` 키를 누르고 싶음
- ✅ "어느 스킬이 토큰을 가장 많이 먹지?" 한 번이라도 궁금했던 적

**아래라면 굳이 안 깔아도 됨:**

- ❌ Claude Code를 아직 안 써봤다 — [거기부터](https://docs.claude.com/en/docs/claude-code) 시작하세요
- ❌ 슬래시 명령이 1–2개뿐이고 다 외움

---

## 설치

| IDE | 위치 |
|---|---|
| **VS Code** | [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel) |
| **Cursor** | [OpenVSX](https://open-vsx.org/extension/parksubeom/claude-skills-panel) |
| **Windsurf** | [OpenVSX](https://open-vsx.org/extension/parksubeom/claude-skills-panel) |
| **VS Codium** | [OpenVSX](https://open-vsx.org/extension/parksubeom/claude-skills-panel) |

> 또는 Extensions 탭(`Cmd+Shift+X`)에서 `Claude Code Skills Panel` 검색 후 **Install** — 4개 IDE 모두 가능.

---

## 더 자세한 기능 / 변경 이력

전체 기능 표, 클래스별 액션 ATLAS, 키보드 단축키, 개발 가이드는 [영문 README](README.md)에. 변경 이력은 [CHANGELOG](CHANGELOG.md)에.

---

## 별 / 이슈 / 기여

- ⭐ [GitHub에 별 주기](https://github.com/parksubeom/claude-skills-panel) — Claude Code 사용자에게 도움
- 🐛 [이슈 / 기능 요청](https://github.com/parksubeom/claude-skills-panel/issues)
- 🔧 [기여 가이드](CONTRIBUTING.md)

## License

MIT © [parksubeom](https://github.com/parksubeom)
