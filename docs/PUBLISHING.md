# 배포 가이드

릴리스는 [.github/workflows/publish.yml](../.github/workflows/publish.yml)이 자동으로 처리합니다. 이 문서는 **최초 1회 설정**과 **배포 흐름**을 다룹니다.

---

## 최초 1회 설정

### 1. VS Code Marketplace publisher 등록

1. https://aka.ms/vscode-create-publisher 에서 Microsoft 계정으로 로그인.
2. publisher ID를 **정확히 `parksubeom`** 으로 생성. ([package.json](../package.json)의 `publisher` 필드와 반드시 일치해야 함). 만약 `parksubeom`이 이미 사용 중이면 package.json 쪽을 등록한 ID로 변경.
3. **Marketplace → Manage** 권한이 있는 PAT(Personal Access Token) 발급:
   - https://dev.azure.com → 우측 상단 사용자 설정 → **Personal Access Tokens**
   - Organization: **All accessible organizations**
   - Scopes → **Custom defined** → Marketplace → **Manage** 체크
4. PAT 복사 (한 번만 표시되니 즉시 백업).

### 2. OpenVSX publisher

1. https://open-vsx.org 에 GitHub 계정으로 로그인.
2. `parksubeom` namespace 소유 확인 (v0.20 배포 시점에 클레임 완료).
3. https://open-vsx.org/user-settings/tokens 에서 액세스 토큰 발급.

### 3. GitHub repo Secrets 등록

GitHub 레포의 **Settings → Secrets and variables → Actions → New repository secret**:

| 이름 | 값 |
|---|---|
| `VSCE_PAT` | 1단계에서 발급한 Azure DevOps PAT |
| `OVSX_PAT` | 2단계에서 발급한 OpenVSX 토큰 |

특정 마켓을 일시적으로 스킵하려면 **Variable** (Secret 아님)로 설정:

| 변수 | 효과 |
|---|---|
| `SKIP_VSCE=true` | VS Code Marketplace 배포 스킵 |
| `SKIP_OVSX=true` | OpenVSX 배포 스킵 |

`VSCE_PAT` 잡은 시크릿이 비어 있으면 경고만 띄우고 자동 스킵하도록 만들어져 있습니다. Azure publisher 승인 대기 중이라도 OpenVSX 발행은 정상 진행됩니다.

---

## 릴리스 절차

```bash
# 1. 버전 bump (npm version 이 commit + tag 자동 생성)
npm version patch   # 또는 minor / major
#    → "v0.23.1" 커밋과 v0.23.1 태그 생성

# 2. 브랜치 + 태그 푸시
git push origin main --follow-tags
```

새 `v*.*.*` 태그가 푸시되면 `Publish Extension` 워크플로우가 자동 실행됩니다:

1. **build** — `npm ci`, `build:pixels|spark|buddy`, `.vsix` 패키징, 아티팩트 업로드.
2. **publish-ovsx** — 아티팩트 다운로드 후 `npx ovsx publish`.
3. **publish-vsce** — 아티팩트 다운로드 후 `npx vsce publish`.
4. **release** — 태그명으로 GitHub Release 생성하고 `.vsix` 첨부.

publish 두 개는 **병렬 실행**되며, 한쪽이 실패해도 다른 쪽을 막지 않습니다.

### 수동 실행 (재배포)

버전 bump 없이 다시 배포해야 한다면 **Actions → Publish Extension → Run workflow** 에서 수동 트리거. 현재 브랜치 tip 기준으로 다시 패키징됩니다.

---

## 배포 후 확인

- **OpenVSX** — https://open-vsx.org/extension/parksubeom/claude-skills-panel
- **VS Marketplace** — https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel
- **GitHub Release** — `.vsix` 자동 첨부 (오프라인 설치: `code --install-extension claude-skills-panel-X.Y.Z.vsix`)

새 버전이 IDE 업데이트 체크에 잡히기까지 **수 분 ~ 1시간** 정도 걸릴 수 있습니다. 보이지 않으면 IDE 익스텐션 탭에서 "Check for Updates"를 눌러보세요.

---

## 로컬 수동 배포 (CI 장애 시 fallback)

CI가 동작하지 않을 때만:

```bash
npm run package
npx ovsx publish *.vsix -p $OVSX_PAT
npx vsce publish --packagePath *.vsix -p $VSCE_PAT
```
