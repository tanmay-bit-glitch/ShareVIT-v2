'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const categories = ['Books', 'Electronics', 'Gadgets', 'Cycles', 'Hostel Essentials', 'Lab Equipment', 'Stationery', 'Notes', 'Other'];
const urgencyLevels = ['Low', 'Medium', 'High', 'Urgent'];

export default function CreateRequestPage() { return <ProtectedRoute><CreateContent /></ProtectedRoute>; }

function CreateContent() {
  const [form, setForm] = useState({ title: '', description: '', category: '', urgency: 'Medium', budget: '', duration: '' });
  const [loading, setLoading] = useState(false);
  const { user, userData } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return toast.error('Title and description are required.');
    setLoading(true);
    try {
      await addDoc(collection(db, 'requests'), {
        ...form,
        budget: Number(form.budget) || 0,
        requesterId: user.uid,
        requesterName: userData?.displayName || 'Anonymous',
        requesterEmail: user.email,
        status: 'Open',
        responses: 0,
        createdAt: serverTimestamp(),
      });
      toast.success('Request posted!');
      router.push('/requests');
    } catch (err) { console.error(err); toast.error('Failed to post.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-content"><div className="container" style={{ maxWidth: 700 }}>
      <div className="page-header animate-fadeInUp"><h1>Create Request</h1><p>Ask the community for what you need</p></div>
      <form onSubmit={handleSubmit} className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-8)' }}>
        <div className="form-group"><label className="form-label">What do you need? *</label><input className="form-input" placeholder="e.g. Engineering Drawing Drafter Set" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">Description *</label><textarea className="form-textarea" placeholder="Describe what you need, specifications, etc." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}><option value="">Select</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Urgency</label><select className="form-select" value={form.urgency} onChange={e => setForm(p => ({ ...p, urgency: e.target.value }))}>{urgencyLevels.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group"><label className="form-label">Budget (₹) — optional</label><input className="form-input" type="number" placeholder="0" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Duration needed</label><input className="form-input" placeholder="e.g. 2 weeks, 1 semester" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} /></div>
        </div>
        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>{loading ? <><span className="spinner" /> Posting...</> : 'Post Request'}</button>
      </form>
    </div></div>
  );
}