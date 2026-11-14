// Extrait de 30 s d'un morceau via l'API de recherche iTunes (JSONP : aucun souci de CORS)
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

function jsonp(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const cb = `__itunes_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const s = document.createElement('script');
    const done = () => { delete window[cb]; s.remove(); clearTimeout(t); };
    const t = setTimeout(() => { done(); reject(new Error('timeout')); }, timeout);
    window[cb] = data => { done(); resolve(data); };
    s.onerror = () => { done(); reject(new Error('réseau')); };
    s.src = `${url}&callback=${cb}`;
    document.head.appendChild(s);
  });
}

export async function fetchPreview(track) {
  if (typeof window !== 'undefined' && typeof window.__ITUNES_MOCK === 'function') return window.__ITUNES_MOCK(track);
  const term = encodeURIComponent(`${track.title} ${track.artist}`);
  const data = await jsonp(`https://itunes.apple.com/search?term=${term}&entity=song&limit=8&country=fr`);
  const a = norm(track.artist).split(' ')[0];
  const t = norm(track.title).split(' ').slice(0, 2).join(' ');
  const hit = (data.results || []).find(r => r.previewUrl && norm(r.artistName).includes(a) && norm(r.trackName).includes(t))
    || (data.results || []).find(r => r.previewUrl && norm(r.artistName).includes(a));
  return hit ? hit.previewUrl : null;
}
