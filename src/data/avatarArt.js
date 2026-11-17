import React from 'react';

// Avatars illustrés (SVG plat, viewBox 64×64). Chaque entrée : fond en dégradé + dessin.
const eye = (x, y, r = 3) => <g key={x}><circle cx={x} cy={y} r={r} fill="#2a1c12" /><circle cx={x + r * 0.35} cy={y - r * 0.35} r={r * 0.35} fill="#fff" /></g>;

export const ART = {
  quizly: { bg: ['#F2A36B', '#E8844A'], draw: (<>
    <circle cx="32" cy="36" r="19" fill="#FFD9B8" />
    <path d="M14 30 Q32 6 50 30 Q32 22 14 30Z" fill="#B85C2B" />
    {eye(25, 37)}{eye(39, 37)}
    <path d="M25 44 Q32 51 39 44" stroke="#2a1c12" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <circle cx="20" cy="43" r="3" fill="#F08A7A" opacity=".55" /><circle cx="44" cy="43" r="3" fill="#F08A7A" opacity=".55" />
    <text x="32" y="22" textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff" fontFamily="sans-serif">?</text>
  </>) },
  cat: { bg: ['#9BB9E0', '#6E8FC4'], draw: (<>
    <polygon points="14,28 16,8 30,20" fill="#F4B860" /><polygon points="50,28 48,8 34,20" fill="#F4B860" />
    <polygon points="18,24 18,13 26,20" fill="#F29CA3" /><polygon points="46,24 46,13 38,20" fill="#F29CA3" />
    <circle cx="32" cy="37" r="19" fill="#F4B860" />
    <path d="M32 18 v8 M26 19 l1 6 M38 19 l-1 6" stroke="#D98E2B" strokeWidth="2" strokeLinecap="round" />
    {eye(25, 36)}{eye(39, 36)}
    <polygon points="29.5,41 34.5,41 32,44" fill="#F29CA3" />
    <path d="M32 44 Q28 49 24 46 M32 44 Q36 49 40 46" stroke="#2a1c12" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <path d="M10 40 h9 M10 46 l9 -2 M54 40 h-9 M54 46 l-9 -2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity=".8" />
  </>) },
  fox: { bg: ['#8FC39F', '#5E9E78'], draw: (<>
    <path d="M10 24 L15 6 L30 18 Q32 17.5 34 18 L49 6 L54 24 Q57 42 32 58 Q7 42 10 24Z" fill="#E8844A" />
    <path d="M18 40 Q32 33 46 40 Q41 54 32 58 Q23 54 18 40Z" fill="#fff" />
    <polygon points="15,10 16,20 24,16" fill="#3a2414" opacity=".85" /><polygon points="49,10 48,20 40,16" fill="#3a2414" opacity=".85" />
    {eye(24, 33)}{eye(40, 33)}
    <ellipse cx="32" cy="48" rx="3.4" ry="2.6" fill="#2a1c12" />
  </>) },
  bear: { bg: ['#F2C879', '#E0A24A'], draw: (<>
    <circle cx="16" cy="19" r="8" fill="#8A5A2E" /><circle cx="48" cy="19" r="8" fill="#8A5A2E" />
    <circle cx="16" cy="19" r="4" fill="#D9A877" /><circle cx="48" cy="19" r="4" fill="#D9A877" />
    <circle cx="32" cy="36" r="20" fill="#A9743F" />
    <ellipse cx="32" cy="43" rx="10" ry="8" fill="#E8C79A" />
    {eye(24, 33)}{eye(40, 33)}
    <ellipse cx="32" cy="40" rx="4" ry="3" fill="#2a1c12" />
    <path d="M32 43 v3 M28 47 Q32 50 36 47" stroke="#2a1c12" strokeWidth="1.8" fill="none" strokeLinecap="round" />
  </>) },
  panda: { bg: ['#A8D5BA', '#6FB08A'], draw: (<>
    <circle cx="16" cy="19" r="8" fill="#2a1c12" /><circle cx="48" cy="19" r="8" fill="#2a1c12" />
    <circle cx="32" cy="36" r="20" fill="#fff" />
    <ellipse cx="23.5" cy="34" rx="6" ry="7.5" transform="rotate(-20 23.5 34)" fill="#2a1c12" />
    <ellipse cx="40.5" cy="34" rx="6" ry="7.5" transform="rotate(20 40.5 34)" fill="#2a1c12" />
    <circle cx="24" cy="34" r="2.4" fill="#fff" /><circle cx="40" cy="34" r="2.4" fill="#fff" />
    <ellipse cx="32" cy="43" rx="3.6" ry="2.6" fill="#2a1c12" />
    <path d="M27 47 Q32 51 37 47" stroke="#2a1c12" strokeWidth="1.8" fill="none" strokeLinecap="round" />
  </>) },
  frog: { bg: ['#F5E39B', '#E6C95E'], draw: (<>
    <circle cx="20" cy="20" r="9" fill="#6BBE5B" /><circle cx="44" cy="20" r="9" fill="#6BBE5B" />
    <ellipse cx="32" cy="38" rx="22" ry="18" fill="#6BBE5B" />
    <circle cx="20" cy="20" r="6" fill="#fff" /><circle cx="44" cy="20" r="6" fill="#fff" />
    {eye(20, 21, 3.2)}{eye(44, 21, 3.2)}
    <path d="M17 42 Q32 56 47 42" stroke="#2a1c12" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <circle cx="27" cy="34" r="1.2" fill="#2a1c12" /><circle cx="37" cy="34" r="1.2" fill="#2a1c12" />
    <circle cx="16" cy="40" r="3.4" fill="#F29CA3" opacity=".6" /><circle cx="48" cy="40" r="3.4" fill="#F29CA3" opacity=".6" />
  </>) },
  owl: { bg: ['#3a2c5e', '#6a4fa8'], draw: (<>
    <polygon points="14,26 14,8 28,18" fill="#8A5A2E" /><polygon points="50,26 50,8 36,18" fill="#8A5A2E" />
    <ellipse cx="32" cy="38" rx="21" ry="20" fill="#A9743F" />
    <ellipse cx="32" cy="46" rx="12" ry="9" fill="#E8C79A" />
    <circle cx="23" cy="32" r="9.5" fill="#fff" /><circle cx="41" cy="32" r="9.5" fill="#fff" />
    <circle cx="23" cy="32" r="4.4" fill="#2a1c12" /><circle cx="41" cy="32" r="4.4" fill="#2a1c12" />
    <circle cx="24.6" cy="30.4" r="1.4" fill="#fff" /><circle cx="42.6" cy="30.4" r="1.4" fill="#fff" />
    <polygon points="28.5,38 35.5,38 32,45" fill="#F2A33A" />
  </>) },
  robot: { bg: ['#6E7CE0', '#3F4DB8'], draw: (<>
    <line x1="32" y1="8" x2="32" y2="17" stroke="#C9D3E0" strokeWidth="2.4" /><circle cx="32" cy="7" r="3.2" fill="#E5604D" />
    <rect x="10" y="30" width="5" height="12" rx="2.5" fill="#8C9BB0" /><rect x="49" y="30" width="5" height="12" rx="2.5" fill="#8C9BB0" />
    <rect x="13" y="17" width="38" height="36" rx="10" fill="#C9D3E0" />
    <rect x="18" y="26" width="28" height="13" rx="6" fill="#1d2433" />
    <circle cx="26" cy="32.5" r="3.6" fill="#8FE3F2" /><circle cx="38" cy="32.5" r="3.6" fill="#8FE3F2" />
    <path d="M23 46 h18 M27 43.5 v5 M32 43.5 v5 M37 43.5 v5" stroke="#6B7A90" strokeWidth="1.6" strokeLinecap="round" />
  </>) },
  penguin: { bg: ['#B8E0F2', '#7DBBDA'], draw: (<>
    <ellipse cx="32" cy="38" rx="21" ry="21" fill="#2a3446" />
    <ellipse cx="32" cy="42" rx="14.5" ry="15.5" fill="#fff" />
    {eye(25, 32, 3)}{eye(39, 32, 3)}
    <polygon points="27.5,37 36.5,37 32,43" fill="#F2A33A" />
    <ellipse cx="20" cy="56" rx="6" ry="3" fill="#F2A33A" /><ellipse cx="44" cy="56" rx="6" ry="3" fill="#F2A33A" />
    <circle cx="19" cy="38" r="3" fill="#F29CA3" opacity=".6" /><circle cx="45" cy="38" r="3" fill="#F29CA3" opacity=".6" />
  </>) },
};

export function ArtSvg({ art, size }) {
  const a = ART[art]; if (!a) return null;
  return <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ display: 'block' }}>{a.draw}</svg>;
}
export const artBg = art => `linear-gradient(145deg, ${ART[art].bg[0]}, ${ART[art].bg[1]})`;
