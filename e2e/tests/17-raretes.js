// Raretés de cartes et doublons du coffre
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => b();
t('collection : compteurs de raretés', async a => {
  await a.signup();
  await a.patchDb(d => { const u = Object.values(d.users)[0]; u.onboarded = true; u.cards = ['culture:classique']; u.chestDay = '2000-01-01'; u.gemsBonus = 0; u.streak = 0; });
  await a.go('/collection'); await a.page.waitForTimeout(800);
  const txt = await a.page.locator('[data-testid="rarity-counts"]').innerText();
  a.assert.ok(/Commune/.test(txt) && /Rare/.test(txt) && /Épique/.test(txt) && /Légendaire/.test(txt), txt);
});
t('coffre : une carte déjà possédée devient un doublon en éclats', async a => {
  await a.page.addInitScript(() => { Math.random = () => 0.01; });
  await a.go('/'); await a.page.waitForTimeout(600);
  await a.page.locator('[data-testid="chest-open"]').click();
  await a.page.locator('[data-testid="chest-dupe"]').waitFor({ timeout: 6000 });
  await a.page.waitForTimeout(500);
  const u = Object.values((await a.db()).users)[0];
  a.assert.strictEqual(u.cardDupes['culture:classique'], 1);
  a.assert.ok(u.gemsBonus > 8, 'gemsBonus ' + u.gemsBonus);
  a.assert.strictEqual(u.cards.length, 1);
});
module.exports = { tests, seed };
