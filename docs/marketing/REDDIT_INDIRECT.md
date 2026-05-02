# Reddit 게시 카피 — 복사 즉시 게시 가능

토론 톤. 본문은 mod-friendly, 첫 댓글에 설치 정보.

---

# 🇺🇸 r/ClaudeAI (영문)

## 제목
```
Anyone else lose track of their Claude Code slash commands? Here's what finally clicked for me
```

## 본문

```markdown
Quick story / honest discussion question, not a sales pitch.

I've been using Claude Code as my daily driver for a couple months,
and at some point I crossed a threshold I didn't expect: I had so
many slash commands installed (mix of `superpowers`, `code-review`,
my own custom `~/.claude/commands/`) that I genuinely couldn't
remember what was available.

Symptoms I noticed in myself:

- Typing `/comm-` and getting ambushed by 4 things I'd never used
- Reinventing a workflow with raw prompts because I forgot I had a
  command for exactly that
- Installing a plugin, trying it once, and never finding it again

So I sat down to figure out *how* I'm using these things, and a few
patterns surprised me:

**1. Most of my usage is concentrated in ~6 commands.** Pareto holds.
The other 40 are situational — I want them findable, not memorable.

**2. The commands cluster by category cleanly.** Code-writing,
review, debugging, docs, git, data analysis, etc. Once I labeled them,
my mental model got a lot clearer about which to reach for.

**3. Claude Code has no GUI for `/plugin install` discovery.** The
official marketplace has 240+ plugins. There's no way to browse them
in any interface — you have to know the name.

What I ended up doing was building a small VS Code panel **with
Claude Code itself**. It auto-finds every slash command on my
machine, lets me click to fire any of them, and binds my top 6 to
keys 1-6. The plugin marketplace became a searchable modal because
I needed it for myself. Free, MIT, no telemetry by default.

How Claude Code actually helped me ship it in about a week:

- The `full-flow` plugin's brainstorm → plan → execute → verify
  cycle ran every feature. I'd describe a problem, Claude would
  produce a plan I could review, then implement it under my
  supervision. Iterating on the buddy class-branching logic took
  maybe 20 minutes start to finish that way.
- I leaned on `code-review` heavily because I'm a one-person team —
  it caught a `replace_all` bug where the same string appeared
  twice with different indentation and only one got swapped, and a
  variable-shadowing bug where my `t()` i18n helper got hidden by a
  loop variable also named `t`.
- The whole i18n system (en/ko/ja/zh, ~210 keys per locale) was
  Claude-translated initially, then I spot-checked.

(Side-project gravity hit somewhere along the way and the buddy
character now branches into one of 10 RPG classes based on which
category you use most — Codey if you're code-heavy, Gitto if it's
mostly `/git-*`, etc. Yes I know. It's all toggle-off-able.)

![the buddy lineup that ended up shipping](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/buddy-lineup.png)

The actually interesting question I keep coming back to:

**What are your top 3 most-used Claude Code slash commands?**

I'm curious if my Pareto distribution is universal or specific to
my workflow. The class-matching regex in my panel is currently
biased toward what *I* use, and your top 3 would probably teach me
categories I'm missing.
```

## OP 첫 댓글 (게시 후 5분 안에)

```markdown
A few things I didn't want to clutter the post with —

**Implementation notes**:
- The plugin marketplace browser pulls directly from
  `~/.claude/plugins/marketplaces/<name>/.claude-plugin/marketplace.json`
  + joins with `installed_plugins.json` to compute install state.
  Works for any marketplace you've added via `/plugin marketplace add`.
- Categorization is regex over the slash-command name — `/git-*`
  hits one bucket, `/code-review` hits the review bucket before code
  (rule order matters). Tie-breaker is alphabetical.

**If anyone wants to try it** (free, MIT, no telemetry by default):
- VS Code: search **"Claude Code Skills Panel"** in extensions, or
  marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel
- Cursor / Windsurf / Codium:
  open-vsx.org/extension/parksubeom/claude-skills-panel
- Source / issues: github.com/parksubeom/claude-skills-panel

Genuinely curious what your top 3 are — drop them below if you've
got a minute.
```

---

# 🇰🇷 OKKY / GeekNews / r/Korea_dev (한국어)

## 제목
```
Claude Code 쓰다가 슬래시 커맨드 50개 넘어가고 난 뒤 깨달은 것들
```

## 본문

```markdown
짧은 경험담 + 토론 질문입니다. 광고 글 아닙니다.

Claude Code 메인으로 쓴 지 한두 달, 어느 순간부터 슬래시 커맨드가
너무 많아져서 못 외우는 지경이 됐습니다. superpowers + code-review +
직접 만든 ~/.claude/commands/ 합치면 ~50개.

저한테서 발견한 증상들:

- `/comm-` 까지 치면 자동완성에 안 쓰던 4-5개가 ambush
- 직접 프롬프트 다시 만들어 쓰고 있었는데 알고 보니 같은 일 하는
  커맨드를 이미 설치해뒀음
- 플러그인을 한 번 써보고 그대로 잊고 사라지는 일이 반복

그래서 "내가 이걸 어떻게 쓰고 있나" 정리해보니 몇 가지 패턴이
보였습니다:

**1. 사용량의 80%가 6개 안에 집중됨.** 파레토가 맞더군요. 나머지
40개는 외울 필요는 없고, 찾을 수 있기만 하면 됨.

**2. 카테고리로 깔끔하게 묶임.** 코드 작성, 리뷰, 디버깅, 문서,
git, 데이터 등. 라벨 붙이고 나니 어떤 걸 써야 할지 머릿속이 정리됨.

**3. Claude Code에 `/plugin install` 검색 GUI가 없음.** 공식 마켓에
240개+ 플러그인 있는데 이름을 알아야만 설치 가능. 정작 가장 큰
디스커버리 문제.

결국 제가 한 건 **Claude Code로 직접** VS Code/Cursor 패널을 만든
겁니다. 머신에 있는 모든 슬래시 커맨드를 자동으로 찾아 클릭으로
실행, 자주 쓰는 6개를 키 1-6에 매핑, 마켓플레이스도 모달로 검색·설치.
제가 매일 쓰려고 만든 거라 진지하게 정리됐고요. **무료·MIT·기본
텔레메트리 OFF**.

Claude Code가 1주일 만에 V1 출시까지 어떻게 도왔는지:

- `full-flow` 스킬의 브레인스토밍 → 플랜 → 실행 → 검증 사이클을
  매 기능마다 사용. 문제를 설명하면 Claude가 플랜을 만들고, 제가
  검토 후 구현 진행. 버디 클래스 분기 로직 같은 건 20분 만에 끝.
- 1인 프로젝트라 `code-review` 스킬에 많이 의존. `replace_all`로
  같은 문자열을 일괄 치환했는데 들여쓰기 다른 한쪽이 안 바뀐 버그,
  그리고 i18n 헬퍼 `t()`가 loop 변수 `t`에 가려진 shadowing 버그
  잡아준 게 컸습니다.
- i18n 전체 (en/ko/ja/zh, locale당 ~210 키)도 Claude로 초벌 번역
  후 spot-check.

(사이드 프로젝트 답게 어쩌다 도트 게임이 됐습니다. 버디 캐릭터가
사용 패턴에 따라 10개 RPG 클래스 중 하나로 분기. `/git-*` 많이 쓰면
Gitto 닌자, `/code-review` 많이 쓰면 Testra 팔라딘. 다 토글로 끌 수
있어요.)

![어쩌다 만들어진 버디 라인업](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/buddy-lineup.png)

진짜 궁금한 질문:

**여러분이 가장 많이 쓰는 슬래시 커맨드 3개는 뭔가요?**

제 파레토가 일반적인지 제 워크플로 한정인지 궁금합니다. 제 패널의
카테고리 매칭 regex가 지금은 제 사용 패턴에 편향되어 있어서, 다른
분들 top 3가 카테고리 추가 힌트가 될 것 같아요.
```

## OP 첫 댓글 (게시 후 5분 안에)

```markdown
본문엔 안 넣은 디테일 몇 가지 —

**구현 노트**:
- 플러그인 마켓플레이스 브라우저는 ~/.claude/plugins/marketplaces/...
  의 marketplace.json을 직접 파싱해서 installed_plugins.json과 join
  으로 설치 상태 계산. 추가한 모든 마켓플레이스에서 동작.
- 클래스 매칭은 슬래시 커맨드명 regex — /git-* 한 그룹, /code-review
  는 code 보다 review가 먼저 매치되어 팔라딘으로 (룰 순서). 동률은
  알파벳.

**혹시 써보실 분** (무료·MIT·기본 텔레메트리 OFF):
- VS Code: 익스텐션에서 **"Claude Code Skills Panel"** 검색,
  또는 marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel
- Cursor / Windsurf:
  open-vsx.org/extension/parksubeom/claude-skills-panel
- 소스 / 이슈: github.com/parksubeom/claude-skills-panel

여러분의 top 3 슬래시 커맨드 진짜 궁금합니다 — 1분 시간 되시면 댓글 부탁!
```

---

# 🇺🇸 r/vscode

## 제목
```
[VS Code workflow] How I stopped losing track of 50+ Claude Code slash commands
```

## 본문 (첫 단락만 교체, 나머지는 r/ClaudeAI 본문 그대로)

```markdown
For VS Code users who use Claude Code (Anthropic's AI coding CLI)
as their daily driver: anyone else hit the wall where you have so
many `/command` and `/skill` files that you can't remember what's
installed?
```

OP 첫 댓글은 r/ClaudeAI 동일.

---

# 🇺🇸 r/cursor

## 제목
```
Cursor + Claude Code: anyone else losing track of their slash commands?
```

## 본문 (첫 단락만 교체)

```markdown
Cursor users running Claude Code as the AI assistant — anyone else
hit the wall where you have so many `/command` and `/skill` files
that you can't remember what's installed? Here's what finally
clicked for me.
```

OP 첫 댓글은 r/ClaudeAI 동일.

---

# 게시 시간

| 채널 | 추천 시간 |
|---|---|
| r/ClaudeAI / r/vscode / r/cursor | 화·수·목 미국 ET 09:00–11:00 (한국 22:00–24:00 KST) |
| OKKY / GeekNews | 한국 평일 오전 9–11시 또는 저녁 8–11시 |

# 게시 후 30분

- OP 첫 댓글 즉시 (5분 안에)
- 댓글 받으면 30분 안에 응답 (알고리즘 가속)
- "top 3" 답변이 모이면 다음 페이즈에 카테고리 매칭 regex 개선에 활용

# r/ClaudeAI Rule 7 체크리스트

이 sub는 자기 프로젝트 게시에 대해 Rule 7로 명시적 요건이 있습니다. 본문이 모두 충족하는지 게시 전 확인:

- [x] **Built with Claude Code BY YOU** — 본문에 "with Claude Code itself" 명시
- [x] **What was built / how Claude helped / what it does** — full-flow, code-review 스킬 사용 디테일
- [x] **Free to try and say so** — 본문에 "Free, MIT" 명시
- [x] **Promotional language minimal** — 토론 톤 유지
- [x] **No referral links** — 직접 GitHub/Marketplace URL만
- [x] **No job seeking**
- [ ] **OP karma > 50** — 계정 karma 50 미만이면 자동 필터. 다른 글에 댓글 답변으로 karma 빌드 후 게시.

# 게시가 또 제거되면 modmail

```
Hi mods,

My post titled "[제목]" was removed. I went back through Rule 7 and
believe I covered the requirements:

- The project was built BY ME with Claude Code (mentioned in the body)
- I described what Claude actually did to help (full-flow plugin
  cycle, code-review for bug catches, i18n translation)
- The project is free + open source (MIT) and the body says so
- Promotional language is minimal — most of the body is workflow
  discussion and a question to the community
- The link is direct (no referral)

If there's still a rule I missed or a framing issue, I'd really
appreciate the specific feedback so I can fix it. Thanks for the
moderation work!
```
