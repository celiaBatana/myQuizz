// Champions par catégorie, boss et catégorie de la semaine
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => {
  const s = b();
  s.quizzes.zK = { catId: 'sport', themeId: 'football', name: 'Quiz Champion', diff: 'easy' };
  for (let i = 0; i < 10; i++) s.questions['zK_q' + i] = { text: `Question ${i + 1} ?`, options: ['Bonne', 'F1', 'F2', 'F3'], answer: 0, explanation: 'Ok.', diff: 'easy', category: 'sport', theme: 'football', quizId: 'zK', active: true };
  s.leaderboard = { zoe: { uid: 'zoe', name: 'Zoé', totalXP: 500, level: 3, catXP: { sport: 340, culture: 90 } } };
  return s;
};
t('accueil : champion de la catégorie + couronne à prendre', async a => {
  await a.go('/'); await a.page.waitForTimeout(1500);
  a.assert.ok(/👑 Zoé · 340 XP/.test(await a.body()), (await a.body()).slice(-400));
  a.assert.ok(/Couronne à prendre/.test(await a.body()));
});
t('semaine : boss et catégorie affichés', async a => {
  const b = await a.body();
  a.assert.ok(/BOSS DE LA SEMAINE/.test(b) && /CATÉGORIE DE LA SEMAINE/.test(b));
  await a.go('/boss'); a.assert.strictEqual(await a.page.locator('[data-testid="weekly-boss"]').count(), 1);
});
t('jouer un quiz enregistre les XP de catégorie', async a => {
  await a.signup();
  await a.go('/quiz/sport/football/zK');
  for (let k = 0; k < 10; k++) {
    await a.page.locator('text="Bonne"').first().click(); await a.page.waitForTimeout(250);
    const nx = a.page.locator('button:has-text("suivante"), button:has-text("Résultat"), button:has-text("Terminer")');
    if (await nx.count()) await nx.first().click();
    await a.page.waitForTimeout(150);
  }
  await a.page.waitForTimeout(1500);
  const d = await a.db();
  const uid = Object.keys(d.users)[0], u = d.users[uid];
  a.assert.ok(u.catXP && u.catXP.sport > 0, JSON.stringify(u.catXP));
  const lb = d.leaderboard[uid];
  a.assert.ok(lb && lb.catXP && lb.catXP.sport > 0, JSON.stringify(lb));
});
module.exports = { tests, seed };
