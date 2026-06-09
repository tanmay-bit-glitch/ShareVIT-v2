import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

function getAdminDb() {
  const { initializeApp: initClientApp, getApps: getClientApps } = require('firebase/app');
  const { getFirestore: getClientFirestore, doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } = require('firebase/firestore');

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  };

  const app = getClientApps().length === 0 ? initClientApp(firebaseConfig) : getClientApps()[0];
  return { db: getClientFirestore(app), doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs };
}

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Missing email or OTP' }, { status: 400 });
    }

    const { db, doc, getDoc, updateDoc, collection, query, where, getDocs } = getAdminDb();
    const emailKey = email.toLowerCase().replace(/\./g, '_');
    
    const otpDocRef = doc(db, 'email_verifications', emailKey);
    const otpDoc = await getDoc(otpDocRef);

    if (!otpDoc.exists()) {
      return NextResponse.json({ error: 'No verification found for this email' }, { status: 404 });
    }

    const data = otpDoc.data();
    
    if (data.verified) {
      // Self-healing: if they are already verified in the OTP store but stuck on the frontend,
      // update their user doc again and return success to unblock them.
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          await updateDoc(userDoc.ref, {
            verified: true,
            otpVerified: true,
          });
        }
      } catch (adminErr) {
        console.warn('Failed to heal user doc:', adminErr.message);
      }
      return NextResponse.json({ message: 'Email is already verified' });
    }

    // Check expiration
    const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt);
    if (Date.now() > expiresAt.getTime()) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, data.otp);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // Mark as verified in the OTP store
    await updateDoc(otpDocRef, {
      verified: true,
      verifiedAt: new Date()
    });

    // Update the user's document as well
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(userDoc.ref, {
          verified: true,
          otpVerified: true,
          verifiedAt: new Date()
        });
      }
    } catch (adminErr) {
      console.warn('Failed to update user doc:', adminErr.message);
    }

    return NextResponse.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}