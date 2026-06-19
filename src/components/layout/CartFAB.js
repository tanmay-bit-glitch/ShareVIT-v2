'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function CartFAB() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState(0);

  useEffect(() => {
    if (!user) {
      setCartItems(0);
      return;
    }

    const cartQ = query(collection(db, 'cart_items'), where('userId', '==', user.uid));
    const unsubscribeCart = onSnapshot(cartQ, (snapshot) => {
      setCartItems(snapshot.size);
    });

    return () => unsubscribeCart();
  }, [user]);

  if (!user || cartItems === 0) return null;

  return (
    <Link href="/cart" style={{
      position: 'fixed',
      bottom: 'var(--space-6)',
      right: 'var(--space-6)',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      backgroundColor: 'var(--accent-primary)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.5), 0 8px 10px -6px rgba(99, 102, 241, 0.1)',
      zIndex: 999,
      cursor: 'pointer',
      transition: 'transform 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <ShoppingCart size={24} />
      <span style={{
        position: 'absolute',
        top: '0',
        right: '0',
        backgroundColor: 'var(--accent-danger)',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 'bold',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        border: '2px solid var(--bg-primary)'
      }}>
        {cartItems > 9 ? '9+' : cartItems}
      </span>
    </Link>
  );
}
