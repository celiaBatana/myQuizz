// Partage d'un score : image (canvas) + lien. Retourne 'shared' | 'copied' | 'downloaded' | 'cancelled'
function drawCard({ score, total, name }) {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1080;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 1080, 1080);
  grad.addColorStop(0, '#2d1a5e'); grad.addColorStop(1, '#8a2be2');
  g.fillStyle = grad; g.fillRect(0, 0, 1080, 1080);
  g.textAlign = 'center'; g.fillStyle = '#fff';
  g.font = 'bold 64px sans-serif'; g.fillText('Quizly', 540, 150);
  g.font = 'bold 300px sans-serif'; g.fillText(`${score}/${total}`, 540, 560);
  g.font = '46px sans-serif';
  const words = String(name || 'Quiz').split(' '); let line = ''; let y = 680;
  words.forEach(w => {
    if ((line + ' ' + w).length > 28) { g.fillText(line.trim(), 540, y); line = w; y += 58; } else line += ' ' + w;
  });
  g.fillText(line.trim(), 540, y);
  g.font = 'bold 56px sans-serif'; g.fillStyle = '#FFD166';
  g.fillText('Bats mon score !', 540, 930);
  return new Promise(res => c.toBlob(res, 'image/png'));
}

export async function shareScore({ score, total, name, url }) {
  const text = `J'ai fait ${score}/${total} à « ${name} » sur Quizly. Tu peux faire mieux ?`;
  let file = null;
  try {
    const blob = await drawCard({ score, total, name });
    if (blob) file = new File([blob], 'quizly-score.png', { type: 'image/png' });
  } catch (e) { /* image facultative */ }
  try {
    if (navigator.share) {
      const withFile = file && navigator.canShare && navigator.canShare({ files: [file] });
      await navigator.share(withFile ? { text, url, files: [file] } : { text, url });
      return 'shared';
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancelled';
  }
  try { await navigator.clipboard.writeText(`${text} ${url}`); return 'copied'; } catch (e) { /* suite */ }
  if (file) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file); a.download = 'quizly-score.png'; a.click();
    return 'downloaded';
  }
  return 'cancelled';
}
