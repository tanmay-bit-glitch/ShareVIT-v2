'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import VerifiedBadge from '@/components/auth/VerifiedBadge';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, userData, refreshUserData, signOut } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: userData?.displayName || '',
    phone: userData?.phone || '',
    department: userData?.department || '',
    year: userData?.year || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: form.displayName,
        phone: form.phone,
        department: form.department,
        year: form.year,
      });
      await refreshUserData();
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: 700 }}>
        <div className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-10)' }}>
          {/* Avatar & Name */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-full)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-3xl)', fontWeight: 'var(--fw-bold)', color: '#fff', margin: '0 auto var(--space-4)' }}>
              {userData?.displayName?.[0]?.toUpperCase() || '?'}
            </div>
            <h1 style={{ fontSize: 'var(--fs-2xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
              {userData?.displayName || 'Student'}
              {userData?.verified && <VerifiedBadge size="lg" />}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', marginTop: 'var(--space-4)' }}>
              <span className="badge">PRN: {userData?.prn || 'N/A'}</span>
              <span className="badge badge-info">{userData?.department || 'N/A'}</span>
              <span className="badge badge-success">{userData?.year || 'N/A'}</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: 'var(--fs-2xl)', color: 'var(--accent-primary)' }}>{userData?.reputation || 0}</div>
              <div className="stat-label">Reputation</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: 'var(--fs-2xl)', color: 'var(--accent-success)' }}>{userData?.uploadsCount || 0}</div>
              <div className="stat-label">Uploads</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: 'var(--fs-2xl)', color: 'var(--accent-info)' }}>{userData?.downloadsCount || 0}</div>
              <div className="stat-label">Downloads</div>
            </div>
          </div>

          {/* Edit form */}
          {editing ? (
            <div>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input className="form-input" value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
              <button className="btn btn-danger" onClick={signOut}>🚪 Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}