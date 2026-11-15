// Éclats et boutique
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => b();
t('éclats = XP/10, achat d\'un gel de série', async a => {
  await a.signup();
  await a.page.evaluate(() => { const d = window.__DB(); const u = Object.keys(d.users)[0]; d.users[u].totalXP = 1000; d.users[u].freezes = 0; localStorage.setItem('fakedb', JSON.stringify(d)); });
  await a.go('/boutique');
  a.assert.ok(/100/.test(await a.page.locator('[data-testid="shop-balance"]').innerText()));
  await a.page.locator('[data-testid="buy-freeze"]').click(); await a.page.waitForTimeout(500);
  const u = Object.values((await a.db()).users)[0];
  a.assert.strictEqual(u.freezes, 1); a.assert.strictEqual(u.gemsSpent, 60);
  a.assert.ok(/40/.test(await a.page.locator('[data-testid="shop-balance"]').innerText()));
});
t('solde insuffisant : achat bloqué', async a => {
  await a.page.evaluate(() => { const d = window.__DB(); const u = Object.keys(d.users)[0]; d.users[u].totalXP = 100; d.users[u].gemsSpent = 0; localStorage.setItem('fakedb', JSON.stringify(d)); });
  await a.go('/boutique');
  a.assert.ok(await a.page.locator('[data-testid="buy-chest"]').isDisabled());
});
t('coffre mystère : débloque un cosmétique', async a => {
  await a.page.evaluate(() => { const d = window.__DB(); const u = Object.keys(d.users)[0]; d.users[u].totalXP = 2000; d.users[u].gemsSpent = 0; localStorage.setItem('fakedb', JSON.stringify(d)); });
  await a.go('/boutique');
  await a.page.locator('[data-testid="buy-chest"]').click(); await a.page.waitForTimeout(500);
  const u = Object.values((await a.db()).users)[0];
  a.assert.ok((u.unlocked || []).length === 1 && u.gemsSpent === 100, JSON.stringify(u.unlocked));
});
t('accueil : rang, éclats ; collection : trophées de boss', async a => {
  await a.go('/');
  a.assert.ok(await a.page.locator('[data-testid="home-rank"]').count() === 1);
  await a.go('/collection');
  a.assert.strictEqual(await a.page.locator('[data-trophy]').count(), 6);
});
module.exports = { tests, seed };
