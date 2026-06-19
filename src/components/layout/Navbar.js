'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { 
  Bell, ShoppingCart, Briefcase, Users, Trophy, 
  Sparkles, MessageSquare, User, LogOut, ChevronDown, Plus, Heart, 
  Star, Settings, Tag, Package, Flame, Clock, Award, 
  HelpCircle, AlertCircle, ShieldCheck, ClipboardList, Home, PlusCircle, Search, X,
  FileText, BookOpen, Laptop, FolderOpen
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const CATEGORIES = ['All', 'Notes', 'Assignments', 'Books', 'Electronics', 'Study Materials', 'PYQs', 'Marketplace Items', 'Miscellaneous'];

export default function Navbar() {
  const { user, userData, signOut, isAuthenticated } = useAuth();
  const { level, streak } = useGamification();
  const pathname = usePathname();
  
  const [openDropdown, setOpenDropdown] = useState(null); // 'marketplace', 'community', 'tools', 'profile', 'notifications'
  const [notifications, setNotifications] = useState([]);
  const [activeBottomSheet, setActiveBottomSheet] = useState(null); // 'marketplace', 'community', 'tools'
  const [desktopSearch, setDesktopSearch] = useState('');
  
  const navbarRef = useRef(null);
  const notificationsRef = useRef(null);

  // Link Definitions
  const marketplaceLinks = [
    { href: '/marketplace/notes', label: 'Notes', icon: FileText },
    { href: '/marketplace/assignments', label: 'Assignments', icon: ClipboardList },
    { href: '/marketplace/books', label: 'Books', icon: BookOpen },
    { href: '/marketplace/electronics', label: 'Electronics', icon: Laptop },
    { href: '/marketplace/study-materials', label: 'Study Materials', icon: FolderOpen },
    { href: '/marketplace/pyqs', label: 'PYQs', icon: FileText },
    { href: '/marketplace/marketplace-items', label: 'Marketplace Items', icon: Package },
    { href: '/marketplace/miscellaneous', label: 'Miscellaneous', icon: Package }
  ];

  const communityLinks = [
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/profile?tab=achievements', label: 'Achievements', icon: Award },
    { href: '/profile?tab=achievements', label: 'Badges', icon: ShieldCheck },
    { href: '/profile', label: 'Streaks', icon: Flame },
    { href: '/leaderboard', label: 'Top Sellers', icon: Users }
  ];

  const toolsLinks = [
    { href: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
    { href: '/chat', label: 'Chat', icon: MessageSquare },
    { href: '/help-center', label: 'Help Center', icon: HelpCircle },
    { href: '/report-issue', label: 'Report Issue', icon: AlertCircle }
  ];

  const profileLinks = [
    { href: '/profile', label: 'My Profile', icon: User },
    { href: '/profile?tab=settings', label: 'Settings', icon: Settings },
    { href: '/profile?tab=activity', label: 'Activity', icon: Clock }
  ];

  // Click outside handling to dismiss dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (navbarRef.current && !navbarRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch Notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 20);
      setNotifications(fetched);
    }, (error) => {
      console.error('Error loading navbar notifications', error);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  const markAllAsRead = () => {
    notifications.filter(n => !n.read).forEach(n => markAsRead(n.id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const isLinkActive = (linkHref) => {
    if (!pathname) return false;
    const [path, queryStr] = linkHref.split('?');
    if (pathname !== path) return false;
    if (!queryStr) {
      if (pathname === '/profile') {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          return !params.get('tab');
        }
      }
      return true;
    }
    
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const linkParams = new URLSearchParams(queryStr);
      for (const [key, val] of linkParams.entries()) {
        if (params.get(key) !== val) return false;
      }
      return true;
    }
    return false;
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(prev => prev === name ? null : name);
  };

  if (!isAuthenticated) {
    return (
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-left">
            <Link href="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/logo.png" alt="ShareVIT Logo" style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
            </Link>
          </div>
          <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div className="flex-row gap-3">
              <Link href="/login" className="btn btn-ghost">Log In</Link>
              <Link href="/signup" className="btn btn-primary">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Top Header Navbar */}
      <header className="top-header" ref={navbarRef}>
        
        {/* Left: Logo Only */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <Link href="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="ShareVIT Logo" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
          </Link>
        </div>

        {/* Center: Dropdown Menus (Desktop) */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
          
          {/* Marketplace Dropdown */}
          <div className="nav-dropdown-wrapper">
            <button 
              className={`nav-dropdown-trigger ${openDropdown === 'marketplace' ? 'active' : ''}`}
              onClick={() => toggleDropdown('marketplace')}
            >
              Marketplace <ChevronDown size={14} style={{ transform: openDropdown === 'marketplace' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            <div className={`nav-dropdown-menu ${openDropdown === 'marketplace' ? 'open' : ''}`}>
              {marketplaceLinks.map(link => {
                const Icon = link.icon;
                const active = isLinkActive(link.href);
                return (
                  <Link 
                    key={link.label} 
                    href={link.href} 
                    className={`nav-dropdown-item ${active ? 'active' : ''}`}
                    onClick={() => setOpenDropdown(null)}
                  >
                    <Icon size={16} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Community Dropdown */}
          <div className="nav-dropdown-wrapper">
            <button 
              className={`nav-dropdown-trigger ${openDropdown === 'community' ? 'active' : ''}`}
              onClick={() => toggleDropdown('community')}
            >
              Community <ChevronDown size={14} style={{ transform: openDropdown === 'community' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            <div className={`nav-dropdown-menu ${openDropdown === 'community' ? 'open' : ''}`}>
              {communityLinks.map(link => {
                const Icon = link.icon;
                const active = isLinkActive(link.href);
                return (
                  <Link 
                    key={link.label} 
                    href={link.href} 
                    className={`nav-dropdown-item ${active ? 'active' : ''}`}
                    onClick={() => setOpenDropdown(null)}
                  >
                    <Icon size={16} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Tools Dropdown */}
          <div className="nav-dropdown-wrapper">
            <button 
              className={`nav-dropdown-trigger ${openDropdown === 'tools' ? 'active' : ''}`}
              onClick={() => toggleDropdown('tools')}
            >
              Tools <ChevronDown size={14} style={{ transform: openDropdown === 'tools' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            <div className={`nav-dropdown-menu ${openDropdown === 'tools' ? 'open' : ''}`}>
              {toolsLinks.map(link => {
                const Icon = link.icon;
                const active = isLinkActive(link.href);
                return (
                  <Link 
                    key={link.label} 
                    href={link.href} 
                    className={`nav-dropdown-item ${active ? 'active' : ''}`}
                    onClick={() => setOpenDropdown(null)}
                  >
                    <Icon size={16} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right: Search, Notifications, Avatar, CTA */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-4)' }}>
          
          {/* Search bar on Desktop */}
          <div className="hide-mobile" style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search listings..." 
              value={desktopSearch}
              onChange={(e) => setDesktopSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && desktopSearch.trim()) {
                  window.location.href = `/marketplace?search=${encodeURIComponent(desktopSearch)}`;
                }
              }}
              style={{ 
                padding: '6px 12px 6px 32px', 
                fontSize: '13px', 
                borderRadius: 'var(--radius-full)', 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--border-color)', 
                color: 'var(--text-primary)', 
                outline: 'none',
                width: '180px',
                transition: 'width 0.25s ease'
              }}
              onFocus={(e) => e.target.style.width = '240px'}
              onBlur={(e) => e.target.style.width = '180px'}
            />
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          </div>

          {/* Notifications */}
          <div style={{ position: 'relative' }} ref={notificationsRef}>
            <button 
              className="btn btn-ghost" 
              style={{ padding: '8px', borderRadius: '50%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => toggleDropdown('notifications')}
            >
              <Bell size={20} color="var(--text-primary)" />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '4px', right: '6px', width: '10px', height: '10px', backgroundColor: 'var(--accent-danger)', borderRadius: '50%', border: '2px solid var(--bg-primary)' }}></span>
              )}
            </button>
            
            {openDropdown === 'notifications' && (
              <div className="navbar-dropdown" style={{ right: '-50px', minWidth: '320px', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-glass)' }}>
                  <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', margin: 0 }}>Notifications</h3>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={markAllAsRead}>Mark all as read</span>
                  )}
                </div>
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)' }}>No recent updates.</div>
                  ) : (
                    notifications.map(note => (
                      <div
                        key={note.id} 
                        onClick={() => {
                          markAsRead(note.id);
                          const destination = note.link || note.metadata?.link;
                          if (destination) window.location.href = destination;
                        }}
                        style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-color)', background: note.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)', transition: 'background 0.2s', cursor: 'pointer' }} 
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{note.title}</strong>
                          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
                            {note.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(note.createdAt.toDate()) : 'Now'}
                          </span>
                        </div>
                        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{note.message || note.text}</p>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ padding: 'var(--space-2)', textAlign: 'center', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                  <Link href="/notifications" onClick={() => setOpenDropdown(null)} style={{ display: 'block', width: '100%', fontSize: 'var(--fs-xs)', color: 'var(--text-primary)', padding: 'var(--space-2)' }}>
                    View All Updates
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar Dropdown */}
          <div style={{ position: 'relative' }}>
            <div className="navbar-avatar" onClick={() => toggleDropdown('profile')}>
              {getInitials(userData?.displayName)}
            </div>
            {openDropdown === 'profile' && (
              <div className="navbar-dropdown" style={{ right: 0 }}>
                <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-color)', marginBottom: 'var(--space-2)' }}>
                  <p style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)', fontSize: 'var(--fs-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                    {userData?.displayName || 'Student'}
                  </p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-xs)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                    {user?.email}
                  </p>
                </div>
                {profileLinks.map(link => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.label} href={link.href} onClick={() => setOpenDropdown(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={16} /> {link.label}
                    </Link>
                  );
                })}
                <button onClick={() => { setOpenDropdown(null); signOut(); }} style={{ color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: 'none', background: 'none', textAlign: 'left', padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Primary CTA + Sell Item Button */}
          <Link href="/marketplace/create" className="btn btn-primary hide-mobile" style={{ padding: '6px 16px', fontSize: '13px', borderRadius: 'var(--radius-full)' }}>
            <Plus size={16} /> Sell Item
          </Link>
        </div>
      </header>

      {/* Mobile Sub-Header Chips Bar */}
      <div className="show-mobile-only" style={{ position: 'fixed', top: 'var(--navbar-height)', left: 0, right: 0, height: '48px', background: 'rgba(10, 10, 15, 0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0 var(--space-4)', zIndex: 999 }}>
        <button 
          className="btn btn-ghost" 
          style={{ fontSize: '12px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: activeBottomSheet === 'marketplace' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)', border: activeBottomSheet === 'marketplace' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)', color: activeBottomSheet === 'marketplace' ? 'var(--accent-primary-hover)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}
          onClick={() => setActiveBottomSheet(activeBottomSheet === 'marketplace' ? null : 'marketplace')}
        >
          Marketplace <ChevronDown size={12} style={{ transform: activeBottomSheet === 'marketplace' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </button>
        <button 
          className="btn btn-ghost" 
          style={{ fontSize: '12px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: activeBottomSheet === 'community' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)', border: activeBottomSheet === 'community' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)', color: activeBottomSheet === 'community' ? 'var(--accent-primary-hover)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}
          onClick={() => setActiveBottomSheet(activeBottomSheet === 'community' ? null : 'community')}
        >
          Community <ChevronDown size={12} style={{ transform: activeBottomSheet === 'community' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </button>
        <button 
          className="btn btn-ghost" 
          style={{ fontSize: '12px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: activeBottomSheet === 'tools' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)', border: activeBottomSheet === 'tools' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)', color: activeBottomSheet === 'tools' ? 'var(--accent-primary-hover)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}
          onClick={() => setActiveBottomSheet(activeBottomSheet === 'tools' ? null : 'tools')}
        >
          Tools <ChevronDown size={12} style={{ transform: activeBottomSheet === 'tools' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <Link href="/" className={`mobile-bottom-nav-link ${isLinkActive('/') ? 'active' : ''}`}>
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link href="/marketplace" className={`mobile-bottom-nav-link ${isLinkActive('/marketplace') ? 'active' : ''}`}>
          <ShoppingCart size={20} />
          <span>Marketplace</span>
        </Link>
        <Link href="/marketplace/create" className={`mobile-bottom-nav-link ${isLinkActive('/marketplace/create') ? 'active' : ''}`}>
          <PlusCircle size={20} />
          <span>Sell</span>
        </Link>
        <Link href="/requests" className={`mobile-bottom-nav-link ${isLinkActive('/requests') ? 'active' : ''}`}>
          <ClipboardList size={20} />
          <span>Requests</span>
        </Link>
        <Link href="/profile" className={`mobile-bottom-nav-link ${isLinkActive('/profile') ? 'active' : ''}`}>
          <User size={20} />
          <span>Profile</span>
        </Link>
      </div>

      {/* Mobile Bottom Sheets */}
      {activeBottomSheet && (
        <>
          <div 
            className="bottom-sheet-overlay" 
            onClick={() => setActiveBottomSheet(null)} 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 8, 0.6)', backdropFilter: 'blur(8px)', zIndex: 2000 }}
          />
          
          <div 
            className="bottom-sheet" 
            style={{ 
              position: 'fixed', bottom: 0, left: 0, right: 0, 
              background: 'rgba(15, 15, 25, 0.95)', backdropFilter: 'blur(24px) saturate(180%)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
              padding: '16px 20px calc(24px + env(safe-area-inset-bottom))', zIndex: 2001,
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
              maxHeight: '80vh', overflowY: 'auto',
              display: 'flex', flexDirection: 'column'
            }}
          >
            <div style={{ width: '40px', height: '4px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '2px', margin: '0 auto 12px' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                {activeBottomSheet === 'marketplace' ? 'Marketplace Portal' : activeBottomSheet === 'community' ? 'Community Hub' : 'Student Utilities'}
              </h3>
              <button 
                onClick={() => setActiveBottomSheet(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeBottomSheet === 'marketplace' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <Link 
                      href="/marketplace" 
                      className="btn btn-ghost" 
                      style={{ justifyContent: 'flex-start', padding: '10px', fontSize: '12px', gap: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} 
                      onClick={() => setActiveBottomSheet(null)}
                    >
                      <ShoppingCart size={14} style={{ color: 'var(--accent-primary)' }} /> Browse All
                    </Link>
                    <Link 
                      href="/marketplace/create" 
                      className="btn btn-ghost" 
                      style={{ justifyContent: 'flex-start', padding: '10px', fontSize: '12px', gap: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} 
                      onClick={() => setActiveBottomSheet(null)}
                    >
                      <Plus size={14} style={{ color: 'var(--accent-primary)' }} /> Sell Item
                    </Link>
                  </div>
                  
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>
                    Explore Categories
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    {CATEGORIES.slice(1).map(catName => {
                      const pathName = catName.toLowerCase().replace(' ', '-');
                      return (
                        <Link 
                          key={catName} 
                          href={`/marketplace/${pathName}`} 
                          className="btn btn-ghost" 
                          style={{ 
                            padding: '8px 4px', fontSize: '10px', flexDirection: 'column', height: 'auto', gap: '4px',
                            border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)'
                          }} 
                          onClick={() => setActiveBottomSheet(null)}
                        >
                          <span style={{ fontSize: '18px' }}>
                            {(catName === 'Notes' || catName === 'PYQs') ? '📝' : 
                             catName === 'Assignments' ? '📄' : 
                             catName === 'Books' ? '📚' : 
                             catName === 'Electronics' ? '💻' : 
                             catName === 'Study Materials' ? '📁' : '📦'}
                          </span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{catName}</span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}

              {activeBottomSheet === 'community' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {communityLinks.map(link => {
                    const Icon = link.icon;
                    return (
                      <Link 
                        key={link.label} 
                        href={link.href} 
                        className="btn btn-ghost" 
                        style={{ justifyContent: 'flex-start', padding: '12px', border: '1px solid var(--border-color)', gap: '10px', fontSize: '13px', borderRadius: 'var(--radius-md)' }} 
                        onClick={() => setActiveBottomSheet(null)}
                      >
                        <Icon size={16} style={{ color: 'var(--accent-primary)' }} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {activeBottomSheet === 'tools' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {toolsLinks.map(link => {
                    const Icon = link.icon;
                    return (
                      <Link 
                        key={link.label} 
                        href={link.href} 
                        className="btn btn-ghost" 
                        style={{ justifyContent: 'flex-start', padding: '12px', border: '1px solid var(--border-color)', gap: '10px', fontSize: '13px', borderRadius: 'var(--radius-md)' }} 
                        onClick={() => setActiveBottomSheet(null)}
                      >
                        <Icon size={16} style={{ color: 'var(--accent-primary)' }} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
