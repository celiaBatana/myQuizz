// Admin : import par copier-coller avec aperçu ligne par ligne
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => {
  const s = b();
  s.questions.e1 = { text: 'Question existante ?', options: ['A', 'B', 'C', 'D'], answer: 0, explanation: 'Ancienne.', diff: 'easy', category: 'sport', theme: 'football', active: true };
  return s;
};
t('coller : aperçu, remplacer, ignorer, importer', async a => {
  const { page } = a;
  await a.signup('Adm', 'a@a.fr');
  await a.patchDb(d => { const u = Object.values(d.users)[0]; u.isAdmin = true; u.onboarded = true; });
  await a.go('/admin'); await page.locator('text=Ajouter').first().click(); await page.waitForTimeout(700);
  const txt = [
    'categorie,theme,difficulte,question,optA,optB,optC,optD,reponse,explication,quiz',
    'sport,football,easy,Nouvelle collée ?,Oui,Non,Peut-être,Jamais,B,Parce que.,',
    'sport,football,easy,Question existante ?,A2,B2,C2,D2,C,Corrigée.,',
    'sport,themeinconnu,easy,Thème bidon ?,A,B,C,D,A,,',
    'sport,football,medium,À ignorer ?,A,B,C,D,A,,',
  ].join('\n');
  await page.locator('[data-testid="paste-area"]').fill(txt);
  await page.locator('[data-testid="paste-go"]').click(); await page.waitForTimeout(400);
  const kinds = await page.locator('[data-testid="paste-row"]').evaluateAll(els => els.map(e => e.getAttribute('data-kind')));
  a.assert.deepStrictEqual(kinds, ['new', 'dup', 'err', 'new']);
  await page.locator('[data-testid="row-create-theme"]').click(); await page.waitForTimeout(800);
  const kinds2 = await page.locator('[data-testid="paste-row"]').evaluateAll(els => els.map(e => e.getAttribute('data-kind')));
  a.assert.deepStrictEqual(kinds2, ['new', 'dup', 'new', 'new'], 'thème créé depuis l\'aperçu');
  await page.locator('[data-testid="row-replace"]').click(); await page.waitForTimeout(200);
  await page.locator('[data-testid="row-skip"]').last().click(); await page.waitForTimeout(200);
  a.assert.ok(/Importer 3 questions/.test(await a.body()), 'compte');
  await page.locator('text=Importer 3 questions').click(); await page.waitForTimeout(1500);
  const d = await a.db(); const qs = Object.values(d.questions);
  const n = qs.find(q => q.text === 'Nouvelle collée ?');
  a.assert.ok(n && n.answer === 1, 'nouvelle, réponse B → 1');
  a.assert.strictEqual(d.questions.e1.answer, 2, 'existante remplacée');
  a.assert.strictEqual(d.questions.e1.explanation, 'Corrigée.');
  a.assert.ok(!qs.some(q => q.text === 'À ignorer ?'), 'ignorée');
  a.assert.ok(qs.some(q => q.text === 'Thème bidon ?' && q.theme === 'themeinconnu'), 'importée dans le thème créé');
  a.assert.ok((await a.db()).themes.themeinconnu, 'thème en base');
});
module.exports = { tests, seed };
