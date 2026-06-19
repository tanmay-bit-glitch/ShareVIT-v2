'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useGamification } from '@/context/GamificationContext';
import { useSearchParams } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import VerifiedBadge from '@/components/auth/VerifiedBadge';
import { ENGINEERING_BRANCHES, CAMPUSES } from '@/lib/constants';
import { NOTIFICATION_CATEGORIES } from '@/lib/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Award, Clock, ShoppingCart, Star, FileText,
  MapPin, ShieldCheck, Heart, Package, UserCheck, Mail, Briefcase, Plus, MessageSquare, GraduationCap, ArrowUpRight, CheckCircle, Search, Edit3, Flame, Calendar, PlusCircle, Pin, Trash2, Eye, Bookmark, MessageCircle, AlertCircle, Share2, HelpCircle, Check
} from 'lucide-react';

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

// --- DUMMY DATA FOR MARKETPLACE PORTFOLIO (V3) ---
const INITIAL_DUMMY_DATA = {
  trustScore: 98,
  memberSince: "Oct 2024",
  lastActive: "10 mins ago",
  sellerRating: 4.9,
  buyerRating: 4.8,
  transactions: 28,
  repeatCustomers: 4,
  analytics: {
    posted: 18,
    sold: 12,
    rented: 4,
    exchanged: 2,
    views: 452,
    saves: 38,
    responseRate: 98,
    responseTime: "15m"
  },
  listings: [
    { id: 1, title: 'Scientific Calculator fx-991EX', price: '₹750', category: 'Calculators', condition: 'Like New', status: 'Available', image: 'https://images.unsplash.com/photo-1580521841315-99881fa4b7b3?auto=format&fit=crop&q=80&w=400', pinned: true },
    { id: 2, title: 'Arduino Uno Ultimate Starter Kit', price: '₹120/wk', category: 'Engineering Tools', condition: 'Good', status: 'Rented', image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=400', pinned: true },
    { id: 3, title: 'Engineering Mechanics Textbook', price: '₹200', category: 'Books', condition: 'Fair', status: 'Available', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400', pinned: false },
    { id: 4, title: 'Lab Apron and Safety Goggles', price: '₹150', category: 'Hostel Essentials', condition: 'New', status: 'Sold', image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&q=80&w=400', pinned: false }
  ],
  lookingFor: [
    { id: 1, title: 'Hostel Study Table (Wood)', budget: '₹500 - ₹800', category: 'Hostel Essentials' },
    { id: 2, title: 'ESP32 Development Board', budget: '₹200 - ₹300', category: 'Engineering Tools' }
  ],
  wishlist: [
    { id: 201, title: 'Campus Cycle (Single Speed)', price: '₹2,500', category: 'Cycles', status: 'Available', image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=400' }
  ],
  reviews: [
    { id: 1, reviewer: 'Rohan Sharma', type: 'Buyer', rating: 5, comment: 'Quick response, item was in perfect condition. Recommend!' },
    { id: 2, reviewer: 'Sneha Patel', type: 'Seller', rating: 5, comment: 'Very polite, prompt payment, smooth transaction.' }
  ],
  activity: [
    { id: 1, action: "Listed a new item: Scientific Calculator fx-991EX", time: "2 hours ago" },
    { id: 2, action: "Sold Lab Apron to Rohan Sharma", time: "1 day ago" },
    { id: 3, action: "Received a 5-star review from Sneha Patel", time: "3 days ago" }
  ]
};

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
  const [dummyData, setDummyData] = useState(INITIAL_DUMMY_DATA);

  // Sync tab with URL search parameter "?tab="
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam) {
      const allowedTabs = ['Listings', 'Missions', 'Achievements', 'Looking For', 'Wishlist', 'Reviews', 'Activity', 'Settings'];
      let targetTab = tabParam.charAt(0).toUpperCase() + tabParam.slice(1).toLowerCase();
      
      // Match specific multi-word tabs
      if (tabParam.toLowerCase() === 'lookingfor' || tabParam.toLowerCase() === 'looking-for') {
        targetTab = 'Looking For';
      }
      
      if (allowedTabs.includes(targetTab)) {
        setActiveTab(targetTab);
      }
    }
  }, [tabParam]);

  // Active Missions State
  const [missions, setMissions] = useState([
    { id: 'mission_1', title: 'Post 3 Listings This Week', progress: 1, target: 3, xp: 50, claimed: false },
    { id: 'mission_2', title: 'Verify Your Profile', progress: 0, target: 1, xp: 50, claimed: false },
    { id: 'mission_3', title: 'Upload Better Listing Photos', progress: 0, target: 1, xp: 10, claimed: false }
  ]);
  
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

  const togglePin = (id) => {
    setDummyData(prev => ({
      ...prev,
      listings: prev.listings.map(l => l.id === id ? { ...l, pinned: !l.pinned } : l)
    }));
    toast.success('Listing pin status updated!');
  };

  const handleCompleteMission = (id) => {
    setMissions(prev => prev.map(m => {
      if (m.id === id) {
        if (m.progress < m.target) {
          const nextProg = m.progress + 1;
          const isDone = nextProg === m.target;
          if (isDone) {
            gainXP(m.xp, `Completed Mission: ${m.title}`);
          }
          return { ...m, progress: nextProg };
        }
      }
      return m;
    }));
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const TABS = ['Listings', 'Missions', 'Achievements', 'Looking For', 'Wishlist', 'Reviews', 'Activity', 'Settings'];

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
                <span className="badge badge-success" style={{ padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                  <ShieldCheck size={12} /> {dummyData.trustScore}% Trust
                </span>
                <span className="badge badge-warning" style={{ padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                  <Flame size={12} fill="currentColor" /> {streak} Day Streak
                </span>
              </div>

              {/* Avatar + Level Title */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ 
                  width: 60, height: 60, borderRadius: '50%', background: 'var(--gradient-primary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', color: '#fff',
                  border: '2px solid var(--border-color)', boxShadow: 'var(--shadow-sm)'
                }}>
                  {getInitials(userData?.displayName)}
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
                  <div style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: 'var(--accent-warning)' }}>
                    <Star size={16} fill="currentColor" /> {dummyData.sellerRating}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Buyer Rating</span>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: 'var(--accent-info)' }}>
                    <Star size={16} fill="currentColor" /> {dummyData.buyerRating}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Successful Transactions</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{dummyData.transactions} completed</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Active Listings</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{dummyData.listings.filter(l => l.status === 'Available').length} items</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Repeat Customers</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{dummyData.repeatCustomers} students</strong>
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
                  <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '2px 0 0', color: 'var(--accent-success)' }}>{dummyData.analytics.sold}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Listings Rented</span>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '2px 0 0', color: 'var(--accent-primary)' }}>{dummyData.analytics.rented}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Views</span>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '2px 0 0' }}>{dummyData.analytics.views}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Saves / Wishlist</span>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '2px 0 0' }}>{dummyData.analytics.saves}</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Response Rate</span>
                  <span style={{ color: 'var(--accent-success)', fontWeight: 'bold' }}>{dummyData.analytics.responseRate}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> Avg Response Time</span>
                  <span>{dummyData.analytics.responseTime}</span>
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
                {activeTab === 'Listings' && <ListingsTab listings={dummyData.listings} togglePin={togglePin} />}
                {activeTab === 'Missions' && <MissionsTab missions={missions} handleCompleteMission={handleCompleteMission} />}
                {activeTab === 'Achievements' && <AchievementsTab list={achievementsList} unlocked={unlockedAchievements} unlock={unlockAchievement} />}
                {activeTab === 'Looking For' && <LookingForTab requests={dummyData.lookingFor} />}
                {activeTab === 'Wishlist' && <WishlistTab items={dummyData.wishlist} />}
                {activeTab === 'Reviews' && <ReviewsTab reviews={dummyData.reviews} rating={dummyData.sellerRating} count={32} />}
                {activeTab === 'Activity' && <ActivityTab activity={dummyData.activity} />}
                {activeTab === 'Settings' && <SettingsTab form={form} setForm={setForm} handleSave={handleSave} saving={saving} />}
              </motion.div>
            </AnimatePresence>

          </div>

        </div>

      </div>

      {/* Floating Quick Action Buttons */}
      <div className="hide-mobile" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button className="btn btn-primary" style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, boxShadow: 'var(--shadow-glow)' }} title="Post Item to Sell">
          <ShoppingCart size={20} />
        </button>
        <button className="btn btn-secondary" style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, background: 'var(--bg-card)' }} title="Post Item to Rent">
          <Calendar size={20} />
        </button>
        <button className="btn btn-secondary" style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, background: 'var(--bg-card)' }} title="Request an Item">
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}

// --- ACTIVE LISTINGS TAB ---
function ListingsTab({ listings, togglePin }) {
  const pinnedListings = listings.filter(l => l.pinned);
  const otherListings = listings.filter(l => !l.pinned);

  const getStatusBadgeClass = (status) => {
    if (status === 'Available') return 'badge-success';
    if (status === 'Sold') return 'badge-danger';
    if (status === 'Rented') return 'badge-warning';
    return 'badge-info';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Pinned/Featured Listings */}
      {pinnedListings.length > 0 && (
        <div>
          <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary-hover)' }}>
            <Pin size={14} /> Featured Items
          </h3>
          <div className="grid grid-2">
            {pinnedListings.map(item => (
              <div key={item.id} className="card-glass card-interactive" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ height: 140, background: `url(${item.image}) center/cover`, position: 'relative' }}>
                  <button 
                    onClick={() => togglePin(item.id)}
                    style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex', color: 'var(--accent-primary-hover)' }}
                  >
                    <Pin size={12} fill="currentColor" />
                  </button>
                  <span className={`badge ${getStatusBadgeClass(item.status)}`} style={{ position: 'absolute', bottom: 10, left: 10 }}>{item.status}</span>
                </div>
                <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{item.category} • {item.condition}</span>
                  <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 'bold', margin: '2px 0 0', color: 'var(--text-primary)' }}>{item.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-3)' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-success)', fontSize: 'var(--fs-base)' }}>{item.price}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }}><Eye size={13} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }}><Edit3 size={13} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All/Other Listings */}
      <div>
        <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-3)' }}>Active Listings</h3>
        {otherListings.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>No other listings posted.</p> : (
          <div className="grid grid-2">
            {otherListings.map(item => (
              <div key={item.id} className="card-glass card-interactive" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ height: 120, background: `url(${item.image}) center/cover`, position: 'relative' }}>
                  <button 
                    onClick={() => togglePin(item.id)}
                    style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}
                  >
                    <Pin size={12} />
                  </button>
                  <span className={`badge ${getStatusBadgeClass(item.status)}`} style={{ position: 'absolute', bottom: 10, left: 10 }}>{item.status}</span>
                </div>
                <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{item.category} • {item.condition}</span>
                  <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 'bold', margin: '2px 0 0', color: 'var(--text-primary)' }}>{item.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-3)' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-success)', fontSize: 'var(--fs-base)' }}>{item.price}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }}><Eye size={13} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }}><Edit3 size={13} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// --- MISSIONS TAB ---
function MissionsTab({ missions, handleCompleteMission }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 0 }}>Marketplace Quests</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', margin: '0 0 10px' }}>Optional missions to boost your experience and portfolio ranking.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {missions.map(m => {
          const isDone = m.progress >= m.target;
          return (
            <div key={m.id} className="card-glass" style={{ border: isDone ? '1px solid var(--accent-success)' : '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 'bold', margin: 0, color: '#fff' }}>{m.title}</h4>
                <span className="badge badge-success">+{m.xp} XP</span>
              </div>
              <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    <span>Quest Progress</span>
                    <span>{m.progress} / {m.target}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${(m.progress / m.target) * 100}%`, height: '100%', background: isDone ? 'var(--gradient-success)' : 'var(--gradient-primary)' }} />
                  </div>
                </div>
                {!isDone ? (
                  <button className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '10px' }} onClick={() => handleCompleteMission(m.id)}>
                    Track
                  </button>
                ) : (
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
function AchievementsTab({ list, unlocked, unlock }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 0 }}>Achievements Lockbox</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', margin: '0 0 12px' }}>Click locked achievements to simulate unlocking them and watch the animation!</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {list.map(ach => {
          const isUnlocked = unlocked.includes(ach.id);
          return (
            <div 
              key={ach.id} 
              onClick={() => !isUnlocked && unlock(ach.id)}
              className="card-glass card-interactive" 
              style={{ 
                padding: 'var(--space-4)', 
                textAlign: 'center', 
                filter: isUnlocked ? 'none' : 'grayscale(1) opacity(0.4)',
                border: isUnlocked ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: isUnlocked ? 'default' : 'pointer'
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 0 }}>Requests Posted</h3>
      {requests.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>No item requests posted yet.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.map(req => (
            <div key={req.id} className="card-glass" style={{ borderLeft: '4px solid var(--accent-info)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{req.category}</span>
                  <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 'bold', margin: '2px 0 0' }}>{req.title}</h4>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }}><Trash2 size={13} /></button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>Target Budget: <strong style={{ color: 'var(--accent-success)' }}>{req.budget}</strong></span>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: '10px' }}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- WISHLIST TAB ---
function WishlistTab({ items }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 0 }}>Wishlist Preview</h3>
      {items.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>No items in wishlist.</p> : (
        <div className="grid grid-2">
          {items.map(item => (
            <div key={item.id} className="card-glass card-interactive" style={{ display: 'flex', gap: '12px', padding: '10px', alignItems: 'center' }}>
              <img src={item.image} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} alt="" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: 'var(--fs-xs)', fontWeight: 'bold', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h4>
                <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{item.category}</p>
                <strong style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent-success)', display: 'block', marginTop: '2px' }}>{item.price}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- REVIEWS TAB ---
function ReviewsTab({ reviews, rating, count }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Rating Summary Banner */}
      <div className="card-glass" style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', padding: 'var(--space-5)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '32px', fontWeight: 'var(--fw-extrabold)', color: 'var(--accent-warning)', margin: 0 }}>{rating}</h3>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Out of 5 Stars</span>
        </div>
        <div style={{ flex: 1, height: '100%', borderLeft: '1px solid var(--border-color)', paddingLeft: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', color: 'var(--accent-warning)', gap: '2px' }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
          </div>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>Verified reviews from buyers and sellers</span>
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
function SettingsTab({ form, setForm, handleSave, saving }) {
  return (
    <div className="card-glass flex-col gap-4">
      <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', margin: 0 }}>
        Edit Trading Profile
      </h3>
      
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