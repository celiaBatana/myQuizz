// Export des questions (admin)
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => {
  const s = b();
  s.quizzes.zq = { catId: 'sport', themeId: 'football', name: 'Quiz, "foot"', diff: 'easy' };
  s.questions.e1 = { text: 'Combien de joueurs, "en tout" ?', options: ['11', '10', '9', '8'], answer: 0, explanation: 'Onze.', diff: 'easy', category: 'sport', theme: 'football', quizId: 'zq', active: true };
  s.questions.e2 = { text: 'Autre ?', options: ['A', 'B', 'C', 'D'], answer: 2, explanation: '', diff: 'hard', category: 'sport', theme: 'football', active: true };
  return s;
};
t('export : CSV réimportable et inventaire', async a => {
  await a.signup('Adm', 'a@a.fr');
  await a.patchDb(d => { const u = Object.values(d.users)[0]; u.isAdmin = true; u.onboarded = true; });
  await a.go('/admin'); await a.page.locator('text=Ajouter').first().click(); await a.page.waitForTimeout(700);
  const [dl] = await Promise.all([a.page.waitForEvent('download'), a.page.locator('[data-testid="export-questions"]').click()]);
  const txt = require('fs').readFileSync(await dl.path(), 'utf8');
  a.assert.ok(txt.includes('categorie,theme,difficulte,question'), 'entête');
  a.assert.ok(txt.includes('"Combien de joueurs, ""en tout"" ?"'), 'échappement');
  a.assert.ok(txt.includes('"Quiz, ""foot"""'), 'nom du quiz');
  const [dl2] = await Promise.all([a.page.waitForEvent('download'), a.page.locator('[data-testid="export-inventory"]').click()]);
  const inv = require('fs').readFileSync(await dl2.path(), 'utf8');
  a.assert.ok(/sport,football,easy,1,1/.test(inv) && /sport,football,hard,1,0/.test(inv), inv);
});
module.exports = { tests, seed };
