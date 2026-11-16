import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const POWERUPS = [
  { id: 'fifty',  icon: '✂️', name: '50/50',            desc: 'Retire 2 mauvaises réponses (Rush, boss)', price: 25 },
  { id: 'skip',   icon: '⏭️', name: 'Passer',           desc: 'Change de question sans pénalité (Rush, boss)', price: 20 },
  { id: 'time',   icon: '⏱️', name: '+10 secondes',     desc: 'Ajoute 10 s au chrono du Rush', price: 20 },
  { id: 'shield', icon: '🛡️', name: 'Bouclier de cœur', desc: "Annule ta prochaine erreur face à un boss", price: 40 },
];
export const stockOf = (profile, id) => profile?.powerups?.[id] || 0;

// Inventaire local (mis à jour tout de suite) + enregistrement dans le profil
export function usePowerups() {
  const { user, profile, updateProfile } = useAuth();
  const [local, setLocal] = useState(null);
  const ref = useRef({});
  ref.current = local || profile?.powerups || {};
  return {
    count: id => (user ? ref.current[id] || 0 : 0),
    use(id) {
      const cur = ref.current[id] || 0;
      if (!user || cur <= 0) return false;
      const next = { ...ref.current, [id]: cur - 1 };
      ref.current = next; setLocal(next);
      Promise.resolve(updateProfile({ powerups: next })).catch(() => {});
      return true;
    },
  };
}
