'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const urgencyColors = { Low: 'badge-info', Medium: 'badge-warning', High: 'badge-danger', Urgent: 'badge-danger' };

export default function RequestsPage() { return <ProtectedRoute><RequestsContent /></ProtectedRoute>; }

function RequestsContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    return () => unsub();
  }, []);

  const filtered = filter === 'All' ? items : items.filter(i => i.status === filter);

  return (
    <div className="page-content"><div className="container">
      <div className="page-header animate-fadeInUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div><h1>Resource Request Board</h1><p>Post requests for resources you need</p></div>
        <Link href="/requests/create" className="btn btn-primary">+ New Request</Link>
      </div>
      <div className="filter-bar animate-fadeInUp">
        {['All', 'Open', 'Fulfilled', 'Closed'].map(f => <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
      </div>
      {loading ? <div className="flex-center" style={{ padding: 'var(--space-16)' }}><div className="spinner spinner-lg" /></div>
      : filtered.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No requests yet</h3><Link href="/requests/create" className="btn btn-primary">Create Request</Link></div>
      : <div className="grid grid-2 stagger-children">{filtered.map(item => (
        <div key={item.id} className="card-glass card-interactive" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <span className={`badge ${item.status === 'Open' ? 'badge-success' : item.status === 'Fulfilled' ? 'badge-info' : ''}`}>{item.status || 'Open'}</span>
              {item.urgency && <span className={`badge ${urgencyColors[item.urgency] || ''}`}>{item.urgency}</span>}
            </div>
            {item.budget && <span className="price-tag" style={{ fontSize: 'var(--fs-base)' }}>₹{item.budget}</span>}
          </div>
          <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-2)' }}>{item.title}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: 'var(--lh-relaxed)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
          <div className="listing-card-meta" style={{ marginTop: 'var(--space-4)' }}>
            <span>👤 {item.requesterName || 'Anonymous'}</span>
            {item.duration && <span>⏱ {item.duration}</span>}
            <span>📧 {item.requesterEmail}</span>
          </div>
        </div>
      ))}</div>}
    </div></div>
  );
}