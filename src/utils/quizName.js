// Affichage : retire le préfixe « Quiz #3 — » / « Quiz 2 : » des noms de quiz (le nom stocké ne change pas)
export function cleanQuizName(name) {
  const s = String(name || '');
  const out = s.replace(/^\s*quiz\s*(?:n°|#)?\s*\d+\s*(?:[—–:.\-]\s*)?/i, '').trim();
  return out || s;
}
