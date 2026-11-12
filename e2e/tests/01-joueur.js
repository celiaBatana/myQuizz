// Parcours joueur : inscription, onboarding, quiz complet, récompenses, pages principales, reconnexion
const tests = [];
const t = (n, f) => tests.push([n, f]);

t('inscription crée le profil', async a => {
  await a.signup();
  const d = await a.db(); const u = Object.values(d.users)[0];
  a.assert.ok(u && u.displayName === 'Testeur' && u.totalXP === 0, 'profil attendu');
  a.assert.ok(/objectif|Suivant/i.test(await a.body()), 'onboarding attendu');
});
t('onboarding mène à un premier quiz', async a => {
  const { page } = a;
  await page.click('text=Suivant'); await page.click('text=Suivant'); await page.click("text=C'est parti"); await page.waitForTimeout(1200);
  a.assert.ok(/\/play\?/.test(page.url()), 'redirigé vers /play : ' + page.url());
});
t('accueil connecté : série et objectif', async a => {
  await a.go('/'); const b = await a.body();
  a.assert.ok(/jour de série/.test(b) && /Objectif du jour/.test(b), b.slice(0, 200));
});
t('le parcours verrouille l\'étape 2', async a => {
  await a.go('/category/culture/theme/geographie'); const b = await a.body();
  a.assert.ok(/Parcours : 0\/2/.test(b) && b.includes('🔒'), b.slice(0, 250));
});
t('quiz complet : 10/10, XP, série, récompenses', async a => {
  const { page } = a;
  await page.click('text=Quiz #1 Relief'); await page.waitForTimeout(900);
  for (let i = 0; i < 10; i++) {
    await page.locator('text=Bonne').first().click({ timeout: 4000 }); await page.waitForTimeout(450);
    await page.locator('button:has-text("Suivant"), button:has-text("Terminer"), button:has-text("Résultat"), button:has-text("Voir")').first().click({ timeout: 3000 }); await page.waitForTimeout(350);
  }
  await page.waitForTimeout(1500);
  const b = await a.body();
  a.assert.ok(/10\/10/.test(b), 'score 10/10 attendu : ' + b.slice(0, 300));
  a.assert.ok(/Coffre du jour/.test(b), 'coffre du jour');
  const u = Object.values((await a.db()).users)[0];
  a.assert.strictEqual(u.quizzesPlayed, 1); a.assert.strictEqual(u.streak, 1);
  a.assert.strictEqual(u.bestScores.z1, 100); a.assert.ok(u.totalXP > 50, 'XP ' + u.totalXP);
  a.assert.strictEqual(Object.keys((await a.db()).leaderboard || {}).length, 1, 'ligne au classement');
});
t('étape 2 débloquée après 100 %', async a => {
  await a.go('/category/culture/theme/geographie'); const b = await a.body();
  a.assert.ok(/Parcours : 1\/2/.test(b), b.slice(0, 250));
});
for (const [n, path, re] of [['profil', '/profile', /Niveau 1/], ['progression', '/progression', /Ma progression/], ['classement', '/classement', /Ligue/], ['groupes', '/groupes', /Groupes privés/], ['révision', '/revision', /revoir|Révision/], ['jouer', '/jouer', /Quiz mixte/], ['défi du jour', '/daily', /Défi du jour/]]) {
  t('page ' + n, async a => { await a.go(path); const b = await a.body(); a.assert.ok(re.test(b), b.slice(0, 200)); });
}
t('quiz mixte démarre', async a => {
  await a.go('/jouer'); await a.page.locator('text=Quiz mixte').first().click(); await a.page.locator('button:has-text("Lancer")').click(); await a.page.waitForTimeout(1800);
  a.assert.ok(/1 \/ \d+/.test(await a.body()), (await a.body()).slice(0, 200));
});
t('onglet Admin caché aux non-admins', async a => {
  await a.go('/'); a.assert.ok(!/Admin$/.test((await a.body()).trim()), 'Admin visible');
  await a.go('/admin'); a.assert.ok(/Accès refusé/.test(await a.body()));
});
t('déconnexion puis reconnexion', async a => {
  const { page } = a;
  await a.go('/profile'); await page.click('text=Se déconnecter'); await page.waitForTimeout(800);
  await page.click('text=Connexion'); await page.fill('input[type=email]', 't@t.fr'); await page.fill('input[type=password]', 'secret1');
  await page.click('button[type=submit]'); await page.waitForTimeout(1300);
  a.assert.ok(/XP/.test(await a.body()) && !/^Quizly \| .*Connexion/.test(await a.body()), (await a.body()).slice(0, 120));
});
module.exports = { tests };
