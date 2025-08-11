export function showMessage(message, color='green'){ // compat
  toast(message, color);
}
export function toast(message, color='green') {
  const box = document.getElementById('feedbackMessage'); if(!box) return;
  box.textContent = message; box.style.color = color; box.style.opacity = 1;
  clearTimeout(window.__toast); window.__toast = setTimeout(()=> box.style.opacity=0, 2000);
}
export function showBadMoveModal(expectedSan){
  const hintPiece = /[A-Z]/.test(expectedSan?.charAt(0)) ? expectedSan.charAt(0) : 'P';
  const name = {K:'♔ Roi', Q:'♕ Dame', R:'♖ Tour', B:'♗ Fou', N:'♘ Cavalier', P:'♙ Pion'}[hintPiece] || '♙ Pion';
  document.getElementById('moveHint').innerText = `Indice : Joue avec ${name}`;
  document.getElementById('badMoveModal').style.display = 'block';
  document.getElementById('badMoveCloseBtn')?.addEventListener('click', ()=> {
    document.getElementById('badMoveModal').style.display = 'none';
  }, { once:true });
}
