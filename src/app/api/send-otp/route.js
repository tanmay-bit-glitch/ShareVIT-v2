import { NextResponse } from 'next/server';
import { sendOTPEmail } from '@/lib/mail';
import bcrypt from 'bcryptjs';

function getAdminDb() {
  const { initializeApp: initClientApp, getApps: getClientApps } = require('firebase/app');
  const { getFirestore: getClientFirestore, doc, setDoc, Timestamp } = require('firebase/firestore');

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  };

  const app = getClientApps().length === 0 ? initClientApp(firebaseConfig) : getClientApps()[0];
  return { db: getClientFirestore(app), doc, setDoc, Timestamp };
}

export async function POST(request) {
  try {
    const { email, name } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { db, doc, setDoc } = getAdminDb();
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    const emailKey = email.toLowerCase().replace(/\./g, '_');
    
    // Store in Firestore (expires in 10 minutes)
    await setDoc(doc(db, 'email_verifications', emailKey), {
      otp: hashedOtp,
      email: email.toLowerCase(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      verified: false,
      createdAt: new Date()
    });

    await sendOTPEmail(email, otp, name || 'Student');

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}