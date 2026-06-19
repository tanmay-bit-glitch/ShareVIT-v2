'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { HelpCircle, Search, Ticket, ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  {
    topic: 'How to Buy',
    q: 'How do I purchase items on ShareVIT?',
    a: 'Browse the marketplace, select an item you need, and click "Chat Now" or "Email Seller". Coordinate a safe, on-campus meeting spot to exchange cash or UPI for the item.'
  },
  {
    topic: 'How to Sell',
    q: 'What can I sell and how do I list items?',
    a: 'You can sell books, stationery, cycles, electronics, or lab equipment. Click the "Sell Item" button on desktop or "Sell" on mobile bottom navigation, fill in details, upload an image, and submit!'
  },
  {
    topic: 'How to Rent',
    q: 'How does renting items work?',
    a: 'Items designated as "Rent" show rental prices (usually per week/semester). Agree on rental duration, deposit fee, and return date with the seller via chat before finalizing.'
  },
  {
    topic: 'How Requests Work',
    q: 'What is the Requests System?',
    a: 'If you cannot find a specific resource (like a specific drafter or textbook), create a "Request" on the Requests board. Sellers with that item can then contact you directly.'
  },
  {
    topic: 'How Reviews Work',
    q: 'How can I review transactions?',
    a: 'Once a transaction is finalized (e.g. marked Sold/Rented), the buyer receives a notification. Go to the profile or transaction page, select the finished deal, and leave your rating & feedback.'
  },
  {
    topic: 'How Reputation Works',
    q: 'What are Trust Scores and XP levels?',
    a: 'Completing deals, listing items, logging in daily, and receiving 5-star ratings increases your Trust Score and awards XP. Levelling up unlocks premium profile badges showing you are a verified, top-tier trader.'
  }
];

export default function HelpCenterPage() {
  return <ProtectedRoute><HelpCenterContent /></ProtectedRoute>;
}

function HelpCenterContent() {
  const { user, userData } = useAuth();
  const toast = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  
  // Support ticket form states
  const [topic, setTopic] = useState('How to Buy');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredFaqs = FAQS.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      return toast.error('Ticket subject and detail description are required.');
    }
    setLoading(true);
    try {
      const ticketId = 'SV-' + Math.floor(100000 + Math.random() * 900000);
      await addDoc(collection(db, 'supportTickets'), {
        ticketId,
        userId: user.uid,
        userName: userData?.displayName || 'Anonymous Student',
        userEmail: user.email,
        topic,
        title,
        description,
        status: 'Open',
        createdAt: serverTimestamp()
      });
      
      toast.success(`Support ticket ${ticketId} submitted successfully!`);
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content" style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* Header */}
        <div className="page-header text-center animate-fadeInUp">
          <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <HelpCircle size={32} style={{ color: 'var(--accent-primary)' }} /> Help & Support
          </h1>
          <p>Find answers to common questions or submit a support ticket to our team.</p>
        </div>

        {/* FAQ Section */}
        <div style={{ marginBottom: 'var(--space-12)' }}>
          <h2 style={{ fontSize: 'var(--fs-xl)', marginBottom: 'var(--space-4)', color: '#fff' }}>Frequently Asked Questions</h2>
          
          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: 'var(--space-6)' }}>
            <input 
              type="text" 
              placeholder="Search help topics..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', background: 'rgba(255,255,255,0.03)' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredFaqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="card-glass" 
                style={{ padding: 'var(--space-4)', cursor: 'pointer', transition: 'border 0.2s', borderColor: openFaq === idx ? 'var(--accent-primary)' : 'var(--border-color)' }}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--accent-primary-hover)', textTransform: 'uppercase', fontWeight: 'bold' }}>{faq.topic}</span>
                  {openFaq === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                <h4 style={{ fontSize: 'var(--fs-base)', margin: '4px 0 0', fontWeight: 'bold', color: '#fff' }}>{faq.q}</h4>
                
                {openFaq === idx && (
                  <p style={{ marginTop: 'var(--space-3)', color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: 1.5, borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <div className="card-glass text-center" style={{ padding: 'var(--space-6)', color: 'var(--text-tertiary)' }}>
                No FAQ topics matches your search query.
              </div>
            )}
          </div>
        </div>

        {/* Submit Ticket Form */}
        <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--fs-xl)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <Ticket size={20} style={{ color: 'var(--accent-primary)' }} /> Submit a Support Ticket
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--space-6)' }}>
            Can't find what you need? Describe your issue below and our team will get back to you shortly.
          </p>

          <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Help Topic</label>
              <select className="form-select" value={topic} onChange={e => setTopic(e.target.value)}>
                <option value="How to Buy">How to Buy</option>
                <option value="How to Sell">How to Sell</option>
                <option value="How to Rent">How to Rent</option>
                <option value="How Requests Work">How Requests Work</option>
                <option value="How Reviews Work">How Reviews Work</option>
                <option value="How Reputation Works">How Reputation Works</option>
                <option value="Payment Issue">Payment/UPI Issue</option>
                <option value="Safety & Abuse">Safety & Abuse Report</option>
                <option value="Other">Other Issues</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input 
                type="text" 
                placeholder="e.g. Unable to message seller" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="form-input" 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Description *</label>
              <textarea 
                placeholder="Describe your issue in detail so we can help you quicker..." 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="form-textarea" 
                style={{ minHeight: '120px' }} 
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary btn-full btn-lg" 
              style={{ marginTop: 'var(--space-2)' }}
            >
              {loading ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
