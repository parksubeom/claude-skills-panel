# Product Hunt 등록 자료

## 게시 시점

- **요일**: 화·수·목 → 트래픽 가장 높음
- **시간**: 새벽 12:01 PT (한국 17:01 KST) 등록 → 24시간 vote window 시작
- **준비**: hunter (다른 PH 사용자)에게 등록 부탁할 수 있음. 자체 등록도 OK.

---

## Tagline (최종 1개 + 후보)

**최종**:
```
The fastest way to use Claude Code slash commands
```
(60자 이내, PH 한도 60)

**후보**:
- `Auto-discover every Claude Code slash command. One click to run.`
- `Pixel-art panel for Claude Code — find and fire any /command in 1 click`
- `One panel for all your Claude Code skills, commands, and plugins`
- `Type slash commands? Stop. Click them instead.` (위트 톤)

---

## Description (260자 이내)

```
A VS Code / Cursor panel that auto-discovers every Claude Code slash
command on your machine — your custom skills, project commands, and
all installed plugins (superpowers, code-review, …). One click to
copy, auto-paste, or run in terminal. Quick Bar with keys 1–6.
Built-in plugin browser. Optional pixel-art gamification.
```

(258자 — 한도에 맞춤)

---

## Description (Long form, PH 본문)

```markdown
**The problem**: Once you install superpowers + code-review + your own
~/.claude/commands/, you've got 50+ slash commands and you keep
forgetting their exact names.

**What this is**: A VS Code / Cursor panel that scans every Claude
Code slash command source on your machine and lays them out as a
clickable, searchable, fuzzy-matched grid.

## What's inside

🔍 **Auto-discovery** — `~/.claude/skills`, `~/.claude/commands`,
project-level `.claude/`, every installed plugin

⚡ **Three execution modes** — copy to clipboard, auto-paste & send,
or send straight to your active terminal

🔢 **Quick Bar** — bind your top 6 commands to keys 1–6, fire from
anywhere with global keybindings

🛒 **Plugin Marketplace browser** — search ~243 plugins from
claude-plugins-official + any community marketplace, install with
one click

🎨 **Three pixel themes** — Dark, Retro CRT, Gameboy LCD

🌐 **Multilingual** — English / 한국어 / 日本語

🏆 **Optional gamification** — skills level up (LV.0 → LV.5), 16
achievements, a pixel buddy that evolves through 6 stages, weekly
report exportable as Markdown. All toggle-off-able.

## Free + Open Source

- VS Code: [marketplace link]
- Cursor / Windsurf / Codium (OpenVSX): [openvsx link]
- Source: github.com/parksubeom/claude-skills-panel (MIT)

Built (mostly) with Claude Code itself.
```

---

## Topics (최대 4)

```
1. Developer Tools
2. Productivity
3. Artificial Intelligence
4. Open Source
```

---

## Maker comment (등록 직후 첫 코멘트)

```
Hey PH 👋

I built this because I was constantly retyping /full-flow,
/commit-prepare, /code-review… and forgetting half my own custom
commands. The panel auto-finds them all, lets you fire any with one
click, and as a side-project bonus, turned into a tiny 8-bit game.

Some honest context:

→ It's specifically for Claude Code users. If you're not using Claude
   Code, this doesn't apply to you.
→ The gamification (achievements, evolving buddy, themes) is opt-out
   from a single toggle — clean professional panel is one click away.
→ No telemetry by default. First run asks once for anonymous feature
   counters (no command names, no content); say no and that's it.

Happy to answer questions, take feature requests, or just hear about
your favorite Claude Code workflow. Voice memo'd here at 1am — be kind 🙏
```

---

## Q&A 대비 (자주 받는 질문 30개)

### 제품 / Scope

1. **Q: VSCode 외 다른 IDE에서도?**
   A: VS Code 호환 IDE — Cursor, Windsurf, Codium 모두 OpenVSX에서 동일하게 동작. JetBrains는 백로그.

2. **Q: 가격?**
   A: 100% 무료, MIT 라이선스. 결제·subscription 없음.

3. **Q: 오픈소스?**
   A: 네 — github.com/parksubeom/claude-skills-panel.

4. **Q: 백엔드 / 서버 의존?**
   A: 전혀 없음. 모든 동작이 로컬. 익명 telemetry도 opt-in.

5. **Q: 데이터 어디 저장?**
   A: `~/.claude/skills-panel-config.json`. 직접 편집 가능, dotfiles로 동기화 권장.

6. **Q: Claude API 호출하나요?**
   A: 안 함. 그냥 슬래시 커맨드를 클립보드로 보내거나 터미널에 입력하는 UI 레이어.

### 기능

7. **Q: 어떤 슬래시 커맨드를 찾아주나?**
   A: `~/.claude/skills/SKILL.md`, `~/.claude/commands/*.md`, project-level 같은 경로, 그리고 `/plugin install`로 설치한 모든 플러그인의 commands/skills.

8. **Q: 커스텀 커맨드는 어떻게 만들지?**
   A: `~/.claude/commands/my-name.md` 같은 파일 만들고 frontmatter에 `name`/`description` 적으면 자동으로 패널에 뜸.

9. **Q: 플러그인 설치도 패널에서?**
   A: 네 — 🛒 버튼 → 카탈로그 → Install. 슬래시 커맨드를 클립보드에 넣어주는 방식 (Claude Code에 붙여넣기만 하면 됨).

10. **Q: Quick Bar 단축키?**
    A: 1-6 키 (입력창에 포커스 없을 때). `Cmd+Shift+1~6`도 keybindings.json에서 바인딩 가능.

11. **Q: 검색 어떻게 동작?**
    A: Fuzzy 매칭 + alias 가중치 + 결과 정렬. `↓/↑/Enter`로 키보드 네비. 검색바에 `/foo` 입력하면 raw 슬래시 트리거.

12. **Q: 다국어?**
    A: en/ko/ja 지원. VS Code 시스템 언어 자동 감지, 푸터에서 토글.

### 게이미피케이션

13. **Q: 게임 같은 거 싫은데?**
    A: 사운드/CRT 효과/캐릭터 시트 모두 토글로 끔. 평범한 패널 한 번에 가능.

14. **Q: 진화하는 버디는 뭐?**
    A: Egg → Slime → Bunny → Cat → Fox → Dragon. 슬래시 커맨드 사용 누적으로 진화. 통계는 INT/DEX/VIT/LCK.

15. **Q: 업적은 뭐 하는 거?**
    A: 16개 — 첫 사용, 10/100/1000회 누적, 5/15종 다양성, 3/7/30일 streak, 한 스킬 LV.5, Quick Bar 6칸 채움, 5개 alias 등.

16. **Q: 위클리 리포트?**
    A: 📊 버튼 → 7일 사용 차트 + TOP 5 + 마크다운 export.

### 보안 / Privacy

17. **Q: 데이터 수집?**
    A: 기본 OFF. 첫 실행 banner에서 익명 카운터 opt-in 한 번 묻고, 거부하면 그걸로 끝.

18. **Q: 슬래시 커맨드 이름·내용 외부 전송?**
    A: 절대 없음. 카운터만 — "Quick Bar 클릭 N번", "검색 N번" 같은 익명 카운트.

19. **Q: 로컬 파일 외 접근?**
    A: 없음. `~/.claude/`, 워크스페이스의 `.claude/` 만 읽음.

20. **Q: Telemetry backend?**
    A: 현재는 consent UI만 있고, 실제 dispatch는 미구현. 활성화 전 별도 PR로 투명하게.

### 기술

21. **Q: 스택?**
    A: VS Code Webview + bare HTML/JS. 외부 라이브러리 거의 없음 (i18n 자체 구현, 50줄).

22. **Q: 번들 크기?**
    A: 117KB (.vsix). 100% 로컬 코드, no node_modules dependency at runtime.

23. **Q: 성능?**
    A: 패널 mount 후 ~50ms 내 모든 카드 렌더. 마운트 시 한 번 파일 시스템 walk.

24. **Q: 자체 호스트?**
    A: 백엔드가 없으니 그냥 사용. fork해서 변경하고 vsix package해서 사이드로드 가능.

### 미래

25. **Q: 로드맵?**
    A: 지금 백로그: 다른 마켓플레이스 탐색·검색, 사용자 디자인 픽셀 캐릭터, telemetry backend, JetBrains 포팅 검토.

26. **Q: 기여?**
    A: PR 환영. CONTRIBUTING.md는 백로그.

27. **Q: AI 코드 도구 다른 거 (Cursor Rules, Copilot 등) 지원?**
    A: 현재는 Claude Code 전용. 일반화는 큰 작업이라 백로그.

28. **Q: 영감?**
    A: VS Code의 Command Palette + 모바일 게임 UI. 픽셀 분위기는 사이드 프로젝트의 자연스러운 흐름.

29. **Q: 제작 기간?**
    A: 약 1주, Claude Code의 풀플로우 스킬로 진행. 빌드 과정도 docs에 기록함.

30. **Q: 이거 이름이 왜 이렇게 직역?**
    A: "Claude Code Skills Panel" — 정확히 말 그대로의 것. 마케팅용 이름이 더 매력적이지만, 검색 의도와 일치하는 게 더 중요.

---

## 게시 직후 1시간 체크리스트

- [ ] 자기 트위터에 PH 링크 첫 트윗
- [ ] r/ClaudeAI에 작은 알림 ("Posted on PH today" 형식 — 직접 vote 부탁 절대 X)
- [ ] 디스코드 (Anthropic Community) 일반 채널에 한 줄
- [ ] 이메일 가입자 (있다면) 알림
- [ ] PH 댓글 매 30분 체크 (첫 1-2시간이 알고리즘에 가장 중요)

## 하지 말 것

- "Vote please" 다이렉트 메시지 (PH 정책 위반, 등록 취소 위험)
- 같은 작업물 1년 안에 재등록 (PH는 same-product re-launch 허용 안 함)
- 로봇처럼 모든 댓글에 같은 답변 — 사람처럼.
