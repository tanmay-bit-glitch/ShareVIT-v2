'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';

const GamificationContext = createContext();

const LEVEL_TITLES = {
  1: 'New Student',
  2: 'Marketplace Explorer',
  3: 'Active Trader',
  4: 'Trusted Seller',
  5: 'Community Merchant',
  6: 'Campus Trader',
  7: 'Marketplace Expert',
  8: 'Campus Legend',
};

const ACHIEVEMENTS_LIST = [
  { id: 'first_login', title: 'First Login', desc: 'Welcome to ShareVIT!', xp: 25, badge: '👋' },
  { id: 'first_listing', title: 'First Listing', desc: 'Upload your first item', xp: 50, badge: '📦' },
  { id: 'first_sale', title: 'First Sale', desc: 'Completed your first transaction', xp: 100, badge: '💰' },
  { id: 'first_purchase', title: 'First Purchase', desc: 'Bought your first resource', xp: 50, badge: '🛍️' },
  { id: 'first_rental', title: 'First Rental', desc: 'Rented out an item', xp: 80, badge: '📅' },
  { id: 'verified_student', title: 'Verified Student', desc: 'Verify your profile', xp: 50, badge: '🛡️' },
  { id: 'sales_5', title: '5 Successful Sales', desc: 'Vanguard of exchange', xp: 200, badge: '🏆' },
  { id: 'fast_responder', title: 'Fast Responder', desc: 'Replies in minutes', xp: 50, badge: '⚡' },
];

export function GamificationProvider({ children }) {
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(1);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [xpToasts, setXpToasts] = useState([]);
  const [levelUpData, setLevelUpData] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTourStep, setActiveTourStep] = useState(null);

  // Sync ref to hold latest values immediately and avoid stale closures
  const stateRef = useRef({ level: 1, xp: 0, streak: 1, unlockedAchievements: [] });

  // Persistence helpers
  const saveState = (l, x, s, ach) => {
    localStorage.setItem('sv_level', l.toString());
    localStorage.setItem('sv_xp', x.toString());
    localStorage.setItem('sv_streak', s.toString());
    localStorage.setItem('sv_achievements', JSON.stringify(ach));
  };

  const getXpNeededForLevel = (lvl) => {
    return lvl * 100;
  };

  const gainXP = (amount, reason) => {
    const { level: curLvl, xp: curXp, streak: curStrk, unlockedAchievements: curAchs } = stateRef.current;

    let newLevel = curLvl;
    let newXp = curXp + amount;
    let nextXpNeeded = getXpNeededForLevel(newLevel);
    let leveledUp = false;

    while (newXp >= nextXpNeeded && newLevel < 8) {
      newXp -= nextXpNeeded;
      newLevel += 1;
      nextXpNeeded = getXpNeededForLevel(newLevel);
      leveledUp = true;
    }

    // Sync reference
    stateRef.current = {
      level: newLevel,
      xp: newXp,
      streak: curStrk,
      unlockedAchievements: curAchs
    };

    // Update states
    setXp(newXp);
    if (leveledUp) {
      setLevel(newLevel);
      setLevelUpData({
        level: newLevel,
        title: LEVEL_TITLES[newLevel],
        reward: newLevel === 8 ? 'Campus Legend Badge Unlocked!' : 'Double views boost on listings'
      });
    }

    // Add to XP Toast queue
    const toastId = Date.now() + Math.random();
    setXpToasts(prev => [...prev, { id: toastId, amount, reason }]);

    // Auto dismiss XP Toast
    setTimeout(() => {
      setXpToasts(prev => prev.filter(t => t.id !== toastId));
    }, 3500);

    saveState(newLevel, newXp, curStrk, curAchs);
  };

  const unlockAchievement = (id) => {
    const { level: curLvl, xp: curXp, streak: curStrk, unlockedAchievements: curAchs } = stateRef.current;
    if (curAchs.includes(id)) return;
    
    const ach = ACHIEVEMENTS_LIST.find(a => a.id === id);
    if (!ach) return;

    const nextAch = [...curAchs, id];
    stateRef.current.unlockedAchievements = nextAch;
    setUnlockedAchievements(nextAch);

    gainXP(ach.xp, `Achievement: ${ach.title}`);
  };

  const completeOnboarding = (startTour) => {
    setShowOnboarding(false);
    localStorage.setItem('sv_onboarding_done', 'true');
    gainXP(25, 'Profile Onboarding Complete');
    if (startTour) {
      setActiveTourStep(0);
    }
  };

  const nextTourStep = () => {
    setActiveTourStep(prev => {
      if (prev === null || prev >= 5) {
        return null;
      }
      return prev + 1;
    });
  };

  const skipTour = () => {
    setActiveTourStep(null);
  };

  const triggerDailyLoginInternal = (initLevel, initXp, initStreak, initAchievements) => {
    const lastLogin = localStorage.getItem('sv_last_login');
    const today = new Date().toDateString();
    
    if (lastLogin !== today) {
      localStorage.setItem('sv_last_login', today);
      
      // Calculate streak
      let newStreak = initStreak;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastLogin === yesterday.toDateString()) {
        newStreak = initStreak + 1;
      } else {
        newStreak = 1;
      }
      
      stateRef.current.streak = newStreak;
      setStreak(newStreak);
      localStorage.setItem('sv_streak', newStreak.toString());

      // Gain daily login XP
      gainXP(5, 'Daily Login Reward');
      
      if (newStreak % 7 === 0) {
        gainXP(50, `${newStreak} Day Streak Bonus!`);
      }
    }
  };

  // Initialize from LocalStorage inside useEffect once component is mounted
  useEffect(() => {
    const savedLevel = localStorage.getItem('sv_level');
    const savedXp = localStorage.getItem('sv_xp');
    const savedStreak = localStorage.getItem('sv_streak');
    const savedAchievements = localStorage.getItem('sv_achievements');
    const savedOnboarding = localStorage.getItem('sv_onboarding_done');

    let lvl = savedLevel ? parseInt(savedLevel) : 1;
    let points = savedXp ? parseInt(savedXp) : 0;
    let strk = savedStreak ? parseInt(savedStreak) : 1;
    let achs = savedAchievements ? JSON.parse(savedAchievements) : [];

    stateRef.current = { level: lvl, xp: points, streak: strk, unlockedAchievements: achs };

    setLevel(lvl);
    setXp(points);
    setStreak(strk);
    setUnlockedAchievements(achs);
    
    if (!savedOnboarding) {
      setShowOnboarding(true);
    }

    triggerDailyLoginInternal(lvl, points, strk, achs);
  }, []);

  return (
    <GamificationContext.Provider value={{
      level,
      levelTitle: LEVEL_TITLES[level],
      xp,
      xpNeeded: getXpNeededForLevel(level),
      streak,
      unlockedAchievements,
      achievementsList: ACHIEVEMENTS_LIST,
      xpToasts,
      levelUpData,
      setLevelUpData,
      showOnboarding,
      completeOnboarding,
      activeTourStep,
      nextTourStep,
      skipTour,
      gainXP,
      unlockAchievement,
    }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) throw new Error('useGamification must be used within GamificationProvider');
  return context;
}
