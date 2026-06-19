'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { 
  Bell, Menu, X, ShoppingCart, Briefcase, Users, Trophy, 
  Sparkles, MessageSquare, User, LogOut, ChevronDown, Plus, Heart, 
  Star, Settings, Tag, Package, Flame, Clock, Award, 
  HelpCircle, AlertCircle, ShieldCheck, ClipboardList, Home, PlusCircle
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Navbar() {
  const { user, userData, signOut, isAuthenticated } = useAuth();
  const { level, streak } = useGamification();
  const pathname = usePathname();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'marketplace', 'community', 'tools', 'profile', 'notifications'
  const [notifications, setNotifications] = useState([]);
  
  const navbarRef = useRef(null);
  const notificationsRef = useRef(null);

  // Link Definitions
  const marketplaceLinks = [
    { href: '/marketplace', label: 'Browse Listings', icon: ShoppingCart, priority: true },
    { href: '/marketplace/create', label: 'Create Listing', icon: Plus, priority: true },
    { href: '/profile?tab=listings', label: 'My Listings', icon: Tag },
    { href: '/profile?tab=wishlist', label: 'Wishlist', icon: Heart },
    { href: '/profile?tab=activity', label: 'Transactions', icon: Briefcase },
    { href: '/profile?tab=activity', label: 'Orders', icon: Package },
    { href: '/profile?tab=reviews', label: 'Reviews', icon: Star },
    { href: '/requests', label: 'Requests', icon: ClipboardList }
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
    { href: '/academics', label: 'Help Center', icon: HelpCircle },
    { href: 'mailto:support@sharevit.com', label: 'Report Issue', icon: AlertCircle }
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
      where('userId', 'in', [user.uid, 'all']),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(fetched);
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

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Check if link matches active route + active URL query params
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
            <Link href="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <img src="/logo.png" alt="ShareVIT Logo" style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
              <span>Share<span style={{ color: 'var(--accent-primary)' }}>VIT</span></span>
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
        
        {/* Left: Hamburger + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button 
            className="navbar-hamburger" 
            onClick={() => setMobileOpen(true)} 
            aria-label="Open sidebar"
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Menu size={24} />
          </button>
          
          <Link href="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <img src="/logo.png" alt="ShareVIT Logo" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
            <span style={{ fontSize: 'var(--fs-md)', fontWeight: 'bold' }}>Share<span style={{ color: 'var(--accent-primary)' }}>VIT</span></span>
          </Link>
        </div>

        {/* Center: Dropdown Menus */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          
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
                    className={`nav-dropdown-item ${active ? 'active' : ''} ${link.priority ? 'priority' : ''}`}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          


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
                        onClick={() => markAsRead(note.id)}
                        style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-color)', background: note.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)', transition: 'background 0.2s', cursor: 'pointer' }} 
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass-hover)'} 
                        onMouseLeave={e => e.currentTarget.style.background = note.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{note.title}</strong>
                          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
                            {note.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(note.createdAt.toDate()) : 'Now'}
                          </span>
                        </div>
                        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{note.text}</p>
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

      {/* Mobile Drawer (Hidden on Desktop) */}
      <aside className={`app-layout-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="app-layout-sidebar-header">
          <Link href="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <img src="/logo.png" alt="ShareVIT Logo" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
            <span style={{ fontSize: 'var(--fs-md)', fontWeight: 'bold' }}>Share<span style={{ color: 'var(--accent-primary)' }}>VIT</span></span>
          </Link>
          <button 
            className="sidebar-close" 
            onClick={() => setMobileOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="app-layout-sidebar-links">
          {/* Mobile CTA */}
          <Link href="/marketplace/create" className="btn btn-primary btn-full" style={{ marginBottom: 'var(--space-4)' }} onClick={() => setMobileOpen(false)}>
            <Plus size={16} /> Sell Item
          </Link>

          {/* Marketplace Group */}
          <div className="mobile-section-header">Marketplace</div>
          {marketplaceLinks.map(link => (
            <Link 
              key={link.label} 
              href={link.href} 
              className={`app-layout-sidebar-link ${isLinkActive(link.href) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <link.icon size={16} style={{ flexShrink: 0 }} />
              <span>{link.label}</span>
            </Link>
          ))}

          {/* Community Group */}
          <div className="mobile-section-header">Community</div>
          {communityLinks.map(link => (
            <Link 
              key={link.label} 
              href={link.href} 
              className={`app-layout-sidebar-link ${isLinkActive(link.href) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <link.icon size={16} style={{ flexShrink: 0 }} />
              <span>{link.label}</span>
            </Link>
          ))}

          {/* Tools Group */}
          <div className="mobile-section-header">Tools</div>
          {toolsLinks.map(link => (
            <Link 
              key={link.label} 
              href={link.href} 
              className={`app-layout-sidebar-link ${isLinkActive(link.href) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <link.icon size={16} style={{ flexShrink: 0 }} />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Card Footer */}
        <div className="app-layout-sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div className="navbar-avatar" style={{ margin: 0, flexShrink: 0 }}>
              {getInitials(userData?.displayName)}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)', fontSize: 'var(--fs-xs)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                {userData?.displayName || 'Student'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span className="badge badge-info" style={{ fontSize: '8px', padding: '1px 4px' }}>
                  Level {level}
                </span>
                <span className="badge badge-warning" style={{ fontSize: '8px', padding: '1px 4px', background: 'rgba(245,158,11,0.1)', border: 'none', color: 'var(--accent-warning)' }}>
                  🔥 {streak}d
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile nav drawer overlay */}
      {mobileOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 1002 }} 
          onClick={() => setMobileOpen(false)} 
        />
      )}

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
    </>
  );
}