'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { uploadImage } from '@/lib/cloudinary';
import { useGamification } from '@/context/GamificationContext';
import { useSearchParams } from 'next/navigation';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import VerifiedBadge from '@/components/auth/VerifiedBadge';
import { ENGINEERING_BRANCHES, CAMPUSES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Award, Clock, ShoppingCart, Star, FileText,
  MapPin, ShieldCheck, Heart, Package, Mail, Briefcase, Plus, MessageSquare, 
  ChevronUp, ChevronDown, Check, Trash2, Eye, Pin, Edit3, Flame
} from 'lucide-react';
import Link from 'next/link';

const years = ['FE (1st Year)', 'SE (2nd Year)', 'TE (3rd Year)', 'BE (4th Year)', 'ME/M.Tech'];

// --- CUSTOM SVG LOGOS ---
const Github = (props) => (
  <svg viewBox="0 0 24 24" width={props.size || 20} height={props.size || 20} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = (props) => (
  <svg viewBox="0 0 24 24" width={props.size || 20} height={props.size || 20} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
          <span>Loading portfolio...</span>
        </div>
      }>
        <ProfileContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, userData, refreshUserData } = useAuth();
  const toast = useToast();
  const { 
    level, levelTitle, xp, xpNeeded, streak, 
    unlockedAchievements, achievementsList, gainXP, unlockAchievement 
  } = useGamification();
  
  const [activeTab, setActiveTab] = useState('Listings');
  const [saving, setSaving] = useState(false);
  const [profilePicProgress, setProfilePicProgress] = useState(0);
  const [uploadingPic, setUploadingPic] = useState(false);

  // Live User Data states
  const [userListings, setUserListings] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync tab with URL search parameter "?tab="
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam) {
      const allowedTabs = ['Listings', 'Missions', 'Achievements', 'Looking For', 'Wishlist', 'Reviews', 'Activity', 'Settings'];
      let targetTab = tabParam.charAt(0).toUpperCase() + tabParam.slice(1).toLowerCase();
      
      if (tabParam.toLowerCase() === 'lookingfor' || tabParam.toLowerCase() === 'looking-for') {
        targetTab = 'Looking For';
      }
      
      if (allowedTabs.includes(targetTab)) {
        setActiveTab(targetTab);
      }
    }
  }, [tabParam]);

  // Real Firestore Subscriptions
  useEffect(() => {
    if (!user) return;

    // 1. Listings
    const listingsQ = query(collection(db, 'listings'), where('sellerId', '==', user.uid));
    const unsubListings = onSnapshot(listingsQ, (snap) => {
      setUserListings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // 2. Requests
    const requestsQ = query(collection(db, 'requests'), where('requesterId', '==', user.uid));
    const unsubRequests = onSnapshot(requestsQ, (snap) => {
      setUserRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. Wishlist IDs from Database user doc
    const savedIds = userData?.wishlist || [];
    if (savedIds.length > 0) {
      const wishlistQ = query(collection(db, 'listings'));
      const unsubWishlist = onSnapshot(wishlistQ, (snap) => {
        const allItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setWishlistItems(allItems.filter(item => savedIds.includes(item.id)));
      });
      return () => {
        unsubListings();
        unsubRequests();
        unsubWishlist();
      };
    } else {
      setWishlistItems([]);
    }

    return () => {
      unsubListings();
      unsubRequests();
    };
  }, [user, userData]);

  // Fetch reviews (fallback to empty)
  useEffect(() => {
    if (!user) return;
    const reviewsQ = query(collection(db, 'reviews'), where('sellerId', '==', user.uid));
    const unsubReviews = onSnapshot(reviewsQ, (snap) => {
      setUserReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubReviews();
  }, [user]);

  // Dynamic calculations for quests / missions
  const listingsCount = userListings.length;
  const isVerified = userData?.verified === true ? 1 : 0;
  const hasPhotos = userListings.some(l => l.imageUrl) ? 1 : 0;

  const currentMissions = [
    { id: 'mission_1', title: 'Post 3 Listings on Campus', progress: Math.min(listingsCount, 3), target: 3, xp: 50 },
    { id: 'mission_2', title: 'Verify Your Profile', progress: isVerified, target: 1, xp: 50 },
    { id: 'mission_3', title: 'Upload Listing Photos', progress: hasPhotos, target: 1, xp: 10 }
  ];

  const userActivity = [];
  userListings.forEach(l => {
    userActivity.push({
      id: `list_${l.id}`,
      action: `You listed: "${l.title}" for ${l.listingType}`,
      time: l.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(l.createdAt.toDate()) : 'Recently'
    });
  });
  userRequests.forEach(r => {
    userActivity.push({
      id: `req_${r.id}`,
      action: `You requested: "${r.title}"`,
      time: r.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(r.createdAt.toDate()) : 'Recently'
    });
  });

  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    campus: '',
    department: '',
    year: '',
    bio: '',
    github: '',
    linkedin: '',
    resume: '',
    photoURL: '',
    notificationPreferences: { globalMute: false, mutedCategories: [] },
  });

  useEffect(() => {
    if (userData) {
      setForm({
        displayName: userData.displayName || '',
        phone: userData.phone || '',
        campus: userData.campus || '',
        department: userData.department || '',
        year: userData.year || '',
        bio: userData.bio || '',
        github: userData.github || '',
        linkedin: userData.linkedin || '',
        resume: userData.resume || '',
        photoURL: userData.photoURL || '',
        notificationPreferences: userData.notificationPreferences || { globalMute: false, mutedCategories: [] },
      });
    }
  }, [userData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: form.displayName,
        phone: form.phone,
        campus: form.campus,
        department: form.department,
        year: form.year,
        bio: form.bio,
        github: form.github,
        linkedin: form.linkedin,
        resume: form.resume,
        photoURL: form.photoURL,
        notificationPreferences: form.notificationPreferences,
      });
      await refreshUserData();
      toast.success('Marketplace profile updated!');
      setActiveTab('Listings');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const TABS = ['Listings', 'Missions', 'Achievements', 'Looking For', 'Wishlist', 'Reviews', 'Activity', 'Settings'];

  // User Stats
  const trustScore = userData?.trustScore; // Display only if exists in db
  const sellerRating = userData?.rating;
  const buyerRating = userData?.buyerRating;
  const transactions = userListings.filter(l => l.status === 'Sold' || l.status === 'Rented').length;

  // Automatically verify/unlock achievements based on database records
  useEffect(() => {
    if (!user || !userData) return;
    
    // Welcome/First Login
    unlockAchievement('first_login');
    
    // First Listing
    if (listingsCount >= 1) {
      unlockAchievement('first_listing');
    }
    // First Purchase
    if (userData.downloadsCount >= 1) {
      unlockAchievement('first_purchase');
    }
    // Verified Student
    if (userData.verified) {
      unlockAchievement('verified_student');
    }
    // Successful sales
    if (transactions >= 1) {
      unlockAchievement('first_sale');
    }
    if (transactions >= 5) {
      unlockAchievement('sales_5');
    }
  }, [listingsCount, transactions, userData, user]);

  return (
    <div className="page-content" style={{ padding: 'var(--space-6) 0 var(--space-16)' }}>
      <div className="container" style={{ maxWidth: 1150 }}>
        
        <div className="profile-grid">
          
          {/* ================= LEFT COLUMN: TRUST, LEVEL & REPUTATION ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* User Level Card */}
            <div className="card-glass" style={{ padding: 'var(--space-5)', position: 'relative', overflow: 'hidden' }}>
              
              {/* Trust Score Header Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                {trustScore !== undefined ? (
                  <span className="badge badge-success" style={{ padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                    <ShieldCheck size={12} /> {trustScore}% Trust
                  </span>
                ) : (
                  <span className="badge badge-secondary" style={{ padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                    <ShieldCheck size={12} /> No Trust Score
                  </span>
                )}
                <span className="badge badge-warning" style={{ padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                  <Flame size={12} fill={streak > 0 ? "currentColor" : "none"} /> {streak > 0 ? `${streak} Day Streak` : 'No Streak'}
                </span>
              </div>

              {/* Avatar + Level Title */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ 
                  width: 60, height: 60, borderRadius: '50%', background: 'var(--gradient-primary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', color: '#fff',
                  border: '2px solid var(--border-color)', boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden'
                }}>
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  ) : (
                    getInitials(userData?.displayName)
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 'var(--fw-bold)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {userData?.displayName || 'Student'}
                    {userData?.verified && <VerifiedBadge size="sm" />}
                  </h3>
                  <span className="badge badge-primary" style={{ fontSize: '9px', padding: '1px 6px', marginTop: '2px' }}>
                    Level {level}: {levelTitle}
                  </span>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Progress to Level {level < 8 ? level + 1 : 'Max'}</span>
                  <span>{xp} / {xpNeeded} XP</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${(xp / xpNeeded) * 100}%`, height: '100%', background: 'var(--gradient-success)' }} />
                </div>
              </div>
            </div>

            {/* Quick Bio Info */}
            <div className="card-glass flex-col gap-3">
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Mail size={12} /> {user?.email}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <MapPin size={12} /> {userData?.campus || 'Campus Not Set'} • {userData?.department || 'Branch'}
              </p>
              <p style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-sm)', lineHeight: 1.4, margin: '6px 0 0', fontStyle: form.bio ? 'normal' : 'italic' }}>
                {form.bio || "No bio added yet."}
              </p>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                {form.github && <a href={form.github} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}><Github size={16} /></a>}
                {form.linkedin && <a href={form.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}><Linkedin size={16} /></a>}
                {form.resume && <a href={form.resume} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}><FileText size={16} /></a>}
              </div>
            </div>

            {/* Reputation Section */}
            <div className="card-glass flex-col gap-4">
              <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Marketplace Reputation
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Seller Rating</span>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: sellerRating > 0 ? 'var(--accent-warning)' : 'var(--text-tertiary)' }}>
                    <Star size={16} fill={sellerRating > 0 ? 'currentColor' : 'none'} /> {sellerRating > 0 ? sellerRating.toFixed(1) : 'N/A'}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Buyer Rating</span>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: buyerRating > 0 ? 'var(--accent-info)' : 'var(--text-tertiary)' }}>
                    <Star size={16} fill={buyerRating > 0 ? 'currentColor' : 'none'} /> {buyerRating > 0 ? buyerRating.toFixed(1) : 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Successful Transactions</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{transactions} completed</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Active Listings</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{userListings.filter(l => l.status === 'active').length} items</strong>
                </div>
              </div>
            </div>

            {/* Marketplace Analytics */}
            <div className="card-glass flex-col gap-4">
              <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Marketplace Analytics
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Listings Sold</span>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '2px 0 0', color: 'var(--accent-success)' }}>
                    {userListings.filter(l => l.listingType === 'Sell' && l.status === 'Sold').length}
                  </p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Listings Rented</span>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '2px 0 0', color: 'var(--accent-primary)' }}>
                    {userListings.filter(l => l.listingType === 'Rent' && l.status === 'Rented').length}
                  </p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Views</span>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '2px 0 0' }}>
                    {userListings.reduce((sum, l) => sum + (l.views || 0), 0)}
                  </p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Saves / Wishlist</span>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '2px 0 0' }}>
                    {userListings.reduce((sum, l) => sum + (l.saves || 0), 0)}
                  </p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Response Rate</span>
                  <span style={{ color: 'var(--accent-success)', fontWeight: 'bold' }}>{userData?.responseRate || 100}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> Avg Response Time</span>
                  <span>{userData?.responseTime || 'N/A'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: INTERACTIVE TABS ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Navigation Tabs */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-2)' }}>
              {TABS.map(tab => (
                <button 
                  key={tab} 
                  className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`} 
                  onClick={() => setActiveTab(tab)}
                  style={{ fontSize: 'var(--fs-sm)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)' }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content view wrapper */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'Listings' && <ListingsTab listings={userListings} />}
                {activeTab === 'Missions' && <MissionsTab missions={currentMissions} />}
                {activeTab === 'Achievements' && <AchievementsTab list={achievementsList} unlocked={unlockedAchievements} />}
                {activeTab === 'Looking For' && <LookingForTab requests={userRequests} />}
                {activeTab === 'Wishlist' && <WishlistTab items={wishlistItems} />}
                {activeTab === 'Reviews' && <ReviewsTab reviews={userReviews} rating={sellerRating} />}
                {activeTab === 'Activity' && <ActivityTab activity={userActivity} />}
                {activeTab === 'Settings' && (
                  <SettingsTab 
                    form={form} 
                    setForm={setForm} 
                    handleSave={handleSave} 
                    saving={saving} 
                    profilePicProgress={profilePicProgress}
                    setProfilePicProgress={setProfilePicProgress}
                    uploadingPic={uploadingPic}
                    setUploadingPic={setUploadingPic}
                  />
                )}
              </motion.div>
            </AnimatePresence>

          </div>

        </div>

      </div>
    </div>
  );
}

// --- ACTIVE LISTINGS TAB ---
function ListingsTab({ listings }) {
  if (!listings || listings.length === 0) {
    return (
      <div className="card-glass text-center animate-fadeInUp" style={{ padding: 'var(--space-12)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🛒</div>
        <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-2)' }}>No listings yet</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--space-6)' }}>
          List your old textbooks, calculators, aprons, or campus cycles to make extra cash!
        </p>
        <Link href="/marketplace/create" className="btn btn-primary">Create Your First Listing</Link>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    if (status === 'active') return 'badge-success';
    if (status === 'Sold') return 'badge-danger';
    if (status === 'Rented') return 'badge-warning';
    return 'badge-info';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-3)' }}>Active Listings</h3>
        <div className="grid grid-2">
          {listings.map(item => (
            <div key={item.id} className="card-glass card-interactive" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              <div style={{ height: 120, background: item.imageUrl ? `url(${item.imageUrl}) center/cover` : 'var(--bg-tertiary)', position: 'relative' }}>
                {!item.imageUrl && (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>📦</div>
                )}
                <span className={`badge ${getStatusBadgeClass(item.status)}`} style={{ position: 'absolute', bottom: 10, left: 10 }}>{item.status}</span>
              </div>
              <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{item.category} • {item.condition} condition</span>
                <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 'bold', margin: '2px 0 0', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-3)' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-success)', fontSize: 'var(--fs-base)' }}>
                    {item.price > 0 ? `₹${item.price}` : 'Free'}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Link href={`/marketplace/${item.id}`} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}><Eye size={13} /></Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- MISSIONS TAB ---
function MissionsTab({ missions }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 0 }}>Marketplace Quests</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', margin: '0 0 10px' }}>Active quests automatically track your campus transaction progress and reward experience points.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {missions.map(m => {
          const isDone = m.progress >= m.target;
          return (
            <div key={m.id} className="card-glass" style={{ border: isDone ? '1px solid var(--accent-success)' : '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 'bold', margin: 0, color: '#fff' }}>{m.title}</h4>
                <span className="badge badge-success">+{m.xp} XP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    <span>Quest Progress</span>
                    <span>{m.progress} / {m.target}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${(m.progress / m.target) * 100}%`, height: '100%', background: isDone ? 'var(--gradient-success)' : 'var(--gradient-primary)' }} />
                  </div>
                </div>
                {isDone && (
                  <span style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    <Check size={16} /> Completed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- ACHIEVEMENTS TAB ---
function AchievementsTab({ list, unlocked }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 0 }}>Achievements Lockbox</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', margin: '0 0 12px' }}>Complete activities, list items, and get reviews to unlock badges.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {list.map(ach => {
          const isUnlocked = unlocked.includes(ach.id);
          return (
            <div 
              key={ach.id} 
              className="card-glass" 
              style={{ 
                padding: 'var(--space-4)', 
                textAlign: 'center', 
                filter: isUnlocked ? 'none' : 'grayscale(1) opacity(0.35)',
                border: isUnlocked ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '28px' }}>{ach.badge}</span>
              <strong style={{ fontSize: 'var(--fs-xs)', color: isUnlocked ? '#fff' : 'var(--text-secondary)', display: 'block' }}>{ach.title}</strong>
              <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', lineHeight: 1.2 }}>{ach.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- LOOKING FOR TAB ---
function LookingForTab({ requests }) {
  if (!requests || requests.length === 0) {
    return (
      <div className="card-glass text-center animate-fadeInUp" style={{ padding: 'var(--space-12)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📋</div>
        <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-2)' }}>No requests posted yet</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--space-6)' }}>
          Looking for a calculator, drawing instruments, or hostel gear? Post on the board!
        </p>
        <Link href="/requests" className="btn btn-primary">Create Your First Request</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 0 }}>Requests Posted</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {requests.map(req => (
          <div key={req.id} className="card-glass" style={{ borderLeft: '4px solid var(--accent-info)', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{req.category}</span>
                <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 'bold', margin: '2px 0 0' }}>{req.title}</h4>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>Target Budget: <strong style={{ color: 'var(--accent-success)' }}>{req.budget > 0 ? `₹${req.budget}` : 'Any budget'}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- WISHLIST TAB ---
function WishlistTab({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="card-glass text-center animate-fadeInUp" style={{ padding: 'var(--space-12)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>❤️</div>
        <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-2)' }}>No wishlist items</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
          Save interesting textbooks, electronics or cycles from the marketplace to check them out later!
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 0 }}>My Saved Items</h3>
      <div className="grid grid-2">
        {items.map(item => (
          <Link key={item.id} href={`/marketplace/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card-glass card-interactive" style={{ display: 'flex', gap: '12px', padding: '10px', alignItems: 'center' }}>
              {item.imageUrl ? (
                <img src={item.imageUrl} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} alt="" />
              ) : (
                <div style={{ width: '56px', height: '56px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📦</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: 'var(--fs-xs)', fontWeight: 'bold', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h4>
                <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{item.category}</p>
                <strong style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent-success)', display: 'block', marginTop: '2px' }}>
                  {item.price > 0 ? `₹${item.price}` : 'Free'}
                </strong>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// --- REVIEWS TAB ---
function ReviewsTab({ reviews, rating }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="card-glass text-center animate-fadeInUp" style={{ padding: 'var(--space-12)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>⭐</div>
        <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-2)' }}>No reviews yet</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
          Complete transactions with verified campus sellers or buyers to earn ratings and feedback.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Rating Summary Banner */}
      <div className="card-glass" style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', padding: 'var(--space-5)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '32px', fontWeight: 'var(--fw-extrabold)', color: 'var(--accent-warning)', margin: 0 }}>{rating.toFixed(1)}</h3>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Out of 5 Stars</span>
        </div>
        <div style={{ flex: 1, height: '100%', borderLeft: '1px solid var(--border-color)', paddingLeft: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', color: 'var(--accent-warning)', gap: '2px' }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.round(rating) ? 'currentColor' : 'none'} />)}
          </div>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>Verified reviews from campus traders</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {reviews.map(r => (
          <div key={r.id} className="card-glass flex-col gap-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${r.type === 'Buyer' ? 'badge-info' : 'badge-success'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>{r.type}</span>
                <strong style={{ fontSize: 'var(--fs-xs)' }}>{r.reviewer}</strong>
              </div>
              <div style={{ display: 'flex', color: 'var(--accent-warning)', gap: '1px' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < r.rating ? 'currentColor' : 'none'} />)}
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', margin: 0, fontStyle: 'italic' }}>"{r.comment}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- ACTIVITY TAB ---
function ActivityTab({ activity }) {
  if (!activity || activity.length === 0) {
    return (
      <div className="card-glass text-center animate-fadeInUp" style={{ padding: 'var(--space-12)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>⏱️</div>
        <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-2)' }}>No recent activity</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
          Create listings or post requests to start tracking activity.
        </p>
      </div>
    );
  }

  return (
    <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
      <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-4)' }}>Activity Log</h3>
      <div style={{ position: 'relative', paddingLeft: '32px' }}>
        {activity.length > 0 && <div style={{ position: 'absolute', left: '11px', top: 0, bottom: 0, width: 2, background: 'var(--border-color)' }} />}
        {activity.map((event, i) => (
          <div key={event.id} style={{ position: 'relative', marginBottom: i === activity.length - 1 ? 0 : 'var(--space-5)' }}>
            <div style={{ position: 'absolute', left: '-27px', top: 2, width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-primary)', border: '2px solid var(--bg-primary)', zIndex: 2 }} />
            <div>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-primary)', margin: 0 }}>{event.action}</p>
              <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>{event.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- SETTINGS TAB ---
function SettingsTab({ 
  form, setForm, handleSave, saving, 
  profilePicProgress, setProfilePicProgress, 
  uploadingPic, setUploadingPic 
}) {
  const toast = useToast();

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return toast.error('Invalid image type. Please select a JPG, PNG, or WEBP image.');
    }
    if (file.size > 10 * 1024 * 1024) {
      return toast.error('Image size must be less than 10MB.');
    }

    setUploadingPic(true);
    setProfilePicProgress(0);
    try {
      const url = await uploadImage(file, (progress) => {
        setProfilePicProgress(progress);
      }, 'sharevit/profiles');
      setForm(prev => ({ ...prev, photoURL: url }));
      toast.success('Profile photo uploaded! Click save to apply changes.');
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingPic(false);
    }
  };

  return (
    <div className="card-glass flex-col gap-4">
      <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', margin: 0 }}>
        Edit Trading Profile
      </h3>
      
      {/* Profile Picture Upload Section */}
      <div className="form-group" style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label className="form-label">Profile Photo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: 64, height: 64, borderRadius: '50%', background: 'var(--gradient-primary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', color: '#fff',
            border: '2px solid var(--border-color)', boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden', flexShrink: 0
          }}>
            {form.photoURL ? (
              <img src={form.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
            ) : (
              '?'
            )}
          </div>
          <div style={{ flex: 1 }}>
            <input 
              type="file" 
              accept="image/*" 
              id="profile-pic-input" 
              style={{ display: 'none' }} 
              onChange={handlePicChange} 
              disabled={uploadingPic}
            />
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              onClick={() => document.getElementById('profile-pic-input').click()}
              disabled={uploadingPic}
              style={{ gap: '6px' }}
            >
              {uploadingPic ? `Uploading (${profilePicProgress}%)` : 'Choose New Photo'}
            </button>
            {uploadingPic && (
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '8px' }}>
                <div style={{ width: `${profilePicProgress}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.2s ease-out' }} />
              </div>
            )}
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-tertiary)' }}>
              Supports JPG, PNG, WEBP up to 10MB
            </p>
          </div>
        </div>
      </div>
      
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Display Name</label>
        <input className="form-input" value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} />
      </div>
      
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Short Trading Bio</label>
        <textarea className="form-textarea" placeholder="Tell students what you sell, when you are active, or where you usually meet on campus..." value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} style={{ minHeight: '60px' }} />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Skills / Pinned Tags (e.g. Arduino, Books)</label>
        <input className="form-input" placeholder="e.g. Electronics, Study Notes, Cycles" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Campus</label>
          <select className="form-select" value={form.campus} onChange={e => setForm(p => ({ ...p, campus: e.target.value }))}>
            <option value="">Select Campus</option>
            {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Branch / Department</label>
          <select className="form-select" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
            <option value="">Select Branch</option>
            {ENGINEERING_BRANCHES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Year</label>
          <select className="form-select" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}>
            <option value="">Select Year</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Phone (Optional)</label>
          <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
        </div>
      </div>

      {/* Social URLs */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">GitHub URL</label>
          <input className="form-input" placeholder="https://github.com/..." value={form.github} onChange={e => setForm(p => ({ ...p, github: e.target.value }))} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">LinkedIn URL</label>
          <input className="form-input" placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={e => setForm(p => ({ ...p, linkedin: e.target.value }))} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Resume Link</label>
          <input className="form-input" placeholder="https://drive.google.com/..." value={form.resume} onChange={e => setForm(p => ({ ...p, resume: e.target.value }))} />
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: 'var(--space-2)' }}>
        {saving ? 'Saving...' : 'Save Marketplace Changes'}
      </button>
    </div>
  );
}