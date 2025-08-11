// frontend/js/app.js
import { createState } from './state.js';
import * as Board from './board.js';
import * as API from './api.js';
import * as Msg from './ui/messages.js';
import { normalizeFenTurn } from './utils/fen.js';

import * as Editor from './modes/editor.js';
import * as Solver from './modes/solver.js';
import * as Chain from './modes/chain.js';

export function boot({ apiBaseUrl = '/api', pieceTheme = '/img/pieces/{piece}.png' } = {}) {
  // 1) État applicatif partagé
  const state = createState({ apiBaseUrl, pieceTheme, Msg, API, normalizeFenTurn });

  // 2) Plateau initial (mode édition, pièces en spare)
  Board.init(state, {
    elementId: 'board',
    draggable: true,
    sparePieces: true,
    pieceTheme
  });

  // 3) Exposer l'API publique attendue par le HTML (window.app.*)
  const app = {
    // Board / édition
    clearBoard: () => Board.recreate(state, { elementId: 'board', draggable: true, sparePieces: true, pieceTheme }),
    saveStartPosition: () => Editor.saveStartPosition(state),
    toggleRecording:   () => Editor.toggleRecording(state),
    saveEndPosition:   () => Editor.saveEndPosition(state),
    saveExercise:      () => Editor.saveExercise(state),

    // Consultation / résolution
    loadExercises: () => Solver.loadExercises(state),
    loadExercise:  (id) => Solver.loadExercise(state, id),
    showPosition:  (fen) => Solver.showPosition(state, fen),
    deleteExercise:(id) => Solver.deleteExercise(state, id),

    // Mode chaîne
    startChainMode: () => Chain.start(state)
  };

  // 4) Petites vérifs non bloquantes
  //    - étiquette du bouton rec au démarrage
  const recBtn = document.getElementById('recordButton');
  if (recBtn) {
    recBtn.textContent = "🎮 Commencer l'enregistrement";
    recBtn.classList.remove('is-recording');
  }

  //    - ping API (log si KO, mais n'empêche pas l'app de marcher en local)
  API.ensureApiAlive?.()
    .then(ok => {
      if (!ok) console.warn('[app] API health KO (proxy /api ?)');
    })
    .catch(err => console.warn('[app] API health error:', err?.message || err));

  return app;
}

// 5) Bootstrap auto: rendre l'app dispo globalement pour le HTML
window.addEventListener('DOMContentLoaded', () => {
  try {
    const app = boot({ apiBaseUrl: window.API_BASE_URL, pieceTheme: window.PIECE_THEME });
    // évite de réécraser si déjà défini par hot-reload
    if (!window.app) Object.defineProperty(window, 'app', { value: app, writable: false });
    else window.app = app; // fallback si tu veux pouvoir remplacer (ex: HMR)
    console.log('[app] ready');
  } catch (e) {
    console.error('[app] bootstrap error:', e);
    alert("Erreur au démarrage de l'application. Ouvre la console (F12) pour plus d'infos.");
  }
});