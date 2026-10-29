'use strict';

const STORAGE_KEY = 'studyquest-refined-prototype-v2';
const XP_PER_QUEST = 25;
const XP_PER_FOCUS_SESSION = 5;
const LEVEL_RANKS = [
  { xp: 0, name: 'Curious Sprout', reward: 'Your Curious Sprout rank badge.' },
  { xp: 100, name: 'Note Taker', reward: 'The Note Taker rank badge and a brighter rank frame.' },
  { xp: 250, name: 'Study Scout', reward: 'The Study Scout badge, earned by staying curious.' },
  { xp: 450, name: 'Brain Builder', reward: 'The Brain Builder badge for steady practice.' },
  { xp: 700, name: 'Focus Ranger', reward: 'The Focus Ranger badge for showing up and doing the work.' },
  { xp: 1000, name: 'Knowledge Keeper', reward: 'The Knowledge Keeper badge for building your library of skills.' },
  { xp: 1400, name: 'Quest Master', reward: 'The Quest Master badge, a mark of consistent progress.' },
  { xp: 1850, name: 'Big Brain Energy', reward: 'The Big Brain badge for your growing XP collection.' },
  { xp: 2350, name: 'Scholar in Bloom', reward: 'The Scholar in Bloom badge for long-term progress.' },
  { xp: 2950, name: 'Study Legend', reward: 'The Study Legend badge, a top-tier StudyQuest rank.' },
  { xp: 3750, name: 'Legendary Scholar', reward: 'The Legendary Scholar badge, your first prestige rank.' }
];
const PRESTIGE_RANK_NAMES = ['Grand Scholar', 'Sage of Study', 'Scholar Supreme', 'Eternal Scholar'];
const THEMES = ['classic', 'soft', 'ocean', 'sunset', 'forest', 'butter', 'midnight', 'graphite', 'plum', 'dark-forest'];
const DARK_THEMES = ['midnight', 'graphite', 'plum', 'dark-forest'];
const CAT_AVATARS = ['black', 'white', 'orange', 'gray'];
const CAT_AVATAR_LABELS = { black: 'Black cat', white: 'White cat', orange: 'Orange cat', gray: 'Gray cat' };
const THEME_LABELS = { classic: 'Lavender and cream', soft: 'Mint and peach', ocean: 'Ocean breeze', sunset: 'Sunset peach', forest: 'Forest sage', butter: 'Butter day', midnight: 'Midnight blue', graphite: 'Graphite', plum: 'Dark plum', 'dark-forest': 'Deep forest' };
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 115;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const tips = [
  'Put your phone out of reach and close the tabs you do not need. Make it easier to focus than to drift.',
  'Before you begin, write down the one thing you want to finish. A clear target makes starting less difficult.',
  'You do not need to feel motivated first. Start with two minutes and let momentum do the rest.',
  'If a task feels too big, shrink it. “Open the notes” is a perfectly good first step.',
  'Take a short stretch break between sessions. Rest is part of learning, not a reward you have to earn.',
  'Keep a scrap of paper nearby for distracting thoughts. Write them down and return to the task.',
  'Try explaining the idea in your own words. It is a useful way to find what you understand and what needs another look.'
];

const starterTasks = [
  { id: 'starter-math', title: 'Review quadratic equations', subject: 'Math', priority: 'high', due: '', duration: 25, completed: false, completedAt: null, xpAwarded: false, completionLog: [] },
  { id: 'starter-code', title: 'Practice Python loops', subject: 'Computer Science', priority: 'normal', due: '', duration: 30, completed: false, completedAt: null, xpAwarded: false, completionLog: [] },
  { id: 'starter-read', title: 'Read 10 pages of a book', subject: 'English', priority: 'low', due: '', duration: 15, completed: false, completedAt: null, xpAwarded: false, completionLog: [] }
];

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function dateOffsetKey(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return todayKey(date);
}
function freshState() {
  return {
    profile: null,
    tasks: starterTasks.map(task => ({ ...task, completionLog: [] })),
    xp: 0,
    completedTotal: 0,
    focusMinutes: 0,
    dailyGoal: 3,
    theme: 'classic',
    fontFamily: 'system',
    textSize: 'normal',
    clockFormat: '24',
    motionPreference: 'system',
    tutorialCompleted: false,
    timerPreset: 25,
    dailyLog: {},
    createdAt: todayKey()
  };
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    const base = freshState();
    return {
      ...base,
      ...parsed,
      profile: parsed.profile && typeof parsed.profile.name === 'string' ? { ...parsed.profile, avatar: CAT_AVATARS.includes(parsed.profile.avatar) ? parsed.profile.avatar : 'orange' } : null,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map(task => ({
        id: String(task.id || makeId()),
        title: String(task.title || 'Untitled quest'),
        subject: String(task.subject || 'Other'),
        priority: ['high', 'normal', 'low'].includes(task.priority) ? task.priority : 'normal',
        due: typeof task.due === 'string' ? task.due : '',
        duration: Number.isFinite(task.duration) ? task.duration : 25,
        completed: Boolean(task.completed),
        completedAt: typeof task.completedAt === 'string' ? task.completedAt : null,
        xpAwarded: Boolean(task.xpAwarded),
        completionLog: Array.isArray(task.completionLog) ? task.completionLog.filter(value => typeof value === 'string') : []
      })) : base.tasks,
      xp: Number.isFinite(parsed.xp) ? Math.max(0, parsed.xp) : 0,
      completedTotal: Number.isFinite(parsed.completedTotal) ? Math.max(0, parsed.completedTotal) : 0,
      focusMinutes: Number.isFinite(parsed.focusMinutes) ? Math.max(0, parsed.focusMinutes) : 0,
      dailyGoal: Number.isFinite(parsed.dailyGoal) ? Math.min(10, Math.max(1, parsed.dailyGoal)) : 3,
      theme: THEMES.includes(parsed.theme) ? parsed.theme : 'classic',
      fontFamily: ['system', 'rounded', 'serif', 'mono'].includes(parsed.fontFamily) ? parsed.fontFamily : 'system',
      textSize: ['normal', 'large', 'extra-large'].includes(parsed.textSize) ? parsed.textSize : 'normal',
      clockFormat: parsed.clockFormat === '12' ? '12' : '24',
      motionPreference: ['system', 'full', 'reduced'].includes(parsed.motionPreference) ? parsed.motionPreference : 'system',
      tutorialCompleted: parsed.tutorialCompleted === true,
      timerPreset: [15, 25, 45, 50].includes(parsed.timerPreset) ? parsed.timerPreset : 25,
      dailyLog: parsed.dailyLog && typeof parsed.dailyLog === 'object' ? parsed.dailyLog : {},
      createdAt: parsed.createdAt || todayKey()
    };
  } catch (error) {
    console.warn('StudyQuest could not read saved data. Starting fresh.', error);
    return freshState();
  }
}
let state = loadState();
let pendingAvatar = state.profile?.avatar || 'orange';
let currentView = 'overview';
let currentFilter = 'all';
let editingTaskId = null;
let timerRemaining = state.timerPreset * 60;
let timerRunning = false;
let timerFinished = false;
let timerInterval = null;
let toastTimeout = null;
let tipIndex = Math.floor(Math.random() * tips.length);
let tutorialStepIndex = 0;
const tutorialSteps = [
  { view: 'overview', icon: 'home', title: 'Your overview', copy: 'This is your home base. Check the next few quests, daily goal, XP and focus progress without opening every page.', location: 'Overview · Your starting page' },
  { view: 'quests', icon: 'check-square', title: 'Manage your quests', copy: 'Add study tasks, choose a subject and due date, then search or filter the list. Checking off a quest earns XP once.', location: 'My quests · Plan your work' },
  { view: 'focus', icon: 'clock', title: 'Settle into focus', copy: 'Choose a session length, pick a quest to work on, and start the timer. Finished sessions add focus time and XP.', location: 'Focus room · One thing at a time' },
  { view: 'progress', icon: 'chart', title: 'Notice your progress', copy: 'Your level, activity streak, weekly history and achievements live here. Small, consistent wins add up over time.', location: 'Progress · See how far you came' },
  { view: 'settings', icon: 'sliders', title: 'Make it yours', copy: 'Change your name, choose a study buddy cat, switch themes, set a daily goal or export a backup of your local data.', location: 'Settings · Your preferences' },
  { view: 'about', icon: 'info', title: 'Meet StudyQuest', copy: 'Read about the planner, its features and how quests, focus sessions and XP fit together.', location: 'About StudyQuest · What this space does' }
];

const ui = {
  welcome: $('#welcome-screen'), app: $('#app-layout'), tutorial: $('#tutorial-modal'), profileForm: $('#profile-form'), profileName: $('#profile-name'), profileSubject: $('#profile-subject'),
  sidebar: $('#sidebar'), scrim: $('#mobile-scrim'), breadcrumb: $('#breadcrumb-current'),
  modal: $('#task-modal'), taskForm: $('#task-form'), taskTitle: $('#task-title'), taskSubject: $('#task-subject'), taskPriority: $('#task-priority'), taskDue: $('#task-due'), taskDuration: $('#task-duration'),
  taskModalTitle: $('#task-modal-title'), taskModalKicker: $('#task-modal-kicker'), taskFormError: $('#task-form-error'),
  overviewTasks: $('#overview-task-list'), fullTaskList: $('#full-task-list'), emptyState: $('#quest-empty-state'), search: $('#task-search'), subjectFilter: $('#subject-filter'),
  toast: $('#toast'), timerDisplay: $('#timer-display'), timerRing: $('#timer-ring-progress'), timerStart: $('#timer-start'), timerReset: $('#timer-reset'), timerNote: $('#timer-note'), timerStatus: $('#timer-status'), timerMode: $('#timer-mode-label'),
  focusTaskSelect: $('#focus-task-select'), focusSelectedTask: $('#focus-selected-task')
};

function makeId() {
  return window.crypto && typeof window.crypto.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `quest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('StudyQuest could not save. Browser storage may be disabled or full.', error);
    showToast('Your browser could not save changes.');
  }
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
function icon(name, className = 'icon', alt = '') {
  return `<img src="assets/icons/${escapeHTML(name)}.svg" class="${escapeHTML(className)}" alt="${escapeHTML(alt)}">`;
}
function ensureDailyLog(key = todayKey()) {
  if (!state.dailyLog[key] || typeof state.dailyLog[key] !== 'object') {
    state.dailyLog[key] = { completedIds: [], focusMinutes: 0, sessions: 0 };
  }
  if (!Array.isArray(state.dailyLog[key].completedIds)) state.dailyLog[key].completedIds = [];
  if (!Number.isFinite(state.dailyLog[key].focusMinutes)) state.dailyLog[key].focusMinutes = 0;
  if (!Number.isFinite(state.dailyLog[key].sessions)) state.dailyLog[key].sessions = 0;
  return state.dailyLog[key];
}
function prestigeRankName(level) {
  const index = level - LEVEL_RANKS.length - 1;
  if (index < PRESTIGE_RANK_NAMES.length) return PRESTIGE_RANK_NAMES[Math.max(0, index)];
  return `Eternal Scholar ${index - PRESTIGE_RANK_NAMES.length + 2}`;
}
function getLevelInfo(xp = state.xp) {
  const totalXp = Math.max(0, Number(xp) || 0);
  let rankIndex = 0;
  for (let index = 1; index < LEVEL_RANKS.length; index += 1) {
    if (totalXp >= LEVEL_RANKS[index].xp) rankIndex = index;
    else break;
  }

  const rank = LEVEL_RANKS[rankIndex];
  let level = rankIndex + 1;
  let currentFloor = rank.xp;
  let nextFloor;
  let nextName;

  if (rankIndex < LEVEL_RANKS.length - 1) {
    nextFloor = LEVEL_RANKS[rankIndex + 1].xp;
    nextName = LEVEL_RANKS[rankIndex + 1].name;
  } else {
    const repeatRankXp = 800;
    const extraLevels = Math.floor((totalXp - rank.xp) / repeatRankXp);
    level += extraLevels;
    currentFloor = rank.xp + extraLevels * repeatRankXp;
    nextFloor = currentFloor + repeatRankXp;
    nextName = prestigeRankName(level + 1);
  }

  const requiredXp = nextFloor - currentFloor;
  const progressXp = totalXp - currentFloor;
  return {
    level,
    name: level > LEVEL_RANKS.length ? prestigeRankName(level) : rank.name,
    reward: level > LEVEL_RANKS.length ? `The ${prestigeRankName(level)} rank badge and a new profile frame.` : rank.reward,
    currentFloor,
    nextFloor,
    nextName,
    requiredXp,
    progressXp,
    progress: Math.min(99, Math.floor(progressXp / requiredXp * 100)),
    remaining: Math.max(0, nextFloor - totalXp)
  };
}
function allDatesWithActivity() {
  return Object.entries(state.dailyLog)
    .filter(([, item]) => (item.completedIds && item.completedIds.length) || item.focusMinutes > 0)
    .map(([date]) => date)
    .sort();
}
function getStreaks() {
  const dates = allDatesWithActivity();
  if (!dates.length) return { current: 0, best: 0 };
  const set = new Set(dates);
  let best = 0;
  let chain = 0;
  let previous = null;
  for (const dateKey of dates) {
    const d = new Date(`${dateKey}T12:00:00`);
    if (previous) {
      const diff = Math.round((d - previous) / 86400000);
      chain = diff === 1 ? chain + 1 : 1;
    } else chain = 1;
    best = Math.max(best, chain);
    previous = d;
  }
  const today = todayKey();
  const yesterday = dateOffsetKey(-1);
  let current = 0;
  let cursor = set.has(today) ? today : set.has(yesterday) ? yesterday : null;
  while (cursor && set.has(cursor)) {
    current++;
    const previousDate = new Date(`${cursor}T12:00:00`);
    previousDate.setDate(previousDate.getDate() - 1);
    cursor = todayKey(previousDate);
  }
  return { current, best };
}
function dailyCompletedCount(key = todayKey()) {
  return state.tasks.filter(task => task.completed && task.completedAt === key).length;
}
function dailyActivityCount(key = todayKey()) {
  return ensureDailyLog(key).completedIds.length;
}
function subjectDot(subject) {
  const colors = {
    'Computer Science': '#9b87e6', Math: '#efa477', Science: '#8cb38a', English: '#7ea6d6', History: '#cf9cbd', Languages: '#88bfc0', Other: '#aaa4b7'
  };
  return `<span class="subject-dot" style="background:${colors[subject] || colors.Other}"></span>`;
}
function dueDateInfo(task) {
  if (!task.due) return null;
  const today = todayKey();
  const label = formatShortDate(task.due);
  if (!task.completed && task.due < today) return { text: `Overdue · ${label}`, className: 'is-overdue' };
  if (task.due === today && !task.completed) return { text: 'Due today', className: '' };
  return { text: `Due ${label}`, className: '' };
}
function formatShortDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function priorityLabel(priority) { return priority === 'high' ? 'High priority' : priority === 'low' ? 'Low priority' : 'Normal'; }
function taskMetaMarkup(task) {
  const due = dueDateInfo(task);
  return `<span class="subject-chip">${escapeHTML(task.subject)}</span>
    <span class="priority-chip priority-${escapeHTML(task.priority)}">${task.completed ? 'Completed' : priorityLabel(task.priority)}</span>
    ${due ? `<span class="due-chip ${due.className}">${escapeHTML(due.text)}</span>` : ''}
    <span class="duration-chip">${icon('clock', 'icon icon-xs')} ${Number(task.duration) || 25} min</span>`;
}
function checkboxMarkup(task) {
  return `<button type="button" class="check-control ${task.completed ? 'is-checked' : ''}" data-action="toggle" data-id="${escapeHTML(task.id)}" aria-label="Mark ${escapeHTML(task.title)} ${task.completed ? 'not done' : 'done'}" aria-pressed="${task.completed}">${icon('check', 'icon icon-xs')}</button>`;
}
function overviewTaskMarkup(task) {
  return `<article class="mini-quest ${task.completed ? 'is-complete' : ''}" data-task-row="${escapeHTML(task.id)}">
    ${checkboxMarkup(task)}
    <div class="mini-quest-body"><p class="mini-quest-title">${escapeHTML(task.title)}</p><div class="mini-quest-sub">${subjectDot(task.subject)}<span>${escapeHTML(task.subject)}</span><span class="task-time">${icon('clock','icon')} ${Number(task.duration) || 25} min</span></div></div>
    <span class="task-priority-mark ${escapeHTML(task.priority)}" title="${escapeHTML(priorityLabel(task.priority))}"></span>
  </article>`;
}
function fullTaskMarkup(task) {
  return `<article class="full-quest ${task.completed ? 'is-complete' : ''}" data-task-row="${escapeHTML(task.id)}">
    ${checkboxMarkup(task)}
    <div class="full-quest-body"><p class="full-quest-title">${escapeHTML(task.title)}</p><div class="full-quest-meta">${taskMetaMarkup(task)}</div></div>
    <div class="full-quest-actions"><button type="button" class="task-action" data-action="edit" data-id="${escapeHTML(task.id)}" aria-label="Edit ${escapeHTML(task.title)}" title="Edit quest">${icon('edit','icon')}</button><button type="button" class="task-action delete" data-action="delete" data-id="${escapeHTML(task.id)}" aria-label="Delete ${escapeHTML(task.title)}" title="Delete quest">${icon('trash','icon')}</button></div>
  </article>`;
}
function filteredTasks() {
  const query = ui.search.value.trim().toLowerCase();
  const subject = ui.subjectFilter.value;
  return state.tasks.filter(task => {
    const matchesFilter = currentFilter === 'all' || (currentFilter === 'active' && !task.completed) || (currentFilter === 'completed' && task.completed);
    const matchesSubject = subject === 'all' || task.subject === subject;
    const matchesSearch = !query || `${task.title} ${task.subject} ${task.priority}`.toLowerCase().includes(query);
    return matchesFilter && matchesSubject && matchesSearch;
  });
}
function renderTasks() {
  const sorted = [...state.tasks].sort((a, b) => Number(a.completed) - Number(b.completed) || priorityRank(a.priority) - priorityRank(b.priority));
  const overview = sorted.filter(task => !task.completed).slice(0, 4);
  ui.overviewTasks.innerHTML = overview.length ? overview.map(overviewTaskMarkup).join('') : `<div class="mini-empty">You're all caught up. Take a breath.</div>`;
  $('#today-quest-subtitle').textContent = overview.length ? `${overview.length} next ${overview.length === 1 ? 'step' : 'steps'} from your list.` : 'You have room to rest or add something new.';
  $('#overview-task-count').textContent = `${state.tasks.filter(task => !task.completed).length} quests left to do`;

  const visible = filteredTasks();
  ui.fullTaskList.innerHTML = visible.map(fullTaskMarkup).join('');
  ui.fullTaskList.hidden = visible.length === 0;
  ui.emptyState.hidden = visible.length !== 0;
  const active = state.tasks.filter(task => !task.completed).length;
  const completed = state.tasks.filter(task => task.completed).length;
  $('#filter-all-count').textContent = state.tasks.length;
  $('#filter-active-count').textContent = active;
  $('#filter-completed-count').textContent = completed;
  $('#nav-quest-count').textContent = active;
  $('#quest-list-heading').textContent = currentFilter === 'all' ? 'All quests' : currentFilter === 'active' ? 'Quests to do' : 'Completed quests';
  $('#quest-list-subtitle').textContent = visible.length ? `${visible.length} ${visible.length === 1 ? 'quest' : 'quests'} in this view.` : 'Nothing matched your current search and filters.';
  $('#quest-list-footer').textContent = state.tasks.length ? `${state.tasks.length} quests in your space.` : 'A blank page is a good place to start.';
  $('#clear-completed').hidden = completed === 0;
}
function priorityRank(value) { return value === 'high' ? 0 : value === 'normal' ? 1 : 2; }
function avatarMarkup(avatar = 'orange', sizeClass = '') {
  const safeAvatar = CAT_AVATARS.includes(avatar) ? avatar : 'orange';
  return `<img class="cat-avatar-image ${sizeClass}" src="assets/images/cat-avatars/${safeAvatar}-cat.svg" alt="${CAT_AVATAR_LABELS[safeAvatar]} avatar">`;
}
function renderAvatarPickers() {
  const selected = state.profile?.avatar || pendingAvatar || 'orange';
  $$('[data-welcome-avatar]').forEach(button => {
    const active = button.dataset.welcomeAvatar === (pendingAvatar || selected);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $$('[data-settings-avatar]').forEach(button => {
    const active = button.dataset.settingsAvatar === selected;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}
function chooseProfileAvatar(avatar, updateProfile) {
  if (!CAT_AVATARS.includes(avatar)) return;
  if (updateProfile) {
    state.profile = { ...(state.profile || { name: 'Student' }), avatar };
    pendingAvatar = avatar;
    saveState();
    renderStats();
    renderAvatarPickers();
    showToast(`${CAT_AVATAR_LABELS[avatar]} selected.`);
  } else {
    pendingAvatar = avatar;
    renderAvatarPickers();
  }
}
function renderStats() {
  const level = getLevelInfo();
  const streaks = getStreaks();
  const dailyCount = dailyCompletedCount();
  const dailyPercent = Math.min(100, Math.round(dailyCount / state.dailyGoal * 100));
  const levelLabel = `Level ${level.level} · ${level.name}`;
  $('#stat-xp').innerHTML = `${state.xp} <small>XP</small>`;
  $('#stat-xp-note').textContent = state.xp === 0 ? `Next rank: ${level.nextName}` : `${level.remaining} XP to ${level.nextName}`;
  $('#stat-completed').textContent = state.completedTotal;
  $('#stat-streak').innerHTML = `${streaks.current} <small>${streaks.current === 1 ? 'day' : 'days'}</small>`;
  $('#stat-streak-note').textContent = streaks.current ? 'Keep your streak going' : 'Start a streak with one small win';
  $('#stat-focus').innerHTML = `${state.focusMinutes} <small>min</small>`;
  $('#daily-progress-count').textContent = `${dailyCount}/${state.dailyGoal}`;
  $('#daily-progress-percent').textContent = `${dailyPercent}%`;
  $('#daily-progress-fill').style.width = `${dailyPercent}%`;
  $('#daily-goal-value').textContent = state.dailyGoal;
  $('#settings-goal-value').textContent = state.dailyGoal;
  const progressTrack = $('#daily-progress-fill').parentElement;
  progressTrack.setAttribute('aria-valuemin', '0');
  progressTrack.setAttribute('aria-valuemax', '100');
  progressTrack.setAttribute('aria-valuenow', String(dailyPercent));
  progressTrack.setAttribute('aria-valuetext', `${dailyCount} of ${state.dailyGoal} quests`);
  if (dailyCount >= state.dailyGoal) $('#daily-goal-message').textContent = 'Daily goal complete. Nice work.';
  else if (dailyCount === 0) $('#daily-goal-message').textContent = `Complete ${state.dailyGoal} quests today to reach your goal.`;
  else $('#daily-goal-message').textContent = `${state.dailyGoal - dailyCount} more ${state.dailyGoal - dailyCount === 1 ? 'quest' : 'quests'} to reach today's goal.`;
  $('#sidebar-name').textContent = state.profile?.name || 'Student';
  $('#sidebar-avatar').innerHTML = avatarMarkup(state.profile?.avatar || 'orange');
  $('#sidebar-avatar').setAttribute('aria-label', `${CAT_AVATAR_LABELS[state.profile?.avatar || 'orange']} profile avatar`);
  $('#sidebar-level').textContent = `LV ${String(level.level).padStart(2, '0')} · ${level.name}`;
  $('#sidebar-level').title = levelLabel;
  $('#sidebar-profile').dataset.rankLevel = String(Math.min(level.level, 10));
  $('#sidebar-level-progress-fill').style.width = `${level.progress}%`;
  $('#sidebar-level-track').setAttribute('aria-valuenow', String(level.progress));
  $('#sidebar-level-track').setAttribute('aria-valuetext', `${level.progressXp} of ${level.requiredXp} XP toward ${level.nextName}`);
  $('#topbar-level-number').textContent = `LEVEL ${String(level.level).padStart(2, '0')}`;
  $('#topbar-level-name').textContent = level.name;
  $('#topbar-level-fill').style.width = `${level.progress}%`;
  $('#topbar-level-reminder').setAttribute('aria-label', `${levelLabel}. ${level.remaining} XP until ${level.nextName}. View progress.`);
}
function renderProgress() {
  const level = getLevelInfo();
  const streaks = getStreaks();
  $('#progress-level-name').textContent = level.name;
  $('#progress-level-number').textContent = `Level ${level.level}`;
  $('#level-progress-fill').style.width = `${level.progress}%`;
  $('#level-progress-copy').textContent = `${level.progressXp.toLocaleString()} / ${level.requiredXp.toLocaleString()} XP · ${level.remaining.toLocaleString()} XP to ${level.nextName}`;
  $('#progress-reward-title').textContent = `Rank badge: ${level.name}`;
  $('#progress-reward-copy').textContent = level.reward;
  $('#progress-next-rank').textContent = `Next: ${level.nextName}`;
  $('#rank-roadmap-current').textContent = `Level ${level.level} active`;
  const rankRoadmap = LEVEL_RANKS.map((rank, index) => {
    const rankLevel = index + 1;
    const unlocked = level.level >= rankLevel;
    const current = level.level === rankLevel;
    const rankStatus = current ? 'Current rank' : unlocked ? 'Unlocked' : 'Locked';
    return `<article class="rank-roadmap-item ${unlocked ? 'unlocked' : ''} ${current ? 'current' : ''}"><div class="rank-roadmap-mark">${icon(unlocked ? 'medal' : 'lock', 'icon')}</div><div class="rank-roadmap-copy"><span>LEVEL ${String(rankLevel).padStart(2, '0')} · ${rank.xp.toLocaleString()} XP</span><h3>${escapeHTML(rank.name)}</h3><p>${escapeHTML(rank.reward)}</p></div><span class="rank-roadmap-status">${rankStatus}</span></article>`;
  });
  if (level.level > LEVEL_RANKS.length) {
    rankRoadmap.push(`<article class="rank-roadmap-item unlocked current"><div class="rank-roadmap-mark">${icon('medal', 'icon')}</div><div class="rank-roadmap-copy"><span>LEVEL ${String(level.level).padStart(2, '0')} · ${level.currentFloor.toLocaleString()} XP</span><h3>${escapeHTML(level.name)}</h3><p>${escapeHTML(level.reward)}</p></div><span class="rank-roadmap-status">Current rank</span></article>`);
  }
  $('#rank-roadmap').innerHTML = rankRoadmap.join('');
  $('#progress-total-xp').textContent = state.xp;
  $('#progress-completed').textContent = state.completedTotal;
  $('#progress-focus-minutes').textContent = state.focusMinutes;
  $('#progress-best-streak').innerHTML = `${streaks.best} <small>${streaks.best === 1 ? 'day' : 'days'}</small>`;

  const days = [];
  for (let offset = -6; offset <= 0; offset++) {
    const key = dateOffsetKey(offset);
    const date = new Date(`${key}T12:00:00`);
    const count = dailyActivityCount(key);
    days.push({ key, label: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), count, today: offset === 0 });
  }
  const max = Math.max(1, ...days.map(day => day.count));
  $('#weekly-chart').innerHTML = days.map(day => {
    const height = day.count === 0 ? 3 : Math.max(9, Math.round(day.count / max * 95));
    return `<div class="chart-day"><span class="chart-day-count">${day.count || ''}</span><div class="chart-bar-zone"><div class="chart-bar ${day.today ? 'today' : ''}" style="height:${height}px" title="${day.count} completed ${day.count === 1 ? 'quest' : 'quests'}"></div></div><span class="chart-day-label">${day.label}</span></div>`;
  }).join('');

  const badges = [
    { title: 'First steps', desc: 'Complete your first quest.', icon: 'flag', unlocked: state.completedTotal >= 1 },
    { title: 'Getting the hang', desc: 'Complete five quests.', icon: 'check-circle', unlocked: state.completedTotal >= 5 },
    { title: 'Focus friend', desc: 'Finish a focus session.', icon: 'clock', unlocked: state.focusMinutes > 0 },
    { title: 'In the zone', desc: 'Spend 60 minutes focusing.', icon: 'target', unlocked: state.focusMinutes >= 60 },
    { title: 'Little streak', desc: 'Build a three-day streak.', icon: 'flame', unlocked: streaks.best >= 3 },
    { title: 'Quest collector', desc: 'Complete 15 quests.', icon: 'trophy', unlocked: state.completedTotal >= 15 },
    { title: 'Level up', desc: 'Reach level 2.', icon: 'sparkles', unlocked: level.level >= 2 },
    { title: 'Study regular', desc: 'Complete 30 quests.', icon: 'book-open', unlocked: state.completedTotal >= 30 }
  ];
  $('#achievement-grid').innerHTML = badges.map(badge => `<article class="achievement-card ${badge.unlocked ? 'unlocked' : ''}"><div class="achievement-mark">${icon(badge.icon,'icon')}</div><h3>${badge.title}</h3><p>${badge.desc}</p><span class="achievement-status">${badge.unlocked ? 'Unlocked' : 'Not yet'}</span></article>`).join('');
}
function renderFocusTaskOptions() {
  const selected = ui.focusTaskSelect.value;
  const tasks = state.tasks.filter(task => !task.completed);
  ui.focusTaskSelect.innerHTML = `<option value="">No specific quest</option>` + tasks.map(task => `<option value="${escapeHTML(task.id)}">${escapeHTML(task.title)}</option>`).join('');
  if (tasks.some(task => task.id === selected)) ui.focusTaskSelect.value = selected;
  renderFocusSelectedTask();
}
function renderFocusSelectedTask() {
  const task = state.tasks.find(item => item.id === ui.focusTaskSelect.value);
  ui.focusSelectedTask.textContent = task ? `Selected: ${task.title}. Stay with this one thing.` : 'Any focused effort counts.';
}
function renderTimer() {
  document.body.classList.toggle('timer-running', timerRunning);
  ui.timerDisplay.textContent = `${String(Math.floor(timerRemaining / 60)).padStart(2,'0')}:${String(timerRemaining % 60).padStart(2,'0')}`;
  const total = state.timerPreset * 60;
  const progress = total > 0 ? 1 - timerRemaining / total : 0;
  ui.timerRing.style.strokeDasharray = String(TIMER_CIRCUMFERENCE);
  ui.timerRing.style.strokeDashoffset = String(TIMER_CIRCUMFERENCE * progress);
  ui.timerStart.innerHTML = `${icon(timerRunning ? 'pause' : 'play','icon icon-sm icon-dark')}<span>${timerRunning ? 'Pause focus' : timerFinished ? 'Start again' : 'Start focus'}</span>`;
  ui.timerMode.textContent = timerRunning ? 'SESSION IN PROGRESS' : timerFinished ? 'SESSION COMPLETE' : 'FOCUS SESSION';
  ui.timerStatus.textContent = timerFinished ? 'NICE WORK!' : timerRunning ? 'ONE THING AT A TIME' : 'READY WHEN YOU ARE';
  $$('[data-minutes]').forEach(button => {
    const selected = Number(button.dataset.minutes) === state.timerPreset;
    button.classList.toggle('selected', selected);
    button.disabled = timerRunning;
  });
  $('#focus-page-total').textContent = `${state.focusMinutes} min`;
  $('#focus-page-sessions').textContent = ensureDailyLog().sessions;
}
function renderDate() {
  const now = new Date();
  $('#today-label').textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  renderClock();
}
function renderClock() {
  const now = new Date();
  const is12Hour = state.clockFormat === '12';
  $('#live-clock').textContent = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: is12Hour }).format(now);
  $('#live-clock').setAttribute('datetime', now.toISOString());
  $('#clock-format-note').textContent = is12Hour ? '12-HOUR' : 'LOCAL TIME';
}
function renderTheme() {
  document.body.dataset.theme = state.theme;
  document.body.dataset.font = state.fontFamily;
  document.body.dataset.textSize = state.textSize;
  document.body.dataset.motion = state.motionPreference;
  $$('[data-theme-choice]').forEach(button => {
    const active = button.dataset.themeChoice === state.theme;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#settings-font').value = state.fontFamily;
  $('#settings-text-size').value = state.textSize;
  $('#settings-clock-format').value = state.clockFormat;
  $('#settings-motion').value = state.motionPreference;
  const darkMode = DARK_THEMES.includes(state.theme);
  $('#theme-toggle').innerHTML = icon(darkMode ? 'sun' : 'moon', 'icon');
  $('#theme-toggle').setAttribute('aria-label', darkMode ? 'Switch to a light theme' : 'Switch to a dark theme');
  $('#theme-toggle').title = darkMode ? 'Switch to a light theme' : 'Switch to a dark theme';
}
function renderAll() {
  renderTheme();
  renderTasks();
  renderStats();
  renderProgress();
  renderFocusTaskOptions();
  renderTimer();
}
function showWelcome() {
  renderTheme();
  ui.welcome.hidden = false;
  ui.app.hidden = true;
  if (state.profile) ui.profileName.value = state.profile.name || '';
  else ui.profileName.value = '';
  if (state.profile?.favoriteSubject) ui.profileSubject.value = state.profile.favoriteSubject;
  pendingAvatar = state.profile?.avatar || 'orange';
  renderAvatarPickers();
}
function enterApp() {
  ui.welcome.hidden = true;
  ui.app.hidden = false;
  renderDate();
  const firstName = (state.profile?.name || 'there').trim().split(/\s+/)[0];
  $('#greeting-title').textContent = `Hey, ${firstName}.`;
  $('#settings-name').value = state.profile?.name || '';
  renderAvatarPickers();
  renderAll();
  saveState();
  if (!state.tutorialCompleted) window.setTimeout(startTutorial, 320);
}
function renderTutorialStep() {
  const step = tutorialSteps[tutorialStepIndex];
  navigate(step.view);
  $('#tutorial-step-label').textContent = `STEP ${tutorialStepIndex + 1} OF ${tutorialSteps.length}`;
  $('#tutorial-progress-fill').style.width = `${((tutorialStepIndex + 1) / tutorialSteps.length) * 100}%`;
  $('#tutorial-illustration').innerHTML = icon(step.icon, 'icon');
  $('#tutorial-kicker').textContent = `YOUR QUICK TOUR · ${String(tutorialStepIndex + 1).padStart(2, '0')}`;
  $('#tutorial-title').textContent = step.title;
  $('#tutorial-copy').textContent = step.copy;
  $('#tutorial-location').innerHTML = `${escapeHTML(step.location.split(' · ')[0])} <span>·</span> ${escapeHTML(step.location.split(' · ')[1])}`;
  $('#tutorial-previous').disabled = tutorialStepIndex === 0;
  $('#tutorial-next').innerHTML = tutorialStepIndex === tutorialSteps.length - 1
    ? `Finish tour ${icon('check', 'icon icon-sm icon-dark')}`
    : `Next ${icon('arrow-right', 'icon icon-sm icon-dark')}`;
}
function startTutorial() {
  tutorialStepIndex = 0;
  ui.tutorial.hidden = false;
  document.body.style.overflow = 'hidden';
  renderTutorialStep();
  $('#tutorial-next').focus({ preventScroll: true });
}
function finishTutorial() {
  ui.tutorial.hidden = true;
  document.body.style.overflow = '';
  state.tutorialCompleted = true;
  saveState();
  navigate('overview');
  showToast('Tour complete. Your space is ready.');
}
function moveTutorial(direction) {
  const next = tutorialStepIndex + direction;
  if (next < 0) return;
  if (next >= tutorialSteps.length) return finishTutorial();
  tutorialStepIndex = next;
  renderTutorialStep();
}
function triggerConfetti(count = 24) {
  if (state.motionPreference === 'reduced' || (state.motionPreference === 'system' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.setProperty('--x', `${Math.round((Math.random() - .5) * 430)}px`);
    piece.style.setProperty('--y', `${Math.round(-90 - Math.random() * 260)}px`);
    piece.style.setProperty('--spin', `${Math.round(Math.random() * 720 - 360)}deg`);
    piece.style.setProperty('--hue', `${Math.round(Math.random() * 360)}deg`);
    piece.style.setProperty('--delay', `${Math.round(Math.random() * 140)}ms`);
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  window.setTimeout(() => layer.remove(), 1300);
}

function showToast(message) {
  clearTimeout(toastTimeout);
  ui.toast.textContent = message;
  ui.toast.classList.add('visible');
  toastTimeout = setTimeout(() => ui.toast.classList.remove('visible'), 2600);
}
function navigate(view) {
  const valid = ['overview', 'quests', 'focus', 'progress', 'about', 'settings'];
  if (!valid.includes(view)) view = 'overview';
  currentView = view;
  $$('.view').forEach(section => {
    const active = section.dataset.page === view;
    section.hidden = !active;
    section.classList.toggle('view-active', active);
    section.classList.remove('is-entering');
    if (active) {
      void section.offsetWidth;
      section.classList.add('is-entering');
    }
  });
  $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  const names = { overview: 'Overview', quests: 'My quests', focus: 'Focus room', progress: 'Progress', about: 'About StudyQuest', settings: 'Settings' };
  ui.breadcrumb.textContent = names[view];
  closeSidebar();
  if (view === 'quests' && ui.tutorial.hidden) setTimeout(() => ui.search.focus({ preventScroll: true }), 80);
}
function openTaskModal(task = null) {
  editingTaskId = task ? task.id : null;
  ui.taskForm.reset();
  ui.taskFormError.hidden = true;
  ui.taskFormError.textContent = '';
  ui.taskModalTitle.textContent = task ? 'Edit your quest' : 'Add a quest';
  ui.taskModalKicker.textContent = task ? 'A SMALL PLAN CHANGE' : 'A NEW LITTLE MISSION';
  $('#save-task-button').innerHTML = `${task ? 'Save changes' : 'Add quest'} ${icon('arrow-right','icon icon-sm icon-dark')}`;
  ui.taskTitle.value = task?.title || '';
  ui.taskSubject.value = task?.subject || state.profile?.favoriteSubject || 'Computer Science';
  ui.taskPriority.value = task?.priority || 'normal';
  ui.taskDue.value = task?.due || '';
  ui.taskDuration.value = String(task?.duration || 25);
  ui.modal.hidden = false;
  document.body.style.overflow = 'hidden';
  setTimeout(() => ui.taskTitle.focus(), 50);
}
function closeTaskModal() {
  ui.modal.hidden = true;
  document.body.style.overflow = '';
  editingTaskId = null;
}
function submitTask(event) {
  event.preventDefault();
  const title = ui.taskTitle.value.trim();
  if (!title) {
    ui.taskFormError.textContent = 'Give your quest a name first.';
    ui.taskFormError.hidden = false;
    ui.taskTitle.focus();
    return;
  }
  const data = {
    title,
    subject: ui.taskSubject.value,
    priority: ui.taskPriority.value,
    due: ui.taskDue.value,
    duration: Number(ui.taskDuration.value) || 25
  };
  if (editingTaskId) {
    const task = state.tasks.find(item => item.id === editingTaskId);
    if (!task) return closeTaskModal();
    Object.assign(task, data);
    showToast('Quest updated. Plan adjusted.');
  } else {
    state.tasks.unshift({ id: makeId(), ...data, completed: false, completedAt: null, xpAwarded: false, completionLog: [] });
    currentFilter = 'all';
    $$('.filter-tab').forEach(button => button.classList.toggle('active', button.dataset.filter === currentFilter));
    ui.search.value = '';
    ui.subjectFilter.value = 'all';
    showToast('Quest added. One step at a time.');
  }
  saveState();
  closeTaskModal();
  renderAll();
  if (currentView !== 'quests') navigate('quests');
}
function awardXp(amount) {
  const previous = getLevelInfo();
  state.xp += amount;
  const next = getLevelInfo();
  return next.level > previous.level ? { previous, next } : null;
}
function showLevelUp(change) {
  const { next } = change;
  $('#level-up-number').textContent = String(next.level).padStart(2, '0');
  $('#level-up-title').textContent = `Level ${next.level} unlocked!`;
  $('#level-up-rank').textContent = next.name;
  $('#level-up-copy').textContent = `You moved up from ${change.previous.name}. Keep collecting XP to reach ${next.nextName}.`;
  $('#level-up-reward-title').textContent = `${next.name} rank badge unlocked`;
  $('#level-up-reward-copy').textContent = next.reward;
  const hue = Math.max(35, 266 - Math.min(next.level, 10) * 17);
  $('#level-up-modal').style.setProperty('--level-up-hue', String(hue));
  $('#level-up-modal').hidden = false;
  document.body.style.overflow = 'hidden';
  const dialog = $('#level-up-modal .level-up-dialog');
  dialog.classList.remove('is-celebrating');
  void dialog.offsetWidth;
  dialog.classList.add('is-celebrating');
  triggerConfetti(42);
  $('#level-up-continue').focus({ preventScroll: true });
}
function closeLevelUp() {
  $('#level-up-modal').hidden = true;
  document.body.style.overflow = (!ui.tutorial.hidden || !ui.modal.hidden) ? 'hidden' : '';
}
function floatXp(amount) {
  let target = $('#topbar-level-reminder');
  if (!target || getComputedStyle(target).display === 'none') target = $('#stat-xp')?.closest('.stat-card');
  if (!target || state.motionPreference === 'reduced') return;
  const bounds = target.getBoundingClientRect();
  const float = document.createElement('span');
  float.className = 'xp-float';
  float.textContent = `+${amount} XP`;
  float.style.left = `${Math.max(10, Math.min(window.innerWidth - 120, bounds.left + bounds.width / 2))}px`;
  float.style.top = `${Math.max(8, bounds.top + 8)}px`;
  document.body.appendChild(float);
  window.setTimeout(() => float.remove(), 1250);
}

function toggleTask(id) {
  const task = state.tasks.find(item => item.id === id);
  if (!task) return;
  const wasComplete = task.completed;
  const dailyCountBefore = dailyCompletedCount();
  let levelChange = null;
  let earnedXp = false;
  task.completed = !wasComplete;
  if (task.completed) {
    const today = todayKey();
    task.completedAt = today;
    if (!task.completionLog.includes(today)) task.completionLog.push(today);
    const daily = ensureDailyLog(today);
    if (!daily.completedIds.includes(task.id)) daily.completedIds.push(task.id);
    if (!task.xpAwarded) {
      task.xpAwarded = true;
      state.completedTotal += 1;
      levelChange = awardXp(XP_PER_QUEST);
      earnedXp = true;
      if (!levelChange) floatXp(XP_PER_QUEST);
    }
  } else {
    task.completedAt = null;
  }
  const dailyGoalJustReached = dailyCountBefore < state.dailyGoal && dailyCompletedCount() >= state.dailyGoal;
  saveState();
  renderAll();
  if (levelChange) {
    showLevelUp(levelChange);
    if (dailyGoalJustReached) triggerConfetti(48);
  } else if (task.completed && earnedXp) {
    showToast(dailyGoalJustReached ? `Daily goal reached! +${XP_PER_QUEST} XP` : `Quest complete! +${XP_PER_QUEST} XP`);
    triggerConfetti(dailyGoalJustReached ? 40 : 24);
  } else if (task.completed) {
    showToast(dailyGoalJustReached ? 'Daily goal reached. Nice work.' : 'Quest checked off. Your XP was already collected.');
    if (dailyGoalJustReached) triggerConfetti(40);
  } else {
    showToast('Moved back to your to-do list. Your XP stays earned.');
  }
}
function deleteTask(id) {
  const task = state.tasks.find(item => item.id === id);
  if (!task) return;
  state.tasks = state.tasks.filter(item => item.id !== id);
  saveState();
  renderAll();
  showToast('Quest removed.');
}
function handleTaskAction(event) {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const { action, id } = control.dataset;
  if (action === 'toggle') toggleTask(id);
  if (action === 'edit') {
    const task = state.tasks.find(item => item.id === id);
    if (task) openTaskModal(task);
  }
  if (action === 'delete') deleteTask(id);
}
function setFilter(filter) {
  currentFilter = filter;
  $$('.filter-tab').forEach(button => button.classList.toggle('active', button.dataset.filter === filter));
  renderTasks();
}
function changeDailyGoal(delta) {
  state.dailyGoal = Math.min(10, Math.max(1, state.dailyGoal + delta));
  saveState();
  renderStats();
}
function setTheme(theme, announce = true) {
  state.theme = THEMES.includes(theme) ? theme : 'classic';
  saveState();
  renderTheme();
  if (announce) showToast(`${THEME_LABELS[state.theme]} theme on.`);
}
function startOrPauseTimer() {
  if (timerRunning) {
    timerRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    ui.timerNote.textContent = 'Paused. Take a breath, then carry on.';
    renderTimer();
    return;
  }
  if (timerFinished || timerRemaining <= 0) {
    timerRemaining = state.timerPreset * 60;
    timerFinished = false;
  }
  timerRunning = true;
  ui.timerNote.textContent = 'Just stay with this one thing for now.';
  timerInterval = setInterval(() => {
    timerRemaining = Math.max(0, timerRemaining - 1);
    renderTimer();
    if (timerRemaining <= 0) finishTimer();
  }, 1000);
  renderTimer();
}
function finishTimer() {
  timerRunning = false;
  timerFinished = true;
  clearInterval(timerInterval);
  timerInterval = null;
  const daily = ensureDailyLog();
  daily.focusMinutes += state.timerPreset;
  daily.sessions += 1;
  state.focusMinutes += state.timerPreset;
  const levelChange = awardXp(XP_PER_FOCUS_SESSION);
  if (!levelChange) floatXp(XP_PER_FOCUS_SESSION);
  saveState();
  renderAll();
  ui.timerNote.textContent = `Session complete. +${XP_PER_FOCUS_SESSION} XP. Take a short break before your next one.`;
  if (levelChange) showLevelUp(levelChange);
  else {
    showToast(`Focus session complete! +${XP_PER_FOCUS_SESSION} XP`);
    triggerConfetti();
  }
}
function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = false;
  timerFinished = false;
  timerRemaining = state.timerPreset * 60;
  ui.timerNote.textContent = 'Quiet the noise. You\'ve got this.';
  renderTimer();
}
function setTimerPreset(minutes) {
  if (![15, 25, 45, 50].includes(minutes) || timerRunning) return;
  state.timerPreset = minutes;
  timerRemaining = minutes * 60;
  timerFinished = false;
  saveState();
  ui.timerNote.textContent = 'Timer ready when you are.';
  renderTimer();
}
function downloadData() {
  const payload = { app: 'StudyQuest', exportedAt: new Date().toISOString(), note: 'Local prototype backup. This file may contain personal study information.', data: state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `studyquest-backup-${todayKey()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Backup downloaded. Keep it somewhere safe.');
}
function resetPrototype() {
  const confirmed = window.confirm('Reset StudyQuest? This clears the local profile, quests, XP and focus history on this device.');
  if (!confirmed) return;
  clearInterval(timerInterval);
  timerRunning = false;
  timerInterval = null;
  localStorage.removeItem(STORAGE_KEY);
  state = freshState();
  pendingAvatar = 'orange';
  timerRemaining = state.timerPreset * 60;
  timerFinished = false;
  currentFilter = 'all';
  currentView = 'overview';
  showWelcome();
}
function saveProfileName(event) {
  event.preventDefault();
  const value = $('#settings-name').value.trim();
  if (!value) return showToast('Please enter a name.');
  state.profile = { ...state.profile, name: value, avatar: state.profile?.avatar || pendingAvatar || 'orange' };
  saveState();
  enterApp();
  navigate('settings');
  showToast('Name updated.');
}
function setTimerTip() {
  let next = Math.floor(Math.random() * tips.length);
  if (tips.length > 1 && next === tipIndex) next = (next + 1) % tips.length;
  tipIndex = next;
  $('#focus-tip-text').textContent = tips[tipIndex];
}
function openSidebar() {
  ui.sidebar.classList.add('open');
  ui.scrim.hidden = false;
  $('#mobile-menu-button').setAttribute('aria-expanded', 'true');
}
function closeSidebar() {
  ui.sidebar.classList.remove('open');
  ui.scrim.hidden = true;
  $('#mobile-menu-button').setAttribute('aria-expanded', 'false');
}

function init() {
  ui.profileForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = ui.profileName.value.trim();
    if (!name) return ui.profileName.focus();
    state.profile = { name, favoriteSubject: ui.profileSubject.value, avatar: pendingAvatar || 'orange' };
    if (!Array.isArray(state.tasks) || !state.tasks.length) state.tasks = starterTasks.map(task => ({ ...task, completionLog: [] }));
    saveState();
    enterApp();
  });
  $$('[data-welcome-avatar]').forEach(button => button.addEventListener('click', () => chooseProfileAvatar(button.dataset.welcomeAvatar, false)));
  $$('[data-settings-avatar]').forEach(button => button.addEventListener('click', () => chooseProfileAvatar(button.dataset.settingsAvatar, true)));
  $('#continue-saved-profile').addEventListener('click', () => {
    if (!state.profile) {
      showToast('Create a local profile first.');
      ui.profileName.focus();
      return;
    }
    enterApp();
  });

  $$('[data-view]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.view)));
  $$('[data-go-view]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.goView)));
  $$('[data-open-task]').forEach(button => button.addEventListener('click', () => openTaskModal()));
  ui.taskForm.addEventListener('submit', submitTask);
  $('#close-task-modal').addEventListener('click', closeTaskModal);
  $('#cancel-task').addEventListener('click', closeTaskModal);
  ui.modal.addEventListener('click', event => { if (event.target === ui.modal) closeTaskModal(); });
  $('#level-up-close').addEventListener('click', closeLevelUp);
  $('#level-up-continue').addEventListener('click', closeLevelUp);
  $('#level-up-modal').addEventListener('click', event => { if (event.target === $('#level-up-modal')) closeLevelUp(); });

  ui.overviewTasks.addEventListener('click', handleTaskAction);
  ui.fullTaskList.addEventListener('click', handleTaskAction);
  $$('.filter-tab').forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  ui.search.addEventListener('input', renderTasks);
  ui.subjectFilter.addEventListener('change', renderTasks);
  $('#clear-completed').addEventListener('click', () => {
    const count = state.tasks.filter(task => task.completed).length;
    if (!count) return;
    state.tasks = state.tasks.filter(task => !task.completed);
    saveState();
    renderAll();
    showToast(`${count} completed ${count === 1 ? 'quest' : 'quests'} cleared. XP stays earned.`);
  });

  $('#goal-minus').addEventListener('click', () => changeDailyGoal(-1));
  $('#goal-plus').addEventListener('click', () => changeDailyGoal(1));
  $('#settings-goal-minus').addEventListener('click', () => changeDailyGoal(-1));
  $('#settings-goal-plus').addEventListener('click', () => changeDailyGoal(1));
  $('#settings-profile-form').addEventListener('submit', saveProfileName);
  $('#sidebar-profile-button').addEventListener('click', () => navigate('settings'));
  $('#theme-toggle').addEventListener('click', () => {
    setTheme(DARK_THEMES.includes(state.theme) ? 'classic' : 'midnight');
  });
  $('#settings-font').addEventListener('change', event => {
    state.fontFamily = ['system', 'rounded', 'serif', 'mono'].includes(event.target.value) ? event.target.value : 'system';
    saveState(); renderTheme(); showToast('Font updated.');
  });
  $('#settings-text-size').addEventListener('change', event => {
    state.textSize = ['normal', 'large', 'extra-large'].includes(event.target.value) ? event.target.value : 'normal';
    saveState(); renderTheme(); showToast('Text size updated.');
  });
  $('#settings-clock-format').addEventListener('change', event => {
    state.clockFormat = event.target.value === '12' ? '12' : '24';
    saveState(); renderClock();
  });
  $('#settings-motion').addEventListener('change', event => {
    state.motionPreference = ['system', 'full', 'reduced'].includes(event.target.value) ? event.target.value : 'system';
    saveState(); renderTheme(); showToast('Motion preference updated.');
  });
  $$('[data-theme-choice]').forEach(button => button.addEventListener('click', () => setTheme(button.dataset.themeChoice)));
  $('#export-data').addEventListener('click', downloadData);
  $('#reset-data').addEventListener('click', resetPrototype);
  $('#restart-tutorial').addEventListener('click', startTutorial);
  $('#tutorial-next').addEventListener('click', () => moveTutorial(1));
  $('#tutorial-previous').addEventListener('click', () => moveTutorial(-1));
  $('#tutorial-skip').addEventListener('click', finishTutorial);
  $('#tutorial-close').addEventListener('click', finishTutorial);

  $('#timer-start').addEventListener('click', startOrPauseTimer);
  $('#timer-reset').addEventListener('click', resetTimer);
  $$('[data-minutes]').forEach(button => button.addEventListener('click', () => setTimerPreset(Number(button.dataset.minutes))));
  ui.focusTaskSelect.addEventListener('change', renderFocusSelectedTask);
  $('#new-focus-tip').addEventListener('click', setTimerTip);
  $('#mobile-menu-button').addEventListener('click', openSidebar);
  ui.scrim.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!$('#level-up-modal').hidden) closeLevelUp();
      if (!ui.tutorial.hidden) finishTutorial();
      if (!ui.modal.hidden) closeTaskModal();
      closeSidebar();
    }
    if (event.key === '/' && currentView === 'quests' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && ui.modal.hidden) {
      event.preventDefault();
      ui.search.focus();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !ui.welcome.hidden) {
      event.preventDefault();
      openTaskModal();
    }
  });

  ensureDailyLog();
  renderDate();
  window.setInterval(renderClock, 1000);
  if (state.profile) enterApp();
  else showWelcome();
}

init();
