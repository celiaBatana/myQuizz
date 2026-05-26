/**
 * QUIZLY — Script d'initialisation Firebase
 * ==========================================
 * Lance une seule fois : node scripts/init-firebase.js
 *
 * Prérequis :
 *   1. Télécharger serviceAccountKey.json depuis Firebase Console
 *      → Paramètres du projet → Comptes de service → Générer une clé privée
 *      → Placer le fichier à la racine du projet (jamais commiter !)
 *   2. npm install firebase-admin
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// ── Chargement de la clé de service ──────────────────────────────────────────
const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
  console.error('\n❌ Fichier serviceAccountKey.json introuvable.');
  console.error('   → Va sur Firebase Console → Paramètres → Comptes de service');
  console.error('   → Clique sur "Générer une nouvelle clé privée"');
  console.error('   → Place le fichier téléchargé à la racine du projet sous le nom serviceAccountKey.json\n');
  process.exit(1);
}

const serviceAccount = require(keyPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

console.log('\n🚀 Initialisation de la base Firebase Quizly...\n');

// ── Données d'initialisation ──────────────────────────────────────────────────

const SAMPLE_QUESTIONS = [
  {
    category: 'culture',
    theme: 'classique',
    diff: 'easy',
    text: "Quelle est la capitale de l'Australie ?",
    options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    answer: 2,
    explanation: "Canberra est la capitale fédérale depuis 1913, choisie comme compromis entre Sydney et Melbourne.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'init-script',
    active: true,
  },
  {
    category: 'cinema',
    theme: 'classiques',
    diff: 'medium',
    text: "Qui a réalisé 'Inception' (2010) ?",
    options: ['Spielberg', 'Christopher Nolan', 'Cameron', 'Scott'],
    answer: 1,
    explanation: "Inception est réalisé par Christopher Nolan, sorti en 2010.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'init-script',
    active: true,
  },
  {
    category: 'sciences',
    theme: 'physique',
    diff: 'medium',
    text: "Quelle est la vitesse de la lumière dans le vide ?",
    options: ['200 000 km/s', '300 000 km/s', '400 000 km/s', '150 000 km/s'],
    answer: 1,
    explanation: "La vitesse de la lumière est d'environ 299 792 km/s.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'init-script',
    active: true,
  },
  {
    category: 'sport',
    theme: 'football',
    diff: 'easy',
    text: "Combien de joueurs dans une équipe de football sur le terrain ?",
    options: ['9', '10', '11', '12'],
    answer: 2,
    explanation: "11 joueurs par équipe, soit 22 joueurs au total sur le terrain.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'init-script',
    active: true,
  },
  {
    category: 'langues',
    theme: 'vocabulaire',
    diff: 'easy',
    text: "Comment dit-on 'merci' en japonais ?",
    options: ['Arigatou', 'Konnichiwa', 'Sayonara', 'Ohayo'],
    answer: 0,
    explanation: "Arigatou (ありがとう) signifie merci en japonais.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'init-script',
    active: true,
  },
];

const SAMPLE_USER = {
  uid: 'sample-admin-user',
  displayName: 'Admin Quizly',
  email: 'admin@quizly.app',
  totalXP: 0,
  level: 1,
  xpInLevel: 0,
  quizzesPlayed: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  isPremium: false,
  isAdmin: true,
  quizzesToday: 0,
  lastPlayDate: null,
  history: [],
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  note: 'Document exemple — remplace uid par ton vrai UID Firebase Auth',
};

const SAMPLE_SUBSCRIPTION = {
  uid: 'sample-admin-user',
  status: 'inactive',
  plan: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  currentPeriodEnd: null,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  note: 'Document exemple Stripe — sera géré automatiquement par les webhooks',
};

// ── Création des collections ──────────────────────────────────────────────────

async function initCollections() {
  const batch = db.batch();

  // 1. Collection "users"
  console.log('📁 Création de la collection "users"...');
  const userRef = db.collection('users').doc('sample-admin-user');
  batch.set(userRef, SAMPLE_USER);

  // 2. Collection "questions"
  console.log('📁 Création de la collection "questions"...');
  for (const q of SAMPLE_QUESTIONS) {
    const qRef = db.collection('questions').doc();
    batch.set(qRef, q);
  }

  // 3. Collection "subscriptions"
  console.log('📁 Création de la collection "subscriptions"...');
  const subRef = db.collection('subscriptions').doc('sample-admin-user');
  batch.set(subRef, SAMPLE_SUBSCRIPTION);

  // 4. Collection "config" (paramètres globaux de l'app)
  console.log('📁 Création de la collection "config"...');
  const configRef = db.collection('config').doc('app');
  batch.set(configRef, {
    appName: 'Quizly',
    version: '1.0.0',
    freeDailyLimit: 3,
    xpPerLevel: 200,
    maintenanceMode: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();
  console.log('\n✅ Collections créées avec succès !\n');
}

// ── Création des index recommandés (info seulement) ──────────────────────────

function printIndexInfo() {
  console.log('📌 Index Firestore recommandés (à créer dans la console Firebase) :');
  console.log('   Collection "questions" :');
  console.log('   → category (ASC) + diff (ASC)');
  console.log('   → category (ASC) + theme (ASC) + diff (ASC)');
  console.log('   Collection "users" :');
  console.log('   → totalXP (DESC) — pour un futur classement\n');
}

// ── Vérification des collections créées ──────────────────────────────────────

async function verifyCollections() {
  console.log('🔍 Vérification...');
  const collections = ['users', 'questions', 'subscriptions', 'config'];
  for (const col of collections) {
    const snap = await db.collection(col).limit(1).get();
    const status = snap.empty ? '❌ vide' : '✅ OK';
    console.log(`   ${status} — ${col} (${snap.size} document(s))`);
  }
}

// ── Résumé final ──────────────────────────────────────────────────────────────

function printSummary() {
  console.log('\n══════════════════════════════════════════');
  console.log('  🎉 Base Firebase Quizly initialisée !');
  console.log('══════════════════════════════════════════\n');
  console.log('Prochaines étapes :');
  console.log('  1. Lance l\'app : npm start');
  console.log('  2. Inscris-toi avec ton vrai email');
  console.log('  3. Dans Firestore → users → ton UID');
  console.log('     → passe isAdmin à true');
  console.log('  4. Push sur GitHub + déploie sur Vercel');
  console.log('\n⚠️  Pense à ajouter serviceAccountKey.json dans .gitignore !');
  console.log('    (c\'est déjà fait si tu utilises le .gitignore fourni)\n');
}

// ── Exécution ────────────────────────────────────────────────────────────────

async function main() {
  try {
    await initCollections();
    await verifyCollections();
    printIndexInfo();
    printSummary();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erreur lors de l\'initialisation :', err.message);
    console.error(err);
    process.exit(1);
  }
}

main();
