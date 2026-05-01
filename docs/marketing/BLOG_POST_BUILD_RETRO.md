# I built a VS Code panel for Claude Code in a week (and it became a tiny pixel game)

> dev.to / Hashnode / Medium / velog 등에 그대로 게시 가능. 영문 본문, 한국어 버전은 하단 별도 섹션.
>
> **태그**: `#claude` `#vscode` `#sideproject` `#typescript` `#devtools`
> **canonical**: 본인 사이트가 있으면 거기 → dev.to에 canonical_url 지정

---

![Demo](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/demo.gif)

> *(GIF placeholder — replace with the real `docs/screenshots/demo.gif` when recorded.)*

---

## The problem nobody else seemed to be solving

I've been using **Claude Code** as my daily driver for a few weeks. After installing the official `superpowers` plugin, the `code-review` plugin, and a handful of my own custom slash commands, my `~/.claude/commands/` plus all the plugin commands had ballooned past **50 entries**. Half of them I'd written myself, half I'd installed and immediately forgotten existed.

The actual UX hit me one morning when I tried to run `/commit-prepare` and accidentally typed `/commit-message`. Silent typo. Wrong workflow. Five wasted minutes before I noticed.

> *I am the only customer of my own slash commands and I don't remember what I have.*

There's no marketplace UI in Claude Code. The `/plugin` command (which I'll mention later) is functional but text-only. There's no "show me everything I have" view.

So I built one.

---

## What it ended up being

[**Claude Code Skills Panel**](https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel) — a VS Code (and Cursor / Codium / Windsurf via OpenVSX) extension that:

- Auto-discovers every slash command on your machine: `~/.claude/skills/`, `~/.claude/commands/`, project-level `.claude/`, and **every plugin you've installed via `/plugin install`**
- Shows them as a clickable, fuzzy-searchable card grid
- Click → command goes to your clipboard (or auto-paste, or straight to terminal)
- Keys 1–6 fire your top six commands from anywhere (Quick Bar)
- Has a **built-in plugin marketplace browser** (243 plugins from `claude-plugins-official`, one-click install)

That's the boring part. The fun part:

- A pixel-art companion that **branches into 1 of 10 RPG classes** based on your usage pattern. Use a lot of `/git-*`? Your buddy becomes a Ninja named **Gitto**. A lot of `/code-review`? **Testra the Paladin**. The branching logic is basically `argmax(usage by category) → class`.
- Three pixel themes (Dark / Retro CRT / Gameboy LCD)
- Skills level up (LV.0 → LV.5) like RPG abilities
- 16 achievements
- Weekly Markdown report you can copy or save
- Everything gamification-related is **toggle-off-able**. Boring panel mode is one click away.

Free, MIT, ~118 KB packaged.

---

## Decisions I made and why

This is the part I actually wanted to write. The features above are the *what*; the implementation choices were the actual interesting work.

### 1. The webview talks to the host through plain `postMessage`

VS Code extensions have two parts: a **host** (Node.js, full file system access) and a **webview** (sandboxed iframe, can't `require()` anything). I needed the panel to be a webview because I wanted full HTML/CSS control for the pixel-art look. But all the file scanning and config writing has to happen in the host.

The bridge is just `postMessage` in both directions. No frameworks. The `<script>` block at the bottom of `extension.js`'s `renderHtml()` is hand-rolled vanilla JS that grew to about 1500 lines.

Pattern:

```js
// host
webview.postMessage({ type: 'usageRecorded', name, ...result });

// webview
window.addEventListener('message', (e) => {
  if (e.data.type === 'usageRecorded') { /* update UI */ }
});
```

Honestly this was simpler than every framework integration I tried first.

### 2. Pass JSON to the webview by inlining it into the HTML

The panel has to know about the user's full config (skills, aliases, achievements) on every render. I started by having the webview `fetch()` a `config.json` from the extension. That broke the content security policy in three different ways.

What I ended up with: just stringify it and inline it.

```html
<script>
  const STR = ${JSON.stringify(i18n.dict(locale))};
  const SKILLS = ${JSON.stringify(skillsArray)};
</script>
```

`JSON.stringify` handles all the escaping. As long as you set the right CSP, the webview just runs it. Zero network requests. Zero auth.

### 3. i18n in 50 lines, no library

The extension supports English, Korean, and Japanese. I started by reaching for `i18next`, then realized:

- I needed key → string lookup
- Variable interpolation (`Used {count}× · LV.{level}`)
- A way to detect a missing key obviously

That's it. No pluralization, no date formatting. So:

```js
function tFor(locale) {
  const D = STRINGS[locale] || STRINGS.en;
  return (key, vars) => {
    let s = D[key];
    if (s == null) s = key;  // missing key shows as the literal key — easy to spot
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => k in vars ? String(vars[k]) : m);
    return s;
  };
}
```

The "missing key shows as the literal key" trick was the best $0 I never spent on a library. When I see `modal.report.empty` rendered literally in the panel, I know exactly what to fix and where.

### 4. The "policy lives in one place" rule, learned the hard way

There's a small icon-priority problem in this panel:

1. User uploaded a custom icon? Use that.
2. Otherwise picked a Spark preset? Use that.
3. Otherwise auto-pick from category. Use that.
4. Otherwise default fallback.

I implemented this rule in **three different places** before I caught a bug where editing an icon in one flow used priority `1, 2, 3, 4` and another flow used `2, 1, 3, 4`. The custom upload would silently lose to the Spark preset depending on which path you came in from.

Now there's exactly one function that resolves the priority, called from everywhere. This is obvious in hindsight. It is never obvious during the third commit of a feature.

### 5. The Plugin Marketplace browser was the highest-leverage feature

Late in the build, I realized: **the whole Claude Code plugin ecosystem doesn't have a graphical browser.** You install plugins by typing `/plugin install …` and remembering names. I had a marketplace.json sitting at `~/.claude/plugins/marketplaces/<name>/.claude-plugin/marketplace.json` with **243 plugins** in the official one alone, and nobody was rendering it.

So I added a 🛒 button. Lazy-loaded modal. Search, category filter, "installed only" toggle, one-click install (sends the install command through whatever execution mode the user has set).

This took about 90 minutes total. It's the feature I expect to convert the most users, because nothing else does this.

---

## Mistakes I made

### Replace-all without checking indentation

I have an `<span class="edit-btn" title="편집">✎</span>` that appears on every card. When I refactored to i18n, I did a single `replace_all` to swap `편집` for `t('card.edit')`. The two occurrences had different leading whitespace (one was inside a 14-space indent, one was 8). Tool replaced the first, silently skipped the second, and I shipped a card with a hardcoded Korean tooltip on the bottom row of the grid.

Caught it via a 5-second `grep -nE "[가-힣]" extension.js`. That grep is now part of CI and a pre-publish hook.

### Variable shadowing in template literals

Inside a `topSkills.map((t, i) => …)` block, I had used `t` as the loop variable name. The outer scope had `t = i18n.tFor(locale)` — my translation helper. The inner `t` shadowed it, so `${t('modal.report.topCount', { count: top.count })}` blew up at render time.

The fix is one-character: rename the loop variable to `top`. The lesson is bigger: **pick descriptive variable names even in tiny lambda scopes**, especially when there's an i18n helper called `t` floating around.

### Auto-paste needed special handling per OS

The "Auto" execution mode focuses the Claude Code input, pastes, and presses Enter. On macOS, this means `osascript` calling `tell application "System Events" to keystroke "v" using command down`. On Windows, PowerShell's `SendKeys`. On Linux, `xdotool`.

The macOS path requires Accessibility permission. The Linux path requires xdotool to be installed. Both fail silently if their preconditions aren't met. I now log a one-line hint to the OS-specific failure path, and the toast says "▶ Auto: /command" hopefully even when the keystroke doesn't actually fire — at least the clipboard copy still worked.

---

## What I'd do differently

- **Set up i18n before writing any UI text.** I introduced i18n in v0.22 after many hardcoded Korean strings had accumulated. Refactoring 100+ string locations was the most boring 4 hours of the project.
- **CI from day 1, even for a personal project.** I had a dozen "I forgot to bump the version" and "I forgot to run the build" releases before I sat down and wrote a 100-line GitHub Actions workflow that does both, plus publishes to OpenVSX and VS Marketplace in parallel. Now `git push --follow-tags` does everything.
- **Demo GIF before week 2.** The Marketplace listing has a 'Resources' panel where the README image renders. Without a demo GIF, conversion from listing-view → install is roughly half what it could be (anecdotal, from comparing my own download curve before/after a similar listing).

---

## Numbers

- **5 days, ~30 commits**
- **~3000 lines of JavaScript**, no transpilation, no bundler
- **183 i18n keys × 3 locales** (English, Korean, Japanese)
- **62 pixel-art Spark icons**, **10 buddy class sprites**, all built from `sharp` + tiny SVG grids
- **118 KB packaged extension**

---

## Try it

- VS Code: [marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel](https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel)
- Cursor / Windsurf / Codium (OpenVSX): [open-vsx.org/extension/parksubeom/claude-skills-panel](https://open-vsx.org/extension/parksubeom/claude-skills-panel)
- Source: [github.com/parksubeom/claude-skills-panel](https://github.com/parksubeom/claude-skills-panel) (MIT)

Built mostly *with* Claude Code. The full-flow plugin's brainstorm → plan → execute → verify cycle is what made shipping this fast actually possible. Recursion: I'm using a panel for a tool that built the panel.

If you try it and have thoughts — issue, DM, anything — I'd love to hear what your most-used commands are. The class-branching logic only knows the keywords I've seen so far. Your set will probably teach me something.

---

# 한국어 버전

## 1주일 만에 만든 Claude Code용 VS Code 패널 (어쩌다 보니 도트 게임이 됨)

**문제**: Claude Code를 메인으로 쓰다 보니 `superpowers`, `code-review`, 직접 만든 `~/.claude/commands/` 까지 합쳐서 슬래시 커맨드가 50개를 넘어갔다. 절반은 내가 만들었는데 절반은 설치하고 까먹었다.

어느 날 아침 `/commit-prepare`를 치려다 `/commit-message`를 잘못 쳐서 5분 날렸다. *"내가 가진 것도 모른 채로 쓰고 있다."* 그게 시작이었다.

**해결책**: 머신에 있는 모든 슬래시 커맨드를 자동으로 찾아 카드 그리드로 보여주고, 클릭 한 번으로 실행하는 VS Code 익스텐션. Cursor/Codium/Windsurf에서도 OpenVSX로 동일하게 동작.

핵심 기능:
- 모든 소스 자동 스캔 (사용자/프로젝트/플러그인)
- 클립보드 복사 / 자동 붙여넣기 / 터미널 실행 3가지 모드
- Quick Bar 1~6 키 단축키
- **243개 공식 플러그인 카탈로그 한 모달에서 검색·설치** (Claude Code엔 없는 GUI)

거기까지가 본 기능. 사이드 프로젝트답게 게이미피케이션도 자연스럽게 추가됨:
- 픽셀 버디가 사용 패턴에 따라 **10개 RPG 클래스 중 하나로 분기** (`/git-*` 많이 쓰면 닌자, `/code-review` 많으면 팔라딘)
- 3개 픽셀 테마 (Dark / Retro / LCD)
- 스킬 레벨업, 16개 업적, 위클리 마크다운 리포트

전부 토글로 끌 수 있음. 무료, MIT.

---

### 만들면서 배운 것 5가지

1. **i18n 외부 라이브러리 안 써도 됨** — 키 룩업 + 변수 보간 + missing key는 키 자체 표시. 이걸로 50줄. `i18next`는 과한 도구였다.

2. **Webview ↔ Host는 그냥 `postMessage`** — VS Code 익스텐션 아키텍처 핵심. 프레임워크 끼우려다 다 빼고 vanilla로 갔더니 1500줄짜리 `<script>` 태그 하나로 다 됐다.

3. **데이터는 HTML 인라인 inject가 가장 단순** — webview에서 `fetch()` CSP 문제 3번 깨고 결국 `${JSON.stringify(...)}` 인라인이 정답이었다.

4. **정책은 한 곳에만** — 아이콘 우선순위 (custom upload > spark > default) 가 3군데에서 다르게 구현돼서 silent bug 두 번. 한 함수로 통일.

5. **CI는 첫날부터** — 1주차에 "버전 bump 까먹음", "빌드 까먹음"으로 잘못 게시한 게 5번. 100줄 GitHub Actions로 `git push --follow-tags` 한 번이면 두 마켓 자동 게시. 진작에 했어야 함.

### 잘못한 것

- **i18n을 늦게 도입** — v0.22에서야 i18n 시스템 도입했고 그때까지 누적된 한국어 100여 군데 치환이 가장 지루한 4시간이었다.
- **`replace_all`로 한 번에 치환했다 한쪽만 바뀜** — 들여쓰기 다른 같은 문자열이 2개. 첫 번째만 바뀌고 두 번째는 사용자 발견. 검증 자동화 (`grep -nE "[가-힣]"`)가 CI에 들어갔다.
- **변수 shadowing** — `topSkills.map((t, i) => ...)` 안에서 외부 `t = i18n.tFor(locale)`을 가렸다. 짧은 변수명이 i18n 헬퍼와 충돌하면 사고. 의미 있는 이름 쓰자.

---

### 숫자

- **5일, 30커밋, 3000줄 JS, 트랜스파일·번들 없음**
- **i18n 183 키 × 3 언어**
- **픽셀 아이콘 62개, 버디 클래스 10명**
- **패키지 크기 118KB**

---

### 설치

- VS Code: [Marketplace](https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel)
- Cursor: [OpenVSX](https://open-vsx.org/extension/parksubeom/claude-skills-panel)
- 소스: [GitHub](https://github.com/parksubeom/claude-skills-panel) (MIT)

대부분 Claude Code의 풀플로우 스킬로 만들었다. 도구를 만든 도구 위에서 도구를 쓰는 재귀 구조. 써보고 의견 있으면 GitHub Issue 환영.
