# Claude Skills Panel

> 스킬 외우기 귀찮아서 GUI로 보고싶어서 만듦.

VSCode/Cursor 사이드바에서 Claude Code 스킬 목록을 한눈에 보고, 클릭 한 번으로 `/skill` 트리거를 클립보드에 복사하는 확장.

## 기능
- `~/.claude/skills/` (user), `프로젝트/.claude/skills/` (project), `~/.claude/plugins/cache/**` (plugin)에서 `SKILL.md` 자동 스캔
- frontmatter의 `name` / `description`을 읽어 그룹별 트리로 표시
- 항목 클릭 → `/skill-name` 클립보드 복사 (Claude Code 채팅에 붙여넣기)
- 우측 인라인 액션: SKILL.md 직접 열기
- 새로고침 버튼

## 설치 (개발 모드)
1. VSCode/Cursor에서 이 폴더를 연다
2. `F5` (Run Extension) → Extension Development Host 창 실행
3. 좌측 액티비티바의 마법지팡이 아이콘 클릭

## 설치 (vsix)
```bash
npm i -g @vscode/vsce
cd ~/claude-skills-panel
npm run package
# 생성된 .vsix를 VSCode "Install from VSIX..."로 설치
```

## 게시
```bash
# VSCode Marketplace
npx vsce login <publisher>
npm run publish:vsce

# OpenVSX (Cursor 등)
npx ovsx publish -p <token>
```

## 한계 (PoC)
- "채팅 입력창에 자동 주입"은 Claude Code 공식 API가 없어 클립보드 복사로 대체
- 플러그인 폴더 버전 다를 때 동일 스킬이 중복 노출될 수 있음
