'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Trash2, ShoppingCart, ArrowRight, Mail } from 'lucide-react';

export default function CartPage() {
  return <ProtectedRoute><CartContent /></ProtectedRoute>;
}

function CartContent() {
  const { cartItems, removeFromCart, clearCart } = useCart();

  const total = cartItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  if (cartItems.length === 0) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="empty-state animate-fadeInUp">
            <div className="empty-state-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Browse the marketplace and add items to your cart.</p>
            <Link href="/marketplace" className="btn btn-primary">Browse Marketplace</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div className="page-header animate-fadeInUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShoppingCart size={28} color="var(--accent-primary)" /> My Cart
            </h1>
            <p>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-ghost" onClick={clearCart} style={{ color: 'var(--accent-danger)' }}>
            Clear All
          </button>
        </div>

        {/* Cart items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {cartItems.map(item => (
            <div key={item.id} className="card-glass animate-fadeInUp" style={{ display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Image */}
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.title} width={80} height={80} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>📦</div>
              )}

              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/marketplace/${item.id}`} style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', display: 'block', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </Link>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span className="badge">{item.category}</span>
                  <span className="badge badge-info">{item.condition}</span>
                </div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Seller: {item.sellerName}</p>
              </div>

              {/* Price + Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {item.price > 0 ? `₹${item.price}` : 'Free'}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={`mailto:${item.sellerEmail}?subject=Interested in: ${encodeURIComponent(item.title)}`}
                    className="btn btn-secondary btn-sm"
                    style={{ borderRadius: 9999 }}
                    title="Contact seller"
                  >
                    <Mail size={14} />
                  </a>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="btn btn-sm"
                    style={{ borderRadius: 9999, color: 'var(--accent-danger)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                    title="Remove from cart"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card-glass animate-fadeInUp" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Order Summary</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {cartItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{item.title}</span>
                <span>{item.price > 0 ? `₹${item.price}` : 'Free'}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'var(--border-color)', margin: '0.5rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent-primary)' }}>₹{total}</span>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
            💡 ShareVIT is a student-to-student platform. Contact each seller directly to complete your purchase.
          </p>
          <Link href="/marketplace" className="btn btn-primary btn-full" style={{ borderRadius: 9999 }}>
            Continue Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
