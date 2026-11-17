// Admin : onglet Joueurs (vérification des classements, correction XP / éclats)
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => {
  const s = b();
  s.users = s.users || {};
  s.users.tricheur = { displayName: 'Suspect', totalXP: 20000, level: 100, quizzesPlayed: 10, gemsBonus: 5000, gemsSpent: 0, weekXP: 100 };
  s.users.sage = { displayName: 'Sage', totalXP: 800, level: 5, quizzesPlayed: 20, gemsBonus: 10, gemsSpent: 0, weekXP: 100 };
  s.leaderboard = s.leaderboard || {};
  s.leaderboard.tricheur = { uid: 'tricheur', name: 'Suspect', totalXP: 20000, level: 100 };
  return s;
};
t('onglet Joueurs : signaux et correction', async a => {
  await a.signup('Adm', 'a@a.fr');
  await a.patchDb(d => { const u = Object.values(d.users).find(x => x.email === 'a@a.fr') || Object.values(d.users).find(x => x.displayName === 'Adm'); u.isAdmin = true; u.onboarded = true; });
  await a.go('/admin'); await a.page.locator('text=Joueurs').first().click(); await a.page.waitForTimeout(900);
  let b = await a.body();
  a.assert.ok(/⚠️ Suspect/.test(b) && /Sage/.test(b), b.slice(0, 400));
  a.assert.ok(!/⚠️ Sage/.test(b), 'Sage ne doit pas être signalé');
  await a.page.locator('[data-testid="aj-row"]', { hasText: 'Suspect' }).locator('[data-testid="aj-edit"]').click();
  await a.page.locator('[data-testid="aj-xp"]').fill('900'); await a.page.locator('[data-testid="aj-gems"]').fill('0');
  await a.page.locator('[data-testid="aj-save"]').click(); await a.page.waitForTimeout(900);
  const d = await a.db();
  a.assert.strictEqual(d.users.tricheur.totalXP, 900); a.assert.strictEqual(d.users.tricheur.gemsBonus, 0);
  a.assert.strictEqual(d.users.tricheur.level, 5); a.assert.strictEqual(d.leaderboard.tricheur.totalXP, 900);
});
module.exports = { tests, seed };
