// Modes mixte / mort subite : sélection de plusieurs catégories
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => {
  const s = b();
  s.quizzes.zS = { catId: 'sport', themeId: 'football', name: 'Quiz #1 — Foot', diff: 'easy' };
  for (let i = 0; i < 10; i++) s.questions['zS_q' + i] = { text: `Question Foot ${i + 1} ?`, options: ['Bonne', 'F1', 'F2', 'F3'], answer: 0, explanation: 'Ok.', diff: 'easy', category: 'sport', theme: 'football', quizId: 'zS', active: true };
  return s;
};
const launch = (a, ids) => a.go('/jouer').then(async () => {
  for (const id of ids) await a.page.locator(`[data-cat="${id}"]`).click();
});

t('une seule catégorie : lancement bloqué', async a => {
  await a.signup(); await a.go('/jouer'); await a.page.locator('[data-cat="sport"]').click();
  const btn = a.page.locator('button:has-text("Choisis une 2ᵉ catégorie")');
  a.assert.ok(await btn.isDisabled(), 'bouton désactivé avec explication dans son libellé');
  a.assert.ok(await a.page.locator('[role=alert]:has-text("au moins 2 catégories")').isVisible(), 'bandeau d\'avertissement');
});
t('deux catégories : seules ces catégories sont jouées', async a => {
  await a.page.locator('[data-cat="culture"]').click();
  a.assert.ok(await a.page.locator('button:has-text("Lancer")').isEnabled());
  await a.page.locator('button:has-text("Lancer")').click(); await a.page.waitForTimeout(1500);
  a.assert.ok(/cat=culture%2Csport|cat=culture,sport|cat=sport,culture|cat=sport%2Cculture/.test(a.page.url()), a.page.url());
  const seen = new Set();
  for (let i = 0; i < 10; i++) {
    const b = await a.body(); const m = b.match(/Question (Quiz #\d — \w+|Foot) \d+/); seen.add(m && (m[1].startsWith('Foot') ? 'sport' : 'culture'));
    await a.page.locator('text=Bonne').first().click(); await a.page.waitForTimeout(400);
    await a.page.locator('button:has-text("Question suivante"), button:has-text("Voir mes")').first().click(); await a.page.waitForTimeout(300);
  }
  a.assert.ok(seen.has('sport') && seen.has('culture') && !seen.has('cinema'), 'catégories vues : ' + [...seen]);
});
t('« Toutes » remet à zéro la sélection', async a => {
  await a.go('/jouer'); await a.page.locator('[data-cat="sport"]').click(); await a.page.locator('text=Toutes (varié)').click();
  a.assert.ok(await a.page.locator('button:has-text("Lancer")').isEnabled());
});
t('mort subite avec plusieurs catégories démarre', async a => {
  await a.go('/jouer'); await a.page.locator('text=Mort subite').click();
  await a.page.locator('[data-cat="sport"]').click(); await a.page.locator('[data-cat="cinema"]').click();
  await a.page.locator('button:has-text("Lancer")').click(); await a.page.waitForTimeout(1500);
  a.assert.ok(/mort subite/i.test(await a.body()) && /1 \//.test(await a.body()), (await a.body()).slice(0, 200));
});
module.exports = { tests, seed };
