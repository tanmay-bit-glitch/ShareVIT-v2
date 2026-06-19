'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

import { ENGINEERING_BRANCHES, CAMPUSES } from '@/lib/constants';

const years = ['FE (1st Year)', 'SE (2nd Year)', 'TE (3rd Year)', 'BE (4th Year)', 'ME/M.Tech'];

export default function SignupPage() {
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirmPassword: '', prn: '', campus: '', department: '', year: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { signUp } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const validate = () => {
    const errs = {};
    if (!form.displayName.trim()) errs.displayName = 'Name is required';
    if (!form.email.includes('@')) errs.email = 'Valid email is required';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.prn.match(/^\d{8,12}$/)) errs.prn = 'Enter a valid PRN (8-12 digits)';
    if (!form.campus) errs.campus = 'Select your campus';
    if (!form.department) errs.department = 'Select your department';
    if (!form.year) errs.year = 'Select your year';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {

      await signUp(form.email, form.password, {
        displayName: form.displayName,
        prn: form.prn,
        campus: form.campus,
        department: form.department,
        year: form.year,
        phone: form.phone,
      });

      // Send OTP
      await fetch('/api/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email, name: form.displayName }) });

      toast.success('Account created! Check your email for the verification code.');
      router.push('/verify-otp');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Try logging in.');
      } else {
        toast.error(err.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeInUp">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Join ShareVIT — exclusively for VIT Pune students</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Enter your full name" value={form.displayName} onChange={handleChange('displayName')} />
            {errors.displayName && <p className="form-error">{errors.displayName}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="your.email@vit.edu" value={form.email} onChange={handleChange('email')} />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange('password')} />
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} />
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">PRN (Permanent Registration Number)</label>
            <input className="form-input" placeholder="e.g. 12345678" value={form.prn} onChange={handleChange('prn')} />
            {errors.prn && <p className="form-error">{errors.prn}</p>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Campus</label>
              <select className="form-select" value={form.campus} onChange={handleChange('campus')}>
                <option value="">Select Campus</option>
                {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.campus && <p className="form-error">{errors.campus}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-select" value={form.department} onChange={handleChange('department')}>
                <option value="">Select Branch</option>
                {ENGINEERING_BRANCHES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <p className="form-error">{errors.department}</p>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Year</label>
              <select className="form-select" value={form.year} onChange={handleChange('year')}>
                <option value="">Select</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {errors.year && <p className="form-error">{errors.year}</p>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone (optional)</label>
            <input className="form-input" placeholder="e.g. 9876543210" value={form.phone} onChange={handleChange('phone')} />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" /> Creating Account...</> : 'Create Account'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link href="/login">Log In</Link>
        </div>
      </div>
    </div>
  );
}