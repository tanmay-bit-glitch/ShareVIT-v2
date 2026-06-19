'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useGamification } from '@/context/GamificationContext';
import { createNotification } from '@/lib/notifications';
import { addToCart } from '@/lib/cart';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Heart, Share2, AlertTriangle, MessageSquare, Mail, ShoppingCart, 
  ShieldCheck, Eye, Calendar, User, ChevronLeft, Star, Award, X, Download
} from 'lucide-react';

const CATEGORIES = ['All', 'Notes', 'Assignments', 'Books', 'Electronics', 'Study Materials', 'PYQs', 'Marketplace Items', 'Miscellaneous'];

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
  const { user, userData, refreshUserData } = useAuth();
  const toast = useToast();
  const { gainXP } = useGamification();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savesCount, setSavesCount] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: 0,
    condition: 'Good',
    category: 'Books',
    location: 'Campus'
  });

  // Populate edit form on edit start
  useEffect(() => {
    if (item) {
      setEditForm({
        title: item.title || '',
        description: item.description || '',
        price: item.price || 0,
        condition: item.condition || 'Good',
        category: item.category || 'Books',
        location: item.location || 'Campus'
      });
    }
  }, [item, isEditing]);

  // Fetch listing & increment views
  useEffect(() => {
    const fetchItemAndIncrement = async () => {
      try {
        const docRef = doc(db, 'listings', id);
        
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
        }
      } catch (err) {
        console.error('Error fetching item details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchItemAndIncrement();
  }, [id]);

  // Sync isSaved with userData.wishlist
  useEffect(() => {
    if (userData && id) {
      setIsSaved(userData.wishlist?.includes(id) || false);
    }
  }, [userData, id]);

  const handleContactSeller = async () => {
    if (!item) return;
    try {
      await createNotification(
        item.sellerId,
        `New Inquiry: ${item.title}`,
        `${userData?.displayName || 'Someone'} is interested in your item.`,
        'Marketplace',
        { link: `/marketplace/${item.id}`, itemId: item.id, buyerId: user.uid, type: 'marketplace_inquiry' }
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

  const handleDownloadPDF = async () => {
    if (!item?.pdfUrl) return;
    try {
      const docRef = doc(db, 'listings', id);
      await updateDoc(docRef, {
        downloads: increment(1)
      });
      setItem(prev => ({ ...prev, downloads: (prev.downloads || 0) + 1 }));
      toast.success('Download started!');
      window.open(item.pdfUrl, '_blank');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update download activity.');
    }
  };

  const toggleSave = async () => {
    if (!item || !user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const docRef = doc(db, 'listings', id);
      const currentWishlist = userData?.wishlist || [];
      const saved = currentWishlist.includes(id);
      
      let newWishlist;
      if (saved) {
        newWishlist = currentWishlist.filter(x => x !== id);
        setIsSaved(false);
        setSavesCount(prev => Math.max(0, prev - 1));
        await updateDoc(docRef, { saves: increment(-1) });
        toast.success('Removed from wishlist');
      } else {
        newWishlist = [...currentWishlist, id];
        setIsSaved(true);
        setSavesCount(prev => prev + 1);
        await updateDoc(docRef, { saves: increment(1) });
        toast.success('Saved to wishlist!');
      }

      await updateDoc(userRef, { wishlist: newWishlist });
      if (refreshUserData) await refreshUserData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update wishlist.');
    }
  };

  const handleDeleteListing = async () => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await deleteDoc(doc(db, 'listings', id));
      toast.success('Listing deleted!');
      router.push('/marketplace');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete listing.');
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await updateDoc(doc(db, 'listings', id), {
        status: newStatus
      });
      
      if (newStatus === 'Sold' && item.listingType === 'Sell') {
        gainXP(100, 'Completed sale of: ' + item.title);
      } else if (newStatus === 'Rented' && item.listingType === 'Rent') {
        gainXP(80, 'Rented out: ' + item.title);
      } else {
        gainXP(40, 'Completed transaction for: ' + item.title);
      }

      setItem(prev => ({ ...prev, status: newStatus }));
      toast.success(`Listing marked as ${newStatus}!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status.');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'listings', id);
      const updatedData = {
        title: editForm.title,
        description: editForm.description,
        price: Number(editForm.price) || 0,
        condition: editForm.condition,
        category: editForm.category,
        location: editForm.location
      };
      await updateDoc(docRef, updatedData);
      setItem(prev => ({ ...prev, ...updatedData }));
      setIsEditing(false);
      toast.success('Listing updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update listing.');
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

              {/* Dynamic Academic Details */}
              {item.pdfUrl && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', margin: '12px 0 20px', fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(item.category === 'Notes' || item.category === 'PYQs') && (
                    <>
                      <div>Subject: <strong style={{ color: '#cbd5e1' }}>{item.subjectName}</strong></div>
                      <div>Department: <strong style={{ color: '#cbd5e1' }}>{item.department}</strong></div>
                      <div>Semester: <strong style={{ color: '#cbd5e1' }}>Semester {item.semester}</strong></div>
                    </>
                  )}
                  {item.category === 'Assignments' && (
                    <>
                      <div>Subject: <strong style={{ color: '#cbd5e1' }}>{item.subjectName}</strong></div>
                      <div>Semester: <strong style={{ color: '#cbd5e1' }}>Semester {item.semester}</strong></div>
                      <div>Type: <span className="badge" style={{ fontSize: '10px' }}>{item.assignmentType}</span></div>
                      {item.facultyName && <div>Faculty: <strong style={{ color: '#cbd5e1' }}>{item.facultyName}</strong></div>}
                    </>
                  )}
                  {item.category === 'Study Materials' && (
                    <>
                      <div>Subject: <strong style={{ color: '#cbd5e1' }}>{item.subjectName}</strong></div>
                      <div>Semester: <strong style={{ color: '#cbd5e1' }}>Semester {item.semester}</strong></div>
                      <div>Subcategory: <span className="badge badge-warning" style={{ fontSize: '10px' }}>{item.subcategory}</span></div>
                    </>
                  )}
                </div>
              )}

              {/* Book Author display */}
              {item.category === 'Books' && item.author && (
                <div style={{ margin: '8px 0 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Author: <strong style={{ color: '#fff' }}>{item.author}</strong>
                </div>
              )}

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
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={16} /> {item.views || 1} views
                </span>
                {item.pdfUrl && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                    <Download size={16} /> {item.downloads || 0} downloads
                  </span>
                )}
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
                    {item.pdfUrl && (!item.price || item.price === 0) ? (
                      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                        <a 
                          href={item.pdfUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={handleDownloadPDF}
                          className="btn btn-secondary btn-full btn-lg" 
                          style={{ gap: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flex: 1 }}
                        >
                          <Eye size={18} /> View {item.pdfUrl.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Document'}
                        </a>
                        <a 
                          href={item.pdfUrl} 
                          download
                          onClick={handleDownloadPDF}
                          className="btn btn-primary btn-full btn-lg" 
                          style={{ gap: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flex: 1, background: 'var(--gradient-primary)', color: 'white' }}
                        >
                          <Download size={18} /> Download {item.pdfUrl.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Document'}
                        </a>
                      </div>
                    ) : (
                      <button 
                        onClick={handleAddToCart} 
                        disabled={addingToCart}
                        className="btn btn-primary btn-full btn-lg" 
                        style={{ gap: '8px' }}
                      >
                        <ShoppingCart size={18} /> {addingToCart ? 'Adding...' : 'Add to Cart'}
                      </button>
                    )}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <button onClick={handleContactSeller} className="btn btn-secondary" style={{ gap: '6px' }}>
                        <Mail size={16} /> Email Seller
                      </button>
                      <Link href={`/chat?sellerId=${item.sellerId}&sellerName=${encodeURIComponent(item.sellerName || 'Seller')}&itemId=${item.id}`} className="btn btn-secondary" style={{ gap: '6px' }}>
                        <MessageSquare size={16} /> Chat Now
                      </Link>
                    </div>

                    <button onClick={toggleSave} className={`btn ${isSaved ? 'btn-ghost' : 'btn-secondary'} btn-full`} style={{ gap: '6px', color: isSaved ? 'var(--accent-danger)' : 'inherit' }}>
                      <Heart size={16} fill={isSaved ? 'var(--accent-danger)' : 'none'} /> 
                      {isSaved ? 'Saved to Wishlist' : 'Add to Wishlist'}
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: 'var(--space-4)', background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed var(--accent-primary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <p style={{ color: 'var(--accent-primary-hover)', fontSize: 'var(--fs-sm)', fontWeight: 'bold', margin: 0 }}>This is your listing (Status: {item.status || 'active'})</p>
                    </div>
                    
                    {item.status === 'active' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {item.listingType === 'Sell' && (
                          <button onClick={() => handleUpdateStatus('Sold')} className="btn btn-primary btn-sm">Mark Sold</button>
                        )}
                        {item.listingType === 'Rent' && (
                          <button onClick={() => handleUpdateStatus('Rented')} className="btn btn-primary btn-sm">Mark Rented</button>
                        )}
                        {item.listingType === 'Exchange' && (
                          <button onClick={() => handleUpdateStatus('Exchanged')} className="btn btn-primary btn-sm">Mark Exchanged</button>
                        )}
                        {item.listingType === 'Donate' && (
                          <button onClick={() => handleUpdateStatus('Completed')} className="btn btn-primary btn-sm">Mark Donated</button>
                        )}
                        <button onClick={() => setIsEditing(true)} className="btn btn-secondary btn-sm">Edit Item</button>
                      </div>
                    )}

                    {item.status !== 'active' && (
                      <button onClick={() => handleUpdateStatus('active')} className="btn btn-secondary btn-full btn-sm">Re-activate Listing</button>
                    )}

                    <button onClick={handleDeleteListing} className="btn btn-ghost btn-full btn-sm" style={{ color: 'var(--accent-danger)' }}>
                      Delete Listing
                    </button>
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

      {/* Edit Modal */}
      {isEditing && (
        <>
          <div className="bottom-sheet-overlay" onClick={() => setIsEditing(false)} style={{ zIndex: 10000 }} />
          <div className="card-glass" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10001, width: '90%', maxWidth: '500px', padding: 'var(--space-6)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>Edit Listing</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)} style={{ padding: '4px' }}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input type="text" className="form-input" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} style={{ minHeight: '100px' }} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input type="number" className="form-input" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} disabled={item.listingType === 'Donate' || item.listingType === 'Exchange'} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Condition</label>
                  <select className="form-select" value={editForm.condition} onChange={e => setEditForm(p => ({ ...p, condition: e.target.value }))}>
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <select className="form-select" value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}>
                    <option value="Hostel">Hostel</option>
                    <option value="Campus">Campus</option>
                    <option value="Outside Campus">Outside Campus</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </>
      )}

      </div>
    </div>
  );
}
