'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { VIT_CAMPUSES, VIT_BRANCHES, VIT_YEARS } from '@/lib/constants';

export default function SignupPage() {
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    prn: '',
    branch: '',
    year: '',
    campus: '',
    dob: '',
    phone: '',
    hostelAddress: '',
    nearbyResidence: '',
    sharePhone: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 2-step form
  const { signUp } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const validate = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.displayName.trim()) errs.displayName = 'Name is required';
      if (!form.email.includes('@')) errs.email = 'Valid email required';
      if (form.password.length < 6) errs.password = 'Min 6 characters';
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    if (s === 2) {
      if (!form.prn.match(/^\d{8,12}$/)) errs.prn = 'Enter a valid PRN (8–12 digits)';
      if (!form.branch) errs.branch = 'Select your branch';
      if (!form.year) errs.year = 'Select your year';
      if (!form.campus) errs.campus = 'Select your campus';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleNext = () => {
    if (validate(1)) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate(2)) return;
    setLoading(true);
    try {
      await signUp(form.email, form.password, {
        displayName: form.displayName,
        prn: form.prn,
        branch: form.branch,
        year: form.year,
        campus: form.campus,
        dob: form.dob,
        phone: form.phone,
        hostelAddress: form.hostelAddress,
        nearbyResidence: form.nearbyResidence,
        sharePhone: form.sharePhone,
      });

      await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, name: form.displayName }),
      });

      toast.success('Account created! Check your email for the verification code.');
      router.push('/verify-otp');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Try logging in.');
        setStep(1);
      } else {
        toast.error(err.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ padding: '1rem', minHeight: '100dvh', alignItems: 'flex-start', paddingTop: 'max(5rem, calc(var(--navbar-height) + 2rem))' }}>
      <div className="auth-card animate-fadeInUp" style={{ width: '100%', maxWidth: 500 }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
          {[1, 2].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 9999, background: step >= s ? 'var(--gradient-primary)' : 'var(--bg-tertiary)', transition: 'background 0.3s' }} />
          ))}
        </div>

        <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}>
          {step === 1 ? 'Create Account' : 'Your Details'}
        </h1>
        <p className="auth-subtitle">
          {step === 1 ? 'Join ShareVIT — exclusively for VIT Pune' : 'Academic info (kept private)'}
        </p>

        {step === 1 && (
          <div>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="Enter your full name" value={form.displayName} onChange={handleChange('displayName')} autoComplete="name" />
              {errors.displayName && <p className="form-error">{errors.displayName}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" placeholder="your.email@vit.edu" value={form.email} onChange={handleChange('email')} autoComplete="email" inputMode="email" />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange('password')} autoComplete="new-password" />
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input className="form-input" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} autoComplete="new-password" />
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
            </div>
            <button type="button" className="btn btn-primary btn-full btn-lg" onClick={handleNext}>
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit}>
            {/* PRN */}
            <div className="form-group">
              <label className="form-label">PRN (Permanent Registration Number) *</label>
              <input className="form-input" placeholder="e.g. 12345678" value={form.prn} onChange={handleChange('prn')} inputMode="numeric" />
              {errors.prn && <p className="form-error">{errors.prn}</p>}
            </div>

            {/* Branch */}
            <div className="form-group">
              <label className="form-label">Branch *</label>
              <select className="form-select" value={form.branch} onChange={handleChange('branch')}>
                <option value="">Select your branch</option>
                {VIT_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.branch && <p className="form-error">{errors.branch}</p>}
            </div>

            {/* Year + Campus */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Year *</label>
                <select className="form-select" value={form.year} onChange={handleChange('year')}>
                  <option value="">Select</option>
                  {VIT_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {errors.year && <p className="form-error">{errors.year}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Campus *</label>
                <select className="form-select" value={form.campus} onChange={handleChange('campus')}>
                  <option value="">Select</option>
                  {VIT_CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.campus && <p className="form-error">{errors.campus}</p>}
              </div>
            </div>

            {/* DOB */}
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input className="form-input" type="date" value={form.dob} onChange={handleChange('dob')} max={new Date().toISOString().split('T')[0]} />
              <p className="form-hint">Used only for your profile. Never shown publicly.</p>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" type="tel" placeholder="e.g. 9876543210" value={form.phone} onChange={handleChange('phone')} inputMode="tel" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <input type="checkbox" id="sharePhone" checked={form.sharePhone} onChange={handleChange('sharePhone')} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="sharePhone" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Allow buyers to see my phone number in marketplace listings
                </label>
              </div>
            </div>

            {/* Hostel / Residence */}
            <div className="form-group">
              <label className="form-label">Hostel Address <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>(optional)</span></label>
              <input className="form-input" placeholder="e.g. Block A, Room 204" value={form.hostelAddress} onChange={handleChange('hostelAddress')} />
            </div>
            <div className="form-group">
              <label className="form-label">Nearby Residence <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>(optional — for day scholars)</span></label>
              <input className="form-input" placeholder="e.g. Kondhwa, Undri" value={form.nearbyResidence} onChange={handleChange('nearbyResidence')} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
              <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 2 }} disabled={loading}>
                {loading ? <><span className="spinner" /> Creating Account...</> : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          Already have an account? <Link href="/login">Log In</Link>
        </div>
      </div>
    </div>
  );
}