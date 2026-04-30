# 2026-04-29 작업 서머리 — Claude Code Skills Panel

## 16:04

### Claude Buddy 시스템
- 6단계 동물 진화 캐릭터 (Egg → Hatchling → Kitten → Cat → Monkey → Dragon)
- 16×16 사이드뷰 스프라이트, 검은 외곽선, 참조 이미지 기반 디자인
- 패널 내 자유 이동 — 스킬 클릭 시 해당 카드 옆으로 jump + cheer 애니메이션
- 4개 스탯 (INT/DEX/VIT/LCK) 자동 성장

### 실행 모드 단순화
- Off 제거 → 3단계: Paste / Auto / Term
- Auto: macOS osascript / Windows PowerShell / Linux xdotool 크로스플랫폼 지원

### Quick Bar 개선
- auto-fit 그리드로 빈칸 없이 레이아웃 정렬
- 진화 단계별 슬롯 해금 (1→6)
- 슬롯 크기 스킬 카드와 동일하게 통일

### 반응형 툴바
- 검색바 + 버튼 flex-wrap 분리
- 좁은 패널에서 버튼이 검색바 아래로 자동 이동

### Spark 아이콘 시스템
- build-spark-icons.js: 30개 + deprecated 별칭 (execute-plan 등)
- 마켓 아이콘: 128×128 픽셀 아트 Claude 스파크

### OpenVSX 배포 (v0.20.0 → v0.20.2)
- 최초 MVP 배포 (parksubeom namespace)
- README 영문 전환 + 스크린샷 2장 (좁은 패널 + 넓은 패널)
- Namespace claim 이슈 제출 (eclipse-openvsx/openvsx)

### 신규 스킬
- `/bump-and-publish` — 버전 업 + OpenVSX 재배포 (프로젝트 전용)
- `/work-log` — 작업 내용을 daily summary에 기록 (전역)
