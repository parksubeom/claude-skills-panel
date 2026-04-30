// i18n string resources for Claude Skills Panel.
// Locale is resolved at render time (cfg.meta.locale → vscode.env.language → 'en').
// All user-visible UI strings live here so the rest of the codebase only deals with keys.

const STRINGS = {
  en: {
    // Skill source groups
    'group.user.label': 'My Skills',
    'group.project.label': 'Project',
    'group.plugin.label': 'Plugin',

    // Skill cards
    'card.edit': 'Edit',
    'card.descEmpty': 'No description',
    'card.usage': 'Used {count}× · LV.{level}',
    'card.notUsed': 'Not used yet',
    'card.copyHint': 'Click → copy /{name}',

    // Quick bar
    'quickbar.unlockHint': '({unlocked}/6 unlocked · evolve for +1)',
    'quickbar.locked': 'Unlocks at evolution stage {stage}',

    // Sections
    'section.recent': 'Recent',
    'section.hidden': 'Hidden',

    // Empty state
    'panel.empty': 'No skills found. Add SKILL.md under ~/.claude/skills.',

    // Toolbar
    'toolbar.searchPh': 'Search',
    'toolbar.sort': 'Sort',
    'toolbar.sortDefault': 'Default sort',
    'toolbar.sortRecent': 'Recently used',
    'toolbar.sortUsage': 'Most used',
    'toolbar.achievements': 'Achievements',
    'toolbar.weeklyReport': 'Weekly report',
    'toolbar.execMode': 'Execute mode',
    'toolbar.sound': 'Sound on/off',
    'toolbar.scanlines': 'CRT effect on/off',
    'toolbar.locale': 'Language',

    // Footer
    'footer.streakDays': '{days}d',
    'footer.totalCopies': '{count}×',
    'footer.hint': 'Click → copy · Right-click → SKILL.md · ✎ → edit',

    // Edit modal
    'modal.edit.titleFormat': 'Edit Skill — /{name}',
    'modal.edit.title': 'Edit Skill',
    'modal.edit.alias': 'Alias',
    'modal.edit.aliasPh': 'e.g. start of day',
    'modal.edit.note': 'Note',
    'modal.edit.notePh': 'Your personal note about this skill…',
    'modal.edit.icon': 'Icon',
    'modal.edit.iconNone': 'None',
    'modal.edit.iconUpload': '📤 Upload',
    'modal.edit.iconRemove': 'Remove',
    'modal.edit.spark': 'Spark Preset',
    'modal.edit.sparkHint': '(click to select)',
    'modal.edit.sparkSearchPh': 'Search…',
    'modal.edit.hide': 'Hide from panel',
    'modal.edit.reset': 'Reset',
    'modal.edit.cancel': 'Cancel',
    'modal.edit.save': 'Save',

    // Achievements modal
    'modal.achv.title': '🏆 Achievements',
    'modal.achv.earned': 'Earned',
    'modal.achv.close': 'Close',

    // Buddy / character sheet
    'modal.buddy.title': '🪄 Character Sheet',
    'modal.buddy.save': 'Save',
    'modal.buddy.close': 'Close',
    'modal.buddy.statIntDesc': 'Grows from thinking/planning/review skills',
    'modal.buddy.statDexDesc': 'Quick Bar gives 2×',
    'modal.buddy.statVitDesc': '+1 per daily streak day',
    'modal.buddy.statLckDesc': '+5 per achievement',

    // Weekly report
    'modal.report.title': '📊 Weekly Report',
    'modal.report.weekTotal': 'This Week',
    'modal.report.streak': 'Streak',
    'modal.report.totalCopies': 'Total',
    'modal.report.unitCount': '×',
    'modal.report.unitDays': 'd',
    'modal.report.recent7': 'Last 7 Days',
    'modal.report.top5': 'This Week TOP 5',
    'modal.report.empty': 'No usage recorded this week.',
    'modal.report.close': 'Close',
    'modal.report.dayTooltip': '{date} — {count}×',
    'modal.report.topCount': '{count}×',

    // Exec mode
    'exec.paste': 'Clipboard copy only',
    'exec.auto': 'Auto paste+enter (mac/win/linux)',
    'exec.terminal': 'Run in terminal',
    'exec.modeTitle': 'Execute mode: {hint} (click to change)',
    'exec.prefixPaste': 'Copy',
    'exec.prefixAuto': 'Auto run',
    'exec.prefixTerminal': 'Terminal',

    // Toasts
    'toast.buddyName': 'Name saved: {name}',
    'toast.iconRemoveOnSave': 'Icon will be removed on save',
    'toast.evolution': '🎉 {name} evolved: {stage}!',
    'toast.achievement': '🏆 Achievement unlocked: {icon} {name}',
    'toast.locked': '🔒 Evolve to unlock',
    'toast.dragHint': 'Drag here · key {key}',
    'toast.slotEmpty': 'Slot {key} cleared',
    'toast.slotRegistered': 'Slot {key} → /{name}',

    // Dialogs / status
    'dialog.iconOpenLabel': 'Pick Icon',
    'status.quickSlotEmpty': 'Quick Slot {n} is empty',

    // Achievements (id-based)
    'achv.first_step.name': 'First Step',
    'achv.first_step.desc': 'Copy your first skill',
    'achv.warmup.name': 'Warm-up',
    'achv.warmup.desc': '10 total copies',
    'achv.centurion.name': 'Centurion',
    'achv.centurion.desc': '100 total copies',
    'achv.thousand.name': 'Thousand',
    'achv.thousand.desc': '1000 total copies',
    'achv.collector_5.name': 'Collector',
    'achv.collector_5.desc': 'Use 5+ different skills',
    'achv.collector_15.name': 'Researcher',
    'achv.collector_15.desc': 'Use 15+ different skills',
    'achv.streak_3.name': 'Steady',
    'achv.streak_3.desc': '3-day streak',
    'achv.streak_7.name': 'Perfect Week',
    'achv.streak_7.desc': '7-day streak',
    'achv.streak_30.name': 'Monthly Devotee',
    'achv.streak_30.desc': '30-day streak',
    'achv.mastery_3.name': 'Skilled',
    'achv.mastery_3.desc': 'Reach LV.3 on a skill',
    'achv.mastery_5.name': 'Master',
    'achv.mastery_5.desc': 'Reach LV.5 on a skill',
    'achv.quickbar_full.name': 'Loadout King',
    'achv.quickbar_full.desc': 'Fill all 6 Quick Bar slots',
    'achv.alias_master.name': 'Alias Master',
    'achv.alias_master.desc': 'Alias 5 skills',
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
    'toolbar.locale': '언어',

    'footer.streakDays': '{days}일',
    'footer.totalCopies': '{count}회',
    'footer.hint': '클릭 → 복사 · 우클릭 → SKILL.md · ✎ → 편집',

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
    'modal.edit.hide': '패널에서 숨기기',
    'modal.edit.reset': '초기화',
    'modal.edit.cancel': '취소',
    'modal.edit.save': '저장',

    'modal.achv.title': '🏆 업적 보드',
    'modal.achv.earned': '달성',
    'modal.achv.close': '닫기',

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
