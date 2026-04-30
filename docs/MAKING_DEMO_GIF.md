# 데모 GIF 만들기

Marketplace 리스팅에서 GIF 한 장이 다운로드 컨버전에 가장 큰 영향을 미칩니다. 6–10초 길이로, 로딩 빠르게.

---

## 권장 시나리오 (10초)

| 초 | 행동 | 보여주려는 것 |
|---|---|---|
| 0–1 | 빈 패널 (스킬 0개) → onboarding 카드 등장 | 첫 인상 / 시각 임팩트 |
| 1–2 | "Install superpowers" 카드 클릭 | 한 번의 클릭으로 설치 시작 |
| 2–4 | 스킬 카드들 fade-in, 30개 등장 | 자동 발견 |
| 4–6 | 검색바에 `today` 입력 → fuzzy 매치 | 검색 품질 |
| 6–8 | 카드 클릭 → 토스트 + 카드 LV.1 → ★ 등장 | 게이미피케이션 |
| 8–10 | 🎨 클릭 → 테마가 dark→retro→lcd로 변환 | 시각 변형 |

---

## 녹화 — macOS

```bash
# QuickTime Player → File → New Screen Recording → 영역 선택 → Record
# 멈춘 뒤 .mov 저장
```

또는 [Kap](https://getkap.co)으로 GIF 직접 출력 (가벼움).

## 녹화 — Linux/Win

- Linux: `peek`, `kazam`
- Windows: ScreenToGif (gif 직출력 무료)

## .mov → .gif 변환 (macOS)

```bash
brew install ffmpeg gifski
# 1단계: mov → png 시퀀스 (12fps면 가벼움)
ffmpeg -i demo.mov -vf "fps=12,scale=820:-1:flags=lanczos" demo-frames/%04d.png
# 2단계: gifski로 고품질 GIF
gifski --fps 12 --quality 85 -o demo.gif demo-frames/*.png
```

목표: **820px 너비, 600KB 미만**. 1MB 넘으면 README에서 로드가 느려져 컨버전 떨어짐.

대안: GIF 대신 **`<video>` 태그 + .webm 또는 .mp4**. README에서는 GIF가 호환성 좋아 일반적이지만, Marketplace에서는 둘 다 지원.

---

## 저장 위치

```
docs/screenshots/demo.gif
```

만들고 나면 README의 다음 줄을 활성화:

```markdown
<!-- ![Demo](https://raw.githubusercontent.com/parksubeom/claude-skills-panel/main/docs/screenshots/demo.gif) -->
```

→ 코멘트 마커(`<!-- -->`) 제거.

`git add docs/screenshots/demo.gif && git commit -m "docs: add demo gif"` 후 다음 릴리스(`npm version patch && git push --follow-tags`)에서 Marketplace에 자동 반영됩니다.

---

## 시간 들이지 않고 시작하는 옵션

- 스크린샷 3–4장 시리즈로 대체 — `docs/screenshots/`에 추가, README에서 grid로 표시.
- Loom 짧은 영상 링크만 README에 박기 (GIF보다 가볍지만 외부 호스팅 의존).

GIF가 준비될 때까지는 코멘트 처리해두고, 준비되면 한 줄 풀기만 하면 됩니다.
