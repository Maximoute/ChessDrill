// frontend/js/state.js
export function createState({ apiBaseUrl, pieceTheme, Msg, API, normalizeFenTurn }) {
  return {
    apiBaseUrl, pieceTheme, Msg, API, normalizeFenTurn,
    mode: 'edit',
    game: null,            // new Chess()
    board: null,           // Chessboard instance
    recording: false,
    resolving: false,
    currentMoveIndex: 0,
    recordedMoves: [],
    currentExercise: { startFen:'', endFen:'', explanation:'', solutionMoves:'' }
  };
}
