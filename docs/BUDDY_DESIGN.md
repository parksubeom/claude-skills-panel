# Buddy 시스템 — 클래스 분기 진화

v0.29.0부터 적용되는 새 진화 시스템.

---

## 핵심 컨셉

**단일 캐릭터가 사용 패턴에 따라 10개 클래스 중 하나로 분기 진화**한다. 모든 사용자가 같은 알에서 시작해서, 어떤 슬래시 커맨드를 가장 많이 썼느냐로 직업이 결정된다는 RPG 메타포.

```
LV.1 Egg            (action 0~9)         공통
LV.2 Hatchling      (action 10~49)       공통
LV.3 [Class]        (action 50~149)      ← 50회 시점에 클래스 결정
LV.4 [Class] Adept  (action 150~499)     클래스 유지, 시각만 강화
LV.5 [Class] Master (action 500+)        최종 폼
```

---

## 10개 클래스 (외부 디자인 작업 중)

| # | 클래스 | 특징 | 담당 영역 | 키워드 매칭 |
|---|---|---|---|---|
| 1 | **Codey** 🗡️ 검사 | 갈색머리, 키보드 검, 후드 | 코드 작성/리팩토링 | `code`, `refactor`, `simpl`, `implement` |
| 2 | **Docly** 📜 사제 | 흰 로브, 두루마리 지팡이 | 문서화 | `doc`, `docs`, `write`, `markdown`, `readme` |
| 3 | **Debuggo** 🔍 탐정 | 돋보기, 트렌치코트, 빨간 눈 | 디버깅 | `debug`, `bug`, `fix`, `trace` |
| 4 | **Testra** 🛡️ 팔라딘 | 체크마크 방패, 녹색 갑옷 | 테스트 | `test`, `spec`, `verify`, `check`, `review` |
| 5 | **Sheety** 📊 상인 | 초록색, 주판, 안경 | xlsx/스프레드시트 | `xlsx`, `csv`, `data`, `sheet`, `excel` |
| 6 | **Slidey** 🎤 음유시인 | 노란 망토, 마이크 지팡이 | 프레젠테이션 | `slide`, `pptx`, `present`, `pitch` |
| 7 | **PDFox** 🦊 도적 | 빨간 여우 귀, 빨간 봉인 | PDF 처리 | `pdf` |
| 8 | **Webbie** 🕸️ 마법사 | 보라 로브, 색상 팔레트 | 프론트엔드 디자인 | `web`, `frontend`, `ui`, `css`, `react`, `design` |
| 9 | **Datia** 🧙‍♀️ 점성술사 | 파란 머리, 차트 수정구슬 | 데이터 분석 | `analyze`, `chart`, `viz`, `report`, `metric` |
| 10 | **Gitto** ⚔️ 닌자 | 검은 닌자복, 브랜치 수리검 | Git/버전관리 | `git`, `commit`, `branch`, `push`, `pull`, `pr`, `merge` |

매칭 안 되는 슬래시 커맨드는 디폴트로 **Codey**로 카운트.

---

## 데이터 모델

`~/.claude/skills-panel-config.json`의 `character`:

```json
{
  "character": {
    "actions": 47,
    "stats": { "int": 23, "dex": 18, "vit": 7, "lck": 5 },
    "skillStats": {
      "codey": 12, "docly": 5, "debuggo": 8, "testra": 3,
      "sheety": 6, "slidey": 0, "pdfox": 1, "webbie": 2,
      "datia": 1, "gitto": 9
    },
    "class": null,
    "classLockedAt": null,
    "name": "Claude"
  }
}
```

`class`는 `null`이면 아직 LV.2 이하. 50회 도달 시점에 `skillStats`에서 가장 큰 카운트를 가진 클래스로 결정 (동률은 알파벳 순). 결정 후 `classLockedAt`에 ISO timestamp.

---

## 분기 로직

```js
function decideClass(skillStats) {
  let max = -1, winner = 'codey';
  for (const cls of CLASS_IDS) {
    const count = skillStats[cls] || 0;
    if (count > max) { max = count; winner = cls; }
  }
  return winner;
}
```

`recordUsage()`가 호출될 때마다:
1. 슬래시 커맨드 이름을 키워드 매칭 → 카테고리 결정 → `skillStats[cat]++`
2. `actions` 누적
3. `actions === 50` 직후 `class === null`이면 `decideClass()` 실행, `class` + `classLockedAt` 저장
4. 클래스 결정 토스트 webview에 push

---

## Reincarnate (재진화)

캐릭터 시트 모달의 **"🔄 Reincarnate"** 버튼:
- `class = null`, `classLockedAt = null`로 리셋
- `skillStats`는 그대로 유지 → 다음 액션에서 즉시 재결정
- 페널티 없음

---

## 시각 표현

### LV.1 ~ LV.2 (공통)
- LV.1 Egg: `assets/pixel-icons/buddy/egg.png`
- LV.2 Hatchling: `assets/pixel-icons/buddy/hatchling.png`

### LV.3 ~ LV.5 (클래스별)
- `assets/pixel-icons/buddy/class/<id>.png`
- LV.4 Adept: 같은 PNG + 코드 오버레이 (가벼운 황금 outline)
- LV.5 Master: 같은 PNG + 더 강한 오버레이 (별빛 파티클 + 더 진한 outline)

→ **디자인 부담 12장** (Egg, Hatchling, 클래스 10개). LV.4·5 강화는 코드.

---

## 기존 사용자 마이그레이션

`character.skillStats`가 없는 사용자:
- 빈 객체 `{}` 초기화
- 다음 사용부터 카운트 시작
- 만약 `actions >= 50` 이미인데 `class === null`이면, 즉시 `class = 'codey'` (default), 사용자가 Reincarnate 버튼으로 다른 클래스 선택 가능

기존 6단계 (Egg/Hatchling/Kitten/Cat/Monkey/Dragon) → 5단계로 압축. `BUDDY_NAMES` 배열은 `getCurrentStageName(character)` 함수로 대체.

---

## i18n

각 클래스마다:
- `class.<id>.name` — 표시 이름 (Codey, Docly, …)
- `class.<id>.role` — 직업 (검사, 사제, 탐정, …)
- `class.<id>.desc` — 한 줄 설명

en/ko/ja 모두 정의.

---

## 작업 순서

1. ✅ 기획서 (이 문서)
2. ⬜ userConfig.js — skillStats, class, classLockedAt 필드 + 카테고리 카운트 + 분기 로직
3. ⬜ Threshold 변경 (5단계)
4. ⬜ 캐릭터 시트 모달 — skillStats 막대 차트, 클래스 정보, Reincarnate 버튼
5. ⬜ 토스트 (분기 / LV up)
6. ⬜ i18n (10 클래스)
7. ⬜ Placeholder PNG 생성 (사용자 디자인 도착 전 임시)
8. ⬜ 최종 디자인 통합 (사용자 작업 후)

---

## 디자이너 참고

- **포맷**: 16×16 또는 32×32 픽셀, 투명 배경 PNG
- **스타일**: 사이드뷰, 검은 외곽선, 픽셀 아트
- **포즈**: 정적 idle (걷는 모션은 보너스)
- **색상**: 위 표의 특징 색을 메인으로
- **사이즈**: 96×96 PNG로 nearest-neighbor 업스케일됨 — 16×16 / 32×32 둘 다 OK
- **저장 경로**: `assets/pixel-icons/buddy/class/<id>.png`
  - 예: `assets/pixel-icons/buddy/class/codey.png`

이미지 넘겨주시면:
1. 16×16 또는 32×32 정규화
2. 위 경로에 배치
3. `npm run build:buddy-classes` 등으로 통합 (스크립트는 사용자 디자인 도착 후 추가)
4. 다음 패치 릴리스

LV.4/5 오버레이는 자동 — 같은 PNG에 CSS/Canvas 효과 추가.
