// Blind test : parcours complet avec extraits simulés
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => b();
t('20 extraits → écran de score', async a => {
  await a.go('/blindtest');
  a.assert.strictEqual(await a.page.locator('[data-testid="bt-cat"]').count(), 8);
  await a.page.locator('[data-cat="rapfr"]').click();
  await a.page.evaluate(() => { window.__ITUNES_MOCK = async () => 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='; });
  await a.page.locator('[data-testid="bt-start"]').click();
  for (let k = 0; k < 20; k++) {
    await a.page.locator('[data-testid="bt-play"]').waitFor({ timeout: 4000 });
    a.assert.strictEqual(await a.page.locator('[data-testid="bt-opt"]').count(), 4);
    await a.page.locator('[data-testid="bt-opt"]').first().click();
    await a.page.locator('[data-testid="bt-next"]').click();
  }
  a.assert.ok(/\/20/.test(await a.page.locator('[data-testid="bt-result"]').innerText()));
});
t('extrait indisponible → on peut passer', async a => {
  await a.go('/blindtest/animes');
  await a.page.evaluate(() => { window.__ITUNES_MOCK = async () => null; });
  await a.page.locator('[data-testid="bt-start"]').click();
  await a.page.locator('[data-testid="bt-skip"]').click();
  a.assert.ok(/Extrait 2\/20/.test(await a.body()));
});
t('carte Blind test sur l\'accueil', async a => {
  await a.go('/'); await a.page.locator('[data-testid="home-blindtest"]').click(); await a.page.waitForTimeout(300);
  a.assert.ok(a.page.url().endsWith('/blindtest'), a.page.url());
});
t('connecté : XP gagné et record enregistré', async a => {
  await a.signup();
  await a.go('/blindtest/rapfr');
  await a.page.evaluate(() => { window.__ITUNES_MOCK = async () => 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='; });
  await a.page.locator('[data-testid="bt-start"]').click();
  for (let k = 0; k < 20; k++) {
    await a.page.locator('[data-testid="bt-play"]').waitFor({ timeout: 4000 });
    await a.page.locator('[data-testid="bt-opt"]').first().click();
    await a.page.locator('[data-testid="bt-next"]').click();
  }
  await a.page.locator('[data-testid="bt-gain"]').waitFor({ timeout: 4000 });
  await a.page.waitForTimeout(800);
  const d = await a.db(); const u = Object.values(d.users)[0];
  a.assert.ok(u.blindBest && typeof u.blindBest.rapfr === 'number', JSON.stringify(u.blindBest));
  a.assert.strictEqual(u.blindPlayed, 1);
  a.assert.ok(/XP/.test(await a.page.locator('[data-testid="bt-gain"]').innerText()));
});
t('classement : mes scores et ceux des autres, par style', async a => {
  const u = Object.keys((await a.db()).users)[0];
  await a.page.evaluate(() => { const d = window.__DB(); d.leaderboard = d.leaderboard || {}; d.leaderboard.zoe = { uid: 'zoe', name: 'Zoé', blindTotal: 15, blindBest: { rapfr: 9, animes: 6 } }; localStorage.setItem('fakedb', JSON.stringify(d)); });
  await a.go('/blindtest'); await a.page.locator('[data-testid="bt-ranking"]').click(); await a.page.waitForTimeout(900);
  a.assert.ok(a.page.url().endsWith('/blindtest/classement'), a.page.url());
  a.assert.ok(await a.page.locator('[data-testid="bb-row"]').count() >= 1, (await a.body()).slice(0, 200));
  await a.page.locator('[data-tab="animes"]').click();
  a.assert.ok(/Zoé/.test(await a.body()) && /6\/20/.test(await a.body()));
  await a.page.locator('[data-tab="films"]').click();
  a.assert.ok(/Personne n'a encore/.test(await a.body()));
});
t('duel blind test : création, partie, résultat enregistré', async a => {
  await a.go('/blindtest/annees80');
  await a.page.locator('[data-testid="bt-duel-create"]').click(); await a.page.waitForTimeout(1200);
  const d = await a.db(); const [id, duel] = Object.entries(d.duels).find(([, x]) => x.type === 'blind');
  a.assert.strictEqual(duel.questionIds.length, 20); a.assert.strictEqual(duel.styleId, 'annees80');
  a.assert.ok(a.page.url().endsWith('/duel/' + id), a.page.url());
  await a.page.locator('[data-testid="bt-duel-start"]').click();
  await a.page.evaluate(() => { window.__ITUNES_MOCK = async () => 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='; });
  for (let k = 0; k < 20; k++) {
    await a.page.locator('[data-testid="bt-play"]').waitFor({ timeout: 5000 });
    a.assert.strictEqual(await a.page.locator('[data-testid="bt-opt"]').count(), 4);
    await a.page.locator('[data-testid="bt-opt"]').first().click();
    await a.page.locator('[data-testid="bt-next"]').click();
  }
  await a.page.locator('[data-testid="duel-board"]').waitFor({ timeout: 5000 });
  await a.page.waitForTimeout(500);
  const r = Object.values((await a.db()).duel_results || {}).find(x => x.duelId === id);
  a.assert.ok(r && r.total === 20, JSON.stringify(r));
});
module.exports = { tests, seed };
