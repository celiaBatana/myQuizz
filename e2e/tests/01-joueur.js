// Parcours joueur : inscription, onboarding, quiz complet, récompenses, pages principales, reconnexion
const tests = [];
const t = (n, f) => tests.push([n, f]);
const playAll = async (a, name, pick = 'Bonne') => {
  const { page } = a;
  await page.click('text=' + name); await page.waitForTimeout(900);
  for (let i = 0; i < 10; i++) {
    await page.locator('text=' + pick).first().click({ timeout: 4000 }); await page.waitForTimeout(450);
    await page.locator('button:has-text("Suivant"), button:has-text("Terminer"), button:has-text("Résultat"), button:has-text("Voir")').first().click({ timeout: 3000 }); await page.waitForTimeout(350);
  }
  await page.waitForTimeout(1500);
};

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
t('carte du thème gagnée après un quiz de chaque niveau', async a => {
  await a.go('/category/culture/theme/geographie'); await playAll(a, 'Quiz #2 Capitales');
  const b = await a.body(); a.assert.ok(/Nouvelle carte/.test(b), b.slice(0, 400));
  a.assert.ok((Object.values((await a.db()).users)[0].cards || []).includes('culture:geographie'));
});
t('collection : carte possédée, anecdote, cartes verrouillées', async a => {
  await a.go('/collection'); const b = await a.body();
  a.assert.ok(/1 \/ 2 cartes/.test(b), b.slice(0, 200));
  a.assert.strictEqual(await a.page.locator('[data-card="culture:geographie"][data-owned="1"]').count(), 1);
  a.assert.strictEqual(await a.page.locator('[data-owned="0"]').count(), 1);
  await a.page.locator('[data-card="culture:geographie"]').click(); await a.page.waitForTimeout(300);
  a.assert.ok(/Vatican/.test(await a.body()), 'anecdote');
});
t('une carte gagnée n\'est pas retirée quand on ajoute un quiz', async a => {
  await a.patchDb(d => { d.quizzes.zNew = { catId: 'culture', themeId: 'geographie', name: 'Quiz #3 Difficile', diff: 'hard' }; });
  await a.go('/collection'); a.assert.strictEqual(await a.page.locator('[data-card="culture:geographie"][data-owned="1"]').count(), 1);
});
t('collection : cartes méritées avant la fonctionnalité récupérées', async a => {
  await a.patchDb(d => { const u = Object.values(d.users)[0]; u.cards = []; delete d.quizzes.zNew; });
  await a.go('/collection'); await a.page.waitForTimeout(500);
  a.assert.ok((Object.values((await a.db()).users)[0].cards || []).includes('culture:geographie'), 'carte restaurée dans le profil');
});
t('rejouer un quiz réussi : XP réduit à 25 %', async a => {
  await a.go('/category/culture/theme/geographie');
  const h0 = Object.values((await a.db()).users)[0].history; const first = h0[h0.length - 1].xp;
  await playAll(a, 'Quiz #1 Relief');
  const b = await a.body(); a.assert.ok(/réduit à 25 %/.test(b), b.slice(0, 400));
  const h1 = Object.values((await a.db()).users)[0].history; const second = h1[h1.length - 1].xp;
  a.assert.ok(second < first / 2, `XP rejoué ${second} vs première fois ${first}`);
});
t('3e rejeu du jour sans progression : plus d\'XP de partie', async a => {
  await a.go('/category/culture/theme/geographie'); await playAll(a, 'Quiz #1 Relief');
  await a.go('/category/culture/theme/geographie'); await playAll(a, 'Quiz #1 Relief');
  const b = await a.body(); a.assert.ok(/plus d'XP sur celui-ci/.test(b), b.slice(0, 400));
});
t('mauvaise partie puis progression : XP proportionnel', async a => {
  await a.go('/category/culture/theme/geographie'); await a.patchDb(d => { const u = Object.values(d.users)[0]; u.bestScores.z1 = 50; u.replays = { date: '1999-01-01', n: {} }; });
  await a.page.reload(); await a.page.waitForTimeout(900);
  await playAll(a, 'Quiz #1 Relief'); const b = await a.body();
  a.assert.ok(!/déjà réussi/.test(b), 'progression 50→100 : pleine récompense attendue\n' + b.slice(0, 300));
});
for (const [n, path, re] of [['profil', '/profile', /Niveau \d/], ['progression', '/progression', /Ma progression/], ['classement', '/classement', /Ligue/], ['groupes', '/groupes', /Groupes privés/], ['révision', '/revision', /revoir|Révision/], ['jouer', '/jouer', /Quiz mixte/], ['défi du jour', '/daily', /Défi du jour/]]) {
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
t('bandeau hors-ligne affiché puis retiré', async a => {
  await a.go('/'); await a.ctx.setOffline(true); await a.page.evaluate(() => window.dispatchEvent(new Event('offline'))); await a.page.waitForTimeout(300);
  a.assert.ok(/Hors-ligne/.test(await a.body()), 'bandeau attendu');
  await a.ctx.setOffline(false); await a.page.evaluate(() => window.dispatchEvent(new Event('online'))); await a.page.waitForTimeout(300);
  a.assert.ok(!/Hors-ligne/.test(await a.body()), 'bandeau retiré');
});
t('manifest et service worker servis', async a => {
  for (const f of ['/manifest.json', '/sw.js', '/icon-192.png']) { const r = await a.page.request.get(a.url + f); a.assert.ok(r.ok(), f); }
  const m = await (await a.page.request.get(a.url + '/manifest.json')).json(); a.assert.strictEqual(m.short_name, 'Quizly');
});
module.exports = { tests };
