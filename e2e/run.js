// Tests de bout en bout avec un FAUX Firebase en mémoire (aucun accès au vrai projet).
// Usage : npm run test:e2e   (nécessite le paquet `playwright` + Chromium)
// Principe : copie src/ dans un dossier temporaire, remplace les imports firebase/* par e2e/fakefb/*,
// compile, sert le build et pilote le site avec Chromium.
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const tmp = path.join(os.tmpdir(), 'quizly-e2e');
const PORT = 5057;

function copyDir(a, b) { fs.mkdirSync(b, { recursive: true }); for (const f of fs.readdirSync(a)) { const s = path.join(a, f), d = path.join(b, f); fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d); } }
function walk(dir, out = []) { for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f); fs.statSync(p).isDirectory() ? walk(p, out) : /\.jsx?$/.test(f) && out.push(p); } return out; }

function build() {
  fs.rmSync(tmp, { recursive: true, force: true });
  copyDir(path.join(root, 'src'), path.join(tmp, 'src'));
  copyDir(path.join(root, 'public'), path.join(tmp, 'public'));
  fs.copyFileSync(path.join(root, 'package.json'), path.join(tmp, 'package.json'));
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(tmp, 'node_modules'));
  copyDir(path.join(__dirname, 'fakefb'), path.join(tmp, 'src', 'fakefb'));
  for (const f of walk(path.join(tmp, 'src'))) {
    if (f.includes(path.join('src', 'fakefb'))) continue;
    const rel = path.relative(path.dirname(f), path.join(tmp, 'src', 'fakefb')).split(path.sep).join('/');
    const pre = rel.startsWith('.') ? rel : './' + rel;
    const s = fs.readFileSync(f, 'utf8');
    const n = s.replace(/'firebase\/(app|auth|firestore)'/g, (_, m) => `'${pre}/${m}'`);
    if (n !== s) fs.writeFileSync(f, n);
  }
  console.log('→ compilation (faux Firebase)…');
  execSync('npx react-scripts build', {
    cwd: tmp, stdio: 'pipe',
    env: { ...process.env, CI: 'false', BUILD_PATH: path.join(tmp, 'out'), REACT_APP_FIREBASE_API_KEY: 'k', REACT_APP_FIREBASE_AUTH_DOMAIN: 'x.firebaseapp.com', REACT_APP_FIREBASE_PROJECT_ID: 'demo', REACT_APP_FIREBASE_APP_ID: '1:1:web:1' },
  });
}

function serve() {
  const out = path.join(tmp, 'out');
  const mt = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let f = path.join(out, q.url.split('?')[0]);
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(out, 'index.html');
      r.setHeader('Content-Type', mt[path.extname(f)] || 'text/plain'); fs.createReadStream(f).pipe(r);
    }).listen(PORT, () => res(s));
  });
}

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) { console.error('Paquet `playwright` introuvable : npm i -D playwright && npx playwright install chromium'); process.exit(2); }
  if (!process.env.E2E_SKIP_BUILD) build();
  const server = await serve();
  const only = process.argv[2];
  const files = fs.readdirSync(path.join(__dirname, 'tests')).filter(f => f.endsWith('.js') && (!only || f.includes(only)));
  const browser = await chromium.launch();
  let failed = 0;
  for (const f of files) {
    console.log('\n■ ' + f);
    const t = require(path.join(__dirname, 'tests', f));
    failed += await require('./helpers').runSuite(browser, `http://localhost:${PORT}`, t);
  }
  await browser.close(); server.close();
  console.log(failed ? `\n✗ ${failed} échec(s)` : '\n✓ tout est vert');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
