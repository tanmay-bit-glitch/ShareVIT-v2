'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { removeFromCart, clearCart } from '@/lib/cart';
import { useToast } from '@/context/ToastContext';

export default function CartPage() {
  return <ProtectedRoute><CartContent /></ProtectedRoute>;
}

function CartContent() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'cart_items'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort in memory to avoid needing a composite index
      items.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      
      setCartItems(items);
      
      // Fetch fresh product details for each cart item
      const productData = {};
      for (const item of items) {
        if (!products[item.productId]) {
          const prodSnap = await getDoc(doc(db, 'listings', item.productId));
          if (prodSnap.exists()) {
            productData[item.productId] = { id: prodSnap.id, ...prodSnap.data() };
          }
        }
      }
      setProducts(prev => ({ ...prev, ...productData }));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRemove = async (id) => {
    const res = await removeFromCart(id);
    if (res.success) toast.success('Removed from cart');
    else toast.error('Failed to remove item');
  };

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;
    const res = await clearCart(user.uid);
    if (res.success) toast.success('Cart cleared');
    else toast.error('Failed to clear cart');
  };

  // Calculate totals based on live product data
  let totalItems = 0;
  let totalPrice = 0;
  
  const populatedCart = cartItems.map(item => {
    const product = products[item.productId];
    if (product) {
      totalItems += item.quantity;
      totalPrice += (product.price || 0) * item.quantity;
    }
    return { ...item, product };
  }).filter(item => item.product); // Filter out items where the product was deleted

  if (loading) return <div className="page-content"><div className="flex-center" style={{ minHeight: '50vh' }}><div className="spinner spinner-lg" /></div></div>;

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="page-header animate-fadeInUp">
          <h1>Your Cart</h1>
          <p>Review your items before proceeding</p>
        </div>

        {populatedCart.length === 0 ? (
          <div className="empty-state animate-fadeInUp">
            <div className="empty-state-icon" style={{ fontSize: '4rem' }}>🛒</div>
            <h3>Your cart is empty</h3>
            <p style={{ marginBottom: 'var(--space-6)' }}>Looks like you haven't added anything to your cart yet.</p>
            <Link href="/marketplace" className="btn btn-primary btn-lg">Browse Marketplace</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-6)', alignItems: 'start' }} className="cart-layout">
            
            <div className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)' }}>Items ({totalItems})</h2>
                <button className="btn btn-ghost btn-sm" onClick={handleClear} style={{ color: 'var(--accent-danger)' }}>Clear Cart</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {populatedCart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)' }}>
                    {item.product.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.title} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    ) : (
                      <div style={{ width: '80px', height: '80px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📦</div>
                    )}
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <Link href={`/marketplace/${item.product.id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
                            <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-1)' }}>{item.product.title}</h3>
                          </Link>
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>Sold by {item.product.sellerName}</div>
                        </div>
                        <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
                          {item.product.price > 0 ? `₹${item.product.price}` : 'Free'}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span className="badge badge-info">{item.product.condition}</span>
                          <span className="badge">{item.product.category}</span>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleRemove(item.id)} style={{ color: 'var(--accent-danger)' }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Sticky Sidebar */}
            <div className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-6)', position: 'sticky', top: '100px' }}>
              <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>Order Summary</h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                <span>Subtotal ({totalItems} items)</span>
                <span>₹{totalPrice}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                <span>Platform Fee</span>
                <span>₹0</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-3)', marginBottom: 'var(--space-6)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-lg)' }}>
                <span>Total</span>
                <span>₹{totalPrice}</span>
              </div>
              
              <button className="btn btn-primary btn-full btn-lg" style={{ marginBottom: 'var(--space-3)' }}>
                Proceed to Checkout
              </button>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
                Checkout currently simulates connecting to the seller.
              </p>
            </div>
            
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .cart-layout { grid-template-columns: 1fr !important; }
        }
      `}} />
    </div>
  );
}
