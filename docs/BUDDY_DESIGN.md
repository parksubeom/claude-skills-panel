# Buddy 디자인 가이드

현재 6단계 (Egg → Hatchling → Kitten → Cat → Monkey → Dragon) 디자인을 전면 개편하기 위한 작업 문서. 픽셀 아트 작업이 처음이라도 따라할 수 있게 정리.

---

## 시스템 (현재)

- 위치: [scripts/build-buddy-icons.js](../scripts/build-buddy-icons.js) `STAGES` 배열
- 그리드: **16×16** (한 캔버스 16개 칸 × 16개 칸)
- 색상 채널: `K`(검은 외곽선), `W`(메인 색), `A`(보조 색), `B`(3차 색), `.`(투명)
- 출력: `assets/pixel-icons/buddy/stage{0..5}.png` (96×96 PNG, nearest-neighbor 업스케일)

빌드 명령:
```bash
npm run build:buddy
```

---

## 컨셉 옵션 (5가지 후보, 픽셀 아트 흐름 각각 다름)

> 진화 컨셉을 한 줄로 정해두면 6단계가 자연스럽게 연결됨. "관련 없는 6캐릭"은 잘 안 어울림.

### A. 동물 진화 (현재 컨셉)
```
Egg → Hatchling → Kitten → Cat → Monkey → Dragon
```
- 친근. 누구나 알아봄. 다만 흐름이 약간 점프 (kitten → monkey?).
- 개선: Cat → Tiger → Phoenix → Dragon 같이 동일 계열 유지

### B. 슬라임 진화 (RPG 풍)
```
Egg → Slime → Slime King → Crystal Slime → Knight Slime → Dragon Slime
```
- 게임 메타포. RPG 분위기 강함. 색상으로 구별 (초록 → 파랑 → 보라 → 금색).

### C. 로봇 / 사이버 (개발자 톤)
```
Chip → Bolt-Bot → Servo-Bot → Drone → Mech → AI-Core
```
- "코딩 도구" 메타포. CLI/터미널 분위기. 색상은 어두운 base + 액센트 (초록/파랑).

### D. 마법사 (Wizards-of-Code)
```
Spark → Apprentice → Wizard → Archmage → Lich → Cosmic Sage
```
- "마법" 메타포 (= AI/Claude). 로브, 모자, 지팡이, 결정.

### E. 픽셀 펫 (Tamagotchi 스타일)
```
Egg → Baby → Kid → Teen → Adult → Mythic
```
- 가장 친근. 나이대로 진화. 표정/포즈 변화로 단계 구별.

---

## 추천 (개인 의견)

**B (슬라임)** 또는 **C (로봇)** 이 픽셀 아트 16×16에 가장 잘 맞음. 이유:
- 동물(A)은 16×16에선 디테일 부족, 종 구별 어려움
- 마법사(D)는 인간형이라 비율 잡기 까다로움
- 슬라임/로봇은 단순 형태 + 색·장식으로 변화 → 작은 캔버스에 깔끔

**B 슬라임이 가장 무난**: 게이미피케이션 분위기 강화 + 픽셀 아트 친화 + 색상으로 진화 표현 쉬움.

---

## 디자인 워크플로우

### 도구 후보 (무료)

| 도구 | 특징 | 추천 여부 |
|---|---|---|
| [Aseprite](https://www.aseprite.org/) | 픽셀 아트 표준. $20 유료, Steam에 데모 | 🔴 최고. 한 번 사면 평생 |
| [Piskel](https://www.piskelapp.com/) | 무료 웹 기반. 간단한 픽셀 작업 충분 | 🟢 무료, 즉시 시작 |
| [LibreSprite](https://libresprite.github.io/) | Aseprite 무료 fork | 🟢 |
| [Pixilart](https://www.pixilart.com/draw) | 무료 웹 기반, 공유 기능 강함 | 🟢 |

**추천**: 처음이면 **Piskel** (브라우저, 가입 없이 시작) → 진지해지면 Aseprite.

### 단계별 진행

#### 1. 컨셉 결정
6단계 흐름을 한 줄 메모로 적기.

예 (B 슬라임 컨셉):
```
0. Goo Drop          - 초록색, 작고 둥글
1. Slime             - 초록, 눈 두 개, 표정
2. Bouncy Slime      - 파란색, 점프 모션 hint
3. Crystal Slime     - 보라, 머리에 결정
4. Knight Slime      - 회색+금, 작은 칼/방패
5. Dragon Slime      - 보라+금, 작은 날개/뿔
```

#### 2. 색상 팔레트
각 스테이지마다 4색까지 (`K`/`W`/`A`/`B`).

색상 추천 (테마와 어울리게):
- **K (외곽선)**: `#0b0d12` 항상 (현재 시스템)
- **W (메인)**: 진화할수록 채도 ↑
- **A (보조)**: 강조/디테일
- **B (3차)**: 그림자/장식

```
0 Goo:        K=#0b0d12  W=#5fb95f  A=#3b8c3b  B=#2d6a2d  (옅은 초록)
1 Slime:      K=#0b0d12  W=#22c55e  A=#15803d  B=#0b0d12  (초록 + 검은 눈)
2 Bouncy:     K=#0b0d12  W=#3a7be0  A=#7dd3fc  B=#1e40af  (파랑)
3 Crystal:    K=#0b0d12  W=#a855f7  A=#fbbf24  B=#7c3aed  (보라+금색 결정)
4 Knight:     K=#0b0d12  W=#9aa3b3  A=#fbbf24  B=#5a6273  (회색+금색 무장)
5 Dragon:     K=#0b0d12  W=#a855f7  A=#fbbf24  B=#ef4444  (보라+금+빨강)
```

#### 3. Piskel에서 그리기
1. 새 스프라이트 → 16×16 → 6 frames
2. 각 frame이 한 단계
3. 색상 4개 팔레트 미리 정해두고 한정 사용
4. 외곽선부터 → 내부 색 채우기 → 디테일 (눈/하이라이트)

#### 4. 그리드로 변환
Piskel의 픽셀 데이터를 16줄 × 16글자 텍스트로 옮김.

도움 함수: 아래 [grid 변환 스크립트](#grid-변환-스크립트)

또는 직접 그리기 (작은 캔버스라 16×16 = 256 글자, 30분이면 한 단계 완성).

#### 5. STAGES 배열에 입력
[scripts/build-buddy-icons.js](../scripts/build-buddy-icons.js)의 `STAGES` 배열의 grid를 새로 작성한 16줄로 교체.

#### 6. 빌드 & 확인
```bash
npm run build:buddy
```
→ `assets/pixel-icons/buddy/stage{0..5}.png` 갱신.

VS Code 패널에서 확인 — 스킬 클릭으로 카운트 늘려서 다음 단계 보기 (또는 `~/.claude/skills-panel-config.json`의 `character.actions` 값 임시 수정).

---

## 빈 템플릿 (복사해서 사용)

```js
{
  id: 0, name: 'Egg', threshold: 0,
  K: '#0b0d12', W: '#f4e9d8', A: '#fbbf24', B: '#e89045',
  grid: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
},
```

---

## 디자인 팁 (16×16 픽셀 아트)

### Do
- **외곽선 두껍게** (1픽셀이지만 모든 모서리 K로 감싸기)
- **얼굴은 가급적 1×1 픽셀** (눈은 그냥 검은 점 하나)
- **색상 단계는 W/A/B 세 가지로 충분** — 더 많으면 16×16에서 떡짐
- **단계 간 실루엣 차이 분명히** — 0(작고 단순) → 5(크고 복잡)
- **참고 이미지 모으기**: 8-bit 게임 (Pokémon Gen 1, Final Fantasy NES) 캐릭터 데모

### Don't
- **그라데이션** — 픽셀 아트 의미 사라짐
- **anti-aliasing** — 자동 매끈 처리 OFF (Piskel은 기본 OFF)
- **너무 많은 디테일** — 16×16엔 외곽선+1주요특징+1보조특징이면 충분
- **흰 배경 가정** — 우리 패널은 다크. 외곽선 K + 배경 투명 (`.`)

---

## Grid 변환 스크립트

Piskel에서 PNG export 한 후, 그 PNG를 16줄 그리드로 자동 변환:

```js
// scripts/png-to-grid.js (참고용 - 필요하면 추가 가능)
const sharp = require('sharp');
async function pngToGrid(file, palette) {
  const { data, info } = await sharp(file).resize(16, 16, { kernel: 'nearest' }).raw().toBuffer({ resolveWithObject: true });
  const lines = [];
  for (let y = 0; y < 16; y++) {
    let row = '';
    for (let x = 0; x < 16; x++) {
      const idx = (y * 16 + x) * 3;
      const hex = '#' + [...data.slice(idx, idx + 3)].map(c => c.toString(16).padStart(2, '0')).join('');
      // map to nearest palette entry
      let best = '.', bestDist = Infinity;
      for (const [ch, pHex] of Object.entries(palette)) {
        const dist = colorDistance(hex, pHex);
        if (dist < bestDist) { best = ch; bestDist = dist; }
      }
      // alpha 0 → '.'
      if (data[idx + 3] === 0) best = '.';
      row += best;
    }
    lines.push(`'${row}',`);
  }
  return lines.join('\n');
}
```

이 스크립트 필요하면 알려주세요 — 추가 작업.

---

## 단계별 threshold 변경 가능

현재:
```
0: 0      (시작부터)
1: 10     (10번 사용)
2: 30
3: 100
4: 300
5: 1000
```

너무 빠르거나 너무 느리면 `threshold` 값만 조정. 진화 페이스가 사용자 경험 큰 영향 — 너무 느리면 동기 부족, 너무 빠르면 의미 없음.

---

## 마무리

디자인 자체는 사용자 영역. 새 6단계 디자인 만들고 알려주시면:
1. 그 디자인 → 16×16 그리드로 변환 도와드립니다
2. STAGES 배열 갱신
3. 새 버전 게시 (이번 v0.28.0 또는 다음)

먼저 어떤 컨셉 (A/B/C/D/E)으로 갈지 정하시면 색상 팔레트 + 단계별 변화 가이드 드릴 수 있습니다.
