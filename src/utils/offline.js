// Hors-ligne : avec le cache local de Firestore, une écriture est enregistrée sur l'appareil
// tout de suite mais sa promesse ne se résout qu'au retour du réseau. On n'attend donc
// que brièvement : l'écriture reste en file d'attente et part toute seule ensuite.
export function settle(promise, ms = 2500) {
  return Promise.race([promise, new Promise(resolve => setTimeout(resolve, ms))]);
}
