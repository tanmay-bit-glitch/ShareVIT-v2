'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef([]);
  const { user, refreshUserData } = useAuth();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) newOtp[i] = pasted[i] || '';
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return toast.error('Please enter the full 6-digit code.');
    setLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, otp: code }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshUserData();
        toast.success('Email verified successfully!');
        router.push('/');
      } else {
        toast.error(data.error || 'Invalid OTP. Try again.');
      }
    } catch (err) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      });
      setResendTimer(60);
      toast.success('New OTP sent to your email.');
    } catch {
      toast.error('Failed to resend OTP.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeInUp" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📧</div>
        <h1>Verify Your Email</h1>
        <p className="auth-subtitle">
          We sent a 6-digit code to <strong>{user?.email || 'your email'}</strong>
        </p>
        <form onSubmit={handleVerify}>
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                className="otp-input"
                type="text"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
              />
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" /> Verifying...</> : 'Verify Email'}
          </button>
        </form>
        <div style={{ marginTop: 'var(--space-6)', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
          Didn&apos;t receive the code?{' '}
          {resendTimer > 0 ? (
            <span style={{ color: 'var(--text-tertiary)' }}>Resend in {resendTimer}s</span>
          ) : (
            <button onClick={handleResend} className="btn-ghost" style={{ color: 'var(--text-link)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--fs-sm)' }}>
              Resend Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}