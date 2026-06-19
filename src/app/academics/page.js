'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  GraduationCap, Sparkles, Flame, HelpCircle, Check,
  Award, TrendingUp, Info, ChevronRight, Calculator, Plus, Minus
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AcademicsPage() {
  return (
    <ProtectedRoute>
      <AcademicsContent />
    </ProtectedRoute>
  );
}

function AcademicsContent() {
  const { userData } = useAuth();
  const { level, levelTitle, xp, xpNeeded, streak } = useGamification();

  // XP Calculator state
  const [calcLogins, setCalcLogins] = useState(5);
  const [calcProfile, setCalcProfile] = useState(true);
  const [calcListings, setCalcListings] = useState(2);
  const [calcImages, setCalcImages] = useState(2);
  const [calcSales, setCalcSales] = useState(1);
  const [calcRentals, setCalcRentals] = useState(1);
  const [calcReviewsLeft, setCalcReviewsLeft] = useState(2);
  const [calcReviewsRecv, setCalcReviewsRecv] = useState(1);
  const [calcTrades, setCalcTrades] = useState(2);

  // Compute XP based on rules:
  // Daily login = 5 XP
  // Profile complete = 25 XP
  // First listing = 50 XP (assumes listingCount >= 1)
  // Add image = 10 XP per image
  // Sell item = 100 XP
  // Rent item = 80 XP
  // Leave review = 15 XP
  // Receive review = 20 XP
  // Complete transaction = 40 XP
  const calculateXP = () => {
    let total = 0;
    total += calcLogins * 5;
    if (calcProfile) total += 25;
    if (calcListings > 0) {
      total += 50; // First listing
      total += (calcListings - 1) * 15; // subsequent listing bonus
    }
    total += calcImages * 10;
    total += calcSales * 100;
    total += calcRentals * 80;
    total += calcReviewsLeft * 15;
    total += calcReviewsRecv * 20;
    total += calcTrades * 40;
    return total;
  };

  const calculatedXP = calculateXP();
  
  // Calculate potential level up
  // Level threshold logic: lvl * 100
  // Level 1: 100 XP, Level 2: 200 XP, Level 3: 300 XP, etc.
  const getLevelsGained = (xpAmount) => {
    let currentLvl = 1;
    let accumulatedXp = xpAmount;
    let xpForNext = currentLvl * 100;
    while (accumulatedXp >= xpForNext && currentLvl < 8) {
      accumulatedXp -= xpForNext;
      currentLvl += 1;
      xpForNext = currentLvl * 100;
    }
    return currentLvl;
  };

  const potentialLevel = getLevelsGained(calculatedXP);

  const pointsSystem = [
    { label: 'Daily Login Reward', pts: '+5 XP', desc: 'Log in daily to maintain your streak.' },
    { label: 'Complete Profile', pts: '+25 XP', desc: 'Fill in your Bio, Social handles and Skills.' },
    { label: 'Upload First Listing', pts: '+50 XP', desc: 'Create your first listing in the marketplace.' },
    { label: 'Upload Listing Image', pts: '+10 XP', desc: 'Attach high-quality images to your item listing.' },
    { label: 'Sell an Item', pts: '+100 XP', desc: 'Successfully sell books, tools or gadgets.' },
    { label: 'Rent out an Item', pts: '+80 XP', desc: 'Rent drawing boards, drafters, or lab coats.' },
    { label: 'Leave a Review', pts: '+15 XP', desc: 'Review your transaction experience with a peer.' },
    { label: 'Receive a Review', pts: '+20 XP', desc: 'Get positive ratings from verified buyers/sellers.' },
    { label: 'Complete Transaction', pts: '+40 XP', desc: 'Complete checkout or coordinate item handoffs.' }
  ];

  return (
    <div className="page-content" style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 'var(--fw-extrabold)', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              Gamification Center
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>Earn XP, unlock verified badges, and build your campus trader portfolio reputation.</p>
          </div>
          <span className="badge badge-primary" style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--fs-base)', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <GraduationCap size={18} /> Level {level}: {levelTitle}
          </span>
        </div>

        {/* Info Banner about ERP Streamlining */}
        <div className="card-glass" style={{ marginBottom: 'var(--space-8)', padding: 'var(--space-4) var(--space-5)', background: 'rgba(99, 102, 241, 0.03)', borderColor: 'rgba(99, 102, 241, 0.2)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <Info size={22} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 'bold', margin: '0 0 4px', color: '#fff' }}>Portfolio Streamlining Active</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', margin: 0, lineHeight: 1.4 }}>
              To keep the ecosystem transaction-focused, we have streamlined our application. Traditional ERP tools (grades/attendance logs) have been removed. Instead, focus on building your Student Portfolio trust score and trading resources!
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
          
          {/* Left: XP Calculator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={20} style={{ color: 'var(--accent-primary)' }} /> Interactive XP Calculator
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', marginBottom: 'var(--space-6)' }}>
                Estimate how many levels you will climb on the leaderboard by inputting your planned activities:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 1. Daily logins */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Daily Logins (+5 XP/day)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcLogins(p => Math.max(0, p - 1))}><Minus size={14} /></button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold' }}>{calcLogins}</span>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcLogins(p => p + 1)}><Plus size={14} /></button>
                  </div>
                </div>

                {/* 2. Complete Profile */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Complete Profile (+25 XP)</span>
                  <input type="checkbox" checked={calcProfile} onChange={e => setCalcProfile(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                </div>

                {/* 3. Listings */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Post Listings (+50 XP 1st, +15 XP sub)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcListings(p => Math.max(0, p - 1))}><Minus size={14} /></button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold' }}>{calcListings}</span>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcListings(p => p + 1)}><Plus size={14} /></button>
                  </div>
                </div>

                {/* 4. Listing Images */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Attached Item Images (+10 XP)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcImages(p => Math.max(0, p - 1))}><Minus size={14} /></button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold' }}>{calcImages}</span>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcImages(p => p + 1)}><Plus size={14} /></button>
                  </div>
                </div>

                {/* 5. Sales */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Item Sales Completed (+100 XP)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcSales(p => Math.max(0, p - 1))}><Minus size={14} /></button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold' }}>{calcSales}</span>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcSales(p => p + 1)}><Plus size={14} /></button>
                  </div>
                </div>

                {/* 6. Rentals */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Rentals Handed Out (+80 XP)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcRentals(p => Math.max(0, p - 1))}><Minus size={14} /></button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold' }}>{calcRentals}</span>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcRentals(p => p + 1)}><Plus size={14} /></button>
                  </div>
                </div>

                {/* 7. Reviews Left */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Reviews Submitted (+15 XP)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcReviewsLeft(p => Math.max(0, p - 1))}><Minus size={14} /></button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold' }}>{calcReviewsLeft}</span>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcReviewsLeft(p => p + 1)}><Plus size={14} /></button>
                  </div>
                </div>

                {/* 8. Reviews Received */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Reviews Received (+20 XP)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcReviewsRecv(p => Math.max(0, p - 1))}><Minus size={14} /></button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold' }}>{calcReviewsRecv}</span>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcReviewsRecv(p => p + 1)}><Plus size={14} /></button>
                  </div>
                </div>

                {/* 9. Trades */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Complete Transactions (+40 XP)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcTrades(p => Math.max(0, p - 1))}><Minus size={14} /></button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold' }}>{calcTrades}</span>
                    <button className="btn btn-ghost" style={{ padding: '4px', minWidth: 'unset' }} onClick={() => setCalcTrades(p => p + 1)}><Plus size={14} /></button>
                  </div>
                </div>
              </div>

              {/* Calculator Summary Results */}
              <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>Estimated XP Gain:</div>
                  <div style={{ fontSize: '24px', fontWeight: 'var(--fw-extrabold)', color: 'var(--accent-primary-hover)' }}>+{calculatedXP} XP</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>Estimated Level:</div>
                  <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', color: '#fff' }}>Level {potential}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: XP Earning Guideline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* Live Progress Card */}
            <div className="card-glass" style={{ padding: 'var(--space-5)', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.02)' }}>
              <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-success)' }}>
                <Flame size={18} /> Live Profile Statistics
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Login Streak:</span>
                  <strong style={{ color: '#fff' }}>{streak} Days Active</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Level Progress:</span>
                  <strong style={{ color: '#fff' }}>{xp} / {xpNeeded} XP</strong>
                </div>

                <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${(xp / xpNeeded) * 100}%`, height: '100%', background: 'var(--gradient-primary)' }} />
                </div>
              </div>
            </div>

            {/* Rules Breakdown */}
            <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} style={{ color: 'var(--accent-warning)' }} /> Point Earning Rules
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {pointsSystem.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: index === pointsSystem.length - 1 ? 'none' : '1px solid var(--border-color)', paddingBottom: index === pointsSystem.length - 1 ? 0 : '10px' }}>
                    <div>
                      <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)', color: '#fff', display: 'block' }}>{item.label}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>{item.desc}</span>
                    </div>
                    <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'bold', color: 'var(--accent-success)', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                      {item.pts}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
