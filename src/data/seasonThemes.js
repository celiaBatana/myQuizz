// Thèmes de saison : la liste tourne en boucle, tout le reste (cadres, titres, avatar) est généré.
// Pour un thème spécial (Noël…), ajoute une ligne : il passera à son tour dans la rotation.
export const SEASON_THEMES = [
  { name: 'Aurore',  emoji: '🌅', color: '#FFD166' },
  { name: 'Océan',   emoji: '🐋', color: '#5FA8D9' },
  { name: 'Forêt',   emoji: '🦌', color: '#8BB36B' },
  { name: 'Cosmos',  emoji: '🪐', color: '#9A7BC9' },
  { name: 'Volcan',  emoji: '🌋', color: '#E5604D' },
  { name: 'Désert',  emoji: '🐪', color: '#E6B35A' },
  { name: 'Glace',   emoji: '🧊', color: '#7FD6E8' },
  { name: 'Jungle',  emoji: '🦜', color: '#4FB286' },
];
export const themeOf = n => SEASON_THEMES[(Math.max(1, n) - 1) % SEASON_THEMES.length];

const glow = (c, k) => ({ border: `3px solid ${c}`, boxShadow: k === 0 ? `0 0 14px ${c}88` : k === 1 ? `0 0 22px ${c}CC` : `0 0 12px ${c}, 0 0 34px ${c}99` });

// Objets d'une saison (n ≥ 2 ; la saison 1 est définie à la main dans cosmetics.js)
export function seasonItems(n) {
  const th = themeOf(n), S = `Saison ${n}`;
  return {
    frames: ['a', 'b', 'c'].map((k, i) => ({ id: `f_s${n}_${k}`, name: `Cadre ${th.name} ${['I', 'II', 'III'][i]}`, hint: `${S} · palier ${[2, 6, 8][i]}`, style: glow(th.color, i) })),
    titles: [{ id: `t_s${n}_fan`, name: `${th.name} · Pionnier`, hint: `${S} · palier 4` }, { id: `t_s${n}_top`, name: `Légende ${th.name}`, hint: `${S} · palier 10` }],
    avatars: [{ id: `a_s${n}`, icon: th.emoji, name: th.name, hint: `${S} · palier 9` }],
  };
}

// Retrouve un objet de saison à partir de son identifiant (f_s3_b, t_s3_fan, a_s3…)
export function dynCosmetic(id) {
  const m = /^(f|t|a)_s(\d+)(?:_(\w+))?$/.exec(String(id || ''));
  if (!m) return null;
  const n = +m[2]; if (n < 2) return null;
  const it = seasonItems(n);
  return [...it.frames, ...it.titles, ...it.avatars].find(x => x.id === id) || null;
}
