// Éclats 💎 : 1 éclat pour 10 XP gagnés, moins ce qui a été dépensé en boutique
export const gemsBalance = profile => Math.max(0, Math.floor((profile?.totalXP || 0) / 10) - (profile?.gemsSpent || 0) + (profile?.gemsBonus || 0));
export const gemsEarned = xp => Math.floor((xp || 0) / 10);
