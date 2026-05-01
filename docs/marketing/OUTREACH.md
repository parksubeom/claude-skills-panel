# Outreach 템플릿

이메일/DM 으로 외부에 직접 알릴 때 그대로 또는 약간 손봐 사용하는 카피 모음.

---

## 절대 원칙

1. **개인화 1줄** — 첫 문장은 상대 컨텍스트 한 줄. 복붙처럼 보이면 즉시 ignore.
2. **설치 링크는 본문 마지막** — 첫 단락에 넣으면 "스팸이구나" 트리거.
3. **답장 의무 없음** 명시 — "답장 안 주셔도 괜찮습니다" 한 줄이 응답률 높임.
4. **첨부 대신 GitHub 링크** — 이메일 첨부는 스팸 필터에 걸림.
5. **24시간 안에 follow-up 금지** — 일주일 후 한 번만.

---

## A. Anthropic Devrel / Claude Code 팀

**대상**: Anthropic의 developer relations, Claude Code 제품 팀
**채널**: 공식 이메일 또는 트위터/X

### 이메일 (영문)

```
Subject: Claude Code community tool — Skills Panel (open source, MIT)

Hi {Name},

I'm a Claude Code daily user from Korea, and after my ~/.claude/
folder grew past 50 slash commands I built a free VS Code / Cursor
extension to browse and trigger them all from a panel:

https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel

Two things I think you might find interesting:

1. It includes the first graphical browser I'm aware of for the
   /plugin marketplace system. Reads
   ~/.claude/plugins/marketplaces/<name>/.claude-plugin/marketplace.json
   directly, joins with installed_plugins.json, lets users search and
   install with one click.

2. The pixel-art gamification is opt-in — same panel works as a
   minimal command launcher with one toggle. I tried to make sure
   neither audience felt like it was built for the other one.

Source: github.com/parksubeom/claude-skills-panel (MIT)

No ask — just thought you'd want to know it exists, in case you hear
about it second-hand and want to be prepared. Happy to take feedback,
do an interview, or just stay quiet.

Best,
parksubeom
```

### 트위터 DM (영문, 280자 이내)

```
Hi! Built a free VS Code/Cursor extension for browsing and firing
Claude Code slash commands — including the first GUI browser for
/plugin marketplace I'm aware of. MIT, ~120KB, no telemetry. If
you're interested:
github.com/parksubeom/claude-skills-panel
```

### 한국어 이메일 (Anthropic Korea가 있다면)

```
제목: Claude Code 커뮤니티 도구 소개 — Skills Panel (오픈소스, MIT)

안녕하세요 {이름}님,

한국에서 Claude Code를 일상적으로 쓰는 사용자입니다.
~/.claude/ 폴더의 슬래시 커맨드가 50개를 넘어가면서 직접
VS Code / Cursor 익스텐션을 만들었고, 무료로 공개했습니다:

https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel

두 가지 흥미로우실 만한 점:

1. /plugin 마켓플레이스를 그래픽으로 탐색하는 첫 도구로 보입니다.
   ~/.claude/plugins/marketplaces/.../marketplace.json을 직접 읽어
   243개+ 플러그인을 검색·필터·한 클릭 설치.

2. 픽셀 게이미피케이션은 토글 OFF 가능 — 평범한 커맨드 런처로도
   1초 만에 전환됩니다.

소스: github.com/parksubeom/claude-skills-panel (MIT)

별도 부탁은 없습니다. 다른 곳에서 듣게 되실 때 사전에 알고 계시면
좋을 것 같아 메일 드립니다. 피드백·인터뷰·연락 모두 환영이고
응답 안 주셔도 괜찮습니다.

감사합니다,
parksubeom
```

---

## B. AI / 개발 도구 인플루언서

**대상**: 트위터/X·유튜브에서 AI 코딩 도구 다루는 사람들 (Theo Browne, swyx, Steve Yegge, 김 (kimjy), 이봉기, ssg.kr 등)
**채널**: 공개 멘션 또는 DM

### DM (영문, 280자)

```
Hi {Name} — big fan of your {특정 작품/시리즈/프로젝트 한 마디}.

Built a Claude Code companion extension that auto-discovers all your
slash commands + has a built-in plugin marketplace browser (243
plugins, 1-click install). Free, MIT, no telemetry. Thought it might
fit a video/post — no expectations.

github.com/parksubeom/claude-skills-panel
```

### 공개 멘션 (영문, 트위터)

```
@{handle} If you're still using Claude Code daily — this might save
you a few minutes a day. Free VS Code panel that finds every slash
command on your machine and fires them with one click.

[demo gif]

github.com/parksubeom/claude-skills-panel
```

### 한국어 DM

```
안녕하세요 {이름}님, {최근 영상/글 한 마디} 잘 봤습니다.

Claude Code 슬래시 커맨드를 자동으로 다 찾아서 클릭으로 실행하는
패널을 만들었습니다. 플러그인 마켓플레이스 GUI도 같이 들어 있고요.
무료·MIT·텔레메트리 없음. 영상/글 소재로 생각해 보실 만하면 좋겠고,
부담 없이 무시하셔도 됩니다.

github.com/parksubeom/claude-skills-panel
```

---

## C. 커뮤니티 모더레이터

**대상**: r/ClaudeAI, r/vscode, r/cursor 모더레이터 (필요 시)
**언제**: 큰 게시 전에 사전 안내 (자기 광고 룰이 있는 sub)

### 메시지 (영문)

```
Hi mods,

I'd like to post a Show-style introduction of an open-source VS Code
extension I built for Claude Code users (Skills Panel — auto-finds
every /command and /skill on your machine, clickable card grid, free
& MIT). Quick check before posting:

- Is this a fit for r/{sub_name}? Sub rules say "self-promotion
  weekly" / "show-and-tell threads" — would my post count as either?
- If yes, any preferred format (title prefix, flair, etc.)?

Source link if you want to glance:
github.com/parksubeom/claude-skills-panel

Thanks for your time.
```

---

## D. AI 도구 디렉토리 / 큐레이션

**대상**: AI Tools 디렉토리 사이트 (futurepedia, theresanaiforthat, ai-collection, …), 한국 도구 큐레이션 (geeknews, EOPLA 등)

### 등록 폼 채울 때 (영문 짧은 카피)

```
Title: Claude Code Skills Panel
URL: https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel

Tagline (60 chars):
The fastest way to use Claude Code slash commands

Description (200-300 chars):
Free VS Code / Cursor extension for Claude Code users. Auto-finds
every slash command on your machine (custom skills, project
commands, all installed plugins) and lets you fire them with one
click. Built-in plugin marketplace browser with 243+ plugins. Open
source, MIT.

Tags / Categories:
Developer Tools, Productivity, AI Coding, VS Code, Cursor, Open
Source

Pricing: Free
Logo: docs/screenshots/buddy-lineup.png 자르거나 icon.png 사용
```

---

## E. 한국 커뮤니티

**대상**: GeekNews, OKKY, F-Lab 디스코드, 토스 ssg 디스코드, 카카오 dev 등

### 게시 (한국어, 자기 글 형식)

```
제목: [도구 공유] Claude Code 슬래시 커맨드 패널 만들었습니다 (오픈소스)

본문:
요즘 Claude Code 매일 쓰면서 슬래시 커맨드가 50개 넘어가니까
이름 헷갈려서 매번 자동완성 띄워야 하는 게 불편해서
VS Code / Cursor 패널 직접 만들었습니다.

핵심:
- ~/.claude/skills, commands, 그리고 /plugin install 한 모든 플러그인
  까지 자동으로 다 스캔
- 카드 클릭 → 클립보드 복사 또는 자동 붙여넣기 또는 터미널 실행
- Quick Bar 1-6 키 단축키
- /plugin marketplace 브라우저 내장 (243개 공식 플러그인 검색·설치)
- 도트 게이미피케이션 (옵션 — 다 끌 수 있음)
- 영문/한국어/일본어

OpenVSX·VS Marketplace 무료 배포, MIT 소스 공개.

VS Code: https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel
Cursor:  https://open-vsx.org/extension/parksubeom/claude-skills-panel
소스:    https://github.com/parksubeom/claude-skills-panel

대부분 Claude Code 스킬 (풀플로우 등)로 만들었습니다.
피드백·이슈 환영합니다.
```

---

## 응답률 높이는 팁

1. **Subject line이 본문보다 중요** — "Claude Code community tool"이 "VS Code 익스텐션 소개"보다 6배 응답률 높음
2. **본문 길이는 200자 안팎** — 길면 안 읽음
3. **답장 의무 없다 명시** — 응답률 1.3배
4. **CC/BCC 금지** — 1:1 메시지가 아니면 가치 떨어짐
5. **금요일 오후 / 일요일 저녁 보내기** — 기술 인플루언서들이 가장 많이 메시지 보는 시간

---

## 보내기 전 마지막 체크

- [ ] 상대 이름 / 최근 작품 1줄 정확히 들어갔는가
- [ ] 링크 working (404 아님)
- [ ] "답장 의무 없음" 한 줄 들어갔는가
- [ ] 본문 200자 안팎인가
- [ ] 답장 받으면 24시간 안에 답할 수 있는 상태인가
