'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

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
  const { user, userData } = useAuth();
  const toast = useToast();
  
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [xpToasts, setXpToasts] = useState([]);
  const [levelUpData, setLevelUpData] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTourStep, setActiveTourStep] = useState(null);

  const initializedRef = useRef(false);

  const getXpNeededForLevel = (lvl) => {
    return lvl * 100;
  };

  const gainXP = async (amount, reason) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const currentXp = xp;
      const currentLvl = level;
      
      let nextLvl = currentLvl;
      let nextXp = currentXp + amount;
      let nextXpNeeded = getXpNeededForLevel(nextLvl);
      let leveledUp = false;
      
      while (nextXp >= nextXpNeeded && nextLvl < 8) {
        nextXp -= nextXpNeeded;
        nextLvl += 1;
        nextXpNeeded = getXpNeededForLevel(nextLvl);
        leveledUp = true;
      }
      
      // Update states
      setXp(nextXp);
      if (leveledUp) {
        setLevel(nextLvl);
        setLevelUpData({
          level: nextLvl,
          title: LEVEL_TITLES[nextLvl],
          reward: nextLvl === 8 ? 'Campus Legend Badge Unlocked!' : 'Double views boost on listings'
        });
        toast.success(`🎉 Level Up! You are now Level ${nextLvl}: ${LEVEL_TITLES[nextLvl]}`);
      }
      
      // Save to Firestore user doc
      await updateDoc(userRef, {
        xp: nextXp,
        level: nextLvl
      });
      
      // Save to xpHistory collection
      await addDoc(collection(db, 'xpHistory'), {
        userId: user.uid,
        amount,
        reason,
        createdAt: serverTimestamp()
      });
      
      // Trigger toast
      const toastId = Date.now() + Math.random();
      setXpToasts(prev => [...prev, { id: toastId, amount, reason }]);
      
      setTimeout(() => {
        setXpToasts(prev => prev.filter(t => t.id !== toastId));
      }, 3500);
      
    } catch (err) {
      console.error('Error gaining XP:', err);
    }
  };

  const unlockAchievement = async (id) => {
    if (!user) return;
    const currentAchs = unlockedAchievements || [];
    if (currentAchs.includes(id)) return;
    
    const ach = ACHIEVEMENTS_LIST.find(a => a.id === id);
    if (!ach) return;
    
    const newAchs = [...currentAchs, id];
    setUnlockedAchievements(newAchs);
    
    try {
      // Save to Firestore user doc
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        achievements: newAchs
      });
      
      // Save to userBadges collection
      await addDoc(collection(db, 'userBadges'), {
        userId: user.uid,
        badgeId: id,
        title: ach.title,
        badgeEmoji: ach.badge,
        unlockedAt: serverTimestamp(),
        xpEarned: ach.xp
      });
      
      // Gain XP
      await gainXP(ach.xp, `Achievement: ${ach.title}`);
      
      // Display achievement notification popup
      toast.success(`🏆 Achievement Unlocked: ${ach.title} (+${ach.xp} XP)`);
    } catch (err) {
      console.error('Error unlocking achievement:', err);
    }
  };

  const triggerDailyLogin = async (usrId, currentData) => {
    try {
      const todayStr = new Date().toDateString();
      const lastActiveStr = currentData.lastActiveDate;
      
      if (lastActiveStr === todayStr) return; // Already logged in today
      
      const userRef = doc(db, 'users', usrId);
      let newStreak = currentData.streak || 0;
      let newLongest = currentData.longestStreak || 0;
      
      if (lastActiveStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        if (lastActiveStr === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      
      if (newStreak > newLongest) {
        newLongest = newStreak;
      }
      
      // Award 5 XP for login
      let loginXp = 5;
      let reason = 'Daily Login';
      
      if (newStreak % 7 === 0) {
        loginXp += 50; // +50 XP bonus for weekly streak
        reason = `${newStreak} Day Streak Bonus!`;
        toast.success(`🔥 ${newStreak} Day Streak Bonus! +50 XP`);
      }
      
      // Perform state updates and save to firestore
      const currentXp = currentData.xp || 0;
      const currentLvl = currentData.level || 1;
      
      let nextLvl = currentLvl;
      let nextXp = currentXp + loginXp;
      let nextXpNeeded = getXpNeededForLevel(nextLvl);
      let leveledUp = false;
      
      while (nextXp >= nextXpNeeded && nextLvl < 8) {
        nextXp -= nextXpNeeded;
        nextLvl += 1;
        nextXpNeeded = getXpNeededForLevel(nextLvl);
        leveledUp = true;
      }
      
      await updateDoc(userRef, {
        streak: newStreak,
        longestStreak: newLongest,
        lastActiveDate: todayStr,
        xp: nextXp,
        level: nextLvl
      });
      
      setLevel(nextLvl);
      setXp(nextXp);
      setStreak(newStreak);
      
      // Log in xpHistory
      await addDoc(collection(db, 'xpHistory'), {
        userId: usrId,
        amount: loginXp,
        reason,
        createdAt: serverTimestamp()
      });
      
      if (leveledUp) {
        toast.success(`🎉 Level Up! You are now Level ${nextLvl}: ${LEVEL_TITLES[nextLvl]}`);
      }
    } catch (err) {
      console.error('Error triggering daily login:', err);
    }
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

  // Initialize onboarding state
  useEffect(() => {
    const savedOnboarding = localStorage.getItem('sv_onboarding_done');
    if (!savedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // Listen to Firestore userData updates & trigger daily login
  useEffect(() => {
    if (userData && !initializedRef.current) {
      const lvl = userData.level || 1;
      const points = userData.xp || 0;
      const strk = userData.streak || 0;
      const achs = userData.achievements || [];

      setLevel(lvl);
      setXp(points);
      setStreak(strk);
      setUnlockedAchievements(achs);

      initializedRef.current = true;
      
      // Trigger daily login check
      triggerDailyLogin(user.uid, userData);
    }
  }, [userData, user]);

  // Reset initialization ref on sign out
  useEffect(() => {
    if (!user) {
      initializedRef.current = false;
      setLevel(1);
      setXp(0);
      setStreak(0);
      setUnlockedAchievements([]);
    }
  }, [user]);

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
