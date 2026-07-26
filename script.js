// ===================================================================
// Cuisson Timer - script.js
// Application front-end vanilla JS - minuteur crêpes/pancakes/gaufres
// ===================================================================

'use strict';

// ----------------------------------------------------------------
// Configuration des modes
// ----------------------------------------------------------------
const MODES = {
  crepe: {
    label: 'crêpe',
    emoji: '🥞',
    hasTwoFaces: true,
    defaultDurations: { face1: 45, face2: 30 },
    face1LabelText: 'Face 1 (s)',
    face2LabelText: 'Face 2 (s)'
  },
  pancake: {
    label: 'pancake',
    emoji: '🥯',
    hasTwoFaces: true,
    defaultDurations: { face1: 90, face2: 60 },
    face1LabelText: 'Face 1 (s)',
    face2LabelText: 'Face 2 (s)'
  },
  gaufre: {
    label: 'gaufre',
    emoji: '🧇',
    hasTwoFaces: false,
    defaultDurations: { face1: 240 },
    face1LabelText: 'Durée totale (s)'
  }
};

const STORAGE_KEYS = {
  settings: 'cuissonTimer.settings',
  counters: 'cuissonTimer.counters',
  theme: 'cuissonTimer.theme'
};

// ----------------------------------------------------------------
// Etat de l'application
// ----------------------------------------------------------------
let state = {
  currentMode: 'crepe',
  timerId: null,
  isRunning: false,
  currentStep: 'idle', // idle | face1 | face2 | done
  remainingSeconds: 0,
  settings: loadSettings(),
  counters: loadCounters()
};

// ----------------------------------------------------------------
// Références DOM
// ----------------------------------------------------------------
const el = {
  modeButtons: document.querySelectorAll('.mode-btn'),
  stepIndicator: document.getElementById('stepIndicator'),
  timerDisplay: document.getElementById('timerDisplay'),
  face1Row: document.getElementById('face1Row'),
  face2Row: document.getElementById('face2Row'),
  face1Label: document.getElementById('face1Label'),
  face2Label: document.getElementById('face2Label'),
  face1Duration: document.getElementById('face1Duration'),
  face2Duration: document.getElementById('face2Duration'),
  startPauseBtn: document.getElementById('startPauseBtn'),
  resetBtn: document.getElementById('resetBtn'),
  mainActionBtn: document.getElementById('mainActionBtn'),
  countCrepe: document.getElementById('countCrepe'),
  countPancake: document.getElementById('countPancake'),
  countGaufre: document.getElementById('countGaufre'),
  countTotal: document.getElementById('countTotal'),
  resetCountersBtn: document.getElementById('resetCountersBtn'),
  darkModeToggle: document.getElementById('darkModeToggle'),
  beepSound: document.getElementById('beepSound')
};

// ----------------------------------------------------------------
// Persistance localStorage
// ----------------------------------------------------------------
function loadSettings() {
  const raw = localStorage.getItem(STORAGE_KEYS.settings);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fallback */ }
  }
  const defaults = {};
  Object.keys(MODES).forEach(mode => {
    defaults[mode] = { ...MODES[mode].defaultDurations };
  });
  return defaults;
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
}

function loadCounters() {
  const raw = localStorage.getItem(STORAGE_KEYS.counters);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fallback */ }
  }
  return { crepe: 0, pancake: 0, gaufre: 0 };
}

function saveCounters() {
  localStorage.setItem(STORAGE_KEYS.counters, JSON.stringify(state.counters));
}

function loadTheme() {
  return localStorage.getItem(STORAGE_KEYS.theme) || 'light';
}

function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

// ----------------------------------------------------------------
// Rendu UI
// ----------------------------------------------------------------
function renderModeUI() {
  const modeConfig = MODES[state.currentMode];

  el.modeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === state.currentMode);
  });

  el.face1Label.textContent = modeConfig.face1LabelText;
  el.face1Duration.value = state.settings[state.currentMode].face1;

  if (modeConfig.hasTwoFaces) {
    el.face2Row.style.display = 'flex';
    el.face2Label.textContent = modeConfig.face2LabelText;
    el.face2Duration.value = state.settings[state.currentMode].face2;
  } else {
    el.face2Row.style.display = 'none';
  }

  el.mainActionBtn.textContent = `Nouvelle ${modeConfig.label}`;
  resetCycleUI();
}

function renderCounters() {
  el.countCrepe.textContent = state.counters.crepe;
  el.countPancake.textContent = state.counters.pancake;
  el.countGaufre.textContent = state.counters.gaufre;
  const total = state.counters.crepe + state.counters.pancake + state.counters.gaufre;
  el.countTotal.textContent = total;
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerDisplay() {
  el.timerDisplay.textContent = formatTime(state.remainingSeconds);
}

function setStepIndicator(text, cssClass) {
  el.stepIndicator.textContent = text;
  el.stepIndicator.className = 'step-indicator' + (cssClass ? ' ' + cssClass : '');
}

function resetCycleUI() {
  state.currentStep = 'idle';
  state.isRunning = false;
  clearInterval(state.timerId);
  state.timerId = null;
  el.startPauseBtn.textContent = 'Démarrer';
  el.startPauseBtn.classList.remove('running');
  el.mainActionBtn.hidden = true;
  el.settingsPanelEnable = true;
  setSettingsInputsDisabled(false);
  const modeConfig = MODES[state.currentMode];
  state.remainingSeconds = modeConfig.hasTwoFaces
    ? getDuration('face1')
    : getDuration('face1');
  updateTimerDisplay();
  setStepIndicator('Prêt à démarrer');
}

function setSettingsInputsDisabled(disabled) {
  el.face1Duration.disabled = disabled;
  el.face2Duration.disabled = disabled;
}

// ----------------------------------------------------------------
// Logique du minuteur
// ----------------------------------------------------------------
function getDuration(faceKey) {
  const val = parseInt(state.settings[state.currentMode][faceKey], 10);
  return Number.isFinite(val) && val > 0 ? val : MODES[state.currentMode].defaultDurations[faceKey];
}

function persistCurrentDurations() {
  const modeConfig = MODES[state.currentMode];
  state.settings[state.currentMode].face1 = parseInt(el.face1Duration.value, 10) || modeConfig.defaultDurations.face1;
  if (modeConfig.hasTwoFaces) {
    state.settings[state.currentMode].face2 = parseInt(el.face2Duration.value, 10) || modeConfig.defaultDurations.face2;
  }
  saveSettings();
}

function startCycle() {
  persistCurrentDurations();
  setSettingsInputsDisabled(true);
  state.isRunning = true;
  el.startPauseBtn.textContent = 'Pause';
  el.startPauseBtn.classList.add('running');
  el.mainActionBtn.hidden = true;

  if (state.currentStep === 'idle' || state.currentStep === 'done') {
    state.currentStep = 'face1';
    state.remainingSeconds = getDuration('face1');
    setStepIndicator('Cuisson : Face 1');
  }

  runTick();
}

function pauseCycle() {
  state.isRunning = false;
  clearInterval(state.timerId);
  state.timerId = null;
  el.startPauseBtn.textContent = 'Reprendre';
  el.startPauseBtn.classList.remove('running');
}

function runTick() {
  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    if (!state.isRunning) return;
    state.remainingSeconds--;
    updateTimerDisplay();

    if (state.remainingSeconds <= 0) {
      handleStepEnd();
    }
  }, 1000);
}

function handleStepEnd() {
  const modeConfig = MODES[state.currentMode];
  playAlert();

  if (state.currentStep === 'face1') {
    if (modeConfig.hasTwoFaces) {
      clearInterval(state.timerId);
      state.timerId = null;
      state.isRunning = false;
      state.currentStep = 'flip';
      setStepIndicator('🔄 Retournez maintenant !', 'flip');
      el.startPauseBtn.textContent = 'Face 2 : Démarrer';
      el.startPauseBtn.classList.remove('running');
      state.remainingSeconds = getDuration('face2');
      updateTimerDisplay();
    } else {
      finishCycle();
    }
  } else if (state.currentStep === 'face2') {
    finishCycle();
  }
}

function startFace2() {
  state.currentStep = 'face2';
  state.isRunning = true;
  el.startPauseBtn.textContent = 'Pause';
  el.startPauseBtn.classList.add('running');
  setStepIndicator('Cuisson : Face 2');
  runTick();
}

function finishCycle() {
  clearInterval(state.timerId);
  state.timerId = null;
  state.isRunning = false;
  state.currentStep = 'done';
  state.remainingSeconds = 0;
  updateTimerDisplay();
  setStepIndicator('✅ Cuisson terminée !', 'done');
  el.startPauseBtn.textContent = 'Démarrer';
  el.startPauseBtn.classList.remove('running');
  el.mainActionBtn.hidden = false;
  setSettingsInputsDisabled(false);
  playAlert();
  vibrate([200, 100, 200]);
}

function playAlert() {
  try {
    el.beepSound.currentTime = 0;
    el.beepSound.play().catch(() => {});
  } catch (e) { /* audio non disponible */ }
  vibrate(150);
}

function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

// ----------------------------------------------------------------
// Actions bouton principal (start/pause)
// ----------------------------------------------------------------
function handleStartPauseClick() {
  if (state.currentStep === 'idle' || state.currentStep === 'done') {
    startCycle();
  } else if (state.currentStep === 'flip') {
    startFace2();
  } else if (state.isRunning) {
    pauseCycle();
  } else {
    state.isRunning = true;
    el.startPauseBtn.textContent = 'Pause';
    el.startPauseBtn.classList.add('running');
    runTick();
  }
}

function handleResetClick() {
  resetCycleUI();
}

function handleMainActionClick() {
  state.counters[state.currentMode]++;
  saveCounters();
  renderCounters();
  resetCycleUI();
  startCycle();
}

function handleResetCountersClick() {
  const confirmed = confirm('Voulez-vous vraiment remettre tous les compteurs à zéro ?');
  if (!confirmed) return;
  state.counters = { crepe: 0, pancake: 0, gaufre: 0 };
  saveCounters();
  renderCounters();
}

function handleModeChange(newMode) {
  if (state.isRunning) {
    const confirmed = confirm('Un cycle est en cours. Changer de mode va l\'annuler. Continuer ?');
    if (!confirmed) return;
  }
  state.currentMode = newMode;
  renderModeUI();
}

// ----------------------------------------------------------------
// Mode sombre
// ----------------------------------------------------------------
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    el.darkModeToggle.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    el.darkModeToggle.textContent = '🌙';
  }
  saveTheme(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ----------------------------------------------------------------
// Ecouteurs d'événements
// ----------------------------------------------------------------
el.modeButtons.forEach(btn => {
  btn.addEventListener('click', () => handleModeChange(btn.dataset.mode));
});

el.startPauseBtn.addEventListener('click', handleStartPauseClick);
el.resetBtn.addEventListener('click', handleResetClick);
el.mainActionBtn.addEventListener('click', handleMainActionClick);
el.resetCountersBtn.addEventListener('click', handleResetCountersClick);
el.darkModeToggle.addEventListener('click', toggleTheme);

el.face1Duration.addEventListener('change', () => {
  if (state.currentStep === 'idle') persistCurrentDurations();
});
el.face2Duration.addEventListener('change', () => {
  if (state.currentStep === 'idle') persistCurrentDurations();
});

// ----------------------------------------------------------------
// Initialisation
// ----------------------------------------------------------------
function init() {
  applyTheme(loadTheme());
  renderModeUI();
  renderCounters();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    });
  }
}

init();
