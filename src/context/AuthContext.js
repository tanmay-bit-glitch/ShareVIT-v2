'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email, password, additionalData) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userDocData = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: additionalData.displayName || '',
      prn: additionalData.prn || '',
      year: additionalData.year || '',
      department: additionalData.department || '',
      phone: additionalData.phone || '',
      verified: false,
      otpVerified: false,
      role: 'student',
      reputation: 0,
      uploadsCount: 0,
      downloadsCount: 0,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), userDocData);
    setUserData(userDocData);
    return cred;
  };

  const signIn = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (!userDoc.exists()) {
      const userDocData = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || '',
        prn: '',
        year: '',
        department: '',
        phone: '',
        verified: false,
        otpVerified: true,
        role: 'student',
        reputation: 0,
        uploadsCount: 0,
        downloadsCount: 0,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), userDocData);
      setUserData(userDocData);
    } else {
      setUserData(userDoc.data());
    }
    return cred;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserData(null);
  };

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const refreshUserData = async () => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    }
  };

  const isAuthenticated = !!user;
  const isActive = userData?.otpVerified === true;
  const isVerified = userData?.verified === true;

  const value = {
    user,
    userData,
    loading,
    isAuthenticated,
    isActive,
    isVerified,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}