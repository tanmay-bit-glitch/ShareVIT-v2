'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, getDoc, doc, setDoc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { removeFromCart, clearCart } from '@/lib/cart';
import { useToast } from '@/context/ToastContext';
import { CheckCircle } from 'lucide-react';

export default function CartPage() {
  return <ProtectedRoute><CartContent /></ProtectedRoute>;
}

function CartContent() {
  const { user, userData } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'cart_items'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort in memory
      items.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      
      setCartItems(items);
      
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

  const handleCheckout = async () => {
    if (populatedCart.length === 0) return;
    setCheckingOut(true);

    try {
      // 1. Group items by seller
      const sellersMap = {};
      populatedCart.forEach(item => {
        const prod = item.product;
        if (!sellersMap[prod.sellerId]) {
          sellersMap[prod.sellerId] = {
            sellerId: prod.sellerId,
            sellerName: prod.sellerName,
            items: []
          };
        }
        sellersMap[prod.sellerId].items.push({
          title: prod.title,
          price: prod.price
        });
      });

      const sellersList = Object.values(sellersMap);

      // 2. Call API to send email to sellers
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName: userData?.displayName || 'A Student',
          buyerPhone: phoneNumber,
          sellers: sellersList
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send order notifications');
      }

      // 3. Auto-initialize Direct Messages with sellers
      const myName = userData?.displayName || 'A Student';
      for (const seller of sellersList) {
        if (seller.sellerId === user.uid) continue; // Skip self

        const chatId = user.uid < seller.sellerId ? `${user.uid}_${seller.sellerId}` : `${seller.sellerId}_${user.uid}`;
        const chatRef = doc(db, 'direct_chats', chatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
          await setDoc(chatRef, {
            participants: [user.uid, seller.sellerId],
            participantNames: {
              [user.uid]: myName,
              [seller.sellerId]: seller.sellerName || 'Seller'
            },
            updatedAt: serverTimestamp(),
            lastMessage: ''
          });
        }

        // Generate automated message
        const itemsText = seller.items.map(i => `"${i.title}" (₹${i.price})`).join(', ');
        const total = seller.items.reduce((acc, curr) => acc + curr.price, 0);
        let msgText = `Hi ${seller.sellerName || 'Seller'}, I'd like to purchase ${itemsText} for a total of ₹${total}. Let me know when you're available for delivery!`;
        if (phoneNumber) {
          msgText += ` You can also reach me at ${phoneNumber}.`;
        }

        await addDoc(collection(db, 'direct_chats', chatId, 'messages'), {
          text: msgText,
          senderId: user.uid,
          senderName: myName,
          createdAt: serverTimestamp(),
        });

        await updateDoc(chatRef, {
          lastMessage: "Order Request sent!",
          updatedAt: serverTimestamp()
        });
      }

      // 4. Clear Cart
      await clearCart(user.uid);
      
      // 5. Show Success Modal
      setCheckoutSuccess(true);
    } catch (err) {
      console.error(err);
      toast.error('An error occurred during checkout');
    } finally {
      setCheckingOut(false);
    }
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
  }).filter(item => item.product);

  if (loading) return <div className="page-content"><div className="flex-center" style={{ minHeight: '50vh' }}><div className="spinner spinner-lg" /></div></div>;

  return (
    <div className="page-content" style={{ position: 'relative' }}>
      
      {/* Success Modal Overlay */}
      {checkoutSuccess && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(11, 15, 25, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            transform: 'scale(1)',
            animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <div style={{
              width: '80px', height: '80px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              color: '#10b981',
              animation: 'bounceIn 0.5s 0.2s both'
            }}>
              <CheckCircle size={40} />
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Order Placed!</h2>
            <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '32px', lineHeight: '1.6' }}>
              We've sent an email notification to the seller(s). A direct chat has also been started so you can coordinate delivery.
            </p>
            
            <button 
              onClick={() => router.push('/chat')}
              className="btn btn-primary btn-full btn-lg" 
              style={{ padding: '14px' }}
            >
              Go to Chat
            </button>
          </div>
        </div>
      )}

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

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="form-control"
                  style={{ width: '100%' }}
                />
              </div>
              
              <button 
                onClick={handleCheckout} 
                disabled={checkingOut}
                className="btn btn-primary btn-full btn-lg" 
                style={{ marginBottom: 'var(--space-3)' }}
              >
                {checkingOut ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#fff' }} />
                    Processing...
                  </span>
                ) : 'Proceed to Checkout'}
              </button>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
                This will notify the seller(s) and start a direct chat to arrange delivery.
              </p>
            </div>
            
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .cart-layout { grid-template-columns: 1fr !important; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
}
