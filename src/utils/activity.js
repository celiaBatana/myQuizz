// Fil d'activité : les 5 derniers faits marquants d'un joueur, stockés sur son profil public (leaderboard)
export function addEvent(profile, ev) {
  return [{ ...ev, at: Date.now() }, ...(profile?.events || [])].slice(0, 5);
}
export function ago(ms) {
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'hier' : `il y a ${d} j`;
}
