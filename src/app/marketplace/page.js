'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { addToCart } from '@/lib/cart';
import { 
  SlidersHorizontal, ArrowUpDown, Search, MapPin, Tag, 
  RotateCcw, Sparkles, AlertCircle, ShoppingCart, Plus 
} from 'lucide-react';

const CATEGORIES = ['All', 'Notes', 'Assignments', 'Books', 'Electronics', 'Study Materials', 'Miscellaneous'];
const LISTING_TYPES = ['All Types', 'Sell', 'Rent', 'Donate', 'Exchange'];
const CONDITIONS = ['All', 'New', 'Like New', 'Good', 'Fair', 'Poor'];
const LOCATIONS = ['All', 'Hostel', 'Campus', 'Outside Campus'];

export default function MarketplacePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex-center" style={{ minHeight: '50vh' }}><div className="spinner spinner-lg" /></div>}>
        <MarketplaceContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [type, setType] = useState('All Types');
  const [condition, setCondition] = useState('All');
  const [location, setLocation] = useState('All');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  
  // Sort State
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'priceAsc', 'priceDesc', 'mostViewed', 'mostSaved'
  
  // Show/Hide filters on mobile
  const [showFilters, setShowFilters] = useState(false);

  // Sync Search and Category from query parameters if present
  useEffect(() => {
    const qSearch = searchParams.get('search');
    const qCategory = searchParams.get('category');
    if (qSearch) setSearch(qSearch);
    if (qCategory) setCategory(qCategory);
  }, [searchParams]);

  // Fetch Listings
  useEffect(() => {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setListings(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter listings
  const filtered = listings.filter(item => {
    if (category !== 'All' && item.category !== category) return false;
    if (type !== 'All Types' && item.listingType !== type) return false;
    if (condition !== 'All' && item.condition !== condition) return false;
    if (location !== 'All' && item.location !== location) return false;
    
    // Search
    if (search) {
      const s = search.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(s);
      const matchDesc = item.description?.toLowerCase().includes(s);
      const matchSeller = item.sellerName?.toLowerCase().includes(s);
      if (!matchTitle && !matchDesc && !matchSeller) return false;
    }

    // Price range
    if (priceMin && (item.price || 0) < Number(priceMin)) return false;
    if (priceMax && (item.price || 0) > Number(priceMax)) return false;

    return true;
  });

  // Sort listings
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    }
    if (sortBy === 'priceAsc') {
      return (a.price || 0) - (b.price || 0);
    }
    if (sortBy === 'priceDesc') {
      return (b.price || 0) - (a.price || 0);
    }
    if (sortBy === 'mostViewed') {
      return (b.views || 0) - (a.views || 0);
    }
    if (sortBy === 'mostSaved') {
      return (b.saves || 0) - (a.saves || 0);
    }
    return 0;
  });

  const handleAddToCart = async (e, item) => {
    e.preventDefault();
    if (!user) return toast.error('Please sign in to add items to cart.');
    
    setAddingToCart(item.id);
    const res = await addToCart(user.uid, item);
    if (res.success) {
      toast.success('Added to cart!');
    } else {
      toast.error(res.message || 'Failed to add to cart.');
    }
    setAddingToCart(null);
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setType('All Types');
    setCondition('All');
    setLocation('All');
    setPriceMin('');
    setPriceMax('');
    setSortBy('newest');
    toast.success('Filters reset');
  };

  return (
    <div className="page-content" style={{ minHeight: '90vh' }}>
      <div className="container">
        
        {/* Header Area */}
        <div className="page-header animate-fadeInUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingCart size={32} style={{ color: 'var(--accent-primary)' }} /> Student Marketplace
            </h1>
            <p>Buy, sell, rent, donate & exchange books, tools, and electronics with VIT Pune students</p>
          </div>
          <Link href="/marketplace/create" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)' }}>
            <Plus size={18} /> Sell an Item
          </Link>
        </div>

        {/* Search Bar + Controls */}
        <div className="animate-fadeInUp" style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text" 
              placeholder="Search listings by title, seller, or descriptions..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{
                width: '100%',
                padding: '12px 16px 12px 46px',
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'all 0.2s',
                fontSize: '14.5px'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%', maxWidth: '380px' }}>
            {/* Sort Dropdown */}
            <div style={{ position: 'relative', flex: 1 }}>
              <ArrowUpDown size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 36px',
                  background: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                <option value="newest">Sort: Newest</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="mostViewed">Most Viewed</option>
                <option value="mostSaved">Most Saved</option>
              </select>
            </div>

            {/* Toggle Filters Panel (Mobile) */}
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
              style={{ gap: '8px', padding: '10px 16px' }}
            >
              <SlidersHorizontal size={16} /> Filters
            </button>
          </div>
        </div>

        {/* Layout Grid (Filters + Items) */}
        <div style={{ display: 'grid', gridTemplateColumns: showFilters ? '280px 1fr' : '1fr', gap: 'var(--space-6)', transition: 'all 0.3s' }}>
          
          {/* Advanced Filters Panel (Expandable) */}
          {showFilters && (
            <aside className="filters-panel animate-fadeInUp">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 0, color: '#fff' }}>Filters</h3>
                <button 
                  onClick={handleResetFilters} 
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--text-link)', fontSize: '11px', cursor: 'pointer' }}
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </div>

              {/* Category */}
              <div className="filters-group">
                <span className="filters-title">Category</span>
                <select 
                  className="form-select" 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  style={{ background: 'rgba(15, 23, 41, 0.65)' }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Listing Type */}
              <div className="filters-group">
                <span className="filters-title">Listing Type</span>
                <select 
                  className="form-select" 
                  value={type} 
                  onChange={e => setType(e.target.value)}
                  style={{ background: 'rgba(15, 23, 41, 0.65)' }}
                >
                  {LISTING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Condition */}
              <div className="filters-group">
                <span className="filters-title">Condition</span>
                <select 
                  className="form-select" 
                  value={condition} 
                  onChange={e => setCondition(e.target.value)}
                  style={{ background: 'rgba(15, 23, 41, 0.65)' }}
                >
                  {CONDITIONS.map(cond => <option key={cond} value={cond}>{cond}</option>)}
                </select>
              </div>

              {/* Location */}
              <div className="filters-group">
                <span className="filters-title">Pickup Location</span>
                <select 
                  className="form-select" 
                  value={location} 
                  onChange={e => setLocation(e.target.value)}
                  style={{ background: 'rgba(15, 23, 41, 0.65)' }}
                >
                  {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>

              {/* Price Range */}
              <div className="filters-group">
                <span className="filters-title">Price Range (₹)</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    placeholder="Min" 
                    className="form-input" 
                    value={priceMin}
                    onChange={e => setPriceMin(e.target.value)}
                    style={{ padding: '8px 10px', background: 'rgba(15, 23, 41, 0.65)' }}
                  />
                  <span style={{ color: 'var(--text-tertiary)' }}>to</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    className="form-input" 
                    value={priceMax}
                    onChange={e => setPriceMax(e.target.value)}
                    style={{ padding: '8px 10px', background: 'rgba(15, 23, 41, 0.65)' }}
                  />
                </div>
              </div>

              <button onClick={() => setShowFilters(false)} className="btn btn-secondary btn-sm btn-full" style={{ marginTop: 'var(--space-2)' }}>
                Apply Filters
              </button>
            </aside>
          )}

          {/* Listings Feed */}
          <main style={{ flex: 1 }}>
            
            {/* Filter Indicators (Active tags) */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
              {category !== 'All' && (
                <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Category: {category} <button onClick={() => setCategory('All')} style={{ border: 'none', background: 'none', color: '#fff', fontSize: '10px', cursor: 'pointer' }}>×</button>
                </span>
              )}
              {type !== 'All Types' && (
                <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Type: {type} <button onClick={() => setType('All Types')} style={{ border: 'none', background: 'none', color: '#fff', fontSize: '10px', cursor: 'pointer' }}>×</button>
                </span>
              )}
              {condition !== 'All' && (
                <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Condition: {condition} <button onClick={() => setCondition('All')} style={{ border: 'none', background: 'none', color: '#fff', fontSize: '10px', cursor: 'pointer' }}>×</button>
                </span>
              )}
              {location !== 'All' && (
                <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Location: {location} <button onClick={() => setLocation('All')} style={{ border: 'none', background: 'none', color: '#fff', fontSize: '10px', cursor: 'pointer' }}>×</button>
                </span>
              )}
              {(priceMin || priceMax) && (
                <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Price: ₹{priceMin || '0'} - ₹{priceMax || '∞'} <button onClick={() => { setPriceMin(''); setPriceMax(''); }} style={{ border: 'none', background: 'none', color: '#fff', fontSize: '10px', cursor: 'pointer' }}>×</button>
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex-center" style={{ padding: 'var(--space-20)' }}>
                <div className="spinner spinner-lg" />
              </div>
            ) : sorted.length === 0 ? (
              <div className="card-glass" style={{ padding: 'var(--space-16)', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📦</div>
                <h3 style={{ fontSize: 'var(--fs-xl)', marginBottom: 'var(--space-2)' }}>No items match your filters</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>Try broadening your search criteria or resetting filters.</p>
                <button onClick={handleResetFilters} className="btn btn-primary">Reset Filters</button>
              </div>
            ) : (
              <div className="grid grid-3 stagger-children">
                {sorted.map(item => (
                  <Link key={item.id} href={`/marketplace/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="listing-card card-interactive">
                      
                      {/* Image Frame */}
                      <div style={{ position: 'relative', overflow: 'hidden' }}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="listing-card-image" loading="lazy" decoding="async" style={{ height: '180px', width: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div className="listing-card-image" style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'var(--bg-tertiary)' }}>📦</div>
                        )}
                        <span className={`badge ${item.listingType === 'Donate' ? 'badge-success' : item.listingType === 'Sell' ? 'badge-warning' : item.listingType === 'Rent' ? 'badge-info' : 'badge-primary'}`} style={{ position: 'absolute', top: '10px', right: '10px' }}>
                          {item.listingType}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="listing-card-body">
                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
                          <span className="badge" style={{ fontSize: '9px', padding: '1px 4px' }}>{item.category}</span>
                          <span className="badge badge-info" style={{ fontSize: '9px', padding: '1px 4px' }}>{item.condition}</span>
                        </div>
                        
                        <h3 className="listing-card-title" style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)' }}>{item.title}</h3>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                          {item.price > 0 ? (
                            <p className="price-tag" style={{ fontSize: 'var(--fs-md)' }}>₹{item.price}</p>
                          ) : (
                            <p className="price-tag price-free" style={{ fontSize: 'var(--fs-md)' }}>Free</p>
                          )}
                          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>🔥 {item.views || 0} views</span>
                        </div>

                        {/* Location / Meta */}
                        <div className="listing-card-meta" style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                          <MapPin size={10} style={{ color: 'var(--text-link)' }} />
                          <span>{item.location || 'Campus'}</span>
                          <span>•</span>
                          <span>by {item.sellerName || 'Anonymous'}</span>
                        </div>

                        {/* Action Drawer */}
                        {item.sellerId !== user?.uid && (
                          <div style={{ marginTop: 'var(--space-4)' }} onClick={e => e.stopPropagation()}>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              style={{ width: '100%', gap: '6px' }}
                              onClick={(e) => handleAddToCart(e, item)}
                              disabled={addingToCart === item.id}
                            >
                              {addingToCart === item.id ? 'Adding...' : (
                                <>
                                  <ShoppingCart size={13} /> Add to Cart
                                </>
                              )}
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

          </main>

        </div>

      </div>
    </div>
  );
}