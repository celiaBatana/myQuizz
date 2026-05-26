# Quizly 🧠

Application de quiz thématiques avec système XP, niveaux et authentification.

## Stack technique

- **React** — frontend
- **Firebase Auth** — authentification (email + Google)
- **Firestore** — base de données temps réel
- **Stripe** — abonnements premium (à brancher)
- **Vercel** — hébergement gratuit

---

## Installation locale

```bash
git clone https://github.com/ton-compte/quizly.git
cd quizly
npm install
cp .env.example .env
# Remplis ton .env avec tes clés Firebase
npm start
```

---

## Configuration Firebase

### 1. Créer le projet

1. Va sur [console.firebase.google.com](https://console.firebase.google.com)
2. Crée un nouveau projet : **quizly**
3. Active **Authentication** → Email/Password + Google
4. Active **Firestore Database** → mode production

### 2. Récupérer les clés

Dans Firebase Console → Paramètres du projet → Tes applications → Web app :

```
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=quizly.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=quizly
REACT_APP_FIREBASE_STORAGE_BUCKET=quizly.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

### 3. Configurer les règles Firestore

Dans Firebase Console → Firestore → Règles :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /questions/{id} {
      allow read: if true;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

### 4. Rendre un compte admin

Dans Firestore → users → {uid} → modifier le champ :
```
isAdmin: true
```

---

## Déploiement sur Vercel

### Méthode 1 — Interface Vercel (recommandé)

1. Push ton code sur GitHub
2. Va sur [vercel.com](https://vercel.com) → New Project
3. Importe ton repo GitHub
4. Dans **Environment Variables**, ajoute toutes les variables du `.env`
5. Clique **Deploy** → ton URL `quizly.vercel.app` est prête !

### Méthode 2 — CLI

```bash
npm install -g vercel
vercel login
vercel
# Suis les instructions, configure les env vars quand demandé
vercel --prod
```

---

## Structure du projet

```
src/
├── components/
│   ├── Layout.js          # Navbar + bottom nav + blobs
│   ├── AuthModal.js       # Modal connexion/inscription
│   └── Toast.js           # Notifications XP
├── context/
│   └── AuthContext.js     # Auth Firebase + profil Firestore
├── data/
│   └── quizData.js        # Toutes les questions (catégorie → thème → quiz)
├── hooks/
│   └── useQuiz.js         # Logique moteur de quiz + XP
├── pages/
│   ├── Home.js            # Accueil + catégories
│   ├── Themes.js          # Liste des thèmes d'une catégorie
│   ├── Quizzes.js         # Liste des quiz d'un thème
│   ├── QuizPlay.js        # Moteur de quiz + résultats
│   ├── Profile.js         # Profil utilisateur + historique
│   └── Admin.js           # Interface admin (ajout + CSV + Firebase)
├── styles/
│   └── globals.css        # CSS global (thème dark coloré)
├── App.js                 # Routes React Router
├── firebase.js            # Config Firebase
└── index.js               # Point d'entrée
```

---

## Structure des données Firestore

### Collection `users`

```json
{
  "uid": "...",
  "displayName": "Joueur",
  "email": "joueur@email.com",
  "totalXP": 150,
  "level": 2,
  "xpInLevel": 150,
  "quizzesPlayed": 5,
  "correctAnswers": 20,
  "totalAnswers": 25,
  "isPremium": false,
  "isAdmin": false,
  "quizzesToday": 2,
  "lastPlayDate": "Thu May 26 2026",
  "history": [
    {
      "quizId": "cin-cl-1",
      "quizName": "Quiz #1 — Les incontournables",
      "category": "cinema",
      "theme": "classiques",
      "diff": "medium",
      "score": 4,
      "total": 5,
      "xp": 45,
      "date": "2026-05-26T..."
    }
  ]
}
```

### Collection `questions` (ajoutées via Admin)

```json
{
  "category": "cinema",
  "theme": "classiques",
  "diff": "medium",
  "text": "Qui a réalisé Inception ?",
  "options": ["Spielberg", "Nolan", "Cameron", "Scott"],
  "answer": 1,
  "explanation": "Christopher Nolan réalise Inception en 2010.",
  "createdAt": "...",
  "createdBy": "uid"
}
```

---

## Système XP

| Difficulté | XP de base | Bonus timer max |
|---|---|---|
| Facile | +5 XP | +10 XP |
| Moyen | +10 XP | +20 XP |
| Expert | +20 XP | +30 XP |

- **200 XP** pour passer au niveau suivant
- Paliers : Novice (1-2) → Apprenti (3-5) → Expert (6-9) → Maître (10+)
- Le timer est **désactivé par défaut**, activable par question

---

## Prochaines étapes (Phase 4)

### Intégrer Stripe

1. Créer un compte Stripe → récupérer `pk_live_...`
2. Créer un Product + Price dans Stripe Dashboard (~4€/mois)
3. Ajouter `REACT_APP_STRIPE_PUBLISHABLE_KEY` dans Vercel
4. Créer un Webhook Firebase Function pour écouter `checkout.session.completed`
5. À la complétion : mettre `isPremium: true` dans Firestore

### Limite freemium

La limite est déjà codée dans `useQuiz.js` :
```js
const FREE_DAILY_LIMIT = 3; // quiz/jour en version gratuite
```

Il suffit de décommenter la vérification et d'afficher une modale Stripe.

---

## Domaine personnalisé (optionnel)

1. Achète `quizly.fr` sur OVH (~10€/an)
2. Dans Vercel → ton projet → Settings → Domains
3. Ajoute ton domaine et suis les instructions DNS
