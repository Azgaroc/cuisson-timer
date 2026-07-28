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
    // Même icône que celle définie dans recipes.js (CREPE_ICON_SVG) : on ne
    // redéclare pas la constante ici pour éviter un conflit de nom entre
    // fichiers chargés dans la même portée globale.
    emoji: '<svg viewBox="0 0 24 24" class="icon-crepe" xmlns="http://www.w3.org/2000/svg"><rect x="3.5" y="9" width="16.5" height="7" rx="3.5" fill="#F6D9A0" stroke="#B97A3D" stroke-width="0.9"/><path d="M8 9.3 L8 15.7 M12 9.1 L12 15.9 M16 9.3 L16 15.7" stroke="#C9954F" stroke-width="0.7" opacity="0.55" stroke-linecap="round"/><path d="M4.5 7.8 Q8 3.8 11.5 6.8 T19 5.6" fill="none" stroke="#7A4A26" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="19.2" cy="13.5" r="2.1" fill="#D5495F"/><path d="M18.9 12.5 Q19.5 11.3 20.4 12.1" stroke="#5C8A4A" stroke-width="0.9" fill="none" stroke-linecap="round"/></svg>'
  },
  pancake: {
    hasTwoFaces: true,
    defaultDurations: { face1: 90, face2: 60 },
    emoji: '🥞'
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
  prefs: 'cuissonTimer.prefs',
  history: 'cuissonTimer.history'
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
  stepEndTime: null, // horodatage (ms) de fin d'étape prévue, pour rester fiable en arrière-plan
  lastBeepedSecond: null,
  settings: loadSettings(),
  counters: loadCounters(),
  prefs: loadPrefs(),
  history: loadHistory(),
  sessionCounts: { crepe: 0, pancake: 0, gaufre: 0 }, // non persistant, remis à zéro à chaque ouverture
  calendarViewDate: new Date()
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
    stats: document.getElementById('panel-stats'),
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
  el.activeCounterEmoji = document.getElementById('activeCounterEmoji');
  el.activeCounterValue = document.getElementById('activeCounterValue');
  el.activeCounterLabel = document.getElementById('activeCounterLabel');
  el.counterResetBtn = document.getElementById('counterResetBtn');
  el.counterCard = document.querySelector('.counter-card--active');

  el.sessionSummary = document.getElementById('sessionSummary');
  el.sessionCrepeValue = document.getElementById('sessionCrepeValue');
  el.sessionPancakeValue = document.getElementById('sessionPancakeValue');
  el.sessionGaufreValue = document.getElementById('sessionGaufreValue');

  el.servingsInput = document.getElementById('servingsInput');
  el.recipeContainer = document.getElementById('recipeContainer');

  el.statsTotalValue = document.getElementById('statsTotalValue');
  el.calendarMonthLabel = document.getElementById('calendarMonthLabel');
  el.calendarWeekdays = document.getElementById('calendarWeekdays');
  el.calendarGrid = document.getElementById('calendarGrid');
  el.calendarPrevBtn = document.getElementById('calendarPrevBtn');
  el.calendarNextBtn = document.getElementById('calendarNextBtn');
  el.achievementsGrid = document.getElementById('achievementsGrid');

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

function loadHistory() {
  const raw = localStorage.getItem(STORAGE_KEYS.history);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) { /* fallback */ }
  }
  return [];
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
}

// Enregistre une préparation terminée : compteur du mode (persistant),
// compteur de la session en cours (non persistant), et entrée d'historique
// horodatée (pour le calendrier et les trophées).
function recordPreparation(mode) {
  state.counters[mode] = (state.counters[mode] || 0) + 1;
  state.sessionCounts[mode] = (state.sessionCounts[mode] || 0) + 1;
  state.history.push({ mode, ts: Date.now() });
  saveCounters();
  saveHistory();
  renderSessionSummary();
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
  // Le nom de l'app ("Pancake Timer") est volontairement fixe et non
  // traduit, pour rester facilement reconnaissable/recherchable quelle
  // que soit la langue de l'interface.
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
  if (tabName === 'stats') {
    renderStatsTab();
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

function renderCounter(bump) {
  const modeConfig = MODES[state.currentMode];
  const singularKey = { crepe: 'modeCrepe', pancake: 'modePancake', gaufre: 'modeGaufre' }[state.currentMode];
  const pluralKey = { crepe: 'modeCrepePlural', pancake: 'modePancakePlural', gaufre: 'modeGaufrePlural' }[state.currentMode];
  const count = state.counters[state.currentMode] || 0;

  el.counterTitle.textContent = t('counterLabel');
  el.activeCounterEmoji.innerHTML = modeConfig.emoji;
  el.activeCounterLabel.textContent = t(count === 1 ? singularKey : pluralKey);
  el.activeCounterValue.textContent = count;

  if (bump && el.counterCard) {
    el.counterCard.classList.remove('bump');
    // force reflow pour pouvoir relancer l'animation si elle vient de jouer
    void el.counterCard.offsetWidth;
    el.counterCard.classList.add('bump');
  }
}

// Affiche le récapitulatif de la session en cours (depuis l'ouverture de
// l'app). Reste masqué tant qu'aucune préparation n'a été comptée.
function renderSessionSummary() {
  const s = state.sessionCounts;
  const total = s.crepe + s.pancake + s.gaufre;

  el.sessionCrepeValue.textContent = s.crepe;
  el.sessionPancakeValue.textContent = s.pancake;
  el.sessionGaufreValue.textContent = s.gaufre;
  el.sessionSummary.classList.toggle('hidden', total === 0);

  if (total > 0) {
    el.sessionSummary.classList.remove('bump');
    void el.sessionSummary.offsetWidth;
    el.sessionSummary.classList.add('bump');
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
  releaseWakeLock();
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
// Écran allumé pendant la cuisson (Screen Wake Lock API)
// L'écran d'un téléphone qui s'éteint pendant que la face 1 cuit serait
// gênant : on demande au système de garder l'écran allumé tant qu'un
// cycle tourne. Le verrou est automatiquement relâché par le navigateur
// quand l'onglet passe en arrière-plan ; on le redemande donc aussi au
// retour au premier plan (voir le listener 'visibilitychange' plus bas).
// ----------------------------------------------------------------
let wakeLockSentinel = null;

async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    wakeLockSentinel = await navigator.wakeLock.request('screen');
  } catch (e) {
    // Refusé (onglet caché, économie d'énergie...) : pas bloquant.
  }
}

function releaseWakeLock() {
  if (wakeLockSentinel) {
    wakeLockSentinel.release().catch(() => {});
    wakeLockSentinel = null;
  }
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
    updateTimerDisplay();
  }

  state.stepEndTime = Date.now() + state.remainingSeconds * 1000;
  requestWakeLock();
  runTick();
}

function pauseCycle() {
  state.isRunning = false;
  clearInterval(state.timerId);
  state.timerId = null;
  el.startPauseBtn.textContent = t('btnResume');
  el.startPauseBtn.classList.remove('running');
  releaseWakeLock();
}

function resumeCycle() {
  state.isRunning = true;
  state.lastBeepedSecond = null;
  el.startPauseBtn.textContent = t('btnPause');
  el.startPauseBtn.classList.add('running');
  state.stepEndTime = Date.now() + state.remainingSeconds * 1000;
  requestWakeLock();
  runTick();
}

// Le minuteur se base sur un horodatage de fin d'étape (state.stepEndTime)
// plutôt que sur un simple décompte à chaque tick. C'est essentiel pour
// qu'il reste fiable même si le navigateur ralentit ou suspend les
// setInterval pendant que l'app est en arrière-plan (écran verrouillé,
// changement d'appli...) : au retour, on recalcule le temps restant à
// partir de l'heure réelle au lieu d'avoir dérivé au fil des ticks manqués.
function tick() {
  if (!state.isRunning) return;

  const remaining = Math.max(0, Math.round((state.stepEndTime - Date.now()) / 1000));

  if (remaining > 0 && remaining <= COUNTDOWN_THRESHOLD && state.lastBeepedSecond !== remaining) {
    state.lastBeepedSecond = remaining;
    playBeep();
  }

  state.remainingSeconds = remaining;
  updateTimerDisplay();

  if (remaining <= 0) {
    handleStepEnd();
  }
}

function runTick() {
  clearInterval(state.timerId);
  state.timerId = setInterval(tick, 1000);
  tick(); // recalcule immédiatement au lieu d'attendre 1s avant le premier affichage
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
          state.stepEndTime = Date.now() + state.remainingSeconds * 1000;
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
  releaseWakeLock();
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
  // 5 bips rapprochés et plus aigus pour bien marquer la fin de cuisson
  for (let i = 0; i < 5; i++) {
    beepTone(1046, 180, i * 220);
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
    resumeCycle();
  }
}

function handleResetFinishClick() {
  // Si la cuisson est déjà terminée (étape "done"), appuyer sur "Terminé"
  // signifie qu'on valide cette dernière cuisson : on l'ajoute au compteur
  // avant de revenir à l'état prêt. Sinon (cycle en cours), ce bouton
  // annule simplement le cycle sans incrémenter le compteur.
  if (state.currentStep === 'done') {
    recordPreparation(state.currentMode);
    renderCounter(true);
  }
  resetCycleUI();
}

function handleMainActionClick() {
  recordPreparation(state.currentMode);
  renderCounter(true);
  resetCycleUI();
  startCycle();
}

function handleResetCounterClick() {
  const confirmed = confirm(t('confirmResetCounter'));
  if (!confirmed) return;
  state.counters[state.currentMode] = 0;
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
// Onglet Stats : compteur total, calendrier d'historique, trophées
// ----------------------------------------------------------------
const ACHIEVEMENTS = [
  { id: 'first', icon: '🥇', titleKey: 'achFirstTitle', descKey: 'achFirstDesc', check: (total, c, days) => total >= 1 },
  { id: 'ten', icon: '🔟', titleKey: 'achTenTitle', descKey: 'achTenDesc', check: (total, c, days) => total >= 10 },
  { id: 'fifty', icon: '🎖️', titleKey: 'achFiftyTitle', descKey: 'achFiftyDesc', check: (total, c, days) => total >= 50 },
  { id: 'hundred', icon: '🏆', titleKey: 'achHundredTitle', descKey: 'achHundredDesc', check: (total, c, days) => total >= 100 },
  { id: 'crepe', icon: '<svg viewBox="0 0 24 24" class="icon-crepe" xmlns="http://www.w3.org/2000/svg"><rect x="3.5" y="9" width="16.5" height="7" rx="3.5" fill="#F6D9A0" stroke="#B97A3D" stroke-width="0.9"/><path d="M8 9.3 L8 15.7 M12 9.1 L12 15.9 M16 9.3 L16 15.7" stroke="#C9954F" stroke-width="0.7" opacity="0.55" stroke-linecap="round"/><path d="M4.5 7.8 Q8 3.8 11.5 6.8 T19 5.6" fill="none" stroke="#7A4A26" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="19.2" cy="13.5" r="2.1" fill="#D5495F"/><path d="M18.9 12.5 Q19.5 11.3 20.4 12.1" stroke="#5C8A4A" stroke-width="0.9" fill="none" stroke-linecap="round"/></svg>', titleKey: 'achCrepeTitle', descKey: 'achCrepeDesc', check: (total, c) => c.crepe >= 10 },
  { id: 'pancake', icon: '🥞', titleKey: 'achPancakeTitle', descKey: 'achPancakeDesc', check: (total, c) => c.pancake >= 10 },
  { id: 'gaufre', icon: '🧇', titleKey: 'achGaufreTitle', descKey: 'achGaufreDesc', check: (total, c) => c.gaufre >= 10 },
  { id: 'allrounder', icon: '🎩', titleKey: 'achAllRounderTitle', descKey: 'achAllRounderDesc', check: (total, c) => c.crepe >= 1 && c.pancake >= 1 && c.gaufre >= 1 },
  { id: 'days3', icon: '📅', titleKey: 'achDays3Title', descKey: 'achDays3Desc', check: (total, c, days) => days >= 3 },
  { id: 'days7', icon: '🌟', titleKey: 'achDays7Title', descKey: 'achDays7Desc', check: (total, c, days) => days >= 7 }
];

function getHistoryDayMap() {
  const map = {};
  state.history.forEach(entry => {
    const d = new Date(entry.ts);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    map[key] = (map[key] || 0) + 1;
  });
  return map;
}

function renderStatsTotal() {
  const total = (state.counters.crepe || 0) + (state.counters.pancake || 0) + (state.counters.gaufre || 0);
  el.statsTotalValue.textContent = total;
}

function renderCalendar() {
  const viewDate = state.calendarViewDate;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const dayMap = getHistoryDayMap();

  const weekdays = TRANSLATIONS[state.prefs.language]?.calendarWeekdays || TRANSLATIONS.fr.calendarWeekdays;
  el.calendarWeekdays.innerHTML = weekdays.map(d => `<span>${d}</span>`).join('');

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const monthLabel = viewDate.toLocaleDateString(state.prefs.language || 'fr', { month: 'long', year: 'numeric' });
  el.calendarMonthLabel.textContent = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '';
  for (let i = 0; i < startWeekday; i++) {
    html += '<div class="cal-cell cal-empty"></div>';
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${month}-${day}`;
    const count = dayMap[key] || 0;
    const classes = ['cal-cell'];
    if (count > 0) classes.push('has-activity');
    if (key === todayKey) classes.push('is-today');
    html += `<div class="${classes.join(' ')}"><span class="cal-day-num">${day}</span>${count > 0 ? `<span class="cal-dot">${count}</span>` : ''}</div>`;
  }

  el.calendarGrid.innerHTML = html;
}

function renderAchievements() {
  const c = state.counters;
  const total = (c.crepe || 0) + (c.pancake || 0) + (c.gaufre || 0);
  const dayMap = getHistoryDayMap();
  const distinctDays = Object.keys(dayMap).length;

  el.achievementsGrid.innerHTML = ACHIEVEMENTS.map(ach => {
    const unlocked = ach.check(total, c, distinctDays);
    return `
      <div class="ach-card ${unlocked ? 'unlocked' : 'locked'}">
        <span class="ach-icon">${ach.icon}</span>
        <span class="ach-title">${t(ach.titleKey)}</span>
        <span class="ach-desc">${t(ach.descKey)}</span>
      </div>
    `;
  }).join('');
}

function renderStatsTab() {
  renderStatsTotal();
  renderCalendar();
  renderAchievements();
}

function initStatsTab() {
  el.calendarPrevBtn.addEventListener('click', () => {
    state.calendarViewDate = new Date(state.calendarViewDate.getFullYear(), state.calendarViewDate.getMonth() - 1, 1);
    renderCalendar();
  });
  el.calendarNextBtn.addEventListener('click', () => {
    state.calendarViewDate = new Date(state.calendarViewDate.getFullYear(), state.calendarViewDate.getMonth() + 1, 1);
    renderCalendar();
  });
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
    renderSessionSummary();
    if (!el.panels.recipes.classList.contains('hidden')) renderRecipesTab();
    if (!el.panels.stats.classList.contains('hidden')) renderStatsTab();
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
  el.counterResetBtn.addEventListener('click', handleResetCounterClick);

  el.face1Duration.addEventListener('change', () => {
    if (state.currentStep === 'idle') {
      persistCurrentDurations();
      state.remainingSeconds = getDuration('face1');
      state.currentStepTotal = state.remainingSeconds;
      updateTimerDisplay();
    }
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
  renderSessionSummary();
  switchTab('home');
  initHomeChooser();
  initTabs();
  initTimerEvents();
  initRecipesTab();
  initSettingsTab();
  initStatsTab();

  // Au retour au premier plan (l'utilisateur quitte l'app puis y revient),
  // on resynchronise immédiatement le minuteur (il se base sur une heure de
  // fin absolue, donc il "rattrape" correctement même si les setInterval ont
  // été suspendus pendant que l'app était en arrière-plan), on redemande le
  // verrou d'écran (le navigateur le relâche automatiquement en arrière-plan)
  // et on réactive le son si besoin (iOS suspend l'AudioContext en arrière-plan).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      if (state.isRunning) {
        requestWakeLock();
        tick();
      }
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
