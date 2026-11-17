// Recherche globale, succès (badges) et page de stats
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => b();
t('recherche globale', async a => {
  const { page } = a;
  await a.signup('Rech', 'r@r.fr');
  await a.patchDb(d => { Object.values(d.users)[0].onboarded = true; });
  await a.go('/'); await page.locator('[data-testid="home-search"]').click(); await page.waitForTimeout(600);
  await page.locator('[data-testid="search-input"]').fill('relief'); await page.waitForTimeout(500);
  a.assert.ok(await page.locator('[data-testid="sr-quiz"]').count() >= 1, 'quiz trouvé');
  await page.locator('[data-testid="search-input"]').fill('zzzzqq'); await page.waitForTimeout(300);
  a.assert.ok(await page.locator('[data-testid="search-none"]').count() === 1, 'aucun résultat');
  await page.locator('[data-testid="search-input"]').fill('géographie'); await page.waitForTimeout(300);
  await page.locator('[data-testid="sr-theme"]').first().click(); await page.waitForTimeout(600);
  a.assert.ok(/category\/.+\/theme\//.test(page.url()), page.url());
});
t('succès : mémorisés et annoncés', async a => {
  const { page } = a;
  await a.patchDb(d => { const u = Object.values(d.users)[0]; u.onboarded = true; u.quizzesPlayed = 12; u.correctAnswers = 40; });
  await a.go('/'); await page.waitForTimeout(1800);
  const d = await a.db(); const u = Object.values(d.users)[0];
  a.assert.ok((u.badges || []).includes('q10') && (u.badges || []).includes('q1'), JSON.stringify(u.badges));
  await a.go('/profile'); await page.waitForTimeout(700);
  a.assert.ok(await page.locator('[data-testid="badge-ok"]').count() >= 2);
  a.assert.ok(/\/\d+/.test(await page.locator('[data-testid="badges-count"]').innerText()));
});
t('page de stats : barres et moment de jeu', async a => {
  const { page } = a;
  await a.patchDb(d => { const u = Object.values(d.users)[0]; u.onboarded = true; u.quizzesPlayed = 6; const iso = h => { const x = new Date(); x.setHours(h, 5, 0, 0); return x.toISOString(); }; u.history = [20, 21, 20, 22, 19, 20].map(h => ({ quizId: 'x', quizName: 'Q', diff: 'easy', score: 8, total: 10, xp: 50, date: iso(h) })); });
  await a.go('/progression'); await page.waitForTimeout(900);
  a.assert.strictEqual(await page.locator('[data-testid="stats-day"]').count(), 7);
  a.assert.ok(/le soir/.test(await page.locator('[data-testid="stats-moment"]').innerText()));
});
module.exports = { tests, seed };
