# 2026-04-30 작업 서머리 — Claude Code Skills Panel

## 19:15

### v0.21.1 — Spark 프리셋 아이콘 선택 UI
- 스킬 편집 모달에 내장 픽셀아트 그리드(`spark/`) 클릭으로 아이콘 지정
- 우선순위: custom upload > spark preset, 저장 시 상호 배타 처리
- `assets/pixel-icons/extracted/` 16개 → `spark/` 30개로 재편
- 액티비티 바 아이콘 `activity-icon.svg` 신규 분리
- OpenVSX 배포 (commit `a6176f9`)

### v0.22.0 — i18n (en/ko) 인프라 + Spark 검색·필터
- 풀플로우 1사이클(브레인스토밍→플랜→실행→검증→배포)로 진행
- `i18n/strings.js` 신규: ko/en 리소스 + `tFor/resolveLocale/interpolate`
- `extension.js` 한글 100+ 위치 → `t()` 호출, webview에 `STR/LOCALE` inject + 클라이언트 `t()` 헬퍼
- 푸터 `🌐 EN/KO` 토글, `setLocale` 메시지로 `cfg.meta.locale` 갱신 + 재렌더
- locale 우선순위: `cfg.meta.locale` → `vscode.env.language` → `'en'`
- Spark 모달에 검색 인풋(부분 일치, 대소문자 무시, 모달 오픈 시 초기화)
- `achievements.js` `name`/`desc` → `nameKey`/`descKey`로 추상화
- `userConfig.js` `getLocale`/`setLocale` export
- `package.json` description 영문 전환
- OpenVSX 배포 + main 푸시 (commit `45a7659`)

### 메모
- 다음 풀플로우 후보: ③ 그룹 커스텀, ④ Quick Bar 드래그 재정렬, ⑤ 테마 토글
- ⑥ 버디 상호작용 강화는 사용자 디자인 작업 후 별도 진행
