'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const categories = ['All', 'Books', 'Electronics', 'Lab Equipment', 'Stationery', 'Sports', 'Furniture', 'Clothing', 'Other'];
const listingTypes = ['All Types', 'Sell', 'Rent', 'Donate', 'Exchange'];

export default function MarketplacePage() {
  return <ProtectedRoute><MarketplaceContent /></ProtectedRoute>;
}

function MarketplaceContent() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [type, setType] = useState('All Types');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'marketplace'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setListings(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = listings.filter(item => {
    if (category !== 'All' && item.category !== category) return false;
    if (type !== 'All Types' && item.listingType !== type) return false;
    if (search && !item.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-content">
      <div className="container">
        <div className="page-header animate-fadeInUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1>Student Marketplace</h1>
            <p>Buy, sell, rent, donate & exchange with fellow VIT students</p>
          </div>
          <Link href="/marketplace/create" className="btn btn-primary">+ Create Listing</Link>
        </div>

        <div className="search-bar animate-fadeInUp">
          <input placeholder="Search listings..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="filter-bar animate-fadeInUp">
          {categories.map(c => (
            <button key={c} className={`filter-btn ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
        <div className="filter-bar animate-fadeInUp" style={{ marginTop: '-var(--space-4)' }}>
          {listingTypes.map(t => (
            <button key={t} className={`filter-btn ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: 'var(--space-16)' }}><div className="spinner spinner-lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <h3>No listings found</h3>
            <p>Be the first to list something for your fellow students!</p>
            <Link href="/marketplace/create" className="btn btn-primary">Create Listing</Link>
          </div>
        ) : (
          <div className="grid grid-3 stagger-children">
            {filtered.map(item => (
              <Link key={item.id} href={`/marketplace/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="listing-card">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.title} width={400} height={200} className="listing-card-image" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="listing-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'var(--bg-tertiary)' }}>📦</div>
                  )}
                  <div className="listing-card-body">
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      <span className="badge">{item.category}</span>
                      <span className={`badge ${item.listingType === 'Donate' ? 'badge-success' : item.listingType === 'Sell' ? 'badge-warning' : 'badge-info'}`}>{item.listingType}</span>
                    </div>
                    <h3 className="listing-card-title">{item.title}</h3>
                    {item.price > 0 ? (
                      <p className="price-tag">₹{item.price}</p>
                    ) : (
                      <p className="price-tag price-free">Free</p>
                    )}
                    <div className="listing-card-meta">
                      <span>by {item.sellerName || 'Anonymous'}</span>
                      <span>•</span>
                      <span>{item.condition || 'Good'} condition</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}