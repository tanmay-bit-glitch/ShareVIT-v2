'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const types = ['All', 'Assignment', 'Lab Manual', 'Project Report', 'Mini Project'];

export default function AssignmentsPage() { return <ProtectedRoute><AssignmentsContent /></ProtectedRoute>; }

function AssignmentsContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    return () => unsub();
  }, []);

  const filtered = items.filter(i => {
    if (type !== 'All' && i.type !== type) return false;
    if (search && !i.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-content"><div className="container">
      <div className="page-header animate-fadeInUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div><h1>Assignments & Lab Manuals</h1><p>Find and share solved assignments and project reports</p></div>
        <Link href="/assignments/upload" className="btn btn-primary">+ Upload</Link>
      </div>
      <div className="search-bar animate-fadeInUp"><input placeholder="Search assignments..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="filter-bar animate-fadeInUp">{types.map(t => <button key={t} className={`filter-btn ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t}</button>)}</div>
      {loading ? <div className="flex-center" style={{ padding: 'var(--space-16)' }}><div className="spinner spinner-lg" /></div>
      : filtered.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📝</div><h3>No assignments found</h3><Link href="/assignments/upload" className="btn btn-primary">Upload Assignment</Link></div>
      : <div className="grid grid-3 stagger-children">{filtered.map(item => (
        <Link key={item.id} href={`/assignments/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="listing-card">
            <div className="listing-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'var(--bg-tertiary)' }}>📋</div>
            <div className="listing-card-body">
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <span className="badge">{item.type || 'Assignment'}</span>
                {item.semester && <span className="badge badge-info">Sem {item.semester}</span>}
              </div>
              <h3 className="listing-card-title">{item.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>{item.subject}</p>
              <div className="listing-card-meta"><span>by {item.uploaderName || 'Anonymous'}</span><span>•</span><span>⬇ {item.downloads || 0}</span></div>
            </div>
          </div>
        </Link>
      ))}</div>}
    </div></div>
  );
}