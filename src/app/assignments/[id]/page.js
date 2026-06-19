'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function AssignmentDetailPage() { return <ProtectedRoute><Detail /></ProtectedRoute>; }

function Detail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const f = async () => { const snap = await getDoc(doc(db, 'assignments', id)); if (snap.exists()) setItem({ id: snap.id, ...snap.data() }); setLoading(false); };
    if (id) f();
  }, [id]);

  const handleDownload = async () => {
    if (item?.assignmentUrl) {
      await updateDoc(doc(db, 'assignments', id), { downloads: increment(1) });
      if (user) await updateDoc(doc(db, 'users', user.uid), { downloadsCount: increment(1) });
      window.open(item.assignmentUrl, '_blank');
    }
  };

  if (loading) return <div className="page-content"><div className="flex-center" style={{ minHeight: '50vh' }}><div className="spinner spinner-lg" /></div></div>;
  if (!item) return <div className="page-content"><div className="container"><div className="empty-state"><h3>Not found</h3><Link href="/assignments" className="btn btn-primary">Back</Link></div></div></div>;

  return (
    <div className="page-content"><div className="container detail-page animate-fadeInUp">
      <Link href="/assignments" className="btn btn-ghost" style={{ marginBottom: 'var(--space-4)' }}>← Back</Link>
      <div className="card-glass" style={{ padding: 'var(--space-8)' }}>
        <div className="detail-header">
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <span className="badge">{item.type}</span>
            {item.semester && <span className="badge badge-info">Sem {item.semester}</span>}
            {item.department && <span className="badge badge-success">{item.department}</span>}
          </div>
          <h1>{item.title}</h1>
          {item.subject && <p style={{ fontSize: 'var(--fs-lg)', color: 'var(--accent-primary)' }}>{item.subject}</p>}
          <div className="detail-meta"><span>👤 {item.uploadedBy || 'Anonymous'}</span><span>⬇ {item.downloads || 0}</span><span>📅 {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span></div>
        </div>
        {item.description && <div className="detail-body"><h3 style={{ marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>Description</h3><p>{item.description}</p></div>}
        <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-6)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div><p style={{ fontWeight: 'var(--fw-semibold)', margin: 0 }}>📎 {item.fileName}</p></div>
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <a 
              href={item.assignmentUrl} 
              target="_blank" 
              rel="noreferrer"
              onClick={handleDownload}
              className="btn btn-secondary btn-lg"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
            >
              View Document
            </a>
            <a 
              href={item.assignmentUrl} 
              download
              onClick={handleDownload}
              className="btn btn-primary btn-lg"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', background: 'var(--gradient-primary)', color: 'white' }}
            >
              Download Document
            </a>
          </div>
        </div>
      </div>
    </div></div>
  );
}