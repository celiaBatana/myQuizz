import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { earnedBadges } from '../data/badges';

// Mémorise les nouveaux succès dans le profil (le bandeau « Tu as gagné » les annonce ensuite).
export default function BadgeSync() {
  const { user, profile, updateProfile } = useAuth();
  const last = useRef('');
  useEffect(() => {
    if (!user || !profile) return;
    const have = new Set(profile.badges || []);
    const fresh = earnedBadges(profile).filter(id => !have.has(id));
    if (!fresh.length) return;
    const key = user.uid + fresh.join(',');
    if (last.current === key) return;
    last.current = key;
    Promise.resolve(updateProfile({ badges: [...have, ...fresh] })).catch(() => { last.current = ''; });
  }, [user, profile, updateProfile]);
  return null;
}
