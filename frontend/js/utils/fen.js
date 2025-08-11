// frontend/js/utils/fen.js
export function normalizeFenTurn(baseFen, turn) {
  const parts = baseFen.split(' ');
  if (parts.length < 6) { parts[1]=turn; parts[2]='-'; parts[3]='-'; parts[4]='0'; parts[5]='1'; }
  else { parts[1] = turn; }
  return parts.join(' ');
}
