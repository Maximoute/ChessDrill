// frontend/js/modes/solver.js
import * as Board from '../board.js';
import { showBadMoveModal } from '../ui/messages.js';

export async function loadExercises(state) {
  const data = await state.API.list();
  const listDiv = document.getElementById('exerciseList'); if (!listDiv) return;
  listDiv.innerHTML = '';
  data.forEach(ex => {
    const div = document.createElement('div');
    div.className = 'exercise';
    div.innerHTML = `
      <p><strong>Explication :</strong> ${ex.explanation||''}</p>
      <button data-action="problem" data-fen="${ex.start_fen}">📌 Problème</button>
      <button data-action="solution" data-fen="${ex.end_fen}">✅ Voir la solution</button>
      <button data-action="solve" data-id="${ex.id}">🎯 Résoudre</button>
      <button data-action="delete" data-id="${ex.id}">🗑️ Supprimer</button>`;
    listDiv.appendChild(div);
  });
  listDiv.addEventListener('click', (e)=>{
    const b = e.target.closest('button'); if(!b) return;
    const a = b.dataset.action;
    if (a==='problem' || a==='solution') return showPosition(state, b.dataset.fen);
    if (a==='solve') return loadExercise(state, Number(b.dataset.id));
    if (a==='delete') return deleteExercise(state, Number(b.dataset.id));
  }, { once:true });
}

export function showPosition(state, fen) {
  state.mode = 'edit';
  const tmp = new Chess(); try { tmp.load(fen); } catch { return state.Msg.toast('❌ FEN invalide', 'red'); }
  Board.recreate(state, { elementId:'board', draggable:false, pieceTheme: state.pieceTheme });
  Board.setPosition(state, tmp.fen());
}

export async function loadExercise(state, id) {
  const ex = await state.API.get(id); if (!ex) return;
  state.mode = 'play'; state.resolving = true; state.currentMoveIndex = 0;
  state.currentExercise = { startFen: ex.start_fen, endFen: ex.end_fen, explanation: ex.explanation, solutionMoves: ex.solution_moves };
  state.game = new Chess(state.currentExercise.startFen);
  Board.recreate(state, { elementId:'board', draggable:true, pieceTheme: state.pieceTheme, onDrop:(s,t)=>onDropSolve(state,s,t) });
  Board.setPosition(state, state.game.fen());
}

function onDropSolve(state, source, target) {
  const move = state.game.move({ from: source, to: target, promotion: 'q' });
  if (!move) return 'snapback';
  state.board.position(state.game.fen());
  const sol = state.currentExercise.solutionMoves.split(',');
  const expected = sol[state.currentMoveIndex];
  if (move.san === expected) {
    state.currentMoveIndex++;
    const next = sol[state.currentMoveIndex];
    if (next) {
      const auto = state.game.moves({ verbose:true }).find(m=>m.san===next);
      if (auto) { state.game.move(auto.san); state.board.position(state.game.fen()); state.currentMoveIndex++; }
    }
    if (state.currentMoveIndex >= sol.length) { state.Msg.toast('🏁 Bravo ! Exercice terminé.', 'black'); state.resolving = false; }
  } else {
    showBadMoveModal(expected);
    return 'snapback';
  }
}

export async function deleteExercise(state, id) {
  if (!confirm('Supprimer cet exercice ?')) return;
  await state.API.remove(id);
  state.Msg.toast('🗑️ Supprimé !', 'black');
  loadExercises(state);
}
