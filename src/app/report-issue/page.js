'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AlertOctagon, Link2 } from 'lucide-react';
import { createNotification } from '@/lib/notifications';

export default function ReportIssuePage() {
  return <ProtectedRoute><ReportIssueContent /></ProtectedRoute>;
}

function ReportIssueContent() {
  const { user, userData } = useAuth();
  const toast = useToast();
  
  const [category, setCategory] = useState('Bug Report');
  const [severity, setSeverity] = useState('Medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      return toast.error('Subject and description are required.');
    }
    setLoading(true);
    try {
      const reportId = 'SV-REP-' + Math.floor(100000 + Math.random() * 900000);
      await addDoc(collection(db, 'issueReports'), {
        reportId,
        userId: user.uid,
        userName: userData?.displayName || 'Anonymous Student',
        userEmail: user.email,
        category,
        severity,
        title,
        description,
        screenshotUrl: screenshotUrl || null,
        status: 'Open',
        createdAt: serverTimestamp()
      });

      const emailResponse = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          userName: userData?.displayName || 'Anonymous Student',
          userEmail: user.email,
          category,
          severity,
          title,
          description,
          screenshotUrl: screenshotUrl || null,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error('The report was saved, but the administrator email could not be sent.');
      }

      await createNotification(
        user.uid,
        'Issue Report Submitted',
        `Your report ${reportId} was sent to the administrator.`,
        'System',
        { link: '/report-issue', reportId, type: 'issue_report' }
      );
      
      toast.success(`Report ${reportId} submitted and sent to the administrator.`);
      setTitle('');
      setDescription('');
      setScreenshotUrl('');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content" style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: '700px' }}>
        
        {/* Header */}
        <div className="page-header text-center animate-fadeInUp">
          <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <AlertOctagon size={32} style={{ color: 'var(--accent-danger)' }} /> Report an Issue
          </h1>
          <p>Encountered a bug or wish to flag marketplace abuse? File a report here.</p>
        </div>

        {/* Submit Issue Card */}
        <div className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-6)' }}>
          <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Issue Category</label>
                <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Bug Report">Bug Report 🐛</option>
                  <option value="Feature Request">Feature Request 💡</option>
                  <option value="Spam Listing">Spam Listing 🚫</option>
                  <option value="Marketplace Abuse">Marketplace Abuse ⚠️</option>
                  <option value="UI Issue">UI/Layout Issue 🎨</option>
                  <option value="Account Issue">Account Issue 👤</option>
                  <option value="Other">Other 📦</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Severity Level</label>
                <select className="form-select" value={severity} onChange={e => setSeverity(e.target.value)}>
                  <option value="Low">Low (Visual glitch)</option>
                  <option value="Medium">Medium (Minor functional issue)</option>
                  <option value="High">High (Major functional issue)</option>
                  <option value="Critical">Critical (Security/Crash/Data loss)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Summary / Subject *</label>
              <input 
                type="text" 
                placeholder="e.g. Drafter image upload crashes on TE department input" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="form-input" 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Issue Details & Reproduction Steps *</label>
              <textarea 
                placeholder="Please describe in detail: (1) what you were doing, (2) what went wrong, and (3) what you expected to see..." 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="form-textarea" 
                style={{ minHeight: '150px' }} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Link2 size={14} /> Screenshot URL (Optional)
              </label>
              <input 
                type="url" 
                placeholder="e.g. https://imgur.com/image-link" 
                value={screenshotUrl} 
                onChange={e => setScreenshotUrl(e.target.value)} 
                className="form-input" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary btn-full btn-lg" 
              style={{ marginTop: 'var(--space-2)' }}
            >
              {loading ? 'Submitting Report...' : 'File Issue Report'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
