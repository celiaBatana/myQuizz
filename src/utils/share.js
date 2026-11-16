// Image de score à partager (canvas) + partage natif, sinon enregistrement de l'image et copie du texte
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

export function drawShareCard({ title, big, sub, emoji, color = '#E8844A' }) {
  const W = 1080, H = 566;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1F1A16'); g.addColorStop(1, '#3A2D22');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = color + '33'; c.beginPath(); c.arc(W - 120, 120, 260, 0, Math.PI * 2); c.fill();
  c.fillStyle = color; roundRect(c, 60, 60, 12, H - 120, 6); c.fill();
  c.fillStyle = color; c.font = '800 44px "Bricolage Grotesque", Arial, sans-serif'; c.fillText('Quizly', 100, 110);
  c.font = '150px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; c.fillText(emoji || '🏆', W - 330, 250);
  c.fillStyle = '#F4EBE2'; c.font = '700 48px Inter, Arial, sans-serif';
  const words = String(title).split(' '); let line = '', y = 230; 
  for (const w of words) { const t = line + w + ' '; if (c.measureText(t).width > 640 && line) { c.fillText(line.trim(), 100, y); line = w + ' '; y += 58; } else line = t; }
  c.fillText(line.trim(), 100, y);
  c.fillStyle = color; c.font = '800 120px "Bricolage Grotesque", Arial, sans-serif'; c.fillText(String(big), 100, y + 140);
  if (sub) { c.fillStyle = '#B9A58F'; c.font = '400 34px Inter, Arial, sans-serif'; c.fillText(sub, 100, y + 200); }
  c.fillStyle = '#B9A58F'; c.font = '400 28px Inter, Arial, sans-serif'; c.fillText('Viens me battre sur ' + location.host, 100, H - 60);
  return cv;
}

export async function shareScore(opts) {
  const cv = drawShareCard(opts);
  const text = `${opts.title} — ${opts.big}${opts.sub ? ' (' + opts.sub + ')' : ''}. Viens me battre sur Quizly !`;
  const url = location.origin;
  const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
  const file = blob ? new File([blob], 'quizly-score.png', { type: 'image/png' }) : null;
  try {
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text, url }); return 'shared'; }
    if (navigator.share) { await navigator.share({ text, url }); return 'shared'; }
  } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  try { await navigator.clipboard.writeText(`${text} ${url}`); } catch (e) { /* ignoré */ }
  if (blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'quizly-score.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
  return 'copied';
}
