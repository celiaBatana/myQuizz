import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Écoute les changements d'état d'auth Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Charge ou crée le profil Firestore
  async function loadProfile(uid) {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setProfile(snap.data());
    }
  }

  // Crée un profil initial dans Firestore
  async function createProfile(uid, displayName, email) {
    const profileData = {
      uid,
      displayName,
      email,
      totalXP: 0,
      level: 1,
      xpInLevel: 0,
      quizzesPlayed: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      isPremium: false,
      isAdmin: false,
      quizzesToday: 0,
      lastPlayDate: null,
      history: [],
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', uid), profileData);
    setProfile(profileData);
    return profileData;
  }

  // Inscription email/password
  async function register(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await createProfile(cred.user.uid, displayName, email);
    return cred.user;
  }

  // Connexion email/password
  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await loadProfile(cred.user.uid);
    return cred.user;
  }

  // Connexion Google
  async function loginWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider);
    const ref = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await createProfile(cred.user.uid, cred.user.displayName, cred.user.email);
    } else {
      setProfile(snap.data());
    }
    return cred.user;
  }

  // Déconnexion
  async function logout() {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  }

  // Mise à jour du profil (XP, stats, historique)
  async function updateProfile_(updates) {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    setProfile((prev) => ({ ...prev, ...updates }));
  }

  const value = {
    user,
    profile,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    updateProfile: updateProfile_,
    isAdmin: profile?.isAdmin || false,
    isPremium: profile?.isPremium || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
