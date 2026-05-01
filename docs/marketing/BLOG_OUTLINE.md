# 블로그/포스트 outline

게시처는 자유. dev.to, hashnode, medium, velog, 본인 사이트 모두 동일 outline 활용.

---

## 후보 1 — "Building a VS Code panel for Claude Code in a week"

### 톤
- 1인칭 빌더 시점, 솔직한 사이드 프로젝트 회고
- 코드는 전부 공개, 인용 허용
- 의도된 청중: AI 개발 도구 사용자, VS Code 익스텐션 빌더

### 구조

#### 1. 시작 — 왜 만들었나 (300자)
- "Claude Code의 슬래시 커맨드를 매번 외워서 쳐야 하는 게 귀찮았다."
- 한 줄짜리 동기. 거창한 비전 없음.

#### 2. MVP는 작았다 (400자)
- 첫날: 카드 그리드 + 클릭 → 클립보드 복사
- 그 다음 alias, 편집 모달, 사용 통계, Quick Bar...
- 사이드 프로젝트의 자연스러운 흐름

#### 3. 핵심 기술 결정 (1500자, 메인)

**a. Webview에서 file system 접근하기 (~500자)**
- VS Code webview는 Node.js 직접 못 씀
- 호스트(extension main)가 fs 작업하고 webview에 message로 전달
- 코드 인용: `discoverPluginSources()` 같은 헬퍼

**b. i18n 자체 구현 (~400자)**
- 외부 라이브러리 없음. 50줄짜리 strings.js
- 키 매칭, fallback, 변수 보간만 구현
- 검증 자동화: `grep -E "[가-힣]" extension.js`로 잔존 한글 검출

**c. Plugin marketplace 통합 (~600자)**
- ~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/ 구조 walk
- installed_plugins.json과 join해서 install state 계산
- 설치 명령은 클립보드로 보내기 (Claude Code CLI를 직접 spawn 안 함 — 사용자 컨텍스트 보존)

#### 4. 잘못 선택했던 것들 (700자)
- replace_all로 한 번에 치환했다가 들여쓰기 다른 한쪽이 안 바뀐 사건
- 변수 shadowing 사고 (t 헬퍼와 .map((t, i) => ...))
- "수정 후 grep 검증" 습관화

#### 5. 의외로 잘된 것들 (500자)
- 게임 요소가 사용자에게 의외로 어필 — toggle off 가능하게 둔 게 컸음
- onboarding을 인터랙티브 카드로 만든 게 첫 인상 차이 큼
- demo GIF 한 장이 README의 모든 텍스트보다 컨버전 높음

#### 6. 숫자 (있을 경우)
- 1주에 N회 커밋, 26개 패치, 코드 X줄
- 게시 후 받은 다운로드 수 (해당 시점)

#### 7. 만약 다시 시작한다면 (400자)
- 처음부터 i18n 분리 (한글/영문 섞이면 나중에 정리 비용)
- 풀플로우 스킬을 첫날부터 — 한꺼번에 다 만들면 PR 너무 커짐
- demo GIF 만들 시간 30분 미리 잡아두기

#### 8. 마무리 + 링크 (200자)
- VS Code Marketplace / OpenVSX / GitHub
- 기여·피드백 환영
- "Built with Claude Code" 한 줄

### 분량
약 4000–4500자 (5–7분 읽기). dev.to/hashnode 평균 길이.

---

## 후보 2 — "A built-in Marketplace browser for Claude Code plugins"

### 톤
- 단일 기능 깊게 파고드는 기술 글
- 의도된 청중: Claude Code SDK / 플러그인 개발자

### 구조

#### 1. The 243 plugin problem (200자)
- claude-plugins-official에 243개 → 어떤 게 있는지 알기 어려움
- `/plugin` UI는 있지만 검색·필터 약함

#### 2. What I built (300자)
- 패널 안에 모달 — 검색, 카테고리 필터, "installed only" 토글
- 한 클릭 install (슬래시 커맨드를 사용자 실행 모드로 dispatch)

#### 3. The data layer (1000자)
- ~/.claude/plugins/marketplaces/<name>/.claude-plugin/marketplace.json 파싱
- ~/.claude/plugins/installed_plugins.json과 join
- 코드 인용: `loadMarketplaceCatalog()`
- Edge case: 마켓플레이스 manifest 형식 다양 (source 필드만 5종 — `git-subdir`, `url`, `github`, `./path`, `gitlab` 등)

#### 4. The UI layer (700자)
- Lazy load — 모달 첫 오픈 시에만 host에 요청
- 검색·정렬·필터 모두 클라이언트 (200개 정도 데이터는 가벼움)
- 코드 인용: 카드 markup
- 카테고리 자동 추출

#### 5. Install flow (500자)
- 슬래시 커맨드 dispatch — 직접 `claude plugin install` 호출 안 함
- 이유: 사용자 인증 컨텍스트, telemetry, prompt 등 다 Claude Code가 갖고 있어야 정상 동작
- 클립보드 → 사용자가 Claude Code에 붙여넣기 → Claude Code가 처리

#### 6. What's next (300자)
- Marketplace 레이팅·다운로드 카운트 표시 (있으면)
- 새 플러그인 알림
- 한 번 install한 후 자동 enable + panel refresh

### 분량
약 3000자.

---

## 후보 3 — "Why my dev tool became a pixel-art game (and you can turn it off)"

### 톤
- 가벼움, 디자인/제품 사고
- 의도된 청중: 일반 개발자 + 디자인 관심층

### 구조

1. 시작 — "본 기능은 카드 클릭 한 번이 끝. 너무 단순했다."
2. 그래서 자연스럽게 더해진 것들 — 마스터리, 업적, 캐릭터, 테마
3. **모두 toggle로 끌 수 있게 만든 게 핵심 디자인 결정**
4. 사용자 반응의 양극 — "재밌다" vs "방해 안 됐으면" 둘 다 만족
5. 게이미피케이션 안 좋아하는 사람도 떠나지 않게 하는 디자인 노트
6. 어차피 사이드 프로젝트는 즐거워야

분량: ~2000자, 가벼운 회고.

---

## 게시 매트릭스

| 글 후보 | dev.to | Hashnode | Medium | velog (한국) | brunch (한국) |
|---|---|---|---|---|---|
| 후보 1 (1주 빌드기) | ✅ 영문 | ✅ 영문 | ✅ 영문 | ✅ 한국어 번역 | △ |
| 후보 2 (Marketplace 깊이) | ✅ 영문 | ✅ 영문 | △ | △ | △ |
| 후보 3 (게이미피케이션 결정) | ✅ | ✅ | ✅ | ✅ | ✅ |

dev.to와 Hashnode는 canonical_url 지정해서 SEO 중복 회피 (자기 사이트 → dev.to).

---

## 작성 팁

- **첫 단락**에 데모 GIF 한 장 박기 — 본문 안 읽어도 핵심 전달
- **코드 인용**은 너무 길지 않게 — 5–10줄 한 블록, 풀 코드는 GitHub 링크
- **TOC 자동 생성**은 dev.to·hashnode가 기본 지원
- **태그**는 5개 이내, 검색 의도 고려
  - `#claude` `#vscode` `#typescript` `#sideproject` `#devtools`
- **CTA**는 마지막에 한 번만, 강요 아니게 — "If you're using Claude Code, give it a try" 정도
