## 작업 요약

- **날짜/폴더**: `docs/2026-04-30-feat/`
- **작업명**: Spark 프리셋 아이콘 선택 UI 추가 + v0.21.1 배포
- **관련 이슈/티켓**: -
- **담당/리뷰어**: parksubeom

---

## What changed (무엇이 바뀌었나)

- **사용자 관점 변화**:
  - 스킬 편집 모달에서 파일 업로드 없이 내장 픽셀아트 프리셋 중 클릭만으로 아이콘 지정 가능
  - 액티비티 바 아이콘이 신규 `activity-icon.svg`로 교체됨
- **범위(in-scope)**:
  - 모달 UI에 Spark 프리셋 그리드 추가
  - `sparkIcon` 필드 userConfig 반영 및 우선순위 처리 (custom upload < spark preset)
  - `assets/pixel-icons/extracted/` 구조 → `spark/` 구조로 재편
  - OpenVSX v0.21.1 배포
- **비범위(out-of-scope)**:
  - Spark 아이콘 추가/편집 기능 (현재는 빌드된 프리셋 사용만)
  - 진화 단계별 슬롯/Quick Bar 변경
- **호환성/브레이킹 체인지 여부**:
  - 기존 `iconPath`(custom upload) 사용자 영향 없음 — `sparkIcon`이 추가될 때만 우선 적용
  - 구 `extracted/` 경로 참조 코드는 없음 (브레이킹 없음)

---

## How (어떤 식으로 진행했나)

- **접근 방식(설계/의도)**:
  - 모달 안에서 라벨 `커스텀 아이콘` → `아이콘`으로 일반화하고, 업로드/제거 영역 아래에 프리셋 그리드 섹션 추가
  - 렌더 시점에 `PIXEL_DIR/spark/` 디렉토리를 스캔해 `{name, uri}` 리스트를 모달에 주입 (`data-presets` JSON)
  - 클릭 핸들러에서 선택 상태(`selected` 클래스) 토글 + `pendingSparkIcon` 전역 변수에 캐싱 → 저장 시 함께 전송
  - 우선순위: custom `iconPath` 있으면 그것, 없으면 `sparkIcon`, 없으면 null
- **핵심 파일**
  - [extension.js](extension.js): `userIconUriFor`에서 spark 우선순위 처리, `sparkPresets` 빌드, 모달 그리드 렌더 + 핸들러, 저장 메시지 `sparkIcon` 포함
  - [userConfig.js](userConfig.js): `applyOverrides`에 `sparkIcon` 필드 노출
  - [package.json](package.json): version `0.20.2 → 0.21.1`, activity bar 아이콘 `icon.svg → activity-icon.svg`
  - [activity-icon.svg](activity-icon.svg): 신규 파일 (액티비티 바 전용 아이콘)
- **핵심 콜체인/플로우**
  - 카드 클릭 → `openEditModal(el)` → `el.dataset.sparkIcon` 으로 현재 선택 복원
  - 그리드 버튼 클릭 → `pendingSparkIcon` 갱신 + preview 업데이트
  - `m-save` 클릭 → postMessage `editMeta { sparkIcon }` → `SkillsViewProvider`에서 `cfg.skills[name].sparkIcon` 기록 + `iconPath` 제거
  - 다음 렌더 → `userIconUriFor`가 spark 경로로 webviewUri 반환
- **데이터 모델/스토어 영향**
  - `userConfig.json` 의 `skills.<name>` 항목에 새 필드 `sparkIcon: string | null` 추가
  - spark 선택 시 `iconPath`는 자동 삭제 (상호 배타)

---

## Impact / Risks (미치는 영향과 리스크)

- **영향 범위**: 스킬 편집 모달 / 카드 아이콘 렌더링 / 액티비티 바 아이콘
- **성능 영향**: 렌더 시 `fs.readdirSync` 1회 추가 (spark 폴더 ~30개 파일) — 미미함
- **보안/권한 영향**: 없음 (로컬 webviewUri만 사용)
- **엣지 케이스**:
  - `PIXEL_DIR` null인 경우 → 빈 배열 반환, 그리드 비어있게 표시
  - spark 디렉토리에 PNG가 없으면 → 빈 그리드
  - 사용자가 `iconPath`와 `sparkIcon` 둘 다 있던 과거 데이터 → spark 선택 시 iconPath 제거되도록 처리

---

## Test plan (검증 방법)

- **로컬 실행**
  - VSCode "Developer: Reload Window" 후 패널 열기
- **체크리스트**
  - [x] 모달 하단에 Spark 프리셋 그리드 표시
  - [x] 그리드 클릭 시 미리보기 갱신 + 선택 테두리 강조
  - [x] 저장 후 카드 아이콘이 선택한 spark로 변경
  - [x] 모달 재오픈 시 현재 선택된 프리셋이 강조 상태로 복원
  - [x] 업로드 후 spark 선택 → spark 우선 적용 확인
  - [x] OpenVSX 배포 성공 (`🚀 Published parksubeom.claude-skills-panel v0.21.1`)

---

## Rollback / Regression plan (회귀 방법)

- **즉시 차단(가능하면)**: 사용자는 모달에서 `제거` 버튼으로 spark 선택 해제 가능 (`clearIcon: true`)
- **코드 회귀**
  - `git revert a6176f9` 후 v0.21.2로 다시 배포 (publish는 unpublish 불가, 한 단계 더 올려야 함)
  - revert 후 `npm run build:* && npx vsce package && npx ovsx publish` 재실행
- **데이터/설정 회귀**
  - 사용자의 `userConfig.json`에 남은 `sparkIcon` 필드는 구버전에서 무시되므로 별도 정리 불필요

---

# 2차 작업 — 1차 릴리즈 플랜 (i18n + Spark 검색·필터)

## 작업 요약

- **작업명**: i18n 인프라 도입 + Spark 프리셋 검색·필터 (1차 릴리즈)
- **타깃 버전**: v0.22.0 (minor — i18n은 사용자 가시 동작 변경)
- **범위(in-scope)**: 항목 ① i18n + ② Spark 검색
- **비범위(out-of-scope)**: 그룹 커스텀(③), Quick Bar 드래그(④), 테마 토글(⑤), 버디(⑥)

## 설계 결정

### ① i18n 인프라
- **방식**: 경량 자체 구현 (외부 의존성 없음 — 익스텐션 번들 크기 최소화)
- **구조**:
  - `i18n/strings.js` — `{ ko: {...}, en: {...} }` 키-밸류 맵 단일 파일
  - `t(key, vars?)` 헬퍼 — 키 미존재 시 키 자체 반환 (개발 중 누락 가시화)
  - 언어 결정: `userConfig.json` 의 `meta.locale` 우선 → 없으면 `vscode.env.language` 의 첫 2자 → 없으면 `'en'` (글로벌 기본)
- **토글 위치**: 푸터 우측에 작은 아이콘 버튼 `🌐 EN` / `🌐 KO` (테마/사운드 토글 옆)
- **키 네이밍**: `panel.empty`, `modal.edit.title`, `modal.edit.alias`, `footer.streak`, `report.title.weekTotal` 등 도메인.섹션.항목
- **번역 일관성**: 1차에서는 영문 키로 `Today's start`, `Recent`, `Hidden` 등 단순·간결 영어. 어색한 표현은 리뷰 단계에서 보정.

### ② Spark 프리셋 검색·필터
- **UI**: 모달 `Spark 프리셋` 라벨 우측에 작은 검색 인풋 (placeholder: `Search…`)
- **동작**: 입력값으로 `presets[].name` 부분 일치 필터링 (대소문자 무시), 빈 입력 시 전체 표시
- **카테고리 태그**: 1차에서는 보류(범위 축소). 단순 검색 인풋만 도입.
- **상태 유지**: 모달이 닫혔다 열려도 검색어 초기화 (사용자가 카드 단위로 편집하므로 매번 처음부터 시작이 자연스러움)

## 핵심 파일 / 변경

- `i18n/strings.js` (신규) — ko/en 리소스 맵, `t()` 헬퍼
- `extension.js`
  - 상단에서 `strings.js` 로드, 렌더 시 `cfg.meta.locale` 결정 → 헬퍼를 webview HTML에 inject
  - 모든 한글 하드코딩 라벨을 `${t('...')}` 또는 webview 측 `t()` 호출로 치환
  - 87개 라인의 한글 문자열 매핑 (모달, 패널 헤더, 토스트, 푸터, 리포트, 캐릭터 시트, hover 텍스트 등)
  - 푸터에 locale 토글 버튼 추가, 클릭 시 webview→ext postMessage `setLocale` 처리
  - Spark 그리드 위 `<input class="spark-search">` 추가, JS 핸들러로 그리드 필터링
- `userConfig.js` — `cfg.meta.locale` 필드 read/write 지원
- `achievements.js` — 16개 한글 라벨 문자열을 키로 추출, `i18n/strings.js`에 등록 (런타임에서 `t()`로 해석)
- `package.json` — 버전 `0.21.1 → 0.22.0`

## 콜체인

```
extension activate
  → loadConfig (cfg.meta.locale 읽기)
  → renderHtml(skills, cfg.meta.locale)
    → strings 객체에서 locale 선택 → HTML 템플릿에 ${t(...)} 치환
    → webview JS에 STR 객체 inject (런타임 t() 헬퍼용)
  → 사용자가 locale 토글 클릭
    → postMessage 'setLocale'
    → ext: cfg.meta.locale 갱신 + view 재렌더
```

## 단계별 실행 순서 (Stage 3)

1. `i18n/strings.js` 생성 — 모든 한글 라벨을 키로 추출 (ko/en 둘 다)
2. `extension.js`에서 strings 로드 + `t()` 헬퍼 + 한글 하드코딩 일괄 치환
3. 푸터에 locale 토글 버튼 + 핸들러
4. `userConfig.js`에 `meta.locale` 필드
5. `achievements.js` 한글 → 키 추출 후 strings.js 통합
6. Spark 검색 인풋 + 필터 JS 추가
7. (검증 단계로 이동)

## Test plan

- [ ] 영문/한글 토글 시 모든 라벨이 즉시 변경
- [ ] 신규 사용자(meta.locale 없음)는 `vscode.env.language` 따라 자동 결정
- [ ] 모달 편집/저장/취소 정상 동작 (i18n과 무관한 로직 회귀 없음)
- [ ] 토스트 메시지(복사 완료 등)도 i18n 적용
- [ ] Spark 그리드 검색: 부분 일치, 대소문자 무시, 빈 입력 시 전체 복원
- [ ] 검색 후 클릭으로 프리셋 선택 정상 (필터된 상태에서도 동작)
- [ ] 빌드: `npm run build:pixels && build:spark && build:buddy && vsce package` 무에러
- [ ] OpenVSX 배포 v0.22.0 게시 확인

## Impact / Risks

- **영향 범위**: 거의 모든 UI 텍스트 (대규모 치환)
- **리스크**: 키 매핑 누락 시 한글이 잔존하거나 키 자체 노출 — 검증 단계에서 panel 전체 시각 점검 필수
- **롤백**: `git revert <commit>` + 한 단계 위 버전(v0.22.1)으로 재배포

## 일정 가정

- Stage 3 실행: 단일 커밋으로 진행 (i18n과 Spark 검색을 한 커밋에 묶어도 무방 — 둘 다 사용자 가시 변경, 같은 모달 영역)
- 또는 i18n 커밋 / Spark 검색 커밋 2개로 분리 (리뷰 가독성 우선 시)
