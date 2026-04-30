# VSCode 익스텐션을 만들면서 배운 것 — Spark 프리셋 아이콘과 i18n

> 주니어 개발자가 사이드 프로젝트로 VSCode 익스텐션을 만들면서, 하루 동안 배운 것들 정리.
> 대상 익스텐션: [Claude Code Skills Panel](https://open-vsx.org/extension/parksubeom/claude-skills-panel) — Claude Code의 `/slash` 커맨드를 한눈에 보고 즉시 트리거하는 도트 게이미피케이션 패널.

---

## 0. 배경 — 왜 만들었나

Cursor / VSCode 안에서 Claude Code를 쓰다 보니, 자주 쓰는 슬래시 커맨드(`/today`, `/commit-prepare`, `/full-flow` 같은 것들)를 매번 타이핑하는 게 번거로웠다. "버튼 하나로 클립보드에 복사되면 좋겠다"가 시작이었는데, 한참 만들다 보니 캐릭터가 진화하고 업적이 해금되는 도트 게임이 되어 있었다. 사이드 프로젝트의 자연스러운 흐름이다.

처음에는 진짜 단순했다. 카드 그리드 + 클릭 → 클립보드 복사. 그 다음 별칭(alias), 별칭 편집 모달, 사용 통계, Quick Bar, 캐릭터 진화…. 점점 게임 같은 무언가가 되었다. (자세한 페이즈 계획은 [docs/gamification-plan.md](../gamification-plan.md))

오늘은 그중 두 개의 작업을 정리한다.

1. **v0.21.1** — 스킬 카드 아이콘을 사용자가 직접 업로드 안 하고도 "내장 프리셋"에서 고를 수 있게
2. **v0.22.0** — UI를 영어/한국어로 토글할 수 있는 i18n 인프라 도입 (그리고 Spark 프리셋 검색 추가)

---

## 1. v0.21.1 — "왜 매번 아이콘을 업로드해야 하지?"

### 출발점

기존에는 스킬 카드 아이콘을 바꾸려면 PNG 파일을 직접 골라 업로드해야 했다. 그런데 이미 익스텐션 번들에는 30개의 픽셀 아트 아이콘(`assets/pixel-icons/spark/`)이 포함돼 있다. 사용자 입장에서는

> "이미 들어 있는 아이콘이 있는데 왜 내가 다시 만들어야 해?"

라는 의문이 자연스럽다. 나도 같은 생각이었다. 그래서 **스킬 편집 모달에 프리셋 그리드를 추가**하기로 했다.

### 막혔던 부분 — 우선순위 충돌

처음 코드를 짜다가 막힌 지점이 있다. 사용자가 이미 커스텀 아이콘을 업로드한 상태에서 프리셋을 추가로 골랐을 때, 둘 중 어떤 게 보여야 하나?

처음에는 "둘 다 저장해 두고, 화면에서는 더 최근 것 표시" 같은 식으로 가려다가, 결국 **상호 배타**로 갔다. 즉:

- 프리셋을 고르면 → 기존 `iconPath`(업로드 파일)는 삭제
- 업로드를 새로 하면 → 기존 `sparkIcon`(프리셋 키)은 삭제

서버(extension 호스트) 쪽 메시지 핸들러에서 단순한 if 분기로 정리했다.

```js
// extension.js (개념적 발췌)
if (msg.sparkIcon) {
  cfg.skills[msg.name].sparkIcon = msg.sparkIcon;
  delete cfg.skills[msg.name].iconPath; // spark가 업로드보다 우선
}
```

그리고 화면 렌더 쪽에서도 우선순위는 한 곳에서만 결정한다. "정책은 한 곳에서만"이라는 원칙이 코드 읽기 편함을 크게 좌우한다는 걸 다시 느꼈다.

```js
const userIconUriFor = (skill) => {
  // 1) custom upload
  const abs = userConfig.resolveIconPath(cfgEntry.iconPath);
  if (abs) return webview.asWebviewUri(...).toString();
  // 2) spark preset
  if (cfgEntry.sparkIcon && PIXEL_DIR) {
    const sparkAbs = path.join(PIXEL_DIR, 'spark', `${cfgEntry.sparkIcon}.png`);
    if (fs.existsSync(sparkAbs)) return webview.asWebviewUri(...).toString();
  }
  return null;
};
```

### webview에 데이터를 어떻게 넘기는가

VSCode webview는 내부 별도 IFrame처럼 동작해서, 서버(extension 호스트)에서 직접 `fs.readdirSync` 같은 API를 부를 수 없다. 그래서

1. **렌더 시점에 한 번**, 프리셋 폴더를 읽어 `[{ name, uri }]` 배열을 만든다.
2. JSON으로 직렬화 → 모달 DOM의 `data-presets` 속성에 박는다.
3. webview JS에서 `JSON.parse(sparkGrid.dataset.presets)` 로 꺼내 그리드를 그린다.

```html
<div class="spark-preset-grid" id="m-spark-grid"
     data-presets="${escapeHtml(JSON.stringify(sparkPresets))}"></div>
```

`escapeHtml`을 안 했더니 `"` 때문에 속성이 깨졌다. 잠깐 헤맸다. 이걸 까먹으면 디버깅에 시간 꽤 쓴다.

### 그리고 배포

`vsce package` 로 `.vsix` 만들고, `ovsx publish`로 OpenVSX에 올린다. 처음엔 `vsce publish`를 쓰려다가 OpenVSX는 별도 토큰이 필요하다는 걸 알았다. (Cursor는 OpenVSX 카탈로그를 쓰기 때문에, Cursor 사용자에게 도달하려면 OpenVSX에 올려야 한다.) 토큰은 [open-vsx.org/user-settings/tokens](https://open-vsx.org/user-settings/tokens) 에서 발급.

배포 직후 IDE에서 자동 업데이트가 안 되는 게 함정이다. **사용자(나) 자신이 IDE에서 익스텐션을 수동 업데이트해야** 새 기능이 보인다. "왜 안 보이지?" 한참 헤매다가 익스텐션 탭에서 "Check for Updates" 누르고서야 알았다.

---

## 2. v0.22.0 — 영어화는 "그냥 번역"이 아니다

### 출발점 — 글로벌 사용자에게도 쓰이게

OpenVSX에 올려놓으니 통계상 다운로드가 한국 외에서도 일어난다는 걸 봤다. 그런데 UI는 전부 한국어 하드코딩.

> "그냥 모든 한글 문자열을 영어로 바꾸면 되겠지?"

처음엔 그렇게 생각했다. 그런데 "한국 사용자도 잘 쓰고 있는데 영어로 바꾸면 그건 그것대로 망하는 거 아닌가" 싶어, **i18n 정식 도입** 으로 방향을 잡았다. 토글 가능하게.

### 외부 라이브러리 vs 자체 구현

i18n 쓸 때 보통 `i18next`, `react-i18next` 같은 걸 쓰는데, 익스텐션은 webview 안에서 동작하는 React 없는 바닐라 JS다. 그리고 **번들 크기**도 신경 쓰인다. 익스텐션을 가볍게 유지하고 싶었다. 그래서 라이브러리 안 쓰고 직접 짜기로 했다.

핵심 요구사항을 적어 보니 단순했다.

- 키 → 문자열 매핑
- 변수 보간(`{count}회` 같은 것)
- locale 결정(우선순위)
- fallback (키 없을 때 키 자체 표시 — 누락 가시화)

이 정도는 한 파일이면 충분하다. [`i18n/strings.js`](../../i18n/strings.js) 한 파일에 다 넣었다.

```js
// i18n/strings.js (요약)
const STRINGS = {
  en: { 'card.usage': 'Used {count}× · LV.{level}', /* ... */ },
  ko: { 'card.usage': '사용 {count}회 · LV.{level}', /* ... */ },
};

function interpolate(template, vars) {
  return vars
    ? template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
    : template;
}

function tFor(locale) {
  const D = STRINGS[locale] || STRINGS.en;
  return (key, vars) => interpolate(D[key] != null ? D[key] : key, vars);
}
```

미스 키가 났을 때 그냥 키 자체를 화면에 보여주게 한 게 의외로 효과 컸다. **검증 단계에서 누락된 키가 한눈에 잡힌다**. 처음엔 `???` 같은 placeholder로 할까 했는데, 키 자체 노출이 디버깅에 더 좋다.

### 서버 → webview 데이터 전달

익스텐션 호스트(Node.js)에서 webview(브라우저 IFrame)로 strings를 보내야 한다. 방법은 두 가지.

1. webview가 `fetch('strings.json')`으로 가져오기 → 별도 엔드포인트 필요, 복잡함
2. 렌더 HTML에 인라인 inject → 단순, 한 번에 됨

당연히 2번. HTML 템플릿 안에서 `<script>`에 객체를 박는다.

```js
// extension.js (renderHtml 안)
const locale = i18n.resolveLocale(cfg.meta?.locale, vscode.env.language);
const t = i18n.tFor(locale);
// ... HTML 템플릿 빌드
return `
<script>
const STR = ${JSON.stringify(i18n.dict(locale))};
const LOCALE = ${JSON.stringify(locale)};
function t(key, vars) {
  let s = STR[key];
  if (s == null) s = key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => k in vars ? String(vars[k]) : m);
  return s;
}
</script>
... // 클라이언트 코드에서 t('toast.locked') 같이 호출
`;
```

서버 측에서도 동일한 키 시스템을 쓰는 `t = i18n.tFor(locale)`을 만들어 HTML 템플릿에 직접 보간한다. 키 한 번만 정의하면 양쪽에서 같은 결과가 나온다.

### locale 우선순위

> 처음 로드할 때 어떤 언어로 보여줄까?

세 단계로 정했다.

1. 사용자가 직접 토글했으면 그 값 (`cfg.meta.locale`)
2. 없으면 VSCode 시스템 언어 (`vscode.env.language`, 예: `'ko-KR'`, `'en-US'`)
3. 그것도 없으면 영어 (글로벌 기본)

```js
function resolveLocale(cfgLocale, envLanguage) {
  if (cfgLocale && SUPPORTED.includes(cfgLocale)) return cfgLocale;
  if (envLanguage) {
    const short = String(envLanguage).slice(0, 2).toLowerCase();
    if (SUPPORTED.includes(short)) return short;
  }
  return 'en';
}
```

### 토글 → 재렌더 흐름

webview에서 토글 버튼 눌렀을 때 어떻게 화면 전체가 바뀌는가?

```
[webview]                       [extension host]
  토글 클릭
  postMessage({ type: 'setLocale', locale: 'en' })
                       ───►    onDidReceiveMessage
                                userConfig.setLocale('en')   // cfg에 저장
                                this.refresh()
                                  └─► webview.html = renderHtml(...)  // 재렌더
                                                                       (새 STR 주입)
```

VSCode webview API의 `webview.html = ...` 한 줄이면 통째로 새 HTML이 주입된다. 단순하고 좋다. 다만 모달이 열려 있던 경우 닫혀 버린다는 작은 단점이 있다. (그래서 `pickIcon` 핸들러는 의도적으로 refresh를 안 부른다 — 주석으로 명시.)

### 잡았던 버그 (1) — 변수명 충돌

서버 측에서 `t = i18n.tFor(locale)`을 만들고, weekly report HTML 템플릿에서 사용했다. 그런데 같은 템플릿 안의 `topSkills.map((t, i) => ...)` 의 `t`가 외부 `t` 헬퍼를 가려 버렸다(shadowing).

```js
${weekly.topSkills.map((t, i) => `   // 여기서 t는 topSkill 객체
  <span class="top-name">${escapeHtml(t.label)}</span>
  <span class="top-count">${t('something')}</span>  // ← 에러! t는 함수가 아님
`).join('')}
```

테스트하다 발견하고 변수명을 `top`으로 바꿔서 해결.

```js
${weekly.topSkills.map((top, i) => `
  <span class="top-name">${escapeHtml(top.label)}</span>
  <span class="top-count">${t('modal.report.topCount', { count: top.count })}</span>
`).join('')}
```

**짧은 변수명 + 동일 스코프에 동일 이름 = 사고**. 이번에 한 번 더 새겼다.

### 잡았던 버그 (2) — replace_all의 함정

`<span class="edit-btn" title="편집">✎</span>` 가 카드 두 군데에 나와서 `replace_all: true`로 일괄 치환했는데, **들여쓰기가 달라서** 한쪽만 바뀌었다. 첫 번째는 14스페이스 들여쓰기, 두 번째는 8스페이스 들여쓰기였다. 도구는 정확히 일치하는 것만 바꾸므로, 한쪽이 남았다.

검증 단계에서 `grep -E "[가-힣]" extension.js` 한 번 돌려보고 알았다.

```bash
$ grep -nE "[가-힣]" extension.js
406:        <span class="edit-btn" title="편집">✎</span>   ← 잔존
```

**검증은 무조건 한다**. "다 바꿨겠지" 가정 금지. 정규식 grep은 5초면 끝나고, 안 하면 결국 사용자가 발견한다.

### 잡았던 버그 (3) — 객체 모양 변경의 파급

`achievements.js`에서 한글 라벨을 i18n 키로 추상화하면서 `name`/`desc` 필드를 `nameKey`/`descKey`로 바꿨다.

```js
// 변경 전
{ id: 'first_step', name: '첫 발걸음', desc: '처음으로 스킬 복사', icon: '👣', check: ... }
// 변경 후
{ id: 'first_step', icon: '👣', check: ... }
  // .map((a) => ({ ...a, nameKey: `achv.${a.id}.name`, descKey: `achv.${a.id}.desc` }))
```

그런데 클라이언트 측 toast에서 `a.name`을 직접 참조하던 곳이 깨졌다.

```js
// 변경 전
t.textContent = '🏆 업적 해제: ' + a.icon + ' ' + a.name;  // a.name이 undefined
```

**한 곳에서 데이터 모양을 바꾸면, 그걸 쓰는 모든 곳을 고쳐야 한다**. 너무 당연한 말인데 막상 일하다 보면 까먹는다. 이때도 grep으로 `a\.name` 검색해서 찾아냈다.

### 작업 결과

- 한글 100+ 위치 → `t()` 호출로 전환
- locale 토글 버튼 (`🌐 EN/KO`) 푸터에 추가
- 신규 키 누락 시 키 자체 표시 → 검증 자동화
- 외부 라이브러리 0개 추가 (번들 크기 영향 없음)

그리고 같은 릴리즈에 Spark 프리셋 검색 인풋도 함께 넣었다. 30개 프리셋 그리드에서 이름으로 즉시 필터링.

---

## 3. 풀플로우(`/full-flow`) 도입의 효과

오늘 두 번째 작업은 처음으로 **풀플로우**라는 메타 스킬로 진행했다. 단계가 정해져 있다.

```
0. 진입 체크 (작업 규모 적정성)
1. 브레인스토밍 → 컨펌
2. 플랜 작성 → 컨펌
3. 실행 → 컨펌
4. 검증 → 컨펌
5. 코드리뷰 (오늘은 스킵)
6. 마무리 (배포/PR)
```

각 단계 끝에서 **명시적 컨펌**을 받고 다음으로 넘어간다. 처음엔 "절차가 너무 많은 거 아닌가" 싶었는데, 실제 해보니

- 브레인스토밍에서 5개 항목이 나왔는데, 한 번에 다 하면 PR이 너무 커진다는 판단이 자연스럽게 나왔다 → **2개씩 묶기로 결정**
- 플랜 작성 단계에서 [docs/daily/2026-04-30-feat/summary.md](../daily/2026-04-30-feat/summary.md)에 "이번에 뭘 할 거고 뭘 안 할 건지"를 써 놓으니, 실행 중 갈팡질팡할 일이 줄었다
- 검증 단계가 별도로 있어서, 빌드/구문체크/렌더 시뮬레이션을 빼먹지 않게 된다

작은 작업에는 과한 절차지만, **여러 파일에 영향이 큰 변경**(오늘 같은)에는 확실히 사고 줄여 준다. 중간 컨펌이 있으니까 "아, 이건 한 번에 다 하지 말자"같은 결정이 쉽게 나온다. 혼자서 머릿속에서만 굴리다 보면 자꾸 욕심이 커진다.

---

## 4. 배운 것 / 다음에는

### 배운 것

- **webview ↔ extension host 메시지 패싱**의 단순함. `postMessage` 한 방향, 그쪽에서 받아서 처리하면 끝.
- **HTML 템플릿에 JSON inject**가 가장 단순한 데이터 전달. `JSON.stringify`만 쓰면 된다 (escape는 자동).
- **정책은 한 곳에서만** — 우선순위, fallback, validation 같은 것.
- **검증 자동화**는 grep 한 줄짜리도 충분히 가치 있다. "다 바꿨겠지"는 금지.
- **외부 라이브러리 안 써도 되는 영역**이 생각보다 많다. i18n 같은 것은 자체 구현 50줄로 충분하다.

### 다음에 시도할 것 (이미 백로그)

- ③ 그룹 커스텀 — 사용자가 그룹을 직접 추가/이름 변경할 수 있게
- ④ Quick Bar 드래그 재정렬 — HTML5 DnD 처음 써본다
- ⑤ 테마 토글 — CSS 변수 기반 다크/레트로 등
- ⑥ 버디 상호작용 강화 — 새 픽셀 디자인 작업 후

---

## 마무리

오늘 두 개의 OpenVSX 릴리즈를 했다 ([v0.21.1](https://open-vsx.org/extension/parksubeom/claude-skills-panel/0.21.1), [v0.22.0](https://open-vsx.org/extension/parksubeom/claude-skills-panel/0.22.0)). 코드량으로는 약 600줄 정도 변경. 그런데 결과보다 **과정에서 배운 게 더 많은 날** 이었다. 변수명 shadowing, replace_all의 함정, 데이터 모양 바뀌면 사용처 모두 점검 — 책으로 읽었으면 흘려보냈을 것들이 직접 부딪히니 머리에 박힌다.

다음 사이클은 그룹 커스텀부터다. Drag-and-Drop API를 처음 써 보는 거라 또 한참 헤맬 것 같다. 그건 그것대로 정리해서 다음 글로 남길 예정.

---

> 익스텐션: [parksubeom.claude-skills-panel](https://open-vsx.org/extension/parksubeom/claude-skills-panel)
> 저장소: [github.com/parksubeom/claude-skills-panel](https://github.com/parksubeom/claude-skills-panel)
