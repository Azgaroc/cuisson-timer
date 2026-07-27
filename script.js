// ===================================================================
// Cuisson Timer - script.js
// Application front-end vanilla JS - minuteur crêpes/pancakes/gaufres
// ===================================================================

'use strict';

// ----------------------------------------------------------------
// Configuration des modes (les libellés viennent de translations.js)
// ----------------------------------------------------------------
const MODES = {
  crepe: {
    hasTwoFaces: true,
    defaultDurations: { face1: 45, face2: 30 },
    emoji: '🥞'
  },
  pancake: {
    hasTwoFaces: true,
    defaultDurations: { face1: 90, face2: 60 },
    emoji: '🥯'
  },
  gaufre: {
    hasTwoFaces: false,
    defaultDurations: { face1: 240 },
    emoji: '🧇'
  }
};

const STORAGE_KEYS = {
  settings: 'cuissonTimer.settings',
  counters: 'cuissonTimer.counters',
  prefs: 'cuissonTimer.prefs'
};

const COUNTDOWN_THRESHOLD = 5; // déclenche les bips à partir de 5s restantes

// ----------------------------------------------------------------
// Etat de l'application
// ----------------------------------------------------------------
let state = {
  currentMode: 'crepe',
  activeTab: 'home',
  timerId: null,
  isRunning: false,
  currentStep: 'idle', // idle | face1 | face2 | done
  remainingSeconds: 0,
  currentStepTotal: 0,
  lastBeepedSecond: null,
  settings: loadSettings(),
  counters: loadCounters(),
  prefs: loadPrefs()
};

// ----------------------------------------------------------------
// Références DOM
// ----------------------------------------------------------------
const el = {};

function cacheDom() {
  el.mainApp = document.getElementById('mainApp');

  el.chooserModeButtons = document.querySelectorAll('#panel-home .chooser-mode-btn');

  el.tabButtons = document.querySelectorAll('.bottom-tabs .tab-btn');
  el.panels = {
    home: document.getElementById('panel-home'),
    minuteur: document.getElementById('panel-minuteur'),
    recipes: document.getElementById('panel-recipes'),
    settings: document.getElementById('panel-settings')
  };

  el.modeButtons = document.querySelectorAll('#panel-minuteur .mode-selector .mode-btn');
  el.stepIndicator = document.getElementById('stepIndicator');
  el.timerDisplay = document.getElementById('timerDisplay');
  el.timerRingProgress = document.getElementById('timerRingProgress');
  el.face1Row = document.getElementById('face1Row');
  el.face2Row = document.getElementById('face2Row');
  el.face1Label = document.getElementById('face1Label');
  el.face2Label = document.getElementById('face2Label');
  el.face1Duration = document.getElementById('face1Duration');
  el.face2Duration = document.getElementById('face2Duration');
  el.startPauseBtn = document.getElementById('startPauseBtn');
  el.resetFinishBtn = document.getElementById('resetFinishBtn');
  el.mainActionBtn = document.getElementById('mainActionBtn');

  el.counterTitle = document.getElementById('counterTitle');
  el.counterValues = {
    crepe: document.getElementById('counterValue-crepe'),
    pancake: document.getElementById('counterValue-pancake'),
    gaufre: document.getElementById('counterValue-gaufre'),
    total: document.getElementById('counterValue-total')
  };
  el.counterCards = document.querySelectorAll('.counter-card[data-mode]');
  el.counterResetButtons = document.querySelectorAll('.counter-reset');

  el.servingsInput = document.getElementById('servingsInput');
  el.recipeContainer = document.getElementById('recipeContainer');

  el.languageSelect = document.getElementById('languageSelect');
  el.soundToggle = document.getElementById('soundToggle');
  el.vibrationToggle = document.getElementById('vibrationToggle');
  el.darkModeToggle = document.getElementById('darkModeToggle');
}

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

function loadPrefs() {
  const raw = localStorage.getItem(STORAGE_KEYS.prefs);
  const defaults = { language: 'fr', sound: true, vibration: true, darkMode: false };
  if (raw) {
    try { return { ...defaults, ...JSON.parse(raw) }; } catch (e) { /* fallback */ }
  }
  const browserLang = (navigator.language || 'fr').slice(0, 2);
  if (TRANSLATIONS[browserLang]) defaults.language = browserLang;
  return defaults;
}

function savePrefs() {
  localStorage.setItem(STORAGE_KEYS.prefs, JSON.stringify(state.prefs));
}

// Adapter pour translations.js qui lit state.settings.language
Object.defineProperty(state, 'settingsLangProxy', { enumerable: false });

// ----------------------------------------------------------------
// Traduction de l'UI (i18n)
// ----------------------------------------------------------------
function translateStaticUI() {
  document.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.getAttribute('data-i18n');
    node.textContent = t(key);
  });
  document.title = t('appName');
}

// Override de t() pour utiliser state.prefs.language
function t(key) {
  const lang = (state.prefs && state.prefs.language) || 'fr';
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.fr;
  return dict[key] || TRANSLATIONS.fr[key] || key;
}

// ----------------------------------------------------------------
// Onglet Accueil : choix du mode (affiché à chaque ouverture)
// ----------------------------------------------------------------
function initHomeChooser() {
  el.chooserModeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      unlockAudio();
      state.currentMode = btn.dataset.mode;
      renderModeUI();
      switchTab('minuteur');
    });
  });
}

// ----------------------------------------------------------------
// Onglets
// ----------------------------------------------------------------
function switchTab(tabName) {
  state.activeTab = tabName;
  el.tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  Object.keys(el.panels).forEach(key => {
    el.panels[key].classList.toggle('hidden', key !== tabName);
  });
  if (tabName === 'recipes') {
    renderRecipesTab();
  }
}

function initTabs() {
  el.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

// ----------------------------------------------------------------
// Rendu UI - Minuteur
// ----------------------------------------------------------------
function renderModeUI() {
  const modeConfig = MODES[state.currentMode];

  el.modeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === state.currentMode);
  });

  el.face1Label.textContent = modeConfig.hasTwoFaces ? t('face1Label') : t('totalDurationLabel');
  el.face1Duration.value = state.settings[state.currentMode].face1;

  if (modeConfig.hasTwoFaces) {
    el.face2Row.style.display = 'flex';
    el.face2Label.textContent = t('face2Label');
    el.face2Duration.value = state.settings[state.currentMode].face2;
  } else {
    el.face2Row.style.display = 'none';
  }

  const newModeBtnKey = { crepe: 'btnNewCrepe', pancake: 'btnNewPancake', gaufre: 'btnNewGaufre' }[state.currentMode];
  el.mainActionBtn.textContent = t(newModeBtnKey);

  renderCounter();
  resetCycleUI();
}

function renderCounter(bumpMode) {
  el.counterTitle.textContent = t('counterLabel');
  let total = 0;
  Object.keys(el.counterValues).forEach(key => {
    if (key === 'total') return;
    const value = state.counters[key] || 0;
    total += value;
    el.counterValues[key].textContent = value;
  });
  el.counterValues.total.textContent = total;

  if (bumpMode) {
    const card = document.querySelector(`.counter-card[data-mode="${bumpMode}"]`);
    if (card) {
      card.classList.remove('bump');
      // force reflow pour pouvoir relancer l'animation si elle vient de jouer
      void card.offsetWidth;
      card.classList.add('bump');
    }
  }
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const RING_CIRCUMFERENCE = 603.19;

function updateTimerDisplay() {
  el.timerDisplay.textContent = formatTime(state.remainingSeconds);
  el.timerDisplay.classList.toggle('countdown', state.remainingSeconds <= COUNTDOWN_THRESHOLD && state.remainingSeconds > 0 && state.isRunning);

  const total = state.currentStepTotal || 1;
  const fraction = Math.max(0, Math.min(1, state.remainingSeconds / total));
  el.timerRingProgress.style.strokeDashoffset = RING_CIRCUMFERENCE * fraction;
}

function setRingState(cssClass) {
  // Sur les éléments SVG, .className n'est pas une simple chaîne (c'est un
  // SVGAnimatedString) : l'assigner directement échoue silencieusement (ou
  // lève une erreur en mode strict) dans les vrais navigateurs. setAttribute
  // fonctionne de façon fiable pour tous les éléments, HTML comme SVG.
  el.timerRingProgress.setAttribute('class', 'timer-ring-progress' + (cssClass ? ' ' + cssClass : ''));
}

function setStepIndicator(text, cssClass) {
  el.stepIndicator.textContent = text;
  el.stepIndicator.className = 'step-indicator' + (cssClass ? ' ' + cssClass : '');
}

function resetCycleUI() {
  state.currentStep = 'idle';
  state.isRunning = false;
  state.lastBeepedSecond = null;
    clearInterval(state.timerId);
  state.timerId = null;
  el.startPauseBtn.textContent = t('btnStart');
  el.startPauseBtn.classList.remove('running');
  el.startPauseBtn.hidden = false;
  el.resetFinishBtn.textContent = t('btnFinish');
  el.mainActionBtn.hidden = true;
  setSettingsInputsDisabled(false);
  state.remainingSeconds = getDuration('face1');
  state.currentStepTotal = state.remainingSeconds;
  updateTimerDisplay();
  setRingState();
  setStepIndicator(t('stepReady'));
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
  state.lastBeepedSecond = null;
  el.startPauseBtn.textContent = t('btnPause');
  el.startPauseBtn.classList.add('running');
  el.mainActionBtn.hidden = true;

  if (state.currentStep === 'idle' || state.currentStep === 'done') {
    state.currentStep = 'face1';
    state.remainingSeconds = getDuration('face1');
    state.currentStepTotal = state.remainingSeconds;
    setStepIndicator(t('stepFace1'));
    setRingState();
  }

  runTick();
}

function pauseCycle() {
  state.isRunning = false;
  clearInterval(state.timerId);
  state.timerId = null;
  el.startPauseBtn.textContent = t('btnResume');
  el.startPauseBtn.classList.remove('running');
}

function runTick() {
  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    if (!state.isRunning) return;

    // Décompte sonore 5,4,3,2,1 avant chaque fin d'étape
    if (state.remainingSeconds > 0 && state.remainingSeconds <= COUNTDOWN_THRESHOLD
        && state.lastBeepedSecond !== state.remainingSeconds) {
      state.lastBeepedSecond = state.remainingSeconds;
      playBeep();
    }

    state.remainingSeconds--;
    updateTimerDisplay();

    if (state.remainingSeconds <= 0) {
      handleStepEnd();
    }
  }, 1000);
}

function handleStepEnd() {
  const modeConfig = MODES[state.currentMode];
  playFinalAlert();

  if (state.currentStep === 'face1') {
    if (modeConfig.hasTwoFaces) {
      // Enchaînement automatique vers face 2 après un court signal de retournement
      clearInterval(state.timerId);
      state.timerId = null;
      state.currentStep = 'face2';
      state.lastBeepedSecond = null;
      setStepIndicator(t('stepFlip'), 'flip');
      setRingState('state-flip');
      state.remainingSeconds = getDuration('face2');
      state.currentStepTotal = state.remainingSeconds;
      updateTimerDisplay();
      vibrate([200, 100, 200]);

      // Petite pause visuelle de 1.5s puis démarrage automatique de la face 2
      setTimeout(() => {
        if (state.currentStep === 'face2') {
          setStepIndicator(t('stepFace2'));
          setRingState();
          runTick();
        }
      }, 1500);
    } else {
      finishCycle();
    }
  } else if (state.currentStep === 'face2') {
    finishCycle();
  }
}

function finishCycle() {
  clearInterval(state.timerId);
  state.timerId = null;
  state.isRunning = false;
  state.currentStep = 'done';
  state.remainingSeconds = 0;
  updateTimerDisplay();
  setStepIndicator(t('stepDone'), 'done');
  setRingState('state-done');
  el.startPauseBtn.hidden = true;
  el.mainActionBtn.hidden = false;
  setSettingsInputsDisabled(false);
  vibrate([200, 100, 200, 100, 200]);
}

// ----------------------------------------------------------------
// Son : bips de décompte + alerte finale (Web Audio API)
//
// On n'utilise plus la balise <audio> + fichier mp3 : sur iPhone/Android,
// audio.play() appelé depuis un setInterval (donc hors "geste utilisateur")
// est souvent bloqué silencieusement par le navigateur. Un AudioContext,
// une fois débloqué par UN clic (voir unlockAudio()), reste utilisable
// ensuite pour générer des bips à la demande, même depuis un timer.
// ----------------------------------------------------------------
let audioCtx = null;

function unlockAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
}

function beepTone(frequency = 880, durationMs = 150, delayMs = 0) {
  if (!audioCtx) return;
  const startTime = audioCtx.currentTime + delayMs / 1000;
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startTime);

  // Petite enveloppe pour éviter les "clics" audio et avoir un bip net
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.35, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + durationMs / 1000);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + durationMs / 1000 + 0.02);
}

function playBeep() {
  vibrateIfEnabled(80);
  if (!state.prefs.sound) return;
  unlockAudio();
  beepTone(880, 150);
}

function playFinalAlert() {
  vibrateIfEnabled([150, 80, 150, 80, 150]);
  if (!state.prefs.sound) return;
  unlockAudio();
  // 4 bips rapprochés et plus aigus pour bien marquer la fin de cuisson
  for (let i = 0; i < 4; i++) {
    beepTone(1046, 180, i * 250);
  }
}

function vibrateIfEnabled(pattern) {
  if (state.prefs.vibration) vibrate(pattern);
}

function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

// ----------------------------------------------------------------
// Actions bouton principal
// ----------------------------------------------------------------
function handleStartPauseClick() {
  unlockAudio();
  if (state.currentStep === 'idle' || state.currentStep === 'done') {
    startCycle();
  } else if (state.isRunning) {
    pauseCycle();
  } else {
    state.isRunning = true;
    el.startPauseBtn.textContent = t('btnPause');
    el.startPauseBtn.classList.add('running');
    runTick();
  }
}

function handleResetFinishClick() {
  resetCycleUI();
}

function handleMainActionClick() {
  state.counters[state.currentMode]++;
  saveCounters();
  renderCounter(state.currentMode);
  resetCycleUI();
  startCycle();
}

function handleResetCounterClick(mode) {
  const confirmed = confirm(t('confirmResetCounter'));
  if (!confirmed) return;
  state.counters[mode] = 0;
  saveCounters();
  renderCounter();
}

function handleModeChange(newMode) {
  if (state.isRunning) {
    const confirmed = confirm(t('confirmCancelCycle'));
    if (!confirmed) return;
  }
  state.currentMode = newMode;
  renderModeUI();
}

// ----------------------------------------------------------------
// Onglet Recettes
// ----------------------------------------------------------------
function renderRecipesTab() {
  const servings = parseInt(el.servingsInput.value, 10) || 4;
  el.recipeContainer.innerHTML = ['crepe', 'pancake', 'gaufre']
    .map(mode => renderRecipe(mode, servings))
    .join('');
}

function initRecipesTab() {
  el.servingsInput.addEventListener('input', renderRecipesTab);
}

// ----------------------------------------------------------------
// Onglet Réglages
// ----------------------------------------------------------------
function initSettingsTab() {
  el.languageSelect.value = state.prefs.language;
  el.soundToggle.checked = state.prefs.sound;
  el.vibrationToggle.checked = state.prefs.vibration;
  el.darkModeToggle.checked = state.prefs.darkMode;

  el.languageSelect.addEventListener('change', () => {
    state.prefs.language = el.languageSelect.value;
    savePrefs();
    translateStaticUI();
    renderModeUI();
    if (!el.panels.recipes.classList.contains('hidden')) renderRecipesTab();
  });

  el.soundToggle.addEventListener('change', () => {
    state.prefs.sound = el.soundToggle.checked;
    savePrefs();
  });

  el.vibrationToggle.addEventListener('change', () => {
    state.prefs.vibration = el.vibrationToggle.checked;
    savePrefs();
  });

  el.darkModeToggle.addEventListener('change', () => {
    state.prefs.darkMode = el.darkModeToggle.checked;
    savePrefs();
    applyDarkMode();
  });
}

function applyDarkMode() {
  if (state.prefs.darkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

// ----------------------------------------------------------------
// Ecouteurs d'événements (minuteur)
// ----------------------------------------------------------------
function initTimerEvents() {
  el.modeButtons.forEach(btn => {
    btn.addEventListener('click', () => handleModeChange(btn.dataset.mode));
  });

  el.startPauseBtn.addEventListener('click', handleStartPauseClick);
  el.resetFinishBtn.addEventListener('click', handleResetFinishClick);
  el.mainActionBtn.addEventListener('click', handleMainActionClick);
  el.counterResetButtons.forEach(btn => {
    btn.addEventListener('click', () => handleResetCounterClick(btn.dataset.mode));
  });

  el.face1Duration.addEventListener('change', () => {
    if (state.currentStep === 'idle') persistCurrentDurations();
  });
  el.face2Duration.addEventListener('change', () => {
    if (state.currentStep === 'idle') persistCurrentDurations();
  });
}

// ----------------------------------------------------------------
// Initialisation
// ----------------------------------------------------------------
function init() {
  cacheDom();
  applyDarkMode();
  translateStaticUI();
  renderModeUI();
  switchTab('home');
  initHomeChooser();
  initTabs();
  initTimerEvents();
  initRecipesTab();
  initSettingsTab();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
