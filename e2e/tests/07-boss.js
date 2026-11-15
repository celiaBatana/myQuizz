// Combats de boss
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => {
  const s = b();
  s.quizzes.zB = { catId: 'sport', themeId: 'football', name: 'Quiz Boss', diff: 'easy' };
  for (let i = 0; i < 30; i++) s.questions['zB_q' + i] = { text: `Question Boss ${i + 1} ?`, options: ['Bonne', 'F1', 'F2', 'F3'], answer: 0, explanation: 'Ok.', diff: 'easy', category: 'sport', theme: 'football', quizId: 'zB', active: true };
  return s;
};
const pick = async (a, good) => {
  const opts = a.page.locator('[data-testid="boss-opt"]');
  await opts.first().waitFor({ timeout: 4000 });
  const n = await opts.count();
  for (let i = 0; i < n; i++) {
    const tx = (await opts.nth(i).innerText()).trim();
    if ((tx === 'Bonne') === good) { await opts.nth(i).click(); return; }
  }
};
t('liste : 6 boss, carte sur l\'accueil', async a => {
  await a.go('/'); await a.page.locator('[data-testid="home-boss"]').click(); await a.page.waitForTimeout(300);
  a.assert.ok(a.page.url().endsWith('/boss'), a.page.url());
  a.assert.strictEqual(await a.page.locator('[data-testid="boss-card"]').count(), 6);
});
t('défaite : 3 mauvaises réponses', async a => {
  await a.go('/boss/minotaure');
  for (let k = 0; k < 3; k++) {
    await pick(a, false);
    if (k < 2) await a.page.locator('[data-testid="boss-next"]').click();
  }
  await a.page.locator('[data-testid="boss-over"]').waitFor({ timeout: 4000 });
  a.assert.ok(/Défaite/.test(await a.body()));
});
t('victoire connecté : XP, trophée et carte', async a => {
  await a.signup(); await a.go('/boss/minotaure');
  for (let k = 0; k < 20; k++) {
    if (await a.page.locator('[data-testid="boss-over"]').count()) break;
    await pick(a, true);
    await a.page.waitForTimeout(1300);
    const nx = a.page.locator('[data-testid="boss-next"]');
    if (await nx.count()) await nx.click();
  }
  await a.page.locator('[data-testid="boss-gain"]').waitFor({ timeout: 5000 });
  a.assert.ok(/Boss vaincu/.test(await a.body()));
  await a.page.waitForTimeout(600);
  const u = Object.values((await a.db()).users)[0];
  a.assert.strictEqual(u.bossWins.minotaure, 1);
  a.assert.ok(u.totalXP >= 90, String(u.totalXP));
  a.assert.ok(await a.page.locator('text=/Trophée de boss/').count() >= 1);
});
module.exports = { tests, seed };
