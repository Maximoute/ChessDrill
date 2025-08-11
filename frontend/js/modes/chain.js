import * as Board from '../board.js';

export function start(state){
  state.mode = 'chain';
  state.chainScore = 0;
  state.chainIndex = 0;
  state.chainExercises = [];

  document.getElementById('chainContainer').style.display = 'block';
  document.getElementById('exerciseList').style.display = 'none';

  state.API.list().then(data=>{
    state.chainExercises = shuffle(data);
    next(state);
  });
}

function shuffle(a){ return a.sort(()=>Math.random()-0.5); }

function next(state){
  if (state.chainIndex >= state.chainExercises.length){
    state.Msg.toast('🏁 Fin de la session !', 'black');
    return stop(state);
  }
  const ex = state.chainExercises[state.chainIndex++];
  state.currentExercise = {
    startFen: ex.start_fen, endFen: ex.end_fen,
    explanation: ex.explanation, solutionMoves: ex.solution_moves
  };
  state.game = new Chess(state.currentExercise.startFen);
  state.solutionMovesArray = state.currentExercise.solutionMoves.split(',');
  state.currentMoveIndex = 0;

  Board.recreate(state, { elementId:'chainBoard', draggable:true, pieceTheme: state.pieceTheme, onDrop:(s,t)=>handleMove(state,s,t) });
  Board.setPosition(state, state.game.fen());
  document.getElementById('chainScore').textContent = `Score : ${state.chainScore}`;
}

function handleMove(state, source, target){
  const move = state.game.move({ from: source, to: target, promotion: 'q' });
  if (!move) { state.Msg.toast(`⛔ Coup illégal : ${source} → ${target}`, 'red'); return 'snapback'; }

  const expected = state.solutionMovesArray[state.currentMoveIndex];
  if (!expected) { state.Msg.toast('✅ Exercice déjà terminé.'); return; }

  if (move.san === expected){
    state.currentMoveIndex++;
    state.board.position(state.game.fen(), true);
    state.Msg.toast('✅ Bon coup !', 'green');

    const nextExpected = state.solutionMovesArray[state.currentMoveIndex];
    if (nextExpected){
      const autoMove = state.game.moves({ verbose:true }).find(m=>m.san===nextExpected);
      if (autoMove){
        setTimeout(()=>{
          const played = state.game.move(autoMove.san);
          state.board.position(state.game.fen(), true);
          state.currentMoveIndex++;
          if (state.currentMoveIndex >= state.solutionMovesArray.length){
            state.chainScore++;
            document.getElementById('chainScore').textContent = `Score : ${state.chainScore}`;
            state.Msg.toast('🎉 Exercice réussi !', 'green');
            setTimeout(()=> next(state), 800);
          }
        }, 300);
      } else {
        state.Msg.toast('⚠️ Coup adverse attendu mais introuvable.', 'orange');
      }
    } else {
      state.chainScore++;
      document.getElementById('chainScore').textContent = `Score : ${state.chainScore}`;
      state.Msg.toast('🎉 Exercice réussi !', 'green');
      setTimeout(()=> next(state), 800);
    }
  } else {
    state.Msg.toast('❌ Mauvais coup !', 'red');
    setTimeout(()=> state.Msg.toast(`💡 Indice : joue une pièce en ${expected?.[0]}`, 'orange'), 1000);
    return 'snapback';
  }
}

export function stop(state){
  state.mode = 'edit';
  document.getElementById('chainContainer').style.display = 'none';
  document.getElementById('exerciseList').style.display = 'block';
  Board.recreate(state, { elementId:'board', draggable:true, sparePieces:true, pieceTheme: state.pieceTheme });
}
