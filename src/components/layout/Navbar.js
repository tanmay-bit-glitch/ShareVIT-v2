'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import { ShoppingCart, BookOpen, FileText, ClipboardList, Bot, MessageSquare, Wrench, Menu, X, User, LogOut, Bell, LayoutDashboard, ChevronDown, MoreHorizontal } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
  { href: '/notes', label: 'Notes & PYQs', icon: BookOpen },
  { href: '/assignments', label: 'Assignments', icon: FileText },
  { href: '/requests', label: 'Requests', icon: ClipboardList },
  { href: '/ai-assistant', label: 'AI Assistant', icon: Bot },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/tools', label: 'Tools', icon: Wrench },
];

const visibleLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
  { href: '/notes', label: 'Notes & PYQs', icon: BookOpen },
  { href: '/ai-assistant', label: 'AI Assistant', icon: Bot },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
];

const dropdownLinks = [
  { href: '/assignments', label: 'Assignments', icon: FileText },
  { href: '/requests', label: 'Requests', icon: ClipboardList },
  { href: '/tools', label: 'Tools', icon: Wrench },
];

export default function Navbar() {
  const { user, userData, signOut, isAuthenticated } = useAuth();
  const { count: cartCount } = useCart();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const moreDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile nav & dropdowns on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
    setMoreDropdownOpen(false);
  }, [pathname]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-left">
            <button className="navbar-hamburger hide-tablet-up" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={24} />
            </button>
            <Link href="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Image src="/logo.png" alt="ShareVIT Logo" width={36} height={36} style={{ borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
              <span className="navbar-logo-text">Share<span style={{ color: 'var(--accent-primary)' }}>VIT</span></span>
            </Link>
          </div>

          {isAuthenticated && (
            <ul className="navbar-links">
              {visibleLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className={pathname?.startsWith(link.href) ? 'active' : ''}>
                    <link.icon size={18} />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
              <li style={{ position: 'relative' }} ref={moreDropdownRef}>
                <button
                  className={`navbar-more-btn ${moreDropdownOpen ? 'active' : ''} ${dropdownLinks.some(link => pathname?.startsWith(link.href)) ? 'parent-active' : ''}`}
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  aria-haspopup="true"
                  aria-expanded={moreDropdownOpen}
                >
                  <MoreHorizontal size={18} />
                  <span>More</span>
                  <ChevronDown size={14} className="chevron" />
                </button>
                {moreDropdownOpen && (
                  <div className="navbar-dropdown navbar-more-dropdown">
                    {dropdownLinks.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={pathname?.startsWith(link.href) ? 'active' : ''}
                        onClick={() => setMoreDropdownOpen(false)}
                      >
                        <link.icon size={16} />
                        <span>{link.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            </ul>
          )}

          <div className="navbar-right">
            {/* Cart icon (Visible to all users) */}
            <Link href="/cart" style={{ position: 'relative', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '6px', borderRadius: 'var(--radius-md)', transition: 'color 0.2s', outline: 'none' }} title="Cart">
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: '#fff', border: '1.5px solid var(--bg-primary)' }}>{cartCount}</span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px', borderRadius: 'var(--radius-md)', position: 'relative', transition: 'all 0.2s' }} title="Notifications">
                  <Bell size={18} />
                  <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', border: '1.5px solid var(--bg-primary)' }} />
                </button>
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <div className="navbar-avatar" onClick={() => setDropdownOpen(!dropdownOpen)}>
                    {getInitials(userData?.displayName)}
                  </div>
                  {dropdownOpen && (
                    <div className="navbar-dropdown">
                      <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-color)', marginBottom: 'var(--space-2)' }}>
                        <p style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)', fontSize: 'var(--fs-sm)' }}>
                          {userData?.displayName || 'Student'}
                        </p>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-xs)', marginTop: '2px' }}>
                          {user?.email}
                        </p>
                      </div>
                      <Link href="/dashboard" onClick={() => setDropdownOpen(false)}>
                        <LayoutDashboard size={16} /> Dashboard
                      </Link>
                      <Link href="/profile" onClick={() => setDropdownOpen(false)}>
                        <User size={16} /> Profile
                      </Link>
                      <button onClick={() => { setDropdownOpen(false); signOut(); }} style={{ color: 'var(--accent-danger)' }}>
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-row gap-3">
                <Link href="/login" className="btn btn-ghost">Log In</Link>
                <Link href="/signup" className="btn btn-primary">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Nav Overlay */}
      <div className={`mobile-nav-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <Link href="/" className="navbar-logo" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Image src="/logo.png" alt="ShareVIT Logo" width={36} height={36} style={{ borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
            <span>Share<span style={{ color: 'var(--accent-primary)' }}>VIT</span></span>
          </Link>
          <button className="mobile-nav-close" onClick={() => setMobileOpen(false)}><X size={24} /></button>
        </div>
        <ul className="mobile-nav-links">
          {navLinks.map(link => (
            <li key={link.href}>
              <Link href={link.href} className={pathname?.startsWith(link.href) ? 'active' : ''} onClick={() => setMobileOpen(false)}>
                <link.icon size={20} />
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
          <li style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
            {isAuthenticated ? (
              <>
                <Link href="/profile" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}><User size={20} /> Profile</Link>
                <button
                  onClick={() => { setMobileOpen(false); signOut(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) 0', width: '100%', border: 'none', background: 'none', color: 'var(--accent-danger)', fontSize: 'var(--fs-base)', cursor: 'pointer' }}
                >
                  <LogOut size={20} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}><User size={20} /> Log In</Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}><FileText size={20} /> Sign Up</Link>
              </>
            )}
          </li>
        </ul>
      </div>
    </>
  );
}