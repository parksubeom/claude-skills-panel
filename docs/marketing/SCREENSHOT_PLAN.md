# 스크린샷 / 이미지 자료 계획

Marketplace 리스팅, README, X 트레드, Product Hunt, Reddit 게시 — 모두 같은 이미지 풀에서 가져다 씁니다. 6장만 있으면 어디든 충분.

---

## 필수 6장 (우선순위 순)

### 1. **HERO** — `docs/screenshots/hero.png`
- **목표**: Marketplace 리스팅 첫 화면, 트위터 1장 카드, README 상단
- **구성**: 넓은 패널 모드 (bottom panel), 약 25개 스킬 카드가 그리드로 배치, Quick Bar 상단에 6슬롯 모두 채움, 버디는 Cat 단계, 검색바 비어 있음
- **테마**: Dark (기본)
- **사이즈**: 1280×800 (16:10) 권장
- **포인트**: "한 화면에 모든 게 다 보인다" 인상

### 2. **PIXEL ART** — `docs/screenshots/pixel-themes.png`
- **목표**: 차별화 시각 임팩트, 게이미피케이션 기조 전달
- **구성**: 좌·중·우로 dark / retro / lcd 테마 한 장씩 합성. 각 화면은 같은 5개 카드만 보임 (비교 가능)
- **사이즈**: 1280×800
- **합성 도구**: Figma, Photopea, Canva 무료. 좌→우 가로 분할.

### 3. **PLUGIN BROWSER** — `docs/screenshots/marketplace-browser.png`
- **목표**: USP("Claude Code의 Marketplace UI") 전달
- **구성**: 🛒 모달 열린 상태, 카탈로그 그리드 (8–12개 카드 보이는 정도), 한 카드는 호버 상태 (호버 효과), 검색창에 "review" 입력 (filtered)
- **사이즈**: 1280×800

### 4. **QUICK BAR + KEYBOARD** — `docs/screenshots/quickbar-keys.png`
- **목표**: "키 1–6으로 어디서든" 강조
- **구성**: 패널 상단의 Quick Bar 줌인. 6슬롯 모두 채워짐. 키 라벨 1-6 보임. 옆에 키보드 그래픽 또는 단축키 hint 텍스트
- **사이즈**: 1280×400 (와이드 banner 풍)

### 5. **GAMIFICATION** — `docs/screenshots/character-sheet.png`
- **목표**: 게이미피케이션 깊이 전달 (캐릭터 시트 모달)
- **구성**: 🪄 캐릭터 시트 모달 열림. INT/DEX/VIT/LCK 스탯 표시, Cat/Fox 단계 캐릭터, progress bar
- **사이즈**: 1280×800

### 6. **WEEKLY REPORT** — `docs/screenshots/weekly-report.png`
- **목표**: "내 사용 패턴이 데이터로 보인다" 인상 + 마크다운 export 어필
- **구성**: 📊 위클리 리포트 모달. 7일 차트 막대 그래프, TOP 5 스킬, 좌측에 "📋 Copy as Markdown" / "💾 Save as .md" 버튼 보임
- **사이즈**: 1280×800

---

## 보조 (선택, ROI 큰 순)

### A. **DEMO GIF** — `docs/screenshots/demo.gif`
- 6–10초, 820px 너비, <600KB
- 시나리오는 [docs/MAKING_DEMO_GIF.md](../MAKING_DEMO_GIF.md) 참고
- README 상단에 hero 자리

### B. **COVER (PRODUCT HUNT)** — `docs/screenshots/ph-cover.png`
- 1270×760 (Product Hunt 권장 비율)
- 패널 + 큰 텍스트 한 줄 ("The fastest way to use Claude Code slash commands")
- 픽셀풍 폰트 + 작은 캐릭터 일러스트

### C. **TWITTER CARD** — `docs/screenshots/twitter-card.png`
- 1200×675 (16:9)
- HERO와 비슷하지만 텍스트 오버레이 ("Auto-discovers everything · One-click install · 3 themes")

---

## 합성 / 편집 팁

### 스크린샷 찍기 (macOS 기준)
```
Cmd+Shift+5 → 영역 선택 → 옵션 → "Show floating thumbnail" 끄면 ~/Desktop 직저장
또는 Cleanshot X 가 chamfer 그림자 자동 처리
```

### 가짜 데이터로 채우기
- 빈 패널이 안 좋아 보이면 `~/.claude/skills-panel-config.json`에 alias·usage·achievements 풍부하게 임시 채우고 스크린샷 → 백업해뒀던 파일로 복구
- 또는 별도 macOS 사용자 / VM에서 demo 환경 구성

### 픽셀 폰트가 깨질 때
- 스크린샷 후 Photopea에서 **Image → Image Size → Nearest Neighbor** 재샘플링하면 픽셀 깔끔
- 또는 Retina 화면에서 찍기 (1x 출력은 안 흐려짐)

### 파일 사이즈
- PNG → `pngquant --quality=80-95 file.png` 로 ~50% 압축
- 1MB 넘으면 README/listing 로딩 느려짐. 목표 < 500KB/장.

---

## 게시처별 사용 매트릭스

| 이미지 | README | VS Marketplace | OpenVSX | X 트윗 | Reddit | Show HN | Product Hunt |
|---|---|---|---|---|---|---|---|
| HERO | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (cover candidate) |
| pixel-themes | ✅ | ✅ | | ✅ (thread) | ✅ | | ✅ |
| marketplace-browser | ✅ | ✅ | | ✅ (thread) | ✅ | ✅ | ✅ |
| quickbar-keys | | ✅ | | ✅ (thread) | | | ✅ |
| character-sheet | | ✅ | | ✅ (thread) | ✅ | | ✅ |
| weekly-report | | ✅ | | ✅ (thread) | | | ✅ |
| demo.gif | ✅ | ✅ | ✅ | ✅ (1트윗으로 전체 어필) | ✅ | ✅ | ✅ |
| ph-cover | | | | | | | ✅ |
| twitter-card | | | | ✅ (link card) | | | |

---

## 작업 순서 추천

1. **demo.gif 먼저** — 가장 큰 임팩트. 다른 이미지 없어도 GIF 한 장으로 게시 가능
2. **HERO** — listing 즉시 갱신
3. **marketplace-browser, character-sheet, weekly-report** — 한 세션에 (모달 열고 닫기만 하면 됨)
4. **pixel-themes** — 합성 작업 (시간 소요)
5. **quickbar-keys** — 와이드 배너로 별도 합성

GIF + HERO 2장만으로도 V0 게시 가능. 나머지는 점진적 추가.
