'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ENGINEERING_BRANCHES } from '@/lib/constants';
import { 
  Search, SlidersHorizontal, ArrowUpDown, Download, Eye, 
  Mail, Heart, ExternalLink, FileText, ClipboardList, BookOpen, 
  Laptop, FolderOpen, Package, User, Clock, ArrowUpRight, MessageSquare, RotateCcw
} from 'lucide-react';

export default function CategoryPage({ categoryName, categoryEmoji, categoryDesc }) {
  const { user, userData, refreshUserData } = useAuth();
  const toast = useToast();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState('All');
  const [subcategoryFilter, setSubcategoryFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [listingTypeFilter, setListingTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'downloads', 'priceAsc', 'priceDesc'
  
  const [showFilters, setShowFilters] = useState(true);

  // Sync data with Firestore
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'listings'), 
      where('category', '==', categoryName)
    );

    const unsub = onSnapshot(q, (snap) => {
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error(`Error loading category ${categoryName} listings:`, err);
      setLoading(false);
    });

    return () => unsub();
  }, [categoryName]);

  // Wishlist logic
  const handleToggleWishlist = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to save items.');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const docRef = doc(db, 'listings', id);
      const currentWishlist = userData?.wishlist || [];
      const saved = currentWishlist.includes(id);

      let newWishlist;
      if (saved) {
        newWishlist = currentWishlist.filter(x => x !== id);
        await updateDoc(docRef, { saves: increment(-1) });
        toast.success('Removed from wishlist');
      } else {
        newWishlist = [...currentWishlist, id];
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

  // PDF Download tracker
  const handleDownloadPDF = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.pdfUrl) return;

    try {
      const docRef = doc(db, 'listings', item.id);
      await updateDoc(docRef, {
        downloads: increment(1)
      });
      
      toast.success('Download starting...');
      window.open(item.pdfUrl, '_blank');
    } catch (err) {
      console.error('Error updating downloads tracker:', err);
      toast.error('Could not log download activity.');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setSemesterFilter('All');
    setDeptFilter('All');
    setAssignmentTypeFilter('All');
    setSubcategoryFilter('All');
    setConditionFilter('All');
    setListingTypeFilter('All');
    setSortBy('newest');
    toast.success('Filters reset');
  };

  // Filter listings
  const filtered = listings.filter(item => {
    // 1. Search
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(s);
      const matchDesc = item.description?.toLowerCase().includes(s);
      const matchSubject = item.subjectName?.toLowerCase().includes(s);
      const matchAuthor = item.author?.toLowerCase().includes(s);
      const matchFaculty = item.facultyName?.toLowerCase().includes(s);
      const matchSeller = item.sellerName?.toLowerCase().includes(s);
      if (!matchTitle && !matchDesc && !matchSubject && !matchAuthor && !matchFaculty && !matchSeller) {
        return false;
      }
    }

    // 2. Semester
    if (categoryName === 'Notes' || categoryName === 'Assignments' || categoryName === 'Study Materials') {
      if (semesterFilter !== 'All' && String(item.semester) !== semesterFilter) return false;
    }

    // 3. Department
    if (categoryName === 'Notes') {
      if (deptFilter !== 'All' && item.department !== deptFilter) return false;
    }

    // 4. Assignment Type
    if (categoryName === 'Assignments') {
      if (assignmentTypeFilter !== 'All' && item.assignmentType !== assignmentTypeFilter) return false;
    }

    // 5. Study Materials Subcategory
    if (categoryName === 'Study Materials') {
      if (subcategoryFilter !== 'All' && item.subcategory !== subcategoryFilter) return false;
    }

    // 6. Condition
    if (categoryName === 'Books' || categoryName === 'Electronics' || categoryName === 'Miscellaneous') {
      if (conditionFilter !== 'All' && item.condition !== conditionFilter) return false;
    }

    // 7. Listing Type
    if (categoryName === 'Books' || categoryName === 'Electronics' || categoryName === 'Miscellaneous') {
      if (listingTypeFilter !== 'All' && item.listingType !== listingTypeFilter) return false;
    }

    return true;
  });

  // Sort listings
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') {
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    }
    if (sortBy === 'downloads') {
      return (b.downloads || 0) - (a.downloads || 0);
    }
    if (sortBy === 'priceAsc') {
      return (a.price || 0) - (b.price || 0);
    }
    if (sortBy === 'priceDesc') {
      return (b.price || 0) - (a.price || 0);
    }
    return 0;
  });

  const pathName = categoryName.toLowerCase().replace(' ', '-');

  return (
    <div className="page-content" style={{ minHeight: '90vh', background: '#0b0f19', color: '#f8fafc' }}>
      <div className="container">
        
        {/* Page Header */}
        <div className="page-header animate-fadeInUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>{categoryEmoji}</span>
              <span>{categoryName} Directory</span>
            </h1>
            <p style={{ color: '#94a3b8' }}>{categoryDesc}</p>
          </div>
          
          <Link href={`/marketplace/create?category=${encodeURIComponent(categoryName)}`} className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)' }}>
            + Post to {categoryName}
          </Link>
        </div>

        {/* Search & Sort Panel */}
        <div className="animate-fadeInUp" style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
          
          {/* Search bar */}
          <div style={{ flex: 1, position: 'relative', minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder={`Search in ${categoryName} by subject, name, author or description...`} 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{
                width: '100%',
                padding: '12px 16px 12px 46px',
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-md)',
                color: '#f8fafc',
                outline: 'none',
                transition: 'all 0.2s',
                fontSize: '14.5px'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%', maxWidth: '380px' }}>
            {/* Sorting */}
            <div style={{ position: 'relative', flex: 1 }}>
              <ArrowUpDown size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 36px',
                  background: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 'var(--radius-md)',
                  color: '#f8fafc',
                  outline: 'none',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                <option value="newest">Sort: Newest</option>
                {(categoryName === 'Notes' || categoryName === 'Assignments' || categoryName === 'Study Materials') && (
                  <option value="downloads">Most Downloaded</option>
                )}
                {(categoryName === 'Books' || categoryName === 'Electronics' || categoryName === 'Miscellaneous') && (
                  <>
                    <option value="priceAsc">Price: Low to High</option>
                    <option value="priceDesc">Price: High to Low</option>
                  </>
                )}
              </select>
            </div>

            {/* Toggle Filters Panel */}
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
              style={{ gap: '8px', padding: '10px 16px' }}
            >
              <SlidersHorizontal size={16} /> Filters
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: showFilters ? '280px 1fr' : '1fr', gap: 'var(--space-6)', transition: 'all 0.3s' }}>
          
          {/* Filters Sidebar */}
          {showFilters && (
            <aside className="filters-panel animate-fadeInUp" style={{ background: 'rgba(17, 24, 39, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px', alignSelf: 'start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#fff' }}>Quick Filter</h3>
                <button 
                  onClick={handleResetFilters} 
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '11px', cursor: 'pointer' }}
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </div>

              {/* Dynamic Categories Filters */}
              {(categoryName === 'Notes' || categoryName === 'Assignments' || categoryName === 'Study Materials') && (
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ fontSize: '12px', color: '#94a3b8' }}>Semester</label>
                  <select className="form-select" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="All">All Semesters</option>
                    {['1', '2', '3', '4', '5', '6', '7', '8'].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              )}

              {categoryName === 'Notes' && (
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ fontSize: '12px', color: '#94a3b8' }}>Department</label>
                  <select className="form-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="All">All Departments</option>
                    {ENGINEERING_BRANCHES.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              {categoryName === 'Assignments' && (
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ fontSize: '12px', color: '#94a3b8' }}>Assignment Type</label>
                  <select className="form-select" value={assignmentTypeFilter} onChange={e => setAssignmentTypeFilter(e.target.value)} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="All">All Types</option>
                    {['Assignment', 'Lab Manual', 'Project Report', 'Mini Project'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              {categoryName === 'Study Materials' && (
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ fontSize: '12px', color: '#94a3b8' }}>Subcategory</label>
                  <select className="form-select" value={subcategoryFilter} onChange={e => setSubcategoryFilter(e.target.value)} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="All">All Subcategories</option>
                    {['Previous Year Papers', 'Lab Manuals', 'Practical Files', 'Viva Notes'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {(categoryName === 'Books' || categoryName === 'Electronics' || categoryName === 'Miscellaneous') && (
                <>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label" style={{ fontSize: '12px', color: '#94a3b8' }}>Condition</label>
                    <select className="form-select" value={conditionFilter} onChange={e => setConditionFilter(e.target.value)} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <option value="All">All Conditions</option>
                      {['New', 'Like New', 'Good', 'Fair', 'Poor'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label" style={{ fontSize: '12px', color: '#94a3b8' }}>Listing Type</label>
                    <select className="form-select" value={listingTypeFilter} onChange={e => setListingTypeFilter(e.target.value)} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <option value="All">All Types</option>
                      {['Sell', 'Rent', 'Donate', 'Exchange'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </aside>
          )}

          {/* Grid Content */}
          <main style={{ flex: 1 }}>
            {loading ? (
              <div className="flex-center" style={{ minHeight: '300px' }}>
                <div className="spinner spinner-lg" />
              </div>
            ) : sorted.length === 0 ? (
              <div className="empty-state" style={{ background: 'rgba(17, 24, 39, 0.4)', padding: '60px 24px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{categoryEmoji}</div>
                <h3>No items in {categoryName}</h3>
                <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '0 auto 20px' }}>Be the first student to upload files or items in this section and gain Level XP!</p>
                <Link href={`/marketplace/create?category=${encodeURIComponent(categoryName)}`} className="btn btn-primary">
                  Upload to {categoryName}
                </Link>
              </div>
            ) : (
              <div className="grid grid-3 stagger-children">
                {sorted.map(item => {
                  const isSaved = userData?.wishlist?.includes(item.id) || false;
                  const isAcademic = categoryName === 'Notes' || categoryName === 'Assignments' || categoryName === 'Study Materials';
                  const dateStr = item.createdAt?.seconds 
                    ? new Date(item.createdAt.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Recently';

                  return (
                    <div 
                      key={item.id} 
                      className="listing-card"
                      style={{
                        background: 'rgba(15, 23, 42, 0.4)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.25s, border-color 0.25s',
                        height: '100%',
                        position: 'relative'
                      }}
                    >
                      
                      {/* Image / Emoji Thumbnail Wrapper */}
                      <Link href={`/marketplace/${item.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                        <div style={{ 
                          height: '180px', 
                          background: 'rgba(30, 41, 59, 0.5)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          overflow: 'hidden',
                          position: 'relative',
                          borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.title} 
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          ) : (
                            <div style={{ fontSize: '4.5rem' }}>
                              {categoryName === 'Notes' ? '📝' : 
                               categoryName === 'Assignments' ? '📋' : 
                               categoryName === 'Study Materials' ? '📁' : '📦'}
                            </div>
                          )}

                          {/* Floating Badges */}
                          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', flexDirection: 'column' }}>
                            <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.85)', color: '#fff', fontSize: '10px' }}>{item.category}</span>
                            {item.semester && (
                              <span className="badge badge-info" style={{ fontSize: '10px' }}>Sem {item.semester}</span>
                            )}
                          </div>

                          {/* Price Tag if not Academic */}
                          {!isAcademic && (
                            <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
                              {item.price > 0 ? (
                                <span style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 10px', fontWeight: 'bold', fontSize: '13px', color: '#10b981' }}>
                                  ₹{item.price}
                                </span>
                              ) : (
                                <span className="badge badge-success" style={{ fontSize: '10px', padding: '4px 10px' }}>Free</span>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Card Content body */}
                      <div className="listing-card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <Link href={`/marketplace/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <h3 className="listing-card-title" style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: '0 0 6px 0', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </h3>
                        </Link>
                        
                        {/* Subheader descriptions */}
                        <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px', flex: 1 }}>
                          {categoryName === 'Notes' && (
                            <>
                              <div>Subject: <strong style={{ color: '#cbd5e1' }}>{item.subjectName}</strong></div>
                              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Dept: {item.department}</div>
                            </>
                          )}
                          {categoryName === 'Assignments' && (
                            <>
                              <div>Subject: <strong style={{ color: '#cbd5e1' }}>{item.subjectName}</strong></div>
                              <div>Faculty: {item.facultyName}</div>
                              <div>Type: <span className="badge" style={{ fontSize: '9px', padding: '1px 5px' }}>{item.assignmentType}</span></div>
                            </>
                          )}
                          {categoryName === 'Study Materials' && (
                            <>
                              <div>Subject: <strong style={{ color: '#cbd5e1' }}>{item.subjectName}</strong></div>
                              <div>Subcategory: <span className="badge badge-warning" style={{ fontSize: '9px', padding: '1px 5px' }}>{item.subcategory}</span></div>
                            </>
                          )}
                          {!isAcademic && (
                            <>
                              <div style={{ textTransform: 'capitalize' }}>Condition: <strong style={{ color: '#cbd5e1' }}>{item.condition}</strong></div>
                              <div>Type: <span className="badge badge-info" style={{ fontSize: '9px', padding: '1px 5px' }}>{item.listingType}</span></div>
                            </>
                          )}
                        </div>

                        {/* Uploader Metas & Download counts */}
                        <div className="listing-card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                            <User size={12} /> {item.sellerName || 'Verified Student'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isAcademic ? (
                              <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>⬇ {item.downloads || 0}</span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}><Eye size={12} style={{ display: 'inline', marginRight: '2px' }} /> {item.views || 0}</span>
                            )}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Clock size={11} /> {dateStr}</span>
                          </span>
                        </div>

                        {/* Quick Actions Panel */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
                          <Link href={`/marketplace/${item.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '11px', padding: '6px 0', justifyContent: 'center' }}>
                            <ExternalLink size={12} /> View
                          </Link>
                          
                          {isAcademic && item.pdfUrl ? (
                            <button onClick={(e) => handleDownloadPDF(e, item)} className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: '11px', padding: '6px 0', justifyContent: 'center', gap: '4px' }}>
                              <Download size={12} /> Get PDF
                            </button>
                          ) : !isAcademic ? (
                            <Link href={`/chat?itemId=${item.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '11px', padding: '6px 0', justifyContent: 'center', gap: '4px' }}>
                              <MessageSquare size={12} /> Chat
                            </Link>
                          ) : (
                            <div style={{ flex: 1 }} />
                          )}

                          <button 
                            onClick={(e) => handleToggleWishlist(e, item.id)} 
                            className="btn btn-ghost btn-sm" 
                            style={{ 
                              padding: '6px 8px', 
                              borderRadius: '8px', 
                              border: '1px solid rgba(255,255,255,0.08)',
                              color: isSaved ? 'var(--accent-danger)' : '#94a3b8'
                            }}
                          >
                            <Heart size={14} fill={isSaved ? 'var(--accent-danger)' : 'none'} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
