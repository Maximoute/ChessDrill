// frontend/js/board.js
export function init(state, { elementId='board', draggable=true, sparePieces=false, pieceTheme, onDrop } = {}) {
  const cfg = { draggable, sparePieces, dropOffBoard: 'trash', pieceTheme };
  if (onDrop) cfg.onDrop = onDrop;
  state.board = Chessboard(elementId, cfg);
  if (sparePieces) state.board.position('empty');
}

export function setPosition(state, fen) {
  state.board?.position(fen, true);
}

export function recreate(state, opts) {
  state.board?.destroy?.();
  init(state, opts);
}
