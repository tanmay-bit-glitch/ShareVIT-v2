'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailPage() {
  const { user, refreshUserData } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      });
      toast.success('Verification email sent! Check your inbox.');
    } catch {
      toast.error('Failed to send verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeInUp" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>✉️</div>
        <h1>Check Your Email</h1>
        <p className="auth-subtitle">
          We&apos;ve sent a verification link to <strong>{user?.email || 'your email'}</strong>.
          Please check your inbox and verify your email to continue.
        </p>
        <button className="btn btn-primary btn-full btn-lg" onClick={handleResendVerification} disabled={loading}>
          {loading ? <><span className="spinner" /> Sending...</> : 'Resend Verification Email'}
        </button>
        <div className="auth-footer">
          <Link href="/verify-otp">Enter OTP manually →</Link>
        </div>
      </div>
    </div>
  );
}