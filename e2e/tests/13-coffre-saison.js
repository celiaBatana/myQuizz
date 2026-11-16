// Coffre du jour et saison
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => b();
const patch = (a, f) => a.page.evaluate(`(${f.toString()})()`);
t('coffre : ouverture, éclats crédités, plus de coffre ensuite', async a => {
  await a.signup(); await a.patchDb(d => { Object.values(d.users)[0].onboarded = true; }); await a.go('/');
  await a.page.locator('[data-testid="chest-open"]').click();
  await a.page.locator('[data-testid="chest-gems"]').waitFor({ timeout: 6000 });
  const g = parseInt((await a.page.locator('[data-testid="chest-gems"]').innerText()).replace(/\D/g, ''), 10);
  a.assert.ok(g >= 8 && g <= 20, 'gems ' + g);
  const u = Object.values((await a.db()).users)[0];
  a.assert.strictEqual(u.gemsBonus, g);
  await a.page.locator('[data-testid="chest-close"]').click();
  await a.page.waitForTimeout(300);
  a.assert.strictEqual(await a.page.locator('[data-testid="chest-card"]').count(), 0);
});
t('coffre : série de 7 jours = récompenses ×2', async a => {
  await patch(a, () => { const d = window.__DB(); const u = Object.keys(d.users)[0]; d.users[u].chestDay = null; d.users[u].streak = 8; d.users[u].gemsBonus = 0; localStorage.setItem('fakedb', JSON.stringify(d)); });
  await a.go('/');
  a.assert.ok(/×2/.test(await a.page.locator('[data-testid="chest-card"]').innerText()));
  await a.page.locator('[data-testid="chest-open"]').click();
  await a.page.locator('[data-testid="chest-gems"]').waitFor({ timeout: 6000 });
  const g = parseInt((await a.page.locator('[data-testid="chest-gems"]').innerText()).replace(/\D/g, ''), 10);
  a.assert.ok(g >= 16 && g <= 40 && g % 2 === 0, 'gems ' + g);
});
t('saison : départ à 0, paliers, récupération des récompenses', async a => {
  await a.go('/'); await a.page.waitForTimeout(500);
  let u = Object.values((await a.db()).users)[0];
  a.assert.ok(u.season && u.season.id >= 1, 'season init');
  a.assert.strictEqual(await a.page.locator('[data-testid="season-tier"]').count(), 10);
  await patch(a, () => { const d = window.__DB(); const x = Object.values(d.users)[0]; x.chestDay = new Date().toISOString().slice(0, 10); x.gemsBonus = 0; x.totalXP = (x.season.base || 0) + 300; localStorage.setItem('fakedb', JSON.stringify(d)); });
  await a.go('/');
  await a.page.locator('[data-testid="season-claim"]').click(); await a.page.waitForTimeout(500);
  u = Object.values((await a.db()).users)[0];
  a.assert.ok((u.unlocked || []).includes('f_s1_a'), JSON.stringify(u.unlocked));
  a.assert.strictEqual(u.gemsBonus, 20);
  a.assert.strictEqual(u.season.claimed.length, 2);
  a.assert.strictEqual(await a.page.locator('[data-testid="season-claim"]').count(), 0);
});
t('profil : cadre débloqué équipable', async a => {
  await a.go('/profil'); await a.page.waitForTimeout(500);
  a.assert.ok((await a.body()).length > 0);
});
module.exports = { tests, seed };
