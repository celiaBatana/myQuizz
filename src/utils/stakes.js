// Mises de duel : chacun mise la même somme d'éclats avant de jouer, le gagnant remporte le tout.
export const STAKES = [0, 10, 25, 50];
export const REFUND_AFTER_MS = 48 * 3600 * 1000;

// rows = résultats du duel ; renvoie 'win' | 'lose' | 'draw' | null (si l'un des deux n'a pas encore joué)
export function stakeOutcome(rows, myUid, otherUid) {
  const me = rows.find(r => r.uid === myUid), other = rows.find(r => r.uid === otherUid);
  if (!me || !other) return null;
  return me.score > other.score ? 'win' : me.score < other.score ? 'lose' : 'draw';
}
export const payout = (outcome, stake) => outcome === 'win' ? stake * 2 : outcome === 'draw' ? stake : 0;
export const createdMs = d => d?.createdAt?.toMillis?.() || (d?.createdAt?.seconds ? d.createdAt.seconds * 1000 : 0);
