'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ShoppingCart, Phone, Mail, MessageSquare, CheckCircle } from 'lucide-react';

export default function MarketplaceDetailPage() {
  return <ProtectedRoute><MarketplaceDetail /></ProtectedRoute>;
}

function MarketplaceDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sellerPhone, setSellerPhone] = useState(null);
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const toast = useToast();
  const inCart = item ? isInCart(item.id) : false;

  useEffect(() => {
    const fetchItem = async () => {
      const snap = await getDoc(doc(db, 'marketplace', id));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setItem(data);
        // Fetch seller's phone if they opted in to share it
        if (data.sellerId) {
          try {
            const sellerSnap = await getDoc(doc(db, 'users', data.sellerId));
            if (sellerSnap.exists()) {
              const sd = sellerSnap.data();
              if (sd._private?.sharePhone && sd._private?.phone) {
                setSellerPhone(sd._private.phone);
              }
            }
          } catch (_) { /* silent — seller data may not be accessible */ }
        }
      }
      setLoading(false);
    };
    if (id) fetchItem();
  }, [id]);

  const handleAddToCart = () => {
    if (!item) return;
    addToCart(item);
    toast.success(`"${item.title}" added to cart!`);
  };

  if (loading) return (
    <div className="page-content">
      <div className="flex-center" style={{ minHeight: '50vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    </div>
  );

  if (!item) return (
    <div className="page-content">
      <div className="container">
        <div className="empty-state">
          <h3>Listing not found</h3>
          <Link href="/marketplace" className="btn btn-primary">Back to Marketplace</Link>
        </div>
      </div>
    </div>
  );

  const isOwner = item.sellerId === user?.uid;

  return (
    <div className="page-content">
      <div className="container animate-fadeInUp" style={{ maxWidth: 860 }}>
        <Link href="/marketplace" className="btn btn-ghost" style={{ marginBottom: '1rem' }}>← Back to Marketplace</Link>

        <div className="card-glass" style={{ padding: 'clamp(1rem, 4vw, 2rem)', overflow: 'hidden' }}>
          {/* Image */}
          {item.imageUrl && (
            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <Image src={item.imageUrl} alt={item.title} width={800} height={400} style={{ width: '100%', maxHeight: 400, objectFit: 'cover' }} />
            </div>
          )}

          {/* Badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span className="badge">{item.category}</span>
            <span className={`badge ${item.listingType === 'Donate' ? 'badge-success' : 'badge-warning'}`}>{item.listingType}</span>
            <span className="badge badge-info">{item.condition}</span>
          </div>

          {/* Title + Price */}
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.5rem' }}>{item.title}</h1>
          {item.price > 0
            ? <p className="price-tag" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>₹{item.price}</p>
            : <p className="price-tag price-free" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>Free</p>
          }

          {/* Meta */}
          <div className="detail-meta" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span>👤 {item.sellerName}</span>
            <span>📅 {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Description</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.description || 'No description provided.'}</p>
          </div>

          {/* Actions — only for non-owners */}
          {!isOwner && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Add to Cart */}
              {item.listingType !== 'Donate' && (
                <button
                  onClick={handleAddToCart}
                  disabled={inCart}
                  className={`btn btn-lg ${inCart ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ borderRadius: 9999, flex: '1 1 160px' }}
                >
                  {inCart ? <><CheckCircle size={16} /> In Cart</> : <><ShoppingCart size={16} /> Add to Cart</>}
                </button>
              )}

              {/* Contact Email */}
              <a
                href={`mailto:${item.sellerEmail}?subject=Interested in: ${encodeURIComponent(item.title)}`}
                className="btn btn-secondary btn-lg"
                style={{ borderRadius: 9999, flex: '1 1 160px' }}
              >
                <Mail size={16} /> Email Seller
              </a>

              {/* Phone — only if seller opted in */}
              {sellerPhone && (
                <a
                  href={`tel:${sellerPhone}`}
                  className="btn btn-secondary btn-lg"
                  style={{ borderRadius: 9999, flex: '1 1 160px', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}
                >
                  <Phone size={16} /> Call Seller
                </a>
              )}

              {/* Chat */}
              <Link href="/chat" className="btn btn-secondary btn-lg" style={{ borderRadius: 9999, flex: '1 1 130px' }}>
                <MessageSquare size={16} /> Chat
              </Link>
            </div>
          )}

          {isOwner && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.875rem', color: '#818cf8' }}>
              📌 This is your listing
            </div>
          )}
        </div>
      </div>
    </div>
  );
}