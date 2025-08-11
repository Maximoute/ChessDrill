// frontend/js/modes/editor.js
import * as Board from '../board.js';

/* ---------- Helpers UI ---------- */
function syncRecordButtonUI(state) {
  const btn = document.getElementById('recordButton');
  if (!btn) return;
  if (state.recording) {
    btn.textContent = "⏹ Terminer l'enregistrement";
    btn.classList.add('is-recording');
  } else {
    btn.textContent = "🎮 Commencer l'enregistrement";
    btn.classList.remove('is-recording');
  }
}

/* ---------- Actions "éditeur" ---------- */
export function saveStartPosition(state) {
  const turn = document.getElementById('turn')?.value || 'w';
  const fen = state.board.fen();
  state.currentExercise.startFen = state.normalizeFenTurn(fen, turn);
  state.Msg.toast('✅ Position du problème sauvegardée !', 'green');
}

export function saveEndPosition(state) {
  state.currentExercise.endFen = state.board.fen();
  state.currentExercise.explanation =
    document.getElementById('explanation')?.value || '';
  state.Msg.toast('✅ Position de solution sauvegardée !', 'green');
}

/**
 * Lance/arrête l'enregistrement des coups.
 * - Anti double-clic (lock 300ms)
 * - Recréation du board avec onDrop d’enregistrement
 * - Met à jour le texte/style du bouton
 */
export function toggleRecording(state) {
  // 🔒 anti double-clic
  if (state.__toggleLock) return;
  state.__toggleLock = true;
  setTimeout(() => { state.__toggleLock = false; }, 300);

  if (!state.recording) {
    // Préconditions
    if (!state.currentExercise.startFen) {
      state.Msg.toast("⚠️ Sauvegarde d'abord la position de départ !", 'red');
      syncRecordButtonUI(state);
      return;
    }

    // Démarrer rec
    state.game = new Chess();
    if (!state.game.load(state.currentExercise.startFen)) {
      state.Msg.toast('❌ Erreur de chargement de la position de départ.', 'red');
      syncRecordButtonUI(state);
      return;
    }

    state.recording = true;
    state.recordedMoves = [];
    syncRecordButtonUI(state);

    Board.recreate(state, {
      elementId: 'board',
      draggable: true,
      pieceTheme: state.pieceTheme,
      onDrop: (source, target) => onDropRecord(state, source, target),
    });
    Board.setPosition(state, state.game.fen());
    return;
  }

  // Arrêter rec
  state.recording = false;
  state.currentExercise.solutionMoves = (state.recordedMoves || []).join(',');
  state.currentExercise.endFen = state.game?.fen?.() || state.currentExercise.endFen;
  syncRecordButtonUI(state);
  state.Msg.toast('✅ Séquence enregistrée avec succès !', 'green');
}

/* ---------- Persist ---------- */
export async function saveExercise(state) {
  const ex = state.currentExercise;
  const moves = (ex.solutionMoves || '').split(',').filter(Boolean);
  if (!ex.startFen || !ex.endFen || moves.length === 0) {
    state.Msg.toast('⚠️ Complète la position, la solution et les coups.', 'red');
    return;
  }
  const payload = {
    startFen: ex.startFen,
    endFen: ex.endFen,
    explanation: ex.explanation || '',
    solutionMoves: moves.join(','),
  };
  try {
    await state.API.create(payload);
    state.Msg.toast('✅ Exercice enregistré avec succès !', 'green');
  } catch (e) {
    console.error('[saveExercise] error', e);
    state.Msg.toast("❌ Échec de l'enregistrement. Vérifie l'API.", 'red');
  }
}

/* ---------- onDrop pendant l’enregistrement ---------- */
function onDropRecord(state, source, target) {
  const move = state.game.move({ from: source, to: target, promotion: 'q' });
  if (!move) return 'snapback';
  state.board.position(state.game.fen());
  state.recordedMoves.push(move.san);
}
