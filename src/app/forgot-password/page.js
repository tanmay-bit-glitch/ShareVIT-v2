'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email.');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        toast.error('No account found with this email.');
      } else {
        toast.error('Failed to send reset email. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card animate-fadeInUp" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📨</div>
          <h1>Check Your Email</h1>
          <p className="auth-subtitle">
            We&apos;ve sent a password reset link to <strong>{email}</strong>. Follow the link to reset your password.
          </p>
          <Link href="/login" className="btn btn-primary btn-full btn-lg">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeInUp">
        <h1>Reset Password</h1>
        <p className="auth-subtitle">Enter your email to receive a password reset link.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="your.email@vit.edu" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" /> Sending...</> : 'Send Reset Link'}
          </button>
        </form>
        <div className="auth-footer">
          Remember your password? <Link href="/login">Log In</Link>
        </div>
      </div>
    </div>
  );
}