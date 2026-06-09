'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields.');
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Welcome back!');
      router.push('/');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password.');
      } else {
        toast.error(err.message || 'Login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      toast.success('Welcome!');
      router.push('/');
    } catch (err) {
      toast.error('Google sign-in failed.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeInUp">
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Log in to your ShareVIT account</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="your.email@vit.edu" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div style={{ textAlign: 'right', marginBottom: 'var(--space-4)' }}>
            <Link href="/forgot-password" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-link)' }}>Forgot Password?</Link>
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" /> Logging in...</> : 'Log In'}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <button className="btn btn-secondary btn-full btn-lg" onClick={handleGoogleLogin}>
          🔵 Continue with Google
        </button>
        <div className="auth-footer">
          Don&apos;t have an account? <Link href="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}