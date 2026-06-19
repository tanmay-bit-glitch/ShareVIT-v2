'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { 
  Search, ShoppingCart, ArrowRight, Tag, Heart, Flame, Sparkles, 
  ShieldCheck, TrendingUp, HelpCircle, Layers, PlusCircle, CheckCircle 
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Books', emoji: '📚', desc: 'Textbooks & PYQs' },
  { name: 'Electronics', emoji: '💻', desc: 'Laptops, calculators' },
  { name: 'Lab Equipment', emoji: '🧪', desc: 'Aprons, drafters, kits' },
  { name: 'Stationery', emoji: '✏️', desc: 'Pens, notebooks, files' },
  { name: 'Sports', emoji: '🏀', desc: 'Rackets, balls, gear' },
  { name: 'Furniture', emoji: '🪑', desc: 'Hostel tables, chairs' },
  { name: 'Clothing', emoji: '👕', desc: 'College hoodies, formals' },
  { name: 'Other', emoji: '📦', desc: 'Miscellaneous items' }
];

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live Stats
  const [stats, setStats] = useState({
    totalListed: 0,
    totalRequests: 0,
    activeExchanges: 0,
    carbonSaved: 0
  });

  useEffect(() => {
    // Fetch listings
    const listingsQuery = query(collection(db, 'marketplace'), orderBy('createdAt', 'desc'));
    const unsubListings = onSnapshot(listingsQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListings(items);
      
      // Calculate real stats
      const listedCount = items.length;
      const exchanges = items.filter(i => i.listingType === 'Exchange' || i.listingType === 'Donate').length;
      setStats(prev => ({
        ...prev,
        totalListed: listedCount,
        activeExchanges: exchanges,
        carbonSaved: Math.round(listedCount * 4.2) // Mock formula: 4.2kg CO2 per recycled item
      }));
      setLoading(false);
    });

    // Fetch requests
    const requestsQuery = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(reqs);
      setStats(prev => ({
        ...prev,
        totalRequests: reqs.length
      }));
    });

    // Fetch top sellers from users collection
    const sellersQuery = query(collection(db, 'users'), orderBy('uploadsCount', 'desc'));
    const unsubSellers = onSnapshot(sellersQuery, (snapshot) => {
      const sellers = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const displayName = data.displayName || 'Anonymous Student';
          const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          return {
            id: doc.id,
            name: displayName,
            avatar: initials,
            branch: data.department || 'Branch',
            year: data.year ? data.year.split(' ')[0] : 'Student',
            level: data.level || 1,
            rating: data.reputation > 0 ? (data.reputation / 10).toFixed(1) : 5.0,
            uploadsCount: data.uploadsCount || 0
          };
        })
        .filter(s => s.uploadsCount > 0)
        .slice(0, 3);
      setTopSellers(sellers);
    }, (err) => {
      console.error('Error fetching homepage top sellers:', err);
    });

    return () => {
      unsubListings();
      unsubRequests();
      unsubSellers();
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/marketplace');
    }
  };

  // Get recently added (top 4 newest)
  const recentlyAdded = listings.slice(0, 4);

  // Get trending items (sorted by views or mock views/saves)
  const trendingItems = [...listings]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 4);

  // Get featured (random or high rating or just slice)
  const featuredListings = listings
    .filter(item => item.imageUrl && item.price > 0)
    .slice(0, 3);

  return (
    <div className="page-content" style={{ padding: '0 0 var(--space-16) 0' }}>
      
      {/* Glow Backdrop */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '1400px',
        height: '600px',
        background: 'radial-gradient(circle at 50% -20%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Hero / Search Section */}
      <section className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 'var(--space-12)', marginBottom: 'var(--space-12)', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span className="badge badge-info" style={{ padding: '6px 12px', fontSize: 'var(--fs-xs)', marginBottom: 'var(--space-4)', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Sparkles size={12} className="text-link" /> Exclusive Marketplace for VIT Pune Students
          </span>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 'var(--fw-extrabold)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 'var(--space-4)' }}>
            Buy, Sell, Rent & Share <br />
            <span className="gradient-text">Within Your Campus</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-lg)', maxWidth: '600px', margin: '0 auto var(--space-8)' }}>
            Connect with campus mates to trade textbooks, electronics, drafting tools, and hostel furniture. Safe, instant, and verified.
          </p>

          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ maxWidth: '620px', margin: '0 auto var(--space-10)', position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(30, 41, 59, 0.45)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 6px 6px 18px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), var(--shadow-glow)'
            }}>
              <Search size={20} style={{ color: 'var(--text-secondary)', marginRight: '10px', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search books, aprons, calculators, cycles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--fs-base)'
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', padding: '10px 24px' }}>
                Search
              </button>
            </div>
          </form>

          {/* Quick Stats Grid */}
          <div className="grid grid-4" style={{ gap: 'var(--space-4)', maxWidth: '900px', margin: '0 auto' }}>
            <div className="card-glass" style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'center', background: 'rgba(30,41,59,0.2)' }}>
              <p style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)', color: '#fff', margin: 0 }}>
                {loading ? '...' : stats.totalListed}
              </p>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', margin: 0 }}>Items Listed</p>
            </div>
            <div className="card-glass" style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'center', background: 'rgba(30,41,59,0.2)' }}>
              <p style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)', color: 'var(--accent-primary)', margin: 0 }}>
                {loading ? '...' : stats.totalRequests}
              </p>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', margin: 0 }}>Active Requests</p>
            </div>
            <div className="card-glass" style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'center', background: 'rgba(30,41,59,0.2)' }}>
              <p style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)', color: 'var(--accent-success)', margin: 0 }}>
                {loading ? '...' : stats.activeExchanges}
              </p>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', margin: 0 }}>Donates & Exchanges</p>
            </div>
            <div className="card-glass" style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'center', background: 'rgba(30,41,59,0.2)' }}>
              <p style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)', color: 'var(--accent-warning)', margin: 0 }}>
                {loading ? '...' : `${stats.carbonSaved} kg`}
              </p>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', margin: 0 }}>CO₂ Saved 🌱</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Slider/Grid */}
      <section className="container" style={{ position: 'relative', zIndex: 1, marginBottom: 'var(--space-16)' }}>
        <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-extrabold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={22} style={{ color: 'var(--accent-primary)' }} /> Browse Categories
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Find exactly what you need quickly</p>
        </div>
        <div className="grid grid-4" style={{ gap: 'var(--space-4)' }}>
          {CATEGORIES.map((cat) => (
            <Link 
              key={cat.name} 
              href={`/marketplace?category=${encodeURIComponent(cat.name)}`}
              className="card-glass card-interactive" 
              style={{ 
                padding: 'var(--space-4) var(--space-5)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-3)', 
                textDecoration: 'none', 
                color: 'inherit',
                background: 'rgba(30, 41, 59, 0.25)' 
              }}
            >
              <span style={{ fontSize: '2rem' }}>{cat.emoji}</span>
              <div>
                <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 0 }}>{cat.name}</h3>
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', margin: 0 }}>{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Listings Section */}
      {featuredListings.length > 0 && (
        <section className="container" style={{ position: 'relative', zIndex: 1, marginBottom: 'var(--space-16)' }}>
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-extrabold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={22} style={{ color: 'var(--accent-warning)' }} /> Featured Listings
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>Premium handpicked items from top sellers</p>
            </div>
            <Link href="/marketplace" className="btn btn-ghost hide-mobile">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-3" style={{ gap: 'var(--space-6)' }}>
            {featuredListings.map((item) => (
              <Link key={item.id} href={`/marketplace/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="listing-card" style={{ border: '1px solid rgba(245, 158, 11, 0.2)', boxShadow: '0 4px 20px rgba(245, 158, 11, 0.05)' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={item.imageUrl} alt={item.title} className="listing-card-image" style={{ height: '220px', objectFit: 'cover' }} />
                    <span className="badge badge-warning" style={{ position: 'absolute', top: '12px', left: '12px', boxShadow: 'var(--shadow-sm)' }}>FEATURED</span>
                    <span className={`badge ${item.listingType === 'Rent' ? 'badge-info' : item.listingType === 'Donate' ? 'badge-success' : 'badge-primary'}`} style={{ position: 'absolute', top: '12px', right: '12px' }}>
                      {item.listingType}
                    </span>
                  </div>
                  <div className="listing-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-1)' }}>
                      <span className="badge" style={{ fontSize: '10px' }}>{item.category}</span>
                      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>{item.condition} condition</span>
                    </div>
                    <h3 className="listing-card-title" style={{ fontSize: 'var(--fs-base)', fontWeight: 'bold' }}>{item.title}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-3)' }}>
                      <p className="price-tag" style={{ margin: 0, fontSize: 'var(--fs-lg)' }}>
                        {item.price > 0 ? `₹${item.price}` : 'Free'}
                      </p>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>by {item.sellerName}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Grid: Trending Items & Recently Added */}
      <section className="container" style={{ position: 'relative', zIndex: 1, marginBottom: 'var(--space-16)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-12)' }}>
          
          {/* Trending Items */}
          <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-extrabold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flame size={22} style={{ color: 'var(--accent-danger)' }} /> Trending Now
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>Most viewed items this week</p>
              </div>
              <Link href="/marketplace" className="btn btn-ghost">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            
            {loading ? (
              <div className="flex-center" style={{ minHeight: '200px' }}><div className="spinner" /></div>
            ) : trendingItems.length === 0 ? (
              <div className="card-glass" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>No items listed yet.</div>
            ) : (
              <div className="grid grid-4" style={{ gap: 'var(--space-4)' }}>
                {trendingItems.map((item) => (
                  <Link key={item.id} href={`/marketplace/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="listing-card">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="listing-card-image" style={{ height: '140px', objectFit: 'cover' }} />
                      ) : (
                        <div className="listing-card-image" style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)' }}>📦</div>
                      )}
                      <div className="listing-card-body" style={{ padding: 'var(--space-3)' }}>
                        <span className="badge" style={{ fontSize: '8px', padding: '1px 4px', marginBottom: '4px' }}>{item.category}</span>
                        <h4 className="listing-card-title" style={{ fontSize: 'var(--fs-sm)', margin: '0 0 var(--space-2) 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p className="price-tag" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>
                            {item.price > 0 ? `₹${item.price}` : 'Free'}
                          </p>
                          <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>🔥 {item.views || 0} views</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recently Added */}
          <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-extrabold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={22} style={{ color: 'var(--accent-success)' }} /> Recently Added
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>Fresh listings from your campus mates</p>
              </div>
              <Link href="/marketplace" className="btn btn-ghost">
                View All <ArrowRight size={16} />
              </Link>
            </div>

            {loading ? (
              <div className="flex-center" style={{ minHeight: '200px' }}><div className="spinner" /></div>
            ) : recentlyAdded.length === 0 ? (
              <div className="card-glass" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>No items listed yet.</div>
            ) : (
              <div className="grid grid-4" style={{ gap: 'var(--space-4)' }}>
                {recentlyAdded.map((item) => (
                  <Link key={item.id} href={`/marketplace/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="listing-card">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="listing-card-image" style={{ height: '140px', objectFit: 'cover' }} />
                      ) : (
                        <div className="listing-card-image" style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)' }}>📦</div>
                      )}
                      <div className="listing-card-body" style={{ padding: 'var(--space-3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span className="badge" style={{ fontSize: '8px', padding: '1px 4px' }}>{item.category}</span>
                          <span className={`badge ${item.listingType === 'Donate' ? 'badge-success' : item.listingType === 'Sell' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>{item.listingType}</span>
                        </div>
                        <h4 className="listing-card-title" style={{ fontSize: 'var(--fs-sm)', margin: '0 0 var(--space-2) 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p className="price-tag" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>
                            {item.price > 0 ? `₹${item.price}` : 'Free'}
                          </p>
                          <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
                            {item.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(item.createdAt.toDate()) : 'Recent'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Grid: Popular Requests & Top Sellers */}
      <section className="container" style={{ position: 'relative', zIndex: 1, marginBottom: 'var(--space-16)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-8)' }}>
          
          {/* Popular Requests */}
          <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-extrabold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📋 Active Student Requests
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>Can you help provide these items?</p>
              </div>
              <Link href="/requests" className="btn btn-ghost btn-sm">
                View Board
              </Link>
            </div>

            {loading ? (
              <div className="flex-center" style={{ minHeight: '150px' }}><div className="spinner" /></div>
            ) : requests.length === 0 ? (
              <div className="card-glass" style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No active requests. Need something? <Link href="/requests" style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>Post a Request</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {requests.slice(0, 3).map((req) => (
                  <div key={req.id} className="card-glass" style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(30,41,59,0.2)' }}>
                    <div style={{ flex: 1, marginRight: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                        <span className="badge badge-success" style={{ fontSize: '8px', padding: '1px 4px' }}>{req.status || 'Open'}</span>
                        {req.urgency && <span className={`badge ${req.urgency === 'Urgent' || req.urgency === 'High' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>{req.urgency}</span>}
                      </div>
                      <h4 style={{ fontSize: 'var(--fs-base)', fontWeight: 'bold', margin: '0 0 var(--space-1) 0' }}>{req.title}</h4>
                      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', margin: '0 0 var(--space-2) 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{req.description}</p>
                      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Requested by {req.requesterName}</span>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p className="price-tag" style={{ fontSize: 'var(--fs-base)', marginBottom: 'var(--space-2)', marginTop: 0 }}>
                        {req.budget > 0 ? `₹${req.budget}` : 'Any budget'}
                      </p>
                      <Link href={`/chat`} className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>
                        Offer Item
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Sellers */}
          <div>
            <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-extrabold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🌟 Top Sellers
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>Most active student traders</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {topSellers.length === 0 ? (
                <div className="card-glass" style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No campus sellers active yet.
                </div>
              ) : (
                topSellers.map((seller) => (
                  <div key={seller.id} className="card-glass" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'rgba(30,41,59,0.25)' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--gradient-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: '#fff',
                      fontSize: 'var(--fs-sm)',
                      flexShrink: 0
                    }}>
                      {seller.avatar}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 'bold', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {seller.name} <ShieldCheck size={14} className="text-link" />
                      </h4>
                      <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0 }}>{seller.branch} • {seller.year}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span className="badge badge-info" style={{ fontSize: '8px', padding: '1px 3px' }}>Lvl {seller.level}</span>
                        <span style={{ fontSize: '10px', color: 'var(--accent-warning)', fontWeight: 'bold' }}>⭐ {seller.rating}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Floating CTA Banner */}
      <section className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="card-glass" style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          padding: 'var(--space-10) var(--space-8)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <h2 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 'var(--fw-extrabold)', marginBottom: 'var(--space-3)' }}>
            Got Stuff Lying Around in Your Hostel?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-base)', maxWidth: '520px', margin: '0 auto var(--space-6)' }}>
            Turn your old books, lab coats, drafters, or electronics into extra pocket money. Help a junior save costs!
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Link href="/marketplace/create" className="btn btn-primary btn-lg">
              <PlusCircle size={18} /> Sell an Item Now
            </Link>
            <Link href="/requests" className="btn btn-secondary btn-lg">
              View Request Board
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}