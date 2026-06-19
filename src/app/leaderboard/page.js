'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Trophy, Award, Star, ShoppingCart, Flame, Clock, 
  ChevronUp, ChevronDown, Minus, ShieldCheck, Heart, Sparkles
} from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';

export default function LeaderboardPage() {
  return (
    <ProtectedRoute>
      <LeaderboardContent />
    </ProtectedRoute>
  );
}

function LeaderboardContent() {
  const { user, userData } = useAuth();
  const { level, streak } = useGamification();
  const [activeTab, setActiveTab] = useState('Top Sellers');
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = ['Top Sellers', 'Top Buyers', 'Top Renters', 'Most Active'];

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snapshot) => {
      setUsersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      console.error('Error fetching users for leaderboard:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const getLeaderboardData = () => {
    let list = [];
    if (activeTab === 'Top Sellers') {
      list = usersList
        .filter(u => (u.uploadsCount || 0) > 0)
        .map(u => ({
          name: u.displayName || 'Anonymous Student',
          year: u.year || 'Student',
          change: 'same',
          itemsSold: u.uploadsCount || 0,
          rating: u.reputation > 0 ? (u.reputation / 10).toFixed(1) : 5.0,
          isCurrentUser: u.uid === user?.uid
        }))
        .sort((a, b) => b.itemsSold - a.itemsSold);
    } else if (activeTab === 'Top Buyers') {
      list = usersList
        .filter(u => (u.downloadsCount || 0) > 0)
        .map(u => ({
          name: u.displayName || 'Anonymous Student',
          year: u.year || 'Student',
          change: 'same',
          itemsBought: u.downloadsCount || 0,
          savedAmount: `₹${(u.downloadsCount || 0) * 150}`,
          isCurrentUser: u.uid === user?.uid
        }))
        .sort((a, b) => b.itemsBought - a.itemsBought);
    } else if (activeTab === 'Top Renters') {
      list = usersList
        .filter(u => (u.rentalsCount || 0) > 0)
        .map(u => ({
          name: u.displayName || 'Anonymous Student',
          year: u.year || 'Student',
          change: 'same',
          itemsRented: u.rentalsCount || 0,
          activeRentals: u.activeRentals || 0,
          isCurrentUser: u.uid === user?.uid
        }))
        .sort((a, b) => b.itemsRented - a.itemsRented);
    } else if (activeTab === 'Most Active') {
      list = usersList
        .filter(u => (u.streak || 0) > 0 || (u.level || 1) > 1)
        .map(u => ({
          name: u.displayName || 'Anonymous Student',
          year: u.year || 'Student',
          change: 'same',
          loginStreak: u.streak || 0,
          level: u.level || 1,
          isCurrentUser: u.uid === user?.uid
        }))
        .sort((a, b) => {
          if (b.loginStreak !== a.loginStreak) return b.loginStreak - a.loginStreak;
          return b.level - a.level;
        });
    }

    return list.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  };

  const activeData = getLeaderboardData();
  const topThree = activeData.slice(0, 3);

  const getScoreDisplay = (student) => {
    if (activeTab === 'Top Sellers') return `${student.itemsSold} Sold`;
    if (activeTab === 'Top Buyers') return `${student.itemsBought} Bought`;
    if (activeTab === 'Top Renters') return `${student.itemsRented} Rented`;
    return `${student.loginStreak} Day Streak`;
  };

  const getSubtextDisplay = (student) => {
    if (activeTab === 'Top Sellers') return `⭐ ${student.rating} Rating`;
    if (activeTab === 'Top Buyers') return `Saved ${student.savedAmount}`;
    if (activeTab === 'Top Renters') return `${student.activeRentals} Active`;
    return `Level ${student.level}`;
  };

  if (loading) {
    return (
      <div className="page-content" style={{ padding: 'var(--space-8) 0' }}>
        <div className="container" style={{ maxWidth: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <span className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 'var(--fw-extrabold)', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              Marketplace Leaderboard
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>Compete with peers by listing items, completing transactions, and maintaining streaks.</p>
          </div>

        </div>

        {/* Tab Filters */}
        <div className="hide-scrollbar" style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', marginBottom: 'var(--space-8)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border-color)' }}>
          {tabs.map(tab => (
            <button 
              key={tab} 
              className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setActiveTab(tab)}
              style={{ fontSize: 'var(--fs-sm)', padding: 'var(--space-2) var(--space-6)', borderRadius: 'var(--radius-full)' }}
            >
              {tab === 'Top Sellers' && <ShoppingCart size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />}
              {tab === 'Top Buyers' && <Star size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />}
              {tab === 'Top Renters' && <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />}
              {tab === 'Most Active' && <Flame size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />}
              {tab}
            </button>
          ))}
        </div>

        {activeData.length === 0 ? (
          <div className="card-glass text-center animate-fadeInUp" style={{ padding: 'var(--space-16)', margin: 'var(--space-8) 0' }}>
            <Trophy size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)', marginInline: 'auto' }} />
            <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-2)' }}>No rankings available yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>Start listing items or completing transactions to top the leaderboard!</p>
          </div>
        ) : (
          <>
            {/* Podium Top 3 */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 'var(--space-6)', marginBottom: 'var(--space-10)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
              
              {/* Second Place */}
              {topThree[1] && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', order: 1 }}
                >
                  <div style={{ position: 'relative', marginBottom: 'var(--space-2)' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--gradient-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', color: '#fff', border: '3px solid #cbd5e1', boxShadow: 'var(--shadow-sm)' }}>
                      {topThree[1].name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '24px', height: '24px', borderRadius: '50%', background: '#cbd5e1', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-xs)', fontWeight: 'bold' }}>2</div>
                  </div>
                  <p style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)', textAlign: 'center', margin: '4px 0 0', color: topThree[1].isCurrentUser ? 'var(--accent-primary-hover)' : 'inherit' }}>
                    {topThree[1].name} {topThree[1].isCurrentUser && '(You)'}
                  </p>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{topThree[1].year}</span>
                  <div className="card-glass" style={{ width: '130px', height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(203, 213, 225, 0.03)', borderColor: 'rgba(203, 213, 225, 0.2)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', marginTop: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-extrabold)', color: '#cbd5e1' }}>{getScoreDisplay(topThree[1])}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{getSubtextDisplay(topThree[1])}</span>
                  </div>
                </motion.div>
              )}

              {/* First Place */}
              {topThree[0] && (
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', order: 2 }}
                >
                  <div style={{ position: 'relative', marginBottom: 'var(--space-2)' }}>
                    <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', color: 'var(--accent-warning)' }}><Trophy size={22} style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.5))' }} /></div>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', color: '#fff', border: '4px solid var(--accent-warning)', boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)' }}>
                      {topThree[0].name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-warning)', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-sm)', fontWeight: 'bold' }}>1</div>
                  </div>
                  <p style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-base)', textAlign: 'center', margin: '4px 0 0', color: topThree[0].isCurrentUser ? 'var(--accent-primary-hover)' : 'inherit' }}>
                    {topThree[0].name} {topThree[0].isCurrentUser && '(You)'}
                  </p>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{topThree[0].year}</span>
                  <div className="card-glass" style={{ width: '150px', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', marginTop: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-extrabold)', color: 'var(--accent-warning)' }}>{getScoreDisplay(topThree[0])}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{getSubtextDisplay(topThree[0])}</span>
                  </div>
                </motion.div>
              )}

              {/* Third Place */}
              {topThree[2] && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', order: 3 }}
                >
                  <div style={{ position: 'relative', marginBottom: 'var(--space-2)' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--gradient-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', color: '#fff', border: '3px solid #b45309', boxShadow: 'var(--shadow-sm)' }}>
                      {topThree[2].name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '24px', height: '24px', borderRadius: '50%', background: '#b45309', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-xs)', fontWeight: 'bold' }}>3</div>
                  </div>
                  <p style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)', textAlign: 'center', margin: '4px 0 0', color: topThree[2].isCurrentUser ? 'var(--accent-primary-hover)' : 'inherit' }}>
                    {topThree[2].name} {topThree[2].isCurrentUser && '(You)'}
                  </p>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{topThree[2].year}</span>
                  <div className="card-glass" style={{ width: '130px', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(180, 83, 9, 0.03)', borderColor: 'rgba(180, 83, 9, 0.2)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', marginTop: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-extrabold)', color: '#b45309' }}>{getScoreDisplay(topThree[2])}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{getSubtextDisplay(topThree[2])}</span>
                  </div>
                </motion.div>
              )}

            </div>

        {/* Leaderboard Table List */}
        <div className="card-glass" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span style={{ width: '60px' }}>Rank</span>
            <span style={{ flex: 1 }}>Student</span>
            <span style={{ width: '120px', textAlign: 'center' }}>Branch/Year</span>
            <span style={{ width: '140px', textAlign: 'right' }}>Score / Stats</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activeData.map((student, idx) => (
              <div 
                key={idx} 
                style={{ 
                  padding: 'var(--space-4) var(--space-6)', 
                  borderBottom: idx === activeData.length - 1 ? 'none' : '1px solid var(--border-color)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: student.isCurrentUser 
                    ? 'rgba(99, 102, 241, 0.06)' 
                    : student.rank <= 3 ? 'rgba(255,255,255,0.01)' : 'transparent',
                  borderLeft: student.isCurrentUser ? '3px solid var(--accent-primary)' : 'none',
                  transition: 'background 0.2s'
                }}
              >
                {/* Rank */}
                <div style={{ width: '60px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {student.rank === 1 && <span style={{ color: 'var(--accent-warning)', fontWeight: 'bold' }}>1st</span>}
                  {student.rank === 2 && <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>2nd</span>}
                  {student.rank === 3 && <span style={{ color: '#b45309', fontWeight: 'bold' }}>3rd</span>}
                  {student.rank > 3 && <span style={{ color: 'var(--text-tertiary)' }}>#{student.rank}</span>}
                  
                  {/* Change Icon */}
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {student.change === 'up' && <ChevronUp size={12} style={{ color: 'var(--accent-success)' }} />}
                    {student.change === 'down' && <ChevronDown size={12} style={{ color: 'var(--accent-danger)' }} />}
                    {student.change === 'same' && <Minus size={12} style={{ color: 'var(--text-tertiary)' }} />}
                  </span>
                </div>

                {/* Name & Initials */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '34px', height: '34px', borderRadius: '50%', 
                    background: student.isCurrentUser ? 'var(--gradient-primary)' : 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: '#fff' 
                  }}>
                    {student.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <span style={{ fontWeight: student.isCurrentUser ? 'var(--fw-bold)' : 'var(--fw-semibold)', color: student.isCurrentUser ? 'var(--accent-primary-hover)' : 'var(--text-primary)' }}>
                      {student.name} {student.isCurrentUser && <span className="badge badge-info" style={{ fontSize: '8px', padding: '1px 5px', marginLeft: '6px' }}>YOU</span>}
                    </span>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      {getSubtextDisplay(student)}
                    </div>
                  </div>
                </div>

                {/* Year/Branch */}
                <div style={{ width: '120px', textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                  {student.year}
                </div>

                {/* Score */}
                <div style={{ width: '140px', textAlign: 'right', fontWeight: 'var(--fw-bold)', color: student.isCurrentUser ? 'var(--accent-primary-hover)' : 'var(--text-primary)' }}>
                  {getScoreDisplay(student)}
                </div>

              </div>
            ))}
          </div>

        </div>
      </>
    )}

      </div>
    </div>
  );
}


