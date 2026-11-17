import React from 'react';
import { avatarIcon, avatarArtId, frameStyle } from '../data/cosmetics';
import { ArtSvg, artBg } from '../data/avatarArt';

// Avatar rond avec le cadre équipé (récompenses de saison / boss héroïque)
export default function Avatar({ id, frame, size = 26, style }) {
  const fs = frameStyle(frame);
  const art = avatarArtId(id);
  const border = fs ? { ...fs, border: fs.border.replace('3px', Math.max(2, Math.round(size / 14)) + 'px') } : {};
  return (
    <span data-testid="avatar" data-frame={frame || ''} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: '50%', fontSize: size * 0.62, lineHeight: 1, flexShrink: 0, verticalAlign: 'middle', marginRight: 6, background: art ? artBg(art) : (fs ? 'var(--s2)' : 'transparent'), overflow: 'hidden', ...border, ...style }}>{art ? <ArtSvg art={art} size={size} /> : avatarIcon(id)}</span>
  );
}
