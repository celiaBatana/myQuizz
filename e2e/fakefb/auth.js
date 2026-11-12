const KEY = 'fakeauth';
const listeners = new Set();
const auth = { currentUser: null };
function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
function users() { try { return JSON.parse(localStorage.getItem('fakeusers') || '{}'); } catch (e) { return {}; } }
function setCur(u) { auth.currentUser = u; try { localStorage.setItem(KEY, JSON.stringify(u)); } catch (e) {} setTimeout(() => listeners.forEach(f => f(u)), 0); }
export function getAuth() { return auth; }
export class GoogleAuthProvider {}
export function onAuthStateChanged(a, cb) {
  listeners.add(cb);
  const u = load(); auth.currentUser = u;
  setTimeout(() => cb(u), 30);
  return () => listeners.delete(cb);
}
export async function createUserWithEmailAndPassword(a, email, pw) {
  const us = users();
  if (us[email]) { const e = new Error('exists'); e.code = 'auth/email-already-in-use'; throw e; }
  const u = { uid: 'u_' + Math.random().toString(36).slice(2, 10), email, displayName: null };
  us[email] = { u, pw }; localStorage.setItem('fakeusers', JSON.stringify(us));
  auth.currentUser = u; localStorage.setItem(KEY, JSON.stringify(u));
  setTimeout(() => listeners.forEach(f => f(u)), 0);
  return { user: u };
}
export async function signInWithEmailAndPassword(a, email, pw) {
  const r = users()[email];
  if (!r || r.pw !== pw) { const e = new Error('bad'); e.code = 'auth/invalid-credential'; throw e; }
  setCur(r.u); return { user: r.u };
}
export async function signInWithPopup() {
  const u = { uid: 'u_google', email: 'g@x.fr', displayName: 'Goog' }; setCur(u); return { user: u };
}
export async function signOut() { setCur(null); }
export async function updateProfile(u, p) { Object.assign(u, p); localStorage.setItem(KEY, JSON.stringify(auth.currentUser)); }
