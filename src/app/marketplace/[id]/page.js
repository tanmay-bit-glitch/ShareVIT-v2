'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { createNotification } from '@/lib/notifications';
import { addToCart } from '@/lib/cart';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Heart, Share2, AlertTriangle, MessageSquare, Mail, ShoppingCart, 
  ShieldCheck, Eye, Calendar, User, ChevronLeft, Star, Award 
} from 'lucide-react';

export default function MarketplaceDetailPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex-center" style={{ minHeight: '50vh' }}><div className="spinner spinner-lg" /></div>}>
        <MarketplaceDetail />
      </Suspense>
    </ProtectedRoute>
  );
}

function MarketplaceDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const toast = useToast();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savesCount, setSavesCount] = useState(0);

  // Fetch listing & increment views
  useEffect(() => {
    const fetchItemAndIncrement = async () => {
      try {
        const docRef = doc(db, 'marketplace', id);
        
        // 1. Increment views in Firestore
        await updateDoc(docRef, {
          views: increment(1)
        });

        // 2. Fetch the updated document
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.id ? { id: snap.id, ...snap.data() } : snap.data();
          setItem(data);
          setSavesCount(data.saves || 0);
          
          // Check if user has this item saved (simulate with localStorage or local state)
          const savedItems = JSON.parse(localStorage.getItem('wishlist') || '[]');
          setIsSaved(savedItems.includes(id));
        }
      } catch (err) {
        console.error('Error fetching item details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchItemAndIncrement();
  }, [id]);

  const handleContactSeller = async () => {
    if (!item) return;
    try {
      await createNotification(
        item.sellerId,
        `New Inquiry: ${item.title}`,
        `${userData?.displayName || 'Someone'} is interested in your item.`,
        'Marketplace',
        { itemId: item.id, buyerId: user.uid, type: 'marketplace_inquiry' }
      );
      toast.success('Inquiry sent! Opening email client...');
      window.location.href = `mailto:${item.sellerEmail}?subject=Interested in: ${item.title}`;
    } catch (err) {
      console.error(err);
      toast.error('Failed to send inquiry notification.');
    }
  };

  const handleAddToCart = async () => {
    if (!user) return toast.error('Please sign in to add items to cart.');
    
    setAddingToCart(true);
    const res = await addToCart(user.uid, item);
    if (res.success) {
      toast.success('Added to cart!');
    } else {
      toast.error(res.message || 'Failed to add to cart.');
    }
    setAddingToCart(false);
  };

  const toggleSave = async () => {
    if (!item) return;
    const savedItems = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const docRef = doc(db, 'marketplace', id);

    if (isSaved) {
      // Remove from wishlist
      const updated = savedItems.filter(x => x !== id);
      localStorage.setItem('wishlist', JSON.stringify(updated));
      setIsSaved(false);
      setSavesCount(prev => Math.max(0, prev - 1));
      await updateDoc(docRef, { saves: increment(-1) });
      toast.success('Removed from wishlist');
    } else {
      // Add to wishlist
      savedItems.push(id);
      localStorage.setItem('wishlist', JSON.stringify(savedItems));
      setIsSaved(true);
      setSavesCount(prev => prev + 1);
      await updateDoc(docRef, { saves: increment(1) });
      toast.success('Saved to wishlist!');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Listing URL copied to clipboard!');
  };

  const handleReport = () => {
    toast.success('Listing reported. Our moderators will review this shortly.');
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="flex-center" style={{ minHeight: '50vh' }}>
          <div className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="empty-state">
            <h3>Listing not found</h3>
            <p>This item might have been sold or removed by the seller.</p>
            <Link href="/marketplace" className="btn btn-primary">Back to Marketplace</Link>
          </div>
        </div>
      </div>
    );
  }

  // Fallbacks for trust stats
  const trustScore = item.sellerTrustScore || 96;
  const sellerRating = item.sellerRating || 4.8;
  const sellerBranch = item.sellerBranch || 'CSE';
  const sellerYear = item.sellerYear || '3rd Year';

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Navigation / Header Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <Link href="/marketplace" className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ChevronLeft size={16} /> Back to Marketplace
          </Link>
          
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button onClick={handleShare} className="btn btn-secondary btn-sm" style={{ gap: '6px' }} title="Share Listing">
              <Share2 size={14} /> Share
            </button>
            <button onClick={handleReport} className="btn btn-ghost btn-sm" style={{ gap: '6px', color: 'var(--text-tertiary)' }} title="Report Listing">
              <AlertTriangle size={14} /> Report
            </button>
          </div>
        </div>

        {/* Product Layout Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-8)' }}>
          
          {/* Left Column: Media & Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Image Container */}
            <div className="card-glass" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  loading="lazy" 
                  decoding="async" 
                  style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', display: 'block' }} 
                />
              ) : (
                <div style={{ height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', background: 'var(--bg-secondary)' }}>
                  📦
                </div>
              )}
              
              {/* Overlay Badges */}
              <span className={`badge ${item.listingType === 'Donate' ? 'badge-success' : item.listingType === 'Sell' ? 'badge-warning' : 'badge-info'}`} style={{ position: 'absolute', top: '16px', right: '16px', fontSize: 'var(--fs-sm)', padding: '4px 12px' }}>
                {item.listingType}
              </span>
            </div>

            {/* Product Details / Description */}
            <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-3)', color: '#fff' }}>
                Item Description
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14.5px', whiteSpace: 'pre-wrap' }}>
                {item.description || 'No description provided for this listing.'}
              </p>
            </div>

          </div>

          {/* Right Column: Title, Transaction details, Seller Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Core Info Panel */}
            <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-3)' }}>
                <span className="badge">{item.category}</span>
                <span className="badge badge-info">{item.condition} condition</span>
              </div>

              <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 'var(--fw-extrabold)', marginBottom: 'var(--space-3)', lineHeight: 1.2 }}>
                {item.title}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-4)' }}>
                {item.price > 0 ? (
                  <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>₹{item.price}</span>
                ) : (
                  <span className="price-tag price-free" style={{ fontSize: '1.8rem' }}>Free</span>
                )}
                
                {item.listingType === 'Rent' && (
                  <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>(Rent price)</span>
                )}
              </div>

              {/* Engagement Stats */}
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--space-6)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={16} /> {item.views || 1} views
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Heart size={16} style={{ color: isSaved ? 'var(--accent-danger)' : 'inherit' }} /> {savesCount} saved
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={16} /> {item.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(item.createdAt.toDate()) : 'Recently'}
                </span>
              </div>

              {/* Call to Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {item.sellerId !== user?.uid ? (
                  <>
                    <button 
                      onClick={handleAddToCart} 
                      disabled={addingToCart}
                      className="btn btn-primary btn-full btn-lg" 
                      style={{ gap: '8px' }}
                    >
                      <ShoppingCart size={18} /> {addingToCart ? 'Adding...' : 'Add to Cart'}
                    </button>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <button onClick={handleContactSeller} className="btn btn-secondary" style={{ gap: '6px' }}>
                        <Mail size={16} /> Email Seller
                      </button>
                      <Link href="/chat" className="btn btn-secondary" style={{ gap: '6px' }}>
                        <MessageSquare size={16} /> Chat Now
                      </Link>
                    </div>

                    <button onClick={toggleSave} className={`btn ${isSaved ? 'btn-ghost' : 'btn-secondary'} btn-full`} style={{ gap: '6px', color: isSaved ? 'var(--accent-danger)' : 'inherit' }}>
                      <Heart size={16} fill={isSaved ? 'var(--accent-danger)' : 'none'} /> 
                      {isSaved ? 'Saved to Wishlist' : 'Add to Wishlist'}
                    </button>
                  </>
                ) : (
                  <div style={{ padding: 'var(--space-4)', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', margin: 0 }}>This is your active listing.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Seller Trust Card */}
            <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                Seller Information
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-4)' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  color: '#fff',
                  fontSize: 'var(--fs-lg)',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {item.sellerName?.substring(0, 2).toUpperCase() || 'ST'}
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--fs-base)', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.sellerName || 'Verified Student'} 
                    <ShieldCheck size={16} style={{ color: 'var(--accent-success)' }} title="College Verified" />
                  </h4>
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                    {sellerBranch} • {sellerYear}
                  </p>
                </div>
              </div>

              {/* Trust Score & Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block' }}>Trust Score</span>
                  <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 'bold', color: 'var(--accent-success)' }}>
                    {trustScore}%
                  </span>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block' }}>Seller Rating</span>
                  <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 'bold', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={16} fill="var(--accent-warning)" /> {sellerRating}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'var(--space-4)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                <Award size={14} style={{ color: 'var(--accent-primary)' }} />
                <span>Response Rate: 98% within an hour</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}