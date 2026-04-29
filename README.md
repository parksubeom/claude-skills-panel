# Claude Code Skills Panel

[![Version](https://img.shields.io/badge/version-0.20.0-f59e0b?style=flat-square)](https://open-vsx.org/extension/parksubeom/claude-skills-panel)
[![OpenVSX](https://img.shields.io/badge/OpenVSX-Install-7dd3fc?style=flat-square&logo=vscodium)](https://open-vsx.org/extension/parksubeom/claude-skills-panel)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)

> 스킬 외우기 귀찮아서 GUI로 만들었는데 게임이 됐음.

**Claude Code** 의 모든 스킬·명령어를 픽셀 아트 패널에서 탐색하고, 클릭 한 번으로 즉시 실행 — 육성형 미니 게임 포함.

---

## 미리보기

### 액티비티바 사이드 패널
![Panel Main](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/panel-main.png)

### 하단 패널 (넓은 화면)
![Panel Wide](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/panel-wide.png)

---

## 📥 설치

**Cursor / VSCode**

> Extensions 탭(`Cmd+Shift+X`)에서 `Claude Code Skills Panel` 검색 → **Install**

또는 [OpenVSX 마켓플레이스](https://open-vsx.org/extension/parksubeom/claude-skills-panel)에서 직접 설치.

---

## ✨ 기능

### 🔍 스킬 자동 탐색
- `~/.claude/skills/` — 사용자 커스텀 스킬
- `<project>/.claude/skills/` — 프로젝트 스킬
- `~/.claude/plugins/cache/**` — superpowers 등 **모든 설치된 플러그인** 자동 스캔  
  (SKILL.md + commands/*.md 포함)

### 🎮 인터랙션

| 동작 | 결과 |
|---|---|
| 카드 클릭 | `/skill` 복사 (또는 자동 실행) |
| 카드 우클릭 | SKILL.md 파일 열기 |
| Quick Bar 드래그 | 슬롯에 등록 (키보드 1~6 즉시 트리거) |
| ✎ hover | 별칭·아이콘·메모 편집 |
| 몬스터 클릭 | 캐릭터 시트 확인 |

### ⚡ Quick Bar — 진화 단계별 해금

자주 쓰는 스킬 6개를 드래그로 등록, 키보드 숫자로 즉시 트리거.  
캐릭터가 진화할수록 슬롯이 하나씩 열립니다 (처음엔 슬롯 1개).

```json
// keybindings.json — 패널 밖에서도 즉시 실행
{ "key": "cmd+shift+1", "command": "claudeSkills.quickSlot1" }
```

### 🚀 실행 모드 (`▶` 버튼으로 전환)

| 모드 | 동작 |
|---|---|
| **▶ Paste** | 클립보드에 복사만 (기본) |
| **▶ Auto** | 포커스 + 자동 붙여넣기 + Enter 전송 (mac/win/linux) |
| **▶ Term** | 활성 터미널에 즉시 송신 |

### ✏️ 커스터마이징

- **별칭(Alias)** — 짧은 이름으로 변경
- **메모** — hover 팝오버에 표시
- **커스텀 아이콘** — 내 이미지 업로드 (PNG/SVG/JPG/GIF)
- **스킬 숨김** — 잘 안 쓰는 스킬 정리

모든 설정은 `~/.claude/skills-panel-config.json` 한 파일 저장 — dotfiles/git 동기화 가능.

---

### 🐾 Claude Buddy 육성

스킬을 사용할수록 같이 성장하는 픽셀 아트 친구.  
패널 안에서 자유롭게 돌아다니다가, 스킬 클릭 시 해당 카드 옆으로 달려옵니다.

| 단계 | 조건 | 이름 |
|---|---|---|
| 0 | 0 액션 | 🥚 Egg |
| 1 | 10+ | 🟢 Hatchling |
| 2 | 30+ | 🐱 Kitten |
| 3 | 100+ | 🐈 Cat |
| 4 | 300+ | 🐒 Monkey |
| 5 | 1000+ | 🐲 Dragon |

**스탯**: 🧠 INT (사고형 스킬) · ⚡ DEX (Quick Bar) · ❤️ VIT (스트릭) · 🍀 LCK (업적)

---

### 🏆 메타게임

- **16개 업적** — 사용량 / 다양성 / 스트릭 / 마스터리 / 커스텀
- **위클리 리포트** (`📊`) — 7일 활동 그래프 + TOP 5 스킬
- **마스터리 ★** — 스킬별 LV.1~5, 레벨업 시 사운드 + 연출
- **데일리 스트릭** 🔥 N일

---

### 🎨 도트 게임 UI

- **픽셀 폰트**: DotGothic16 (한글) + Press Start 2P (영문)
- **30개 spark 스타일 아이콘** — 통일된 다크 프레임, 스킬별 전용 컬러
- **CRT 효과** — scanlines / vignette (토글 가능)
- **8-bit 사운드** — hover/click/levelup (토글 가능)
- **애니메이션** — chamfer 모서리, sparkle hover, shake 클릭

---

## ⌨ 키바인딩 (선택)

`Cmd+Shift+P` → `Preferences: Open Keyboard Shortcuts (JSON)`:

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

## 🛠 개발

```bash
git clone https://github.com/parksubeom/claude-skills-panel
cd claude-skills-panel
npm install

npm run build:pixels   # 픽셀 아이콘 빌드
npm run build:spark    # spark 스타일 30개 스킬 아이콘
npm run build:buddy    # 버디 캐릭터 6단계
npm run package        # 위 3개 빌드 + .vsix 패키징

# 배포
npx ovsx publish -p <token>   # OpenVSX (Cursor)
npx vsce publish              # VSCode Marketplace
```

---

## 📝 라이선스

MIT © [parksubeom](https://github.com/parksubeom)
