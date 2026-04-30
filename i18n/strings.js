// i18n string resources for Claude Skills Panel.
// Locale is resolved at render time (cfg.meta.locale → vscode.env.language → 'en').
// All user-visible UI strings live here so the rest of the codebase only deals with keys.

const STRINGS = {
  en: {
    // Skill source groups
    'group.user.label': 'My Skills',
    'group.project.label': 'Project',
    'group.plugin.label': 'Plugin',
    'group.plugin.sub': '{plugins} plugins',
    'group.custom.sub': 'custom',
    'group.edit': 'Edit groups',

    // Skill cards
    'card.edit': 'Edit',
    'card.descEmpty': 'No description',
    'card.usage': 'Used {count}× · LV.{level}',
    'card.notUsed': 'Not used yet',
    'card.copyHint': 'Click → copy /{name}',

    // Quick bar
    'quickbar.unlockHint': '({unlocked}/6 slots · evolve to unlock more)',
    'quickbar.locked': 'Unlocks at the {stage} stage',

    // Sections
    'section.recent': 'Recent',
    'section.hidden': 'Hidden',

    // Empty state
    'panel.empty': 'No skills found. Add SKILL.md under ~/.claude/skills.',

    // Onboarding (shown when zero skills are discovered)
    'onboarding.title': 'Welcome — let\'s wire up your skills',
    'onboarding.sub': 'This panel auto-discovers every Claude Code slash command on your machine. Pick one of the paths below to get started.',
    'onboarding.step1.title': 'Install a battle-tested plugin',
    'onboarding.step1.desc': 'Superpowers ships ~50 slash commands for TDD, code review, debugging, and more — installed in one shot via the official marketplace.',
    'onboarding.step1.cta': 'Click to copy & run',
    'onboarding.step2.title': 'Add your own commands',
    'onboarding.step2.desc': 'Drop a Markdown file under ~/.claude/commands/ and it shows up here automatically. SKILL.md format also works under any skills/ folder.',
    'onboarding.step3.title': 'Make it yours',
    'onboarding.step3.desc': 'Custom themes, custom groups, achievements, evolving buddy, Quick Bar with keyboard 1–6 — all opt-in, all togglable.',
    'onboarding.foot': 'Once you have skills, this screen disappears and the panel takes over.',
    'toast.onbInstallTriggered': 'Copied — paste in Claude Code to install',

    // Toolbar
    'toolbar.searchPh': 'Search',
    'toolbar.sort': 'Sort',
    'toolbar.sortDefault': 'Default sort',
    'toolbar.sortRecent': 'Recently used',
    'toolbar.sortUsage': 'Most used',
    'toolbar.achievements': 'Achievements',
    'toolbar.weeklyReport': 'Weekly report',
    'toolbar.execMode': 'Execution mode',
    'toolbar.sound': 'Toggle sound',
    'toolbar.scanlines': 'Toggle CRT effect',
    'toolbar.theme': 'Theme',
    'toolbar.locale': 'Language',
    'toolbar.groups': 'Manage groups',
    'toolbar.marketplace': 'Browse plugins',
    'toolbar.settings': 'Settings',

    // Footer
    'footer.streakDays': '{days}d',
    'footer.totalCopies': '{count}×',
    'footer.hint': 'Click to copy · Right-click for source · ✎ to edit',
    'footer.rate': 'Rate',
    'footer.issue': 'Issue',

    // Edit modal
    'modal.edit.titleFormat': 'Edit Skill — /{name}',
    'modal.edit.title': 'Edit Skill',
    'modal.edit.alias': 'Alias',
    'modal.edit.aliasPh': 'e.g. "morning standup"',
    'modal.edit.note': 'Note',
    'modal.edit.notePh': 'Personal notes for this skill…',
    'modal.edit.icon': 'Icon',
    'modal.edit.iconNone': 'None',
    'modal.edit.iconUpload': '📤 Upload',
    'modal.edit.iconRemove': 'Remove',
    'modal.edit.spark': 'Spark Preset',
    'modal.edit.sparkHint': '(click to select)',
    'modal.edit.sparkSearchPh': 'Search…',
    'modal.edit.group': 'Group',
    'modal.edit.groupAuto': 'Auto (by source)',
    'modal.edit.hide': 'Hide from panel',
    'modal.edit.reset': 'Reset',
    'modal.edit.cancel': 'Cancel',
    'modal.edit.save': 'Save',

    // Achievements modal
    'modal.achv.title': '🏆 Achievements',
    'modal.achv.earned': 'Earned',
    'modal.achv.close': 'Close',

    // Groups modal
    'modal.groups.title': '📁 Custom Groups',
    'modal.groups.hint': 'Group skills the way you actually use them. Auto groups (My / Project / Plugin) still show below.',
    'modal.groups.empty': 'No custom groups yet — add one below.',
    'modal.groups.add': 'Add',
    'modal.groups.addPh': 'Group name',
    'modal.groups.up': 'Move up',
    'modal.groups.down': 'Move down',
    'modal.groups.delete': 'Delete',
    'modal.groups.confirmDel': 'Delete this group? Skills will fall back to auto-grouping.',
    'modal.groups.close': 'Close',

    // Marketplace browser
    'modal.market.title': '🛒 Browse Plugins',
    'modal.market.hint': 'Plugins from every marketplace you\'ve added (`/plugin marketplace add …`). Click Install to copy the slash command — it runs through your current execution mode.',
    'modal.market.searchPh': 'Search name, description, author…',
    'modal.market.installedOnly': 'Installed only',
    'modal.market.loading': 'Loading catalog…',
    'modal.market.count': 'Showing {shown} of {total}',
    'modal.market.allCats': 'All categories',
    'modal.market.installed': 'Installed',
    'modal.market.install': 'Install',
    'modal.market.installTriggered': 'Install command sent — run it in Claude Code',
    'modal.market.home': 'Homepage',
    'modal.market.close': 'Close',

    // Settings
    'modal.settings.title': '⚙ Settings',
    'modal.settings.export': 'Export settings',
    'modal.settings.exportHint': 'Copies your aliases, groups, Quick Bar, achievements, and theme to the clipboard as JSON. Share via gist or sync via dotfiles.',
    'modal.settings.exportBtn': 'Copy as JSON',
    'modal.settings.import': 'Import settings',
    'modal.settings.importHint': 'Paste exported JSON below. This will replace your current configuration.',
    'modal.settings.importBtn': 'Import',
    'modal.settings.importConfirm': 'This replaces your current settings. Continue?',
    'modal.settings.telemetry': 'Anonymous usage stats',
    'modal.settings.telemetryHint': 'Help shape future features. No personal data, no skill names — just feature counters.',
    'modal.settings.telemetryOn': 'Allow',
    'modal.settings.telemetryOff': 'Disable',
    'modal.settings.telemetryCurrent': 'Currently: {value}',
    'modal.settings.close': 'Close',

    // Telemetry banner (first-run)
    'telemetry.banner': 'Help improve this extension? We collect anonymous feature usage counters — no skill names, no personal data.',
    'telemetry.allow': 'Allow',
    'telemetry.deny': 'No thanks',

    // Buddy / character sheet
    'modal.buddy.title': '🪄 Character Sheet',
    'modal.buddy.save': 'Save',
    'modal.buddy.close': 'Close',
    'modal.buddy.statIntDesc': 'Grows when you use thinking, planning, or review skills',
    'modal.buddy.statDexDesc': 'Quick Bar usage counts double',
    'modal.buddy.statVitDesc': '+1 for each day of your streak',
    'modal.buddy.statLckDesc': '+5 for every achievement earned',

    // Weekly report
    'modal.report.title': '📊 Weekly Report',
    'modal.report.weekTotal': 'This Week',
    'modal.report.streak': 'Streak',
    'modal.report.totalCopies': 'Total',
    'modal.report.unitCount': '×',
    'modal.report.unitDays': 'd',
    'modal.report.recent7': 'Last 7 Days',
    'modal.report.top5': "This Week's Top 5",
    'modal.report.empty': 'No activity this week yet.',
    'modal.report.close': 'Close',
    'modal.report.copyMd': '📋 Copy as Markdown',
    'modal.report.saveMd': '💾 Save as .md',
    'modal.report.dayTooltip': '{date} — {count}×',
    'modal.report.topCount': '{count}×',

    // Exec mode
    'exec.paste': 'Copy to clipboard',
    'exec.auto': 'Auto-paste & send (mac/win/linux)',
    'exec.terminal': 'Run in terminal',
    'exec.modeTitle': 'Execution mode: {hint} (click to change)',
    'exec.prefixPaste': 'Copied',
    'exec.prefixAuto': 'Sent',
    'exec.prefixTerminal': 'Terminal',

    // Toasts
    'toast.buddyName': 'Name saved: {name}',
    'toast.iconRemoveOnSave': 'Icon will be cleared when you save',
    'toast.evolution': '🎉 {name} evolved into {stage}!',
    'toast.achievement': '🏆 Achievement unlocked: {icon} {name}',
    'toast.locked': '🔒 Evolve to unlock',
    'toast.dragHint': 'Drop here · Key {key}',
    'toast.slotEmpty': 'Slot {key} cleared',
    'toast.slotRegistered': 'Slot {key} → /{name}',
    'toast.weeklyCopied': '📋 Weekly report copied to clipboard',
    'toast.weeklySaved': '💾 Weekly report saved',
    'toast.settingsExported': '📋 Settings copied to clipboard as JSON',
    'toast.settingsImported': '✓ Settings imported',
    'toast.settingsImportFailed': '✘ Import failed — invalid JSON',

    // Dialogs / status
    'dialog.iconOpenLabel': 'Pick Icon',
    'status.quickSlotEmpty': 'Quick Slot {n} is empty',

    // Achievements (id-based)
    'achv.first_step.name': 'First Step',
    'achv.first_step.desc': 'Copy your first skill',
    'achv.warmup.name': 'Warm-up',
    'achv.warmup.desc': 'Copy 10 skills total',
    'achv.centurion.name': 'Centurion',
    'achv.centurion.desc': 'Copy 100 skills total',
    'achv.thousand.name': 'Thousandfold',
    'achv.thousand.desc': 'Copy 1,000 skills total',
    'achv.collector_5.name': 'Collector',
    'achv.collector_5.desc': 'Use 5 or more different skills',
    'achv.collector_15.name': 'Researcher',
    'achv.collector_15.desc': 'Use 15 or more different skills',
    'achv.streak_3.name': 'Steady',
    'achv.streak_3.desc': 'Hit a 3-day streak',
    'achv.streak_7.name': 'Perfect Week',
    'achv.streak_7.desc': 'Hit a 7-day streak',
    'achv.streak_30.name': 'Monthly Devotee',
    'achv.streak_30.desc': 'Hit a 30-day streak',
    'achv.mastery_3.name': 'Skilled',
    'achv.mastery_3.desc': 'Reach LV.3 with any skill',
    'achv.mastery_5.name': 'Master',
    'achv.mastery_5.desc': 'Reach LV.5 with any skill',
    'achv.quickbar_full.name': 'Loadout King',
    'achv.quickbar_full.desc': 'Fill all 6 Quick Bar slots',
    'achv.alias_master.name': 'Alias Master',
    'achv.alias_master.desc': 'Set aliases for 5 skills',
    'achv.declutter.name': 'Declutter',
    'achv.declutter.desc': 'Hide at least one skill',
    'achv.designer.name': 'Designer',
    'achv.designer.desc': 'Set a custom icon',
    'achv.archivist.name': 'Archivist',
    'achv.archivist.desc': 'Add notes to 5 skills',
  },

  ko: {
    'group.user.label': '내 스킬',
    'group.project.label': '프로젝트',
    'group.plugin.label': '플러그인',
    'group.plugin.sub': '{plugins}개 플러그인',
    'group.custom.sub': '사용자 그룹',
    'group.edit': '그룹 편집',

    'card.edit': '편집',
    'card.descEmpty': '설명 없음',
    'card.usage': '사용 {count}회 · LV.{level}',
    'card.notUsed': '아직 사용 안함',
    'card.copyHint': '클릭 → /{name} 복사',

    'quickbar.unlockHint': '({unlocked}/6 해금 · 진화로 +1)',
    'quickbar.locked': '진화 {stage} 단계에서 해금',

    'section.recent': '최근 사용',
    'section.hidden': '숨김',

    'panel.empty': '스킬이 없습니다. ~/.claude/skills 에 SKILL.md 를 추가해보세요.',

    'onboarding.title': '시작하기 — 스킬 패널 준비',
    'onboarding.sub': '이 패널은 머신에 있는 모든 Claude Code 슬래시 커맨드를 자동으로 찾아옵니다. 아래 중 하나로 시작하세요.',
    'onboarding.step1.title': '검증된 플러그인 설치',
    'onboarding.step1.desc': 'Superpowers는 TDD/코드리뷰/디버깅 등 50여 개의 슬래시 커맨드 패키지입니다. 공식 마켓플레이스에서 한 번에 설치.',
    'onboarding.step1.cta': '클릭해서 복사 & 실행',
    'onboarding.step2.title': '내 커맨드 직접 만들기',
    'onboarding.step2.desc': '~/.claude/commands/ 아래에 마크다운 파일을 넣으면 자동으로 표시됩니다. SKILL.md 포맷도 어떤 skills/ 폴더에든 동작.',
    'onboarding.step3.title': '내 스타일로 커스터마이즈',
    'onboarding.step3.desc': '테마, 사용자 그룹, 업적, 진화하는 버디, 키보드 1–6 Quick Bar — 모두 선택형, 모두 토글 가능.',
    'onboarding.foot': '스킬이 하나라도 잡히면 이 화면은 사라지고 본 패널이 뜹니다.',
    'toast.onbInstallTriggered': '복사 완료 — Claude Code에 붙여넣어 설치하세요',

    'toolbar.searchPh': '검색창',
    'toolbar.sort': '정렬',
    'toolbar.sortDefault': '기본 정렬',
    'toolbar.sortRecent': '최근 사용',
    'toolbar.sortUsage': '자주 사용',
    'toolbar.achievements': '업적 보드',
    'toolbar.weeklyReport': '위클리 리포트',
    'toolbar.execMode': '실행 방식',
    'toolbar.sound': '사운드 on/off',
    'toolbar.scanlines': 'CRT 효과 on/off',
    'toolbar.theme': '테마',
    'toolbar.locale': '언어',
    'toolbar.groups': '그룹 관리',
    'toolbar.marketplace': '플러그인 탐색',
    'toolbar.settings': '설정',

    'footer.streakDays': '{days}일',
    'footer.totalCopies': '{count}회',
    'footer.hint': '클릭 → 복사 · 우클릭 → SKILL.md · ✎ → 편집',
    'footer.rate': '평가',
    'footer.issue': '이슈',

    'modal.edit.titleFormat': '스킬 편집 — /{name}',
    'modal.edit.title': '스킬 편집',
    'modal.edit.alias': '별칭(Alias)',
    'modal.edit.aliasPh': '예: 오늘 시작',
    'modal.edit.note': '설명 메모(Note)',
    'modal.edit.notePh': '이 스킬에 대한 개인 메모…',
    'modal.edit.icon': '아이콘',
    'modal.edit.iconNone': '없음',
    'modal.edit.iconUpload': '📤 업로드',
    'modal.edit.iconRemove': '제거',
    'modal.edit.spark': 'Spark 프리셋',
    'modal.edit.sparkHint': '(클릭으로 선택)',
    'modal.edit.sparkSearchPh': '검색…',
    'modal.edit.group': '그룹',
    'modal.edit.groupAuto': '자동 (소스 기반)',
    'modal.edit.hide': '패널에서 숨기기',
    'modal.edit.reset': '초기화',
    'modal.edit.cancel': '취소',
    'modal.edit.save': '저장',

    'modal.achv.title': '🏆 업적 보드',
    'modal.achv.earned': '달성',
    'modal.achv.close': '닫기',

    'modal.groups.title': '📁 사용자 그룹',
    'modal.groups.hint': '직접 쓰는 흐름대로 스킬을 묶어 두세요. 자동 그룹(내 스킬 / 프로젝트 / 플러그인)은 아래에 그대로 표시됩니다.',
    'modal.groups.empty': '아직 사용자 그룹이 없습니다 — 아래에서 추가하세요.',
    'modal.groups.add': '추가',
    'modal.groups.addPh': '그룹 이름',
    'modal.groups.up': '위로',
    'modal.groups.down': '아래로',
    'modal.groups.delete': '삭제',
    'modal.groups.confirmDel': '이 그룹을 삭제할까요? 소속 스킬은 자동 그룹으로 돌아갑니다.',
    'modal.groups.close': '닫기',

    'modal.market.title': '🛒 플러그인 탐색',
    'modal.market.hint': '추가한 모든 마켓플레이스의 플러그인 목록입니다. Install 클릭 시 슬래시 커맨드가 현재 실행 방식대로 동작합니다.',
    'modal.market.searchPh': '이름·설명·저자 검색…',
    'modal.market.installedOnly': '설치된 것만',
    'modal.market.loading': '카탈로그 불러오는 중…',
    'modal.market.count': '{shown}개 표시 (전체 {total}개)',
    'modal.market.allCats': '모든 카테고리',
    'modal.market.installed': '설치됨',
    'modal.market.install': '설치',
    'modal.market.installTriggered': '설치 커맨드 전송됨 — Claude Code에서 실행하세요',
    'modal.market.home': '홈페이지',
    'modal.market.close': '닫기',

    'modal.settings.title': '⚙ 설정',
    'modal.settings.export': '설정 내보내기',
    'modal.settings.exportHint': '별칭/그룹/Quick Bar/업적/테마 등 모든 설정을 JSON으로 클립보드에 복사. gist나 dotfiles로 공유.',
    'modal.settings.exportBtn': 'JSON 복사',
    'modal.settings.import': '설정 가져오기',
    'modal.settings.importHint': '아래에 JSON을 붙여넣으세요. 현재 설정을 덮어씁니다.',
    'modal.settings.importBtn': '가져오기',
    'modal.settings.importConfirm': '현재 설정을 덮어씁니다. 계속하시겠어요?',
    'modal.settings.telemetry': '익명 사용 통계',
    'modal.settings.telemetryHint': '기능 개선에 활용됩니다. 개인 정보·스킬 이름 수집 없음 — 어떤 기능이 몇 번 쓰였는지만.',
    'modal.settings.telemetryOn': '허용',
    'modal.settings.telemetryOff': '거부',
    'modal.settings.telemetryCurrent': '현재 상태: {value}',
    'modal.settings.close': '닫기',

    'telemetry.banner': '익스텐션 개선에 도움 주실래요? 기능 사용 카운터만 익명으로 수집합니다 — 스킬 이름·개인 정보 일절 없음.',
    'telemetry.allow': '허용',
    'telemetry.deny': '괜찮아요',

    'modal.buddy.title': '🪄 캐릭터 시트',
    'modal.buddy.save': '저장',
    'modal.buddy.close': '닫기',
    'modal.buddy.statIntDesc': '사고/계획/리뷰 스킬에서 성장',
    'modal.buddy.statDexDesc': 'Quick Bar는 2배',
    'modal.buddy.statVitDesc': '데일리 스트릭 매일 +1',
    'modal.buddy.statLckDesc': '업적 1개당 +5',

    'modal.report.title': '📊 위클리 리포트',
    'modal.report.weekTotal': '이번 주 사용',
    'modal.report.streak': '스트릭',
    'modal.report.totalCopies': '전체 누적',
    'modal.report.unitCount': '회',
    'modal.report.unitDays': '일',
    'modal.report.recent7': '최근 7일 활동',
    'modal.report.top5': '이번 주 TOP 5',
    'modal.report.empty': '이번 주 사용 기록이 없습니다.',
    'modal.report.close': '닫기',
    'modal.report.copyMd': '📋 마크다운으로 복사',
    'modal.report.saveMd': '💾 .md 파일로 저장',
    'modal.report.dayTooltip': '{date} — {count}회',
    'modal.report.topCount': '{count}회',

    'exec.paste': '클립보드만 복사',
    'exec.auto': '붙여넣기+엔터 자동 (mac/win/linux)',
    'exec.terminal': '터미널 실행',
    'exec.modeTitle': '실행 방식: {hint} (클릭으로 변경)',
    'exec.prefixPaste': '복사',
    'exec.prefixAuto': '자동 실행',
    'exec.prefixTerminal': '터미널',

    'toast.buddyName': '이름 저장: {name}',
    'toast.iconRemoveOnSave': '저장 시 아이콘 제거됩니다',
    'toast.evolution': '🎉 {name} 진화: {stage}!',
    'toast.achievement': '🏆 업적 해제: {icon} {name}',
    'toast.locked': '🔒 진화로 해금',
    'toast.dragHint': '드래그해서 등록 · 키 {key}',
    'toast.slotEmpty': '슬롯 {key} 비움',
    'toast.slotRegistered': '슬롯 {key} 등록: /{name}',
    'toast.weeklyCopied': '📋 위클리 리포트 클립보드 복사',
    'toast.weeklySaved': '💾 위클리 리포트 저장 완료',
    'toast.settingsExported': '📋 설정을 JSON으로 클립보드에 복사',
    'toast.settingsImported': '✓ 설정 가져오기 완료',
    'toast.settingsImportFailed': '✘ 가져오기 실패 — JSON 형식 확인',

    'dialog.iconOpenLabel': '아이콘 선택',
    'status.quickSlotEmpty': 'Quick Slot {n} 비어있음',

    'achv.first_step.name': '첫 발걸음',
    'achv.first_step.desc': '처음으로 스킬 복사',
    'achv.warmup.name': '워밍업',
    'achv.warmup.desc': '총 10회 복사',
    'achv.centurion.name': '백 번의 기록',
    'achv.centurion.desc': '총 100회 복사',
    'achv.thousand.name': '천부장',
    'achv.thousand.desc': '총 1000회 복사',
    'achv.collector_5.name': '컬렉터',
    'achv.collector_5.desc': '5종 이상 다른 스킬 사용',
    'achv.collector_15.name': '연구가',
    'achv.collector_15.desc': '15종 이상 다른 스킬 사용',
    'achv.streak_3.name': '꾸준한',
    'achv.streak_3.desc': '3일 연속 사용',
    'achv.streak_7.name': '개근',
    'achv.streak_7.desc': '7일 연속 사용',
    'achv.streak_30.name': '한 달 개근',
    'achv.streak_30.desc': '30일 연속 사용',
    'achv.mastery_3.name': '숙련',
    'achv.mastery_3.desc': '한 스킬 LV.3 달성',
    'achv.mastery_5.name': '마스터',
    'achv.mastery_5.desc': '한 스킬 LV.5 달성',
    'achv.quickbar_full.name': '장비왕',
    'achv.quickbar_full.desc': 'Quick Bar 6칸 모두 채움',
    'achv.alias_master.name': '별칭 마스터',
    'achv.alias_master.desc': '5개 스킬에 별칭 부여',
    'achv.declutter.name': '정리정돈',
    'achv.declutter.desc': '한 개 이상 스킬 숨김',
    'achv.designer.name': '디자이너',
    'achv.designer.desc': '한 개 이상 커스텀 아이콘',
    'achv.archivist.name': '기록가',
    'achv.archivist.desc': '5개 스킬에 메모 작성',
  },
};

const SUPPORTED = ['en', 'ko'];
const FALLBACK = 'en';

function resolveLocale(cfgLocale, envLanguage) {
  if (cfgLocale && SUPPORTED.includes(cfgLocale)) return cfgLocale;
  if (envLanguage) {
    const short = String(envLanguage).slice(0, 2).toLowerCase();
    if (SUPPORTED.includes(short)) return short;
  }
  return FALLBACK;
}

function dict(locale) {
  return STRINGS[locale] || STRINGS[FALLBACK];
}

function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

// Server-side translator. Returns the key itself when missing so issues are visible.
function tFor(locale) {
  const D = dict(locale);
  return (key, vars) => interpolate(D[key] != null ? D[key] : key, vars);
}

module.exports = {
  STRINGS,
  SUPPORTED,
  FALLBACK,
  resolveLocale,
  dict,
  interpolate,
  tFor,
};
