'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function NoteDetailPage() {
  return <ProtectedRoute><NoteDetail /></ProtectedRoute>;
}

function NoteDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, 'notes', id));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    if (id) fetch();
  }, [id]);

  const handleDownload = async () => {
    if (item?.pdfUrl) {
      await updateDoc(doc(db, 'notes', id), { downloads: increment(1) });
      if (user) await updateDoc(doc(db, 'users', user.uid), { downloadsCount: increment(1) });
      window.open(item.pdfUrl, '_blank');
    }
  };

  if (loading) return <div className="page-content"><div className="flex-center" style={{ minHeight: '50vh' }}><div className="spinner spinner-lg" /></div></div>;
  if (!item) return <div className="page-content"><div className="container"><div className="empty-state"><h3>Note not found</h3><Link href="/notes" className="btn btn-primary">Back to Notes</Link></div></div></div>;

  return (
    <div className="page-content"><div className="container detail-page animate-fadeInUp">
      <Link href="/notes" className="btn btn-ghost" style={{ marginBottom: 'var(--space-4)' }}>← Back to Notes</Link>
      <div className="card-glass" style={{ padding: 'var(--space-8)' }}>
        <div className="detail-header">
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <span className="badge">{item.type || 'Notes'}</span>
            <span className="badge badge-info">Sem {item.semester || '?'}</span>
            {item.branch && <span className="badge badge-success">{item.branch}</span>}
          </div>
          <h1>{item.title}</h1>
          <p style={{ fontSize: 'var(--fs-lg)', color: 'var(--accent-primary)', fontWeight: 'var(--fw-semibold)' }}>{item.subject}</p>
          <div className="detail-meta">
            <span>👤 {item.uploadedBy || 'Anonymous'}</span>
            <span>⬇ {item.downloads || 0} downloads</span>
            <span>📅 {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
          </div>
        </div>
        {item.description && <div className="detail-body"><h3 style={{ marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>Description</h3><p>{item.description}</p></div>}
        <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-6)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div><p style={{ fontWeight: 'var(--fw-semibold)', margin: 0 }}>📎 {item.fileName}</p><p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-sm)', margin: '4px 0 0' }}>{item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}</p></div>
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <a 
              href={item.pdfUrl} 
              target="_blank" 
              rel="noreferrer"
              onClick={handleDownload}
              className="btn btn-secondary btn-lg"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
            >
              View PDF
            </a>
            <a 
              href={item.pdfUrl} 
              download
              onClick={handleDownload}
              className="btn btn-primary btn-lg"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', background: 'var(--gradient-primary)', color: 'white' }}
            >
              Download PDF
            </a>
          </div>
        </div>
      </div>
    </div></div>
  );
}