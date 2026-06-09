'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function MarketplaceDetailPage() {
  return <ProtectedRoute><MarketplaceDetail /></ProtectedRoute>;
}

function MarketplaceDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchItem = async () => {
      const snap = await getDoc(doc(db, 'marketplace', id));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    if (id) fetchItem();
  }, [id]);

  if (loading) return <div className="page-content"><div className="flex-center" style={{ minHeight: '50vh' }}><div className="spinner spinner-lg" /></div></div>;
  if (!item) return <div className="page-content"><div className="container"><div className="empty-state"><h3>Listing not found</h3><Link href="/marketplace" className="btn btn-primary">Back to Marketplace</Link></div></div></div>;

  return (
    <div className="page-content">
      <div className="container detail-page animate-fadeInUp">
        <Link href="/marketplace" className="btn btn-ghost" style={{ marginBottom: 'var(--space-4)' }}>← Back to Marketplace</Link>
        <div className="card-glass" style={{ padding: 'var(--space-8)', overflow: 'hidden' }}>
          {item.imageUrl && <img src={item.imageUrl} alt={item.title} loading="lazy" decoding="async" style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)' }} />}
          <div className="detail-header">
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <span className="badge">{item.category}</span>
              <span className={`badge ${item.listingType === 'Donate' ? 'badge-success' : 'badge-warning'}`}>{item.listingType}</span>
              <span className="badge badge-info">{item.condition}</span>
            </div>
            <h1>{item.title}</h1>
            {item.price > 0 ? <p className="price-tag" style={{ fontSize: 'var(--fs-3xl)' }}>₹{item.price}</p> : <p className="price-tag price-free" style={{ fontSize: 'var(--fs-3xl)' }}>Free</p>}
            <div className="detail-meta">
              <span>👤 {item.sellerName}</span>
              <span>📧 {item.sellerEmail}</span>
              <span>📅 {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
            </div>
          </div>
          <div className="detail-body">
            <h3 style={{ marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>Description</h3>
            <p>{item.description || 'No description provided.'}</p>
          </div>
          {item.sellerId !== user?.uid && (
            <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-3)' }}>
              <a href={`mailto:${item.sellerEmail}?subject=Interested in: ${item.title}`} className="btn btn-primary btn-lg">📧 Contact Seller</a>
              <Link href="/chat" className="btn btn-secondary btn-lg">💬 Chat</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}