'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const categories = ['All', 'Notes', 'PYQ', 'Syllabus', 'Reference Material'];
const semesters = ['All Semesters', '1', '2', '3', '4', '5', '6', '7', '8'];

export default function NotesPage() {
  return <ProtectedRoute><NotesContent /></ProtectedRoute>;
}

function NotesContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [semester, setSemester] = useState('All Semesters');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = items.filter(item => {
    if (category !== 'All' && item.type !== category) return false;
    if (semester !== 'All Semesters' && item.semester !== semester) return false;
    if (search && !item.title?.toLowerCase().includes(search.toLowerCase()) && !item.subject?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-content">
      <div className="container">
        <div className="page-header animate-fadeInUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div><h1>Notes & PYQ Repository</h1><p>Access and share academic resources with your batch</p></div>
          <Link href="/notes/upload" className="btn btn-primary">+ Upload Notes</Link>
        </div>
        <div className="search-bar animate-fadeInUp"><input placeholder="Search by title or subject..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="filter-bar animate-fadeInUp">
          {categories.map(c => <button key={c} className={`filter-btn ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>)}
        </div>
        <div className="filter-bar animate-fadeInUp">
          {semesters.map(s => <button key={s} className={`filter-btn ${semester === s ? 'active' : ''}`} onClick={() => setSemester(s)}>Sem {s === 'All Semesters' ? 'All' : s}</button>)}
        </div>
        {loading ? <div className="flex-center" style={{ padding: 'var(--space-16)' }}><div className="spinner spinner-lg" /></div>
        : filtered.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📚</div><h3>No notes found</h3><p>Upload notes to help your fellow students!</p><Link href="/notes/upload" className="btn btn-primary">Upload Notes</Link></div>
        : (
          <div className="grid grid-3 stagger-children">
            {filtered.map(item => (
              <Link key={item.id} href={`/notes/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="listing-card">
                  <div className="listing-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'var(--bg-tertiary)' }}>
                    {item.type === 'PYQ' ? '📝' : '📄'}
                  </div>
                  <div className="listing-card-body">
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      <span className="badge">{item.type || 'Notes'}</span>
                      <span className="badge badge-info">Sem {item.semester || '?'}</span>
                    </div>
                    <h3 className="listing-card-title">{item.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>{item.subject}</p>
                    <div className="listing-card-meta">
                      <span>by {item.uploaderName || 'Anonymous'}</span>
                      <span>•</span>
                      <span>⬇ {item.downloads || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}