// Panneau Admin : onglets, import CSV, santé (nettoyage, doublons), signalements
const base = { category: 'culture', theme: 'geographie', diff: 'easy', quizId: 'zA', active: true, options: ['Bonne', 'F1', 'F2', 'F3'], answer: 0, explanation: 'Une explication complète.' };
const tests = [];
const t = (n, f) => tests.push([n, f]);

const seed = b => {
  const questions = {};
  for (let i = 0; i < 8; i++) questions['f' + i] = { ...base, text: 'Filler ' + i + ' ?' };
  questions.d1 = { ...base, text: 'Capitale du pays X ?' };
  questions.d2 = { ...base, text: 'Capitale du pays X ?', options: ['Bonne2', 'F1', 'F2', 'F3'] };
  questions.qq = { ...base, text: 'Question guillemets ?', options: ['"Un"', '"Deux"', 'Trois', 'Quatre'] };
  questions.qr = { ...base, text: 'Question signalée ?' };
  return b({ quizzes: { zA: { catId: 'culture', themeId: 'geographie', name: 'Quiz A', diff: 'easy' } }, questions,
    reports: { r1: { questionId: 'qr', quizId: 'zA', quizName: 'Quiz A', text: 'Question signalée ?', reason: 'Réponse fausse', reporterUid: 'x', createdAt: { __ts: Date.now() } } } });
};

const openTab = async (a, label) => { await a.go('/admin'); await a.page.locator('text=' + label).first().click(); await a.page.waitForTimeout(700); };

t('devenir admin', async a => {
  await a.signup('Adm', 'a@a.fr');
  await a.patchDb(d => { const u = Object.values(d.users)[0]; u.isAdmin = true; u.onboarded = true; });
  await a.go('/admin'); a.assert.ok(/Admin Quizly/.test(await a.body()));
});
for (const l of ['Quiz (', 'Lier questions', 'Questions (', 'Ajouter', 'Santé', 'Signalements', 'Catégories', 'Thèmes']) {
  t('onglet ' + l, async a => { await openTab(a, l); a.assert.ok((await a.body()).length > 150); });
}
t('import CSV : doublon ignoré, quiz créé, guillemets', async a => {
  await openTab(a, 'Ajouter');
  const csv = 'categorie,theme,difficulte,question,optionA,optionB,optionC,optionD,reponse_correcte,explication,quiz\n' +
    'culture,geographie,easy,Nouvelle question ?,Oui,Non,Peut-etre,Jamais,A,Ok.,Quiz A\n' +
    'culture,geographie,easy,Filler 1 ?,A,B,C,D,A,Doublon.,Quiz A\n' +
    'culture,geographie,easy,Autre ?,Oui,Non,Peut-etre,Jamais,B,Ok.,Quiz Neuf\n';
  require('fs').writeFileSync(require('path').join(require('os').tmpdir(), 'quizly-e2e.csv'), csv);
  await a.page.setInputFiles('#csv-q-in', require('path').join(require('os').tmpdir(), 'quizly-e2e.csv')); await a.page.waitForTimeout(900);
  await a.page.locator('button:has-text("Importer")').first().click(); await a.page.waitForTimeout(1500);
  const d = await a.db(); const texts = Object.values(d.questions).map(q => q.text);
  a.assert.ok(texts.includes('Nouvelle question ?') && texts.includes('Autre ?'), 'nouvelles questions');
  a.assert.strictEqual(texts.filter(x => x === 'Filler 1 ?').length, 1, 'doublon ignoré');
  a.assert.ok(Object.values(d.quizzes).some(q => q.name === 'Quiz Neuf'), 'quiz créé');
});
t('santé : tout nettoyer retire les guillemets', async a => {
  await openTab(a, 'Santé'); await a.page.locator('button:has-text("Tout nettoyer")').click(); await a.page.waitForTimeout(1200);
  a.assert.deepStrictEqual((await a.db()).questions.qq.options.slice(0, 2), ['Un', 'Deux']);
});
t('santé : modifier un exemplaire en doublon', async a => {
  await openTab(a, 'Santé'); await a.page.locator('button:has-text("Modifier (en faire une")').first().click(); await a.page.waitForTimeout(600);
  await a.page.locator('input[value="Capitale du pays X ?"], textarea:has-text("Capitale du pays X ?")').first().fill('Capitale du pays Y ?');
  await a.page.locator('button:has-text("Enregistrer"), button:has-text("Sauvegarder")').first().click(); await a.page.waitForTimeout(900);
  const q = (await a.db()).questions; a.assert.notStrictEqual(q.d1.text, q.d2.text);
});
t('santé : remplacer un doublon par une ligne CSV', async a => {
  await a.patchDb(d => { d.questions.r1 = { ...d.questions.d1, text: 'Question en double R ?' }; d.questions.r2 = { ...d.questions.d1, text: 'Question en double R ?' }; });
  await openTab(a, 'Santé');
  await a.page.locator('[data-testid="csv-replace"]').first().click();
  await a.page.locator('[data-testid="reimport-input"]').fill('Quel fleuve traverse Budapest ?,Le Danube,La Vistule,"L\'Elbe",Le Rhin,A,"Le Danube sépare Buda et Pest, deux villes."');
  await a.page.locator('button:has-text("Remplacer cette question")').click(); await a.page.waitForTimeout(900);
  const q = (await a.db()).questions;
  const hit = Object.values(q).find(x => x.text === 'Quel fleuve traverse Budapest ?');
  a.assert.ok(hit, 'question remplacée'); a.assert.strictEqual(hit.answer, 0);
  a.assert.deepStrictEqual(hit.options, ['Le Danube', 'La Vistule', "L'Elbe", 'Le Rhin']);
  a.assert.ok(/Buda et Pest/.test(hit.explanation));
});
t('santé : CSV invalide affiche une erreur', async a => {
  await a.patchDb(d => { d.questions.r3 = { ...d.questions.d1, text: 'Autre double S ?' }; d.questions.r4 = { ...d.questions.d1, text: 'Autre double S ?' }; });
  await openTab(a, 'Santé');
  await a.page.locator('[data-testid="csv-replace"]').first().click();
  await a.page.locator('[data-testid="reimport-input"]').fill('Q,a,b,c,d,Z,expl');
  await a.page.locator('button:has-text("Remplacer cette question")').click(); await a.page.waitForTimeout(300);
  a.assert.ok(/introuvable/.test(await a.body()));
});
t('santé : supprimer un exemplaire', async a => {
  await a.patchDb(d => { d.questions.d3 = { ...d.questions.d1, options: ['B3', 'F1', 'F2', 'F3'] }; });
  await openTab(a, 'Santé'); const n0 = Object.keys((await a.db()).questions).length;
  await a.page.locator('button:has-text("🗑"), button:has-text("Supprimer")').first().click(); await a.page.waitForTimeout(900);
  a.assert.strictEqual(Object.keys((await a.db()).questions).length, n0 - 1);
});
t('signalements : affichage de l\'origine', async a => {
  await openTab(a, 'Signalements'); const b = await a.body();
  a.assert.ok(/culture › geographie › Quiz A/.test(b) && /Réponse fausse/.test(b), b.slice(0, 300));
});
t('signalements : corriger ouvre l\'éditeur', async a => {
  await openTab(a, 'Signalements'); await a.page.locator('button:has-text("Corriger")').first().click(); await a.page.waitForTimeout(500);
  a.assert.ok(await a.page.locator('input[value="Question signalée ?"], textarea:has-text("Question signalée ?")').count() > 0);
});
t('signalements : marquer résolu', async a => {
  await openTab(a, 'Signalements'); await a.page.locator('button:has-text("Ignorer / résolu")').first().click(); await a.page.waitForTimeout(800);
  a.assert.strictEqual(Object.keys((await a.db()).reports || {}).length, 0);
});
t('signalements : supprimer la question', async a => {
  await a.patchDb(d => { d.reports.r2 = { questionId: 'qr', quizId: 'zA', quizName: 'Quiz A', text: 'x', reason: 'r', reporterUid: 'x', createdAt: { __ts: 1 } }; });
  await openTab(a, 'Signalements'); await a.page.locator('button:has-text("Supprimer la question")').first().click(); await a.page.waitForTimeout(900);
  a.assert.ok(!(await a.db()).questions.qr);
});
module.exports = { tests, seed };
