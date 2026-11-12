const KEY = 'fakedb';
let DB = {};
try { DB = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { DB = {}; }
if (window.__SEED && !Object.keys(DB).length) DB = JSON.parse(JSON.stringify(window.__SEED));
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} };
window.__DB = () => DB;

class TS { constructor(ms) { this.ms = ms; this.seconds = Math.floor(ms / 1000); this.nanoseconds = 0; }
  toDate() { return new Date(this.ms); } toMillis() { return this.ms; } }
const SERVER = { __op: 'ts' };
export const serverTimestamp = () => SERVER;
export const increment = n => ({ __op: 'inc', n });
export const arrayUnion = (...v) => ({ __op: 'au', v });
export const arrayRemove = (...v) => ({ __op: 'ar', v });
export const deleteField = () => ({ __op: 'del' });
export const documentId = () => ({ __docid: true });
export const getFirestore = () => ({ fake: true });
export const Timestamp = TS;

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function resolve(cur, v) {
  if (v && v.__op) {
    switch (v.__op) {
      case 'ts': return { __ts: Date.now() };
      case 'inc': return (typeof cur === 'number' ? cur : 0) + v.n;
      case 'au': { const a = Array.isArray(cur) ? [...cur] : []; v.v.forEach(x => { if (!a.some(y => eq(x, y))) a.push(x); }); return a; }
      case 'ar': return (Array.isArray(cur) ? cur : []).filter(y => !v.v.some(x => eq(x, y)));
      default: return v;
    }
  }
  if (Array.isArray(v)) return v.map(x => resolve(undefined, x));
  if (v && typeof v === 'object' && !(v.__ts)) { const o = {}; Object.keys(v).forEach(k => { o[k] = resolve(cur && cur[k], v[k]); }); return o; }
  return v;
}
function setPath(obj, path, val) {
  const ks = path.split('.'); let o = obj;
  for (let i = 0; i < ks.length - 1; i++) { if (!o[ks[i]] || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]]; }
  const last = ks[ks.length - 1];
  if (val && val.__op === 'del') delete o[last]; else o[last] = resolve(o[last], val);
}
function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }
function rev(x) { // revive timestamps
  if (x && typeof x === 'object') {
    if (x.__ts) return new TS(x.__ts);
    if (Array.isArray(x)) return x.map(rev);
    const o = {}; Object.keys(x).forEach(k => { o[k] = rev(x[k]); }); return o;
  }
  return x;
}
const col = n => (DB[n] = DB[n] || {});
const rid = () => Array.from({ length: 20 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join('');

export const collection = (db, ...p) => ({ type: 'col', path: p.join('/') });
export function doc(a, ...p) {
  if (a && a.type === 'col') return { type: 'doc', col: a.path, id: p[0] || rid() };
  const segs = p.join('/').split('/'); const id = segs.pop();
  return { type: 'doc', col: segs.join('/'), id };
}
const snapOf = (c, id) => {
  const raw = col(c)[id];
  return { id, exists: () => raw !== undefined, data: () => (raw === undefined ? undefined : rev(JSON.parse(JSON.stringify(raw)))), ref: { type: 'doc', col: c, id } };
};
export async function getDoc(r) { return snapOf(r.col, r.id); }
export async function setDoc(r, data, opts) {
  const c = col(r.col); const cur = c[r.id];
  if (opts && opts.merge && cur) { Object.keys(data).forEach(k => { cur[k] = resolve(cur[k], data[k]); }); }
  else c[r.id] = resolve(undefined, data);
  persist();
}
export async function addDoc(cr, data) { const id = rid(); col(cr.path)[id] = resolve(undefined, data); persist(); return { id, type: 'doc', col: cr.path }; }
export async function updateDoc(r, data) {
  const cur = col(r.col)[r.id];
  if (!cur) { const e = new Error('No document to update'); e.code = 'not-found'; throw e; }
  Object.keys(data).forEach(k => setPath(cur, k, data[k])); persist();
}
export async function deleteDoc(r) { delete col(r.col)[r.id]; persist(); }
export function writeBatch() {
  const ops = [];
  const b = {
    set: (r, d, o) => { ops.push(() => setDoc(r, d, o)); return b; },
    update: (r, d) => { ops.push(() => updateDoc(r, d)); return b; },
    delete: r => { ops.push(() => deleteDoc(r)); return b; },
    commit: async () => { for (const f of ops) await f(); },
  };
  return b;
}
export const where = (f, op, v) => ({ k: 'where', f, op, v });
export const orderBy = (f, d = 'asc') => ({ k: 'order', f, d });
export const startAt = v => ({ k: 'start', v });
export const limit = n => ({ k: 'limit', n });
export const query = (c, ...cs) => ({ ...c, cs });
const fval = (id, data, f) => (f && f.__docid) || f === '__name__' ? id : getPath(data, f);
function run(q) {
  let rows = Object.keys(col(q.path)).map(id => ({ id, data: col(q.path)[id] }));
  const cs = q.cs || [];
  cs.filter(c => c.k === 'where').forEach(c => {
    rows = rows.filter(r => {
      const v = fval(r.id, r.data, c.f);
      switch (c.op) {
        case '==': return eq(v, c.v);
        case '!=': return !eq(v, c.v);
        case 'in': return c.v.some(x => eq(x, v));
        case 'array-contains': return Array.isArray(v) && v.some(x => eq(x, c.v));
        case '>': return v > c.v; case '>=': return v >= c.v;
        case '<': return v < c.v; case '<=': return v <= c.v;
        default: throw new Error('op ' + c.op);
      }
    });
  });
  const ord = cs.find(c => c.k === 'order');
  if (ord) {
    rows.sort((a, b) => { const x = fval(a.id, a.data, ord.f), y = fval(b.id, b.data, ord.f); return (x > y ? 1 : x < y ? -1 : 0) * (ord.d === 'desc' ? -1 : 1); });
    const st = cs.find(c => c.k === 'start');
    if (st) rows = rows.filter(r => fval(r.id, r.data, ord.f) >= st.v);
  }
  const lim = cs.find(c => c.k === 'limit'); if (lim) rows = rows.slice(0, lim.n);
  return rows;
}
export async function getDocs(q) {
  const docs = run(q).map(r => snapOf(q.path, r.id));
  return { docs, size: docs.length, empty: !docs.length, forEach: f => docs.forEach(f) };
}
export function onSnapshot(q, cb) {
  const fire = () => { const docs = q.type === 'col' || q.cs ? run(q).map(r => snapOf(q.path, r.id)) : []; cb({ docs, size: docs.length, empty: !docs.length, forEach: f => docs.forEach(f), docChanges: () => [] }); };
  setTimeout(fire, 0); return () => {};
}
