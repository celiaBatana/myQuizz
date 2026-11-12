// Utilitaires partagés par les tests
const assert = require('assert');

// Données de départ : un thème avec 2 quiz de 10 questions (la bonne réponse est « Bonne »)
function baseSeed(extra = {}) {
  const quizzes = {}, questions = {};
  const mk = (qid, cat, th, diff, name, n) => {
    quizzes[qid] = { catId: cat, themeId: th, name, diff };
    for (let i = 0; i < n; i++) questions[`${qid}_q${i}`] = { text: `Question ${name} ${i + 1} ?`, options: ['Bonne', 'Fausse 1', 'Fausse 2', 'Fausse 3'], answer: 0, explanation: `Explication ${i + 1}.`, diff, category: cat, theme: th, quizId: qid, active: true };
  };
  mk('z1', 'culture', 'geographie', 'easy', 'Quiz #1 Relief', 10);
  mk('z2', 'culture', 'geographie', 'medium', 'Quiz #2 Capitales', 10);
  mk('z3', 'cinema', 'classiques', 'hard', 'Quiz #1 Cine', 10);
  return { quizzes: { ...quizzes, ...(extra.quizzes || {}) }, questions: { ...questions, ...(extra.questions || {}) }, ...Object.fromEntries(Object.entries(extra).filter(([k]) => !['quizzes', 'questions'].includes(k))) };
}

async function runSuite(browser, url, suite) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 700 } });
  await ctx.addInitScript(s => { window.__SEED = s; }, suite.seed ? suite.seed(baseSeed) : baseSeed());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  const api = {
    url, page, ctx, assert,
    body: async () => (await page.innerText('body')).replace(/\n+/g, ' | '),
    db: () => page.evaluate(() => window.__DB()),
    patchDb: fn => page.evaluate(f => { const d = window.__DB(); (new Function('d', 'return (' + f + ')(d)'))(d); localStorage.setItem('fakedb', JSON.stringify(d)); }, fn.toString()),
    go: async p => { await page.goto(url + p); await page.waitForTimeout(900); },
    signup: async (name = 'Testeur', email = 't@t.fr', pw = 'secret1') => {
      await page.goto(url + '/'); await page.waitForTimeout(500);
      await page.click('text=Connexion'); await page.click('.modal-tab:has-text("Inscription")');
      await page.fill('input[type=text]', name); await page.fill('input[type=email]', email); await page.fill('input[type=password]', pw);
      await page.click('button[type=submit]'); await page.waitForTimeout(1300);
    },
  };
  let failed = 0;
  for (const [name, fn] of suite.tests) {
    try { await fn(api); console.log('  ✓ ' + name); }
    catch (e) { failed++; console.log('  ✗ ' + name + '\n      ' + String(e.message).split('\n')[0]); await page.screenshot({ path: require('path').join(require('os').tmpdir(), 'quizly-e2e-fail-' + name.replace(/\W+/g, '_') + '.png') }).catch(() => {}); }
  }
  if (errors.length) { failed++; console.log('  ✗ erreurs JavaScript :\n      ' + [...new Set(errors)].join('\n      ')); }
  await ctx.close();
  return failed;
}
module.exports = { runSuite, baseSeed };
