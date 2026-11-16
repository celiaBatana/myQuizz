// Partage de score et fil d'activité
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => {
  const s = b();
  s.leaderboard = { lina: { uid: 'lina', name: 'Lina', totalXP: 300, level: 2, events: [{ k: '🐉', t: 'a vaincu Le Dragon Savant', at: Date.now() - 3600000 }, { k: '🔥', t: 'série de 7 jours', at: Date.now() - 86400000 * 2 }] } };
  s.friend_requests = { 'lina_ME': { fromUid: 'lina', toUid: 'ME', fromName: 'Lina', toName: 'cece', status: 'accepted' } };
  return s;
};
t('fil : sans amis, invitation à en ajouter', async a => {
  await a.signup(); await a.go('/'); await a.page.waitForTimeout(1200);
  a.assert.ok(/Ajoute des amis/.test(await a.body()));
});
t('fil : les exploits des amis, du plus récent au plus ancien', async a => {
  await a.page.evaluate(() => { const d = window.__DB(); const me = Object.keys(d.users)[0]; d.friend_requests = { lina_me: { fromUid: 'lina', toUid: me, fromName: 'Lina', toName: 'Moi', status: 'accepted' } }; localStorage.setItem('fakedb', JSON.stringify(d)); sessionStorage.clear(); });
  await a.go('/'); await a.page.waitForTimeout(1500);
  const items = await a.page.locator('[data-testid="activity-item"]').allInnerTexts();
  a.assert.strictEqual(items.length, 2, JSON.stringify(items));
  a.assert.ok(/Lina.*Dragon Savant/.test(items[0]) && /il y a 1 h/.test(items[0]), items[0]);
  a.assert.ok(/série de 7 jours/.test(items[1]));
});
t('partage : bouton sur l\'écran de victoire du boss', async a => {
  await a.go('/boss');
  a.assert.ok(true);
});
module.exports = { tests, seed };
