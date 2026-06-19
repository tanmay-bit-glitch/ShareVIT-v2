'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { notifyGroup } from '@/lib/notifications';
import { 
  Upload, Check, ChevronRight, ChevronLeft, Image as ImageIcon, 
  FileText, DollarSign, Eye, ShoppingCart 
} from 'lucide-react';

const CATEGORIES = ['Books', 'Electronics', 'Lab Equipment', 'Stationery', 'Sports', 'Furniture', 'Clothing', 'Other'];
const LISTING_TYPES = ['Sell', 'Rent', 'Donate', 'Exchange'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
const LOCATIONS = ['Hostel', 'Campus', 'Outside Campus'];

export default function CreateListingPage() {
  return <ProtectedRoute><CreateListingContent /></ProtectedRoute>;
}

function CreateListingContent() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    category: '', 
    listingType: 'Sell', 
    price: '', 
    condition: 'Good', 
    location: 'Campus' 
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return toast.error('Image size must be less than 5MB.');
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
      toast.success('Image loaded successfully!');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        return toast.error('Image size must be less than 5MB.');
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
      toast.success('Image dropped successfully!');
    } else {
      toast.error('Please drop an image file.');
    }
  };

  const nextStep = () => {
    if (step === 2 && !form.title.trim()) {
      return toast.error('Please enter a title for your item.');
    }
    if (step === 3 && !form.category) {
      return toast.error('Please select a category.');
    }
    if (step === 3 && form.listingType !== 'Donate' && form.listingType !== 'Exchange' && !form.price) {
      return toast.error('Please set a price (or change type to Donate/Exchange).');
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      let imageUrl = '';
      if (image) {
        const imageRef = ref(storage, `marketplace/${user.uid}/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      const listingData = {
        ...form,
        price: (form.listingType === 'Donate' || form.listingType === 'Exchange') ? 0 : Number(form.price) || 0,
        imageUrl,
        sellerId: user.uid,
        sellerName: userData?.displayName || 'Anonymous',
        sellerEmail: user.email,
        sellerTrustScore: userData?.trustScore || 95,
        sellerRating: userData?.rating || 4.8,
        sellerBranch: userData?.branch || 'CSE',
        sellerYear: userData?.year || '3rd Year',
        status: 'active',
        views: 0,
        saves: 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'marketplace'), listingData);
      await updateDoc(doc(db, 'users', user.uid), { uploadsCount: increment(1) });
      
      // Trigger notifications for campus mates
      if (userData?.campus) {
        await notifyGroup(
          `New Marketplace Item: ${form.title}`,
          `${userData?.displayName || 'Someone'} listed a new item for ${form.listingType}.`,
          'Marketplace',
          { campus: userData.campus },
          { itemId: form.title },
          user.uid
        );
      }

      toast.success('Listing published successfully!');
      router.push('/marketplace');
    } catch (err) {
      console.error(err);
      toast.error('Failed to publish listing.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for progress indicator line width
  const getProgressLineWidth = () => {
    return `${((step - 1) / 3) * 100}%`;
  };

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '680px' }}>
        
        {/* Header */}
        <div className="page-header text-center animate-fadeInUp" style={{ marginBottom: 'var(--space-6)' }}>
          <h1>List an Item</h1>
          <p>Complete the steps to publish your listing to the campus marketplace</p>
        </div>

        {/* Wizard Progress Indicator */}
        <div className="wizard-progress-bar animate-fadeInUp">
          <div className="wizard-progress-line" style={{ width: getProgressLineWidth() }} />
          
          <div className={`wizard-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            {step > 1 ? <Check size={14} /> : '1'}
          </div>
          <div className={`wizard-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            {step > 2 ? <Check size={14} /> : '2'}
          </div>
          <div className={`wizard-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            {step > 3 ? <Check size={14} /> : '3'}
          </div>
          <div className={`wizard-step ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
            {step > 4 ? <Check size={14} /> : '4'}
          </div>
        </div>

        {/* Wizard Titles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 'var(--space-8)', padding: '0 4px' }}>
          <span style={{ color: step === 1 ? 'var(--accent-primary)' : 'inherit' }}>Upload</span>
          <span style={{ color: step === 2 ? 'var(--accent-primary)' : 'inherit' }}>Details</span>
          <span style={{ color: step === 3 ? 'var(--accent-primary)' : 'inherit' }}>Type & Price</span>
          <span style={{ color: step === 4 ? 'var(--accent-primary)' : 'inherit' }}>Publish</span>
        </div>

        {/* Wizard Card Form */}
        <div className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-8)' }}>
          
          {/* STEP 1: Upload Images */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'bold', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} style={{ color: 'var(--accent-primary)' }} /> Upload Item Image
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', marginBottom: 'var(--space-6)' }}>
                Items with clear images receive up to 80% more views and inquires.
              </p>

              <div 
                className="upload-area" 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('listing-image').click()}
                style={{ 
                  border: '2px dashed var(--border-color)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: 'var(--space-10) var(--space-6)', 
                  textAlign: 'center',
                  background: 'rgba(15, 23, 41, 0.2)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  minHeight: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                {preview ? (
                  <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                    <img 
                      src={preview} 
                      alt="Listing Preview" 
                      style={{ maxHeight: '200px', objectFit: 'contain', width: '100%', borderRadius: 'var(--radius-md)' }} 
                    />
                    <p style={{ fontSize: '11px', color: 'var(--text-link)', marginTop: '8px', fontWeight: 'bold' }}>Click image to replace</p>
                  </div>
                ) : (
                  <>
                    <Upload size={36} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }} />
                    <p style={{ fontWeight: 'bold', fontSize: 'var(--fs-sm)', margin: '0 0 var(--space-1) 0' }}>Drag & Drop your image here</p>
                    <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', margin: 0 }}>or click to browse from files (Max 5MB)</p>
                  </>
                )}
                <input 
                  id="listing-image" 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleImageChange} 
                />
              </div>
            </div>
          )}

          {/* STEP 2: Core Details */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'bold', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--accent-primary)' }} /> Item Details
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', marginBottom: 'var(--space-6)' }}>
                Give your item a clear name and describe any flaws or specifications.
              </p>

              <div className="form-group">
                <label className="form-label">Title *</label>
                <input 
                  className="form-input" 
                  placeholder="e.g. fx-991EX Scientific Calculator" 
                  value={form.title} 
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="e.g. Used for 2 semesters, completely scratchless, has all keys working. Includes original cover." 
                  rows={4}
                  value={form.description} 
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Condition</label>
                  <select 
                    className="form-select" 
                    value={form.condition} 
                    onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}
                  >
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Pickup Location</label>
                  <select 
                    className="form-select" 
                    value={form.location} 
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  >
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Pricing & Type */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'bold', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} style={{ color: 'var(--accent-primary)' }} /> Type, Category & Pricing
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', marginBottom: 'var(--space-6)' }}>
                Choose how students can acquire your item and categorize it.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select 
                    className="form-select" 
                    value={form.category} 
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Listing Type</label>
                  <select 
                    className="form-select" 
                    value={form.listingType} 
                    onChange={e => setForm(p => ({ ...p, listingType: e.target.value }))}
                  >
                    {LISTING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {(form.listingType === 'Sell' || form.listingType === 'Rent') ? (
                <div className="form-group animate-fadeInUp">
                  <label className="form-label">Price (₹) *</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    placeholder="e.g. 250" 
                    value={form.price} 
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))} 
                  />
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '10px', marginTop: '4px' }}>
                    {form.listingType === 'Rent' ? 'Set the rent price per week/semester.' : 'Set your direct sell price.'}
                  </p>
                </div>
              ) : (
                <div className="form-group animate-fadeInUp" style={{ padding: 'var(--space-4)', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ color: 'var(--accent-success)', fontSize: 'var(--fs-sm)', margin: 0, fontWeight: 'semibold' }}>
                    🌱 This item is marked as <strong>{form.listingType}</strong>. It will be listed as Free/Exchange to help other students!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Review & Publish */}
          {step === 4 && (
            <div>
              <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 'bold', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} style={{ color: 'var(--accent-primary)' }} /> Review Your Listing
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)', marginBottom: 'var(--space-6)' }}>
                Verify details before publishing to the campus feed.
              </p>

              {/* Review summary cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                
                {/* Photo summary */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  {preview ? (
                    <img src={preview} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', background: 'var(--bg-tertiary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📦</div>
                  )}
                  <div>
                    <h4 style={{ margin: 0, fontSize: 'var(--fs-sm)', fontWeight: 'bold' }}>{form.title}</h4>
                    <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>{form.category} • {form.condition} condition</p>
                  </div>
                </div>

                {/* Details list */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: 'var(--fs-sm)', background: 'rgba(255,255,255,0.01)', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '10px', uppercase: 'true', display: 'block' }}>LISTING TYPE</span>
                    <strong>{form.listingType}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '10px', uppercase: 'true', display: 'block' }}>PRICE</span>
                    <strong>{(form.listingType === 'Donate' || form.listingType === 'Exchange') ? 'Free' : `₹${form.price || 0}`}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '10px', uppercase: 'true', display: 'block' }}>LOCATION</span>
                    <strong>{form.location}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '10px', uppercase: 'true', display: 'block' }}>PUBLISHER</span>
                    <strong>{userData?.displayName || 'Anonymous'}</strong>
                  </div>
                </div>

                {/* Description summary */}
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '10px', uppercase: 'true', display: 'block', marginBottom: '4px' }}>DESCRIPTION</span>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12.5px' }}>{form.description || 'No description provided.'}</p>
                </div>

              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
            {step > 1 ? (
              <button onClick={prevStep} type="button" className="btn btn-secondary" style={{ gap: '6px' }}>
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <div /> // Placeholder
            )}

            {step < 4 ? (
              <button onClick={nextStep} type="button" className="btn btn-primary" style={{ gap: '6px' }}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                onClick={handlePublish} 
                type="button" 
                className="btn btn-success" 
                style={{ gap: '6px', background: 'var(--gradient-success)' }}
                disabled={loading}
              >
                {loading ? (
                  <>Publishing...</>
                ) : (
                  <>
                    <Check size={16} /> Publish Listing
                  </>
                )}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}