'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { notifyGroup } from '@/lib/notifications';
import { 
  ClipboardList, Plus, X, AlertCircle, Calendar, MessageSquare, 
  MapPin, HelpCircle, Heart, DollarSign 
} from 'lucide-react';

const CATEGORIES = ['Notes', 'Assignments', 'Books', 'Electronics', 'Study Materials', 'PYQs', 'Marketplace Items', 'Miscellaneous'];
const URGENCY_LEVELS = ['Low', 'Medium', 'High', 'Urgent'];
const URGENCY_BADGES = {
  Low: 'badge-info',
  Medium: 'badge-warning',
  High: 'badge-danger',
  Urgent: 'badge-danger'
};

export default function RequestsPage() {
  return (
    <ProtectedRoute>
      <RequestsContent />
    </ProtectedRoute>
  );
}

function RequestsContent() {
  const { user, userData } = useAuth();
  const toast = useToast();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Books',
    urgency: 'Medium',
    budget: '',
    duration: ''
  });

  // Fetch Requests
  useEffect(() => {
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      return toast.error('Please enter a title and description.');
    }
    setSubmitting(true);
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

      await notifyGroup(
        '📣 New Item Request',
        `${userData?.displayName || 'Someone'} is looking for: ${form.title}. Do you have it?`,
        'Marketplace',
        {},
        { link: '/requests', type: 'request' },
        user.uid
      );

      toast.success('Request posted to the campus board!');
      setForm({ title: '', description: '', category: 'Books', urgency: 'Medium', budget: '', duration: '' });
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to post request.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = filter === 'All' ? items : items.filter(i => i.status === filter);

  return (
    <div className="page-content">
      <div className="container">
        
        {/* Header */}
        <div className="page-header animate-fadeInUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ClipboardList size={32} style={{ color: 'var(--accent-primary)' }} /> Student Requests
            </h1>
            <p>Can&apos;t find an item? Post a request and let your college mates help you find it.</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', gap: '6px' }}>
            <Plus size={18} /> Post a Request
          </button>
        </div>

        {/* Filters Panel */}
        <div className="filter-bar animate-fadeInUp" style={{ marginBottom: 'var(--space-6)' }}>
          {['All', 'Open', 'Fulfilled', 'Closed'].map(f => (
            <button 
              key={f} 
              className={`filter-btn ${filter === f ? 'active' : ''}`} 
              onClick={() => setFilter(f)}
            >
              {f} Requests
            </button>
          ))}
        </div>

        {/* Requests Feed */}
        {loading ? (
          <div className="flex-center" style={{ padding: 'var(--space-16)' }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-glass" style={{ padding: 'var(--space-16)', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📋</div>
            <h3>No requests found</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>Be the first to post a request or check back later!</p>
            <button onClick={() => setModalOpen(true)} className="btn btn-primary">Create Request</button>
          </div>
        ) : (
          <div className="grid grid-2 stagger-children">
            {filtered.map(item => (
              <div key={item.id} className="card-glass card-interactive" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
                <div>
                  
                  {/* Card Header badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <span className={`badge ${item.status === 'Open' ? 'badge-success' : item.status === 'Fulfilled' ? 'badge-info' : 'badge-secondary'}`}>
                        {item.status || 'Open'}
                      </span>
                      {item.urgency && (
                        <span className={`badge ${URGENCY_BADGES[item.urgency] || 'badge-info'}`}>
                          {item.urgency} Urgency
                        </span>
                      )}
                      <span className="badge">{item.category}</span>
                    </div>
                    {item.budget > 0 ? (
                      <span className="price-tag" style={{ fontSize: 'var(--fs-base)' }}>₹{item.budget}</span>
                    ) : (
                      <span className="price-tag price-free" style={{ fontSize: 'var(--fs-xs)' }}>Any budget</span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'bold', marginBottom: 'var(--space-2)', color: '#fff' }}>
                    {item.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: '1.6', marginBottom: 'var(--space-4)', minHeight: '60px' }}>
                    {item.description}
                  </p>
                </div>

                {/* Footer details + Offer CTA */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-4)', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="listing-card-meta" style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    <span>Requested by: <strong>{item.requesterName || 'Anonymous'}</strong></span>
                    {item.duration && <span>Duration: <strong>{item.duration}</strong></span>}
                    <span>Posted: {item.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(item.createdAt.toDate()) : 'Recently'}</span>
                  </div>

                  {item.requesterId !== user?.uid && item.status !== 'Closed' && (
                    <Link href="/chat" className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
                      <MessageSquare size={13} /> Offer Item
                    </Link>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Modal Overlay & Form */}
        {modalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 5, 10, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)'
          }}>
            <div className="card-glass animate-fadeInUp" style={{
              width: '100%',
              maxWidth: '560px',
              position: 'relative',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
              background: 'var(--bg-primary)'
            }}>
              
              {/* Close Button */}
              <button 
                onClick={() => setModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>

              <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={22} style={{ color: 'var(--accent-primary)' }} /> Request an Item
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', marginBottom: 'var(--space-6)' }}>
                Detail what you need so juniors or campus mates can get in touch.
              </p>

              <form onSubmit={handleCreateRequest}>
                
                <div className="form-group">
                  <label className="form-label">What item do you need? *</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="e.g. Drafter set, chemistry apron, mechanics textbook"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Item Specifications / Details *</label>
                  <textarea 
                    className="form-textarea"
                    placeholder="Describe what condition you need, course code (if notes/book), or other details..."
                    rows={4}
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select 
                      className="form-select"
                      value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Urgency</label>
                    <select 
                      className="form-select"
                      value={form.urgency}
                      onChange={e => setForm(p => ({ ...p, urgency: e.target.value }))}
                    >
                      {URGENCY_LEVELS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Budget (₹) — optional</label>
                    <input 
                      type="number"
                      className="form-input"
                      placeholder="e.g. 300"
                      value={form.budget}
                      onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration Needed</label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. 2 weeks, full semester"
                      value={form.duration}
                      onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--space-6)' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flex: 2 }}
                    disabled={submitting}
                  >
                    {submitting ? 'Posting...' : 'Post Request'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
