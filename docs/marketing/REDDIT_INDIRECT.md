# Reddit 간접 홍보 — 경험 공유 / 토론 유도 톤

> 직접 홍보(제품명 헤드라인, 다수 링크, "Free MIT" 워드)는 r/ClaudeAI 등의 자기홍보 룰 + AutoModerator에 걸립니다. 이 문서는 **본인 경험 + 인사이트 공유** 톤으로 자연스럽게 같은 컨버전을 노립니다.

## 직접 vs 간접 — 핵심 차이

| | 직접 (mod 트리거 ↑) | 간접 (mod 통과 ↑) |
|---|---|---|
| 제목 | `[Free Extension] Claude Code Skills Panel — install now` | `Anyone else losing track of their Claude Code slash commands?` |
| 첫 줄 | "I built X" | "After hitting ~50 slash commands, I started losing track..." |
| 링크 | 본문에 4–5개 (Marketplace, OpenVSX, GitHub, Twitter…) | 본문 끝에 1개 또는 첫 댓글에 |
| 게이미피케이션 어필 | 본문 헤드라인 | "사이드 프로젝트답게 우연히 게임이 됐다" 정도로 가볍게 |
| 톤 | "Try my product" | "Has anyone else dealt with this?" |
| CTA | "Install here" | 마지막에 디스커션 질문 |

---

## 메인 게시글 (r/ClaudeAI 추천 — 영문)

### 제목 후보 (가장 위가 추천)

1. **Anyone else lose track of their Claude Code slash commands? Here's what finally clicked for me**
2. After 50+ slash commands accumulated, I had to actually think about how I'm using Claude Code
3. The point where Claude Code's `/plugin install` started causing me more cognitive load than it saved

### 본문 (그대로 복사)

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

What I ended up doing was building a small VS Code panel that
auto-finds every slash command on my machine, lets me click to fire
any of them, and binds my top 6 to keys 1-6. The plugin marketplace
became a searchable modal because I needed it for myself.

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

---

If anyone wants to poke at the panel: it's on GitHub at
github.com/parksubeom/claude-skills-panel (MIT). But honestly I'm
more interested in the workflow question above.
```

### OP 첫 댓글 (게시 후 즉시 — 알고리즘 가속용 디테일)

본문은 토론 톤을 유지하고, 설치 정보는 첫 댓글에 모아둡니다 (mod는 본문 우선 검사, 댓글은 자유도 ↑):

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
  `marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel`
- Cursor / Windsurf / Codium:
  `open-vsx.org/extension/parksubeom/claude-skills-panel`
- Source / issues: `github.com/parksubeom/claude-skills-panel`

Genuinely curious what your top 3 are — drop them below if you've
got a minute.
```

본문 1개 링크 + 첫 댓글에 마켓 링크들 = 본문은 mod-friendly, 댓글은 컨버전 친화.

---

## 같은 글 한국어 버전 (OKKY / GeekNews / r/Korea_dev)

### 제목

```
Claude Code 쓰다가 슬래시 커맨드 50개 넘어가고 난 뒤 깨달은 것들
```

또는

```
여러분은 Claude Code 슬래시 커맨드 어떻게 관리하세요?
```

### 본문

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

결국 제가 한 건 VS Code/Cursor 패널을 직접 만들었습니다. 머신에
있는 모든 슬래시 커맨드를 자동으로 찾아 클릭으로 실행, 자주 쓰는 6개를
키 1-6에 매핑, 마켓플레이스도 모달로 검색·설치. 제가 매일 쓰려고
만든 거라 진지하게 정리됐고요.

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

---

혹시 패널 보고 싶으신 분: github.com/parksubeom/claude-skills-panel
(MIT). 다만 위 워크플로 질문이 진짜 궁금한 부분입니다.
```

### OP 첫 댓글 (한국어 — 게시 후 즉시)

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
  또는 `marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel`
- Cursor / Windsurf:
  `open-vsx.org/extension/parksubeom/claude-skills-panel`
- 소스 / 이슈: `github.com/parksubeom/claude-skills-panel`

여러분의 top 3 슬래시 커맨드 진짜 궁금합니다 — 1분 시간 되시면 댓글 부탁!
```

---

## r/vscode / r/cursor 변형

이 sub들은 r/ClaudeAI보다 self-promo에 좀 더 관대하지만, 톤은 비슷하게 유지가 안전:

### 제목
```
[VS Code workflow] How I stopped losing track of 50+ Claude Code slash commands
```

### 본문 (첫 단락만 교체, 나머지는 위 영문판 그대로)

```markdown
For VS Code users who use Claude Code (Anthropic's AI coding CLI)
as their daily driver: anyone else hit the wall where you have so
many `/command` and `/skill` files that you can't remember what's
installed?
```

뒤는 동일. 마지막 GitHub 링크 1개만 유지.

---

## 핵심 원칙 (왜 이 톤이 통하는가)

### 1. 첫 줄에 "광고 아님" 명시
- "Quick story, not a sales pitch" / "광고 글 아닙니다"
- 모더레이터·사용자 둘 다 즉시 신뢰 ↑

### 2. 일인칭 솔직 톤
- "I had so many slash commands"
- "Symptoms I noticed in myself" — 자기 약점 인정
- 자랑 톤 0%

### 3. 인사이트 우선, 도구 후순위
- 80%가 워크플로/패턴 토론
- 도구는 "I ended up doing X"로 슬쩍
- 게이미피케이션은 "Side-project gravity hit"로 위트있게 (자기 비하 톤)

### 4. 디스커션 질문으로 마무리
- "What are your top 3?" — Reddit 알고리즘은 댓글 많은 글을 띄움
- 도구 클릭률보다 댓글 수가 sub 노출에 더 영향

### 5. 링크 분산 (본문 1개 + 첫 댓글 3개)
- 본문: GitHub 1개만 (mod 자동필터의 핵심 트리거)
- 첫 댓글: VS Marketplace + OpenVSX + GitHub 모두 + 설치 안내
- 댓글은 mod가 본문보다 덜 봄 → 컨버전 친화적 정보는 댓글로 분산

### 6. 이미지 1장 (자연스러운 맥락에서)
- Reddit feed에서 thumbnail 있는 글이 임프레션 ~3배
- "(side-project gravity hit and this lineup ended up shipping:)" 식 자연스러운 introduction 후 라인업 PNG
- alt text는 마케팅 톤 X — "the buddy lineup that ended up shipping" / "어쩌다 만들어진 버디 라인업"
- 헤드라인 hero가 아니라 본문 후반 자연스러운 위치

---

## 게시 시간

- **r/ClaudeAI**: 미국 ET 09:00–11:00 (한국 22:00–24:00)
- **OKKY/GeekNews**: 한국 평일 오전 9-11시 또는 저녁 8-11시
- 화·수·목이 가장 좋고, 금요일 오후·일요일 오후는 트래픽 낮음

## 게시 후 1시간

- **OP 첫 댓글 즉시** (5분 안에): 디테일 + GitHub 링크
- **댓글에 빠르게 응답**: 30분 안에 답하면 알고리즘 가속
- **"top 3" 답변 모으기**: 카테고리 patterns에 활용 가능 (다음 페이즈 우선순위)
- **DM은 게시글에서 절대 부탁 X**: AutoModerator가 가장 싫어함

## 어떤 댓글에도 답할 한 줄

```
Genuinely interested in what works for you — happy to take any
feature requests as issues if you find the panel useful.
```

자기 광고처럼 안 들리면서도 "써보세요" 메시지 자연스럽게 전달.

---

## 만약 또 제거되면

1. **모더레이터에게 modmail**:
   ```
   Hi mods,
   
   My post titled "[제목]" was removed. I tried to keep it framed as a
   workflow discussion (with the actually-built tool mentioned only at
   the end), and I'd appreciate knowing which rule it triggered so I
   can fix the framing for next time. Thanks!
   ```

2. **modmail 24시간 후 답 없으면**: 다른 sub부터 (r/vscode 더 관대)

3. **계정 활동 더 누적**: 다른 글에 댓글 답변 5-10개 (홍보 의도 0). 일주일 후 재게시.
