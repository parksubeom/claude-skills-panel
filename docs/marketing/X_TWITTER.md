# X (Twitter) 게시 카피

## 게시 전략

- **첫 게시**: hero GIF + 1 트윗으로 시작. 반응 보고 thread 풀기.
- **시간**: 미국 기준 화·수 09:00–11:00 ET (한국 23:00–01:00 KST). 개발자 타임라인 활성.
- **해시태그**: `#ClaudeCode #VSCode #BuildInPublic` (3개 이내)
- **태그**: `@AnthropicAI` (Claude 팀이 종종 커뮤니티 툴 RT)

---

## V0 — 단발 트윗 (영어, 가장 가벼운 시작)

```
Built a VS Code panel that finds every Claude Code slash command on
your machine — your custom skills, project commands, and every plugin
you install via /plugin install — and lets you fire them with one
click. Or one keystroke.

Pixel-art game vibes optional but fun.

[demo.gif]

#ClaudeCode #VSCode
```

**문자수**: ~250 (280 한도 OK)

---

## V0 — 단발 트윗 (한국어)

```
Claude Code 슬래시 커맨드 매번 외워서 타이핑하기 귀찮아서 만든 패널.
~/.claude/commands, 프로젝트 커맨드, /plugin install 한 모든 플러그인까지
자동으로 다 찾아서 한 클릭으로 실행됨. 1-6 키 단축키도.

도트 게임 분위기는 옵션이지만 보너스.

[demo.gif]

OpenVSX & VS Marketplace에 무료 배포됨.
```

---

## V1 — Thread (영어, 7 트윗)

### 1/7 (hook + GIF)
```
I kept forgetting which Claude Code slash commands I had, so I built a
VS Code panel that auto-finds them all and lets me fire any of them
with one click.

Free, open source, and somehow turned into a tiny pixel-art game.

[demo.gif]

🧵
```

### 2/7 (the problem)
```
The pain: you install superpowers, code-review, skill-creator, plus
your own ~/.claude/commands/ folder, and now you have ~50+ slash
commands. Half the time I'd forget the exact name and end up retyping.

#ClaudeCode
```

### 3/7 (auto-discovery)
```
The panel walks every source on your machine:
• ~/.claude/skills/ + commands/
• <project>/.claude/skills/ + commands/
• ~/.claude/plugins/cache/* (every installed plugin)

No setup. Open the panel and they're all there, grouped by source.

[hero.png]
```

### 4/7 (one-click execution)
```
Click a card → command goes to clipboard.
Or auto-paste + Enter.
Or send straight to your terminal.

Plus a Quick Bar with keys 1–6 for the ones you fire all day.

[quickbar-keys.png]
```

### 5/7 (plugin browser)
```
Even nicer: a built-in plugin browser shows everything in
claude-plugins-official (243 plugins) plus any community marketplace
you've added. Search, filter, one-click install.

It's basically the Marketplace UI Claude Code never had.

[marketplace-browser.png]
```

### 6/7 (gamification, optional)
```
And because side projects gonna side project: the panel is a tiny
8-bit game.

• Skills level up (LV.0 → LV.5)
• A pixel buddy evolves through 6 stages
• 16 achievements
• 3 themes: Dark / Retro CRT / Gameboy LCD

All toggle-off-able if you want a clean panel.

[pixel-themes.png]
```

### 7/7 (install)
```
parksubeom.claude-skills-panel
• VS Code: https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel
• Cursor / Codium / Windsurf (OpenVSX): https://open-vsx.org/extension/parksubeom/claude-skills-panel
• Source: https://github.com/parksubeom/claude-skills-panel

Made with Claude Code, naturally. Feedback welcome 🙏
```

---

## V1 — Thread (한국어, 6 트윗)

### 1/6
```
Claude Code 슬래시 커맨드 매번 외워서 타이핑하기 귀찮아서, 머신에 있는
모든 /command·/skill·플러그인을 자동으로 찾아 한 클릭으로 실행하는
VS Code 패널 만들었습니다. 무료·오픈소스.

만들다 보니 도트 게임이 됐네요.

[demo.gif]

🧵
```

### 2/6
```
문제: superpowers·code-review·skill-creator + 내가 만든 commands/까지
하면 슬래시 커맨드가 50개+. 절반은 이름이 헷갈려서 재타이핑.

해결: 패널이 모든 소스를 자동으로 스캔해서 카드 그리드로 표시.

[hero.png]
```

### 3/6
```
실행 모드 3가지:
• Paste — 클립보드 복사만
• Auto — 자동 붙여넣기 + Enter
• Term — 터미널에 직접 전송

Quick Bar에 1-6 키로 자주 쓰는 거 등록하면 어디서든 단축키 한 번.

[quickbar-keys.png]
```

### 4/6
```
🛒 Plugin Browser — claude-plugins-official 243개 + 추가한 마켓플레이스
모두 한 모달에서 검색·카테고리 필터·한 클릭 설치.

Claude Code의 Marketplace UI가 이렇게 생겨야 했음.

[marketplace-browser.png]
```

### 5/6
```
사이드 프로젝트답게 도트 게이미피케이션:
• 스킬 레벨업 (LV.0~5)
• 진화하는 픽셀 버디 (6단계)
• 16개 업적
• 테마 3개: Dark / Retro CRT / Gameboy LCD

다 토글해서 끌 수 있음 — 싫으면 평범한 패널.

[pixel-themes.png]
```

### 6/6
```
parksubeom.claude-skills-panel
• VS Code: https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel
• Cursor: https://open-vsx.org/extension/parksubeom/claude-skills-panel
• Source: https://github.com/parksubeom/claude-skills-panel

당연히 Claude Code로 만들었습니다. 피드백 환영 🙏
```

---

## 후속 — 1주 후 콘텐츠 아이디어

- **"How I built a feature in 30 minutes with Claude Code"** — 풀플로우 스킬 활용 사례
- **"3 themes I shipped in one afternoon"** — Dark/Retro/LCD 비교 GIF
- **"My weekly report from the Skills Panel"** — 자기 사용 통계 markdown export 인용
- **"243 Claude Code plugins, browseable"** — Plugin Browser 단독 어필
- **사용자 사례** — DM/이슈로 들어온 실제 사용 사례 RT

---

## 응답 템플릿 (예상 질문)

> "Cursor에서도 되나요?"
- "네 — Cursor·Windsurf·Codium 모두 OpenVSX에서 동일하게 설치됩니다."

> "오픈소스인가요? 라이선스?"
- "네, MIT. github.com/parksubeom/claude-skills-panel"

> "다른 IDE 지원?"
- "현재는 VS Code 호환 IDE (Cursor·Windsurf·Codium 포함). JetBrains는 백로그입니다."

> "데이터 수집?"
- "기본 OFF. 첫 실행 시 익명 카운터 opt-in을 한 번 묻고, 거부하면 그걸로 끝. 스킬 이름 같은 건 절대 안 보냅니다."

> "왜 게임처럼 만들었나?"
- "본 기능 (스킬 트리거)은 카드 클릭이 끝이라 너무 단순해서, 재미 요소가 자연스럽게 늘어났습니다. 다 토글로 끌 수 있어요."

> "Claude Code 안 쓰면?"
- "이 패널은 Claude Code 사용자가 대상이라 다른 환경에선 의미 없습니다. /plugin·/command 시스템에 의존."
