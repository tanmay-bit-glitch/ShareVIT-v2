'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadImage, uploadDocument, getPublicIdFromUrl } from '@/lib/cloudinary';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { notifyGroup } from '@/lib/notifications';
import { ENGINEERING_BRANCHES } from '@/lib/constants';
import {
  getDocumentAccept,
  getDocumentLabel,
  isDocumentCategory,
  isImageCategory,
  validateMarketplaceDocument,
  validateMarketplaceImage,
} from '@/lib/marketplaceUploads';
import {
  Check, ChevronRight, ChevronLeft, Image as ImageIcon, 
  FileText, DollarSign, Eye, FileUp, Sparkles
} from 'lucide-react';

const CATEGORIES = ['Notes', 'Assignments', 'Books', 'Electronics', 'Study Materials', 'PYQs', 'Marketplace Items', 'Miscellaneous'];
const LISTING_TYPES = ['Sell', 'Rent', 'Donate', 'Exchange'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
const LOCATIONS = ['Hostel', 'Campus', 'Outside Campus'];

export default function CreateListingPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="flex-center" style={{ minHeight: '50vh' }}>
          <div className="spinner spinner-lg" />
        </div>
      }>
        <CreateListingContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function CreateListingContent() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    category: '', 
    listingType: 'Donate', 
    price: '', 
    condition: 'Good', 
    location: 'Campus',
    // Academic fields
    subjectName: '',
    department: '',
    semester: '',
    facultyName: '',
    assignmentType: '',
    subcategory: '',
    // Physical goods fields
    author: ''
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [imageProgress, setImageProgress] = useState(0);
  const [pdfProgress, setPdfProgress] = useState(0);

  // Sync Category from search parameters
  useEffect(() => {
    const qCategory = searchParams.get('category');
    if (qCategory && CATEGORIES.includes(qCategory)) {
      setForm(prev => {
        const isDoc = isDocumentCategory(qCategory);
        return { 
          ...prev, 
          category: qCategory,
          listingType: isDoc ? 'Donate' : 'Sell'
        };
      });
    }
  }, [searchParams]);

  // Adjust defaults when category changes
  const handleCategoryChange = (val) => {
    const isDoc = isDocumentCategory(val);
    setForm(prev => ({
      ...prev,
      category: val,
      listingType: isDoc ? 'Donate' : 'Sell',
      price: ''
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        validateMarketplaceImage(file);
        if (file.size > 10 * 1024 * 1024) {
          return toast.error('Image size must be less than 10MB.');
        }
        setImage(file);
        setPreview(URL.createObjectURL(file));
        toast.success('Image loaded successfully!');
      } catch (err) {
        toast.error(err.message || 'Invalid image format');
      }
    }
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        validateMarketplaceDocument(file, form.category);

        if (file.size > 25 * 1024 * 1024) {
          return toast.error('Document size must be less than 25MB.');
        }
        setPdfFile(file);
        setPdfName(file.name);
        toast.success('Document loaded successfully!');
      } catch (err) {
        toast.error(err.message || 'Invalid document format');
      }
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!form.category) {
        return toast.error('Please select a category first.');
      }
      if (isDocumentCategory(form.category) && !pdfFile) {
        return toast.error('Please attach a document.');
      }
      if (isImageCategory(form.category) && !image) {
        return toast.error('Please upload at least one image of the product.');
      }
    }
    
    if (step === 2) {
      if (!form.title.trim()) {
        return toast.error('Please enter a listing title.');
      }
      // Validate dynamic detail fields
      if (form.category === 'Notes' || form.category === 'PYQs') {
        if (!form.subjectName.trim()) return toast.error('Subject Name is required.');
        if (!form.department) return toast.error('Please select the department.');
        if (!form.semester) return toast.error('Please select the semester.');
      }
      if (form.category === 'Assignments') {
        if (!form.subjectName.trim()) return toast.error('Subject Name is required.');
        if (!form.semester) return toast.error('Please select the semester.');
        if (!form.assignmentType) return toast.error('Please select the assignment type.');
      }
      if (form.category === 'Study Materials') {
        if (!form.subjectName.trim()) return toast.error('Subject Name is required.');
        if (!form.semester) return toast.error('Please select the semester.');
        if (!form.subcategory) return toast.error('Please select the subcategory.');
      }
      if (form.category === 'Books') {
        if (!form.author.trim()) return toast.error('Book author is required.');
      }
    }

    if (step === 3) {
      if (form.listingType !== 'Donate' && form.listingType !== 'Exchange' && !form.price) {
        return toast.error('Please specify a price (or select Donate/Exchange type).');
      }
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
      let pdfUrl = '';

      if (isDocumentCategory(form.category)) {
        if (!pdfFile) {
          throw new Error('Please attach a document.');
        }

        pdfUrl = await uploadDocument(pdfFile, (progress) => {
          setPdfProgress(progress);
        });

        if (image) {
          imageUrl = await uploadImage(image, (progress) => {
            setImageProgress(progress);
          });
        }
      } else {
        if (!image) {
          throw new Error('Please upload at least one image of the product.');
        }

        imageUrl = await uploadImage(image, (progress) => {
          setImageProgress(progress);
        });
      }

      const listingData = {
        title: form.title,
        description: form.description,
        category: form.category,
        listingType: form.listingType,
        price: (form.listingType === 'Donate' || form.listingType === 'Exchange') ? 0 : Number(form.price) || 0,
        condition: isDocumentCategory(form.category) ? 'New' : form.condition,
        location: form.location,
        // Category specific details
        subjectName: isDocumentCategory(form.category) ? form.subjectName : '',
        department: (form.category === 'Notes' || form.category === 'PYQs') ? form.department : '',
        semester: isDocumentCategory(form.category) ? form.semester : '',
        facultyName: form.category === 'Assignments' ? form.facultyName : '',
        assignmentType: form.category === 'Assignments' ? form.assignmentType : '',
        subcategory: form.category === 'Study Materials' ? form.subcategory : '',
        author: form.category === 'Books' ? form.author : '',
        // Media URLs
        imageUrl,
        imagePublicId: image ? getPublicIdFromUrl(imageUrl) : '',
        pdfUrl,
        pdfPublicId: pdfFile ? getPublicIdFromUrl(pdfUrl) : '',
        downloads: 0,
        // Seller details
        sellerId: user.uid,
        sellerName: userData?.displayName || 'Anonymous',
        sellerEmail: user.email,
        sellerTrustScore: userData?.trustScore || 96,
        sellerRating: userData?.rating || 4.8,
        sellerBranch: userData?.branch || 'CSE',
        sellerYear: userData?.year || '3rd Year',
        status: 'active',
        views: 0,
        saves: 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'listings'), listingData);
      await updateDoc(doc(db, 'users', user.uid), { uploadsCount: increment(1) });
      
      // Trigger notifications
      if (userData?.campus) {
        await notifyGroup(
          `New ${form.category}: ${form.title}`,
          `${userData?.displayName || 'Someone'} shared a new post.`,
          'Marketplace',
          { campus: userData.campus },
          { itemId: form.title },
          user.uid
        );
      }

      toast.success('Listing published successfully!');
      const categoryRoute = form.category.toLowerCase().replace(' ', '-');
      router.push(`/marketplace/${categoryRoute}`);
    } catch (err) {
      console.error('Publishing error details:', err);
      toast.error('Failed to publish listing: ' + (err.message || 'Check console logs.'));
    } finally {
      setLoading(false);
    }
  };

  const getProgressLineWidth = () => {
    return `${((step - 1) / 3) * 100}%`;
  };

  return (
    <div className="page-content" style={{ background: '#0b0f19', color: '#f8fafc', minHeight: '90vh' }}>
      <div className="container" style={{ maxWidth: '680px' }}>
        
        {/* Header */}
        <div className="page-header text-center animate-fadeInUp" style={{ marginBottom: 'var(--space-6)' }}>
          <h1>List an Item</h1>
          <p>Provide information about your academic file or physical product</p>
        </div>

        {/* Progress Bar */}
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

        {/* Steps Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 'var(--space-8)', padding: '0 4px' }}>
          <span style={{ color: step === 1 ? 'var(--accent-primary)' : 'inherit' }}>Files & Category</span>
          <span style={{ color: step === 2 ? 'var(--accent-primary)' : 'inherit' }}>Details</span>
          <span style={{ color: step === 3 ? 'var(--accent-primary)' : 'inherit' }}>Pricing & Pickup</span>
          <span style={{ color: step === 4 ? 'var(--accent-primary)' : 'inherit' }}>Publish</span>
        </div>

        {/* Main Wizard Form Wrapper */}
        <div className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-8)', background: 'rgba(17, 24, 39, 0.45)', border: '1px solid rgba(255,255,255,0.06)' }}>
          
          {/* STEP 1: Choose Category and Upload Files */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} /> Select Category & File Uploads
              </h3>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Category *</label>
                <select 
                  className="form-select" 
                  value={form.category} 
                  onChange={e => handleCategoryChange(e.target.value)}
                  style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Dynamic File Uploader slots */}
              {form.category && (
                <div className="animate-fadeInUp" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Academic Document Slot */}
                  {isDocumentCategory(form.category) && (
                    <div className="form-group">
                      <label className="form-label">
                        Academic Document ({getDocumentLabel(form.category)}) *
                      </label>
                      <div 
                        onClick={() => document.getElementById('listing-pdf').click()}
                        style={{ 
                          border: '2px dashed rgba(255,255,255,0.15)', 
                          borderRadius: '12px', 
                          padding: '24px 16px', 
                          textAlign: 'center',
                          background: 'rgba(15, 23, 41, 0.25)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <FileUp size={28} style={{ color: 'var(--accent-primary)' }} />
                        {pdfName ? (
                          <div>
                            <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#fff', margin: 0 }}>{pdfName}</p>
                            <p style={{ fontSize: '11px', color: 'var(--accent-success)', margin: '4px 0 0' }}>Click to replace file</p>
                          </div>
                          ) : (
                            <>
                              <p style={{ fontWeight: 'bold', fontSize: '13px', margin: 0 }}>Select File</p>
                              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                              {getDocumentLabel(form.category)} up to 25MB
                              </p>
                            </>
                          )}
                        <input 
                          id="listing-pdf" 
                          type="file" 
                          accept={getDocumentAccept(form.category)} 
                          style={{ display: 'none' }} 
                          onChange={handlePdfChange} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Image slot (Optional for Academic, Required for Physical goods) */}
                  <div className="form-group">
                    <label className="form-label">
                      {isDocumentCategory(form.category) ? 'Thumbnail Preview Image (Optional)' : 'Item Image *'}
                    </label>
                    <div 
                      onClick={() => document.getElementById('listing-image').click()}
                      style={{ 
                        border: '2px dashed rgba(255,255,255,0.15)', 
                        borderRadius: '12px', 
                        padding: '24px 16px', 
                        textAlign: 'center',
                        background: 'rgba(15, 23, 41, 0.25)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '140px'
                      }}
                    >
                      {preview ? (
                        <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }}>
                          <img src={preview} alt="Preview" style={{ maxHeight: '120px', objectFit: 'contain', width: '100%', borderRadius: '8px' }} />
                          <p style={{ fontSize: '10px', color: 'var(--accent-primary)', marginTop: '6px', fontWeight: 'bold', margin: 0 }}>Replace photo</p>
                        </div>
                      ) : (
                        <>
                          <ImageIcon size={28} style={{ color: '#64748b', marginBottom: '8px' }} />
                          <p style={{ fontWeight: 'bold', fontSize: '13px', margin: 0 }}>Select Photo</p>
                          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>JPG, PNG up to 5MB</p>
                        </>
                      )}
                      <input id="listing-image" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* STEP 2: Detail fields based on Category */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--accent-primary)' }} /> Listing Specifications
              </h3>

              {/* Title input */}
              <div className="form-group">
                <label className="form-label">
                  {form.category === 'Notes' ? 'Notes Title *' :
                   form.category === 'PYQs' ? 'PYQ Title *' :
                   form.category === 'Assignments' ? 'Assignment Title *' :
                   form.category === 'Books' ? 'Book Title *' :
                   form.category === 'Electronics' ? 'Product Name *' :
                   form.category === 'Study Materials' ? 'Material Title *' : 'Listing Title *'}
                </label>
                <input 
                  className="form-input" 
                  placeholder="e.g. fx-991EX Scientific Calculator, B.S. Grewal, Unit 2 DSA" 
                  value={form.title} 
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
 
              {/* DYNAMIC METADATA INPUTS */}
              
              {/* Category: NOTES / PYQs */}
              {(form.category === 'Notes' || form.category === 'PYQs') && (
                <div className="animate-fadeInUp" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Subject Name *</label>
                    <input className="form-input" placeholder="e.g. Data Structures & Algorithms" value={form.subjectName} onChange={e => setForm(p => ({ ...p, subjectName: e.target.value }))} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Semester *</label>
                      <select className="form-select" value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <option value="">Select</option>
                        {['1', '2', '3', '4', '5', '6', '7', '8'].map(s => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department *</label>
                      <select className="form-select" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <option value="">Select</option>
                        {ENGINEERING_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Category: ASSIGNMENTS */}
              {form.category === 'Assignments' && (
                <div className="animate-fadeInUp" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Subject Name *</label>
                    <input className="form-input" placeholder="e.g. Computer Networks" value={form.subjectName} onChange={e => setForm(p => ({ ...p, subjectName: e.target.value }))} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Semester *</label>
                      <select className="form-select" value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <option value="">Select</option>
                        {['1', '2', '3', '4', '5', '6', '7', '8'].map(s => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Assignment Type *</label>
                      <select className="form-select" value={form.assignmentType} onChange={e => setForm(p => ({ ...p, assignmentType: e.target.value }))} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <option value="">Select</option>
                        {['Assignment', 'Lab Manual', 'Project Report', 'Mini Project'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Faculty Name (Optional)</label>
                    <input className="form-input" placeholder="e.g. Prof. G. R. Deshpande" value={form.facultyName} onChange={e => setForm(p => ({ ...p, facultyName: e.target.value }))} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                </div>
              )}

              {/* Category: STUDY MATERIALS */}
              {form.category === 'Study Materials' && (
                <div className="animate-fadeInUp" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Subject Name *</label>
                    <input className="form-input" placeholder="e.g. Engineering Chemistry" value={form.subjectName} onChange={e => setForm(p => ({ ...p, subjectName: e.target.value }))} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Semester *</label>
                      <select className="form-select" value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <option value="">Select</option>
                        {['1', '2', '3', '4', '5', '6', '7', '8'].map(s => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subcategory *</label>
                      <select className="form-select" value={form.subcategory} onChange={e => setForm(p => ({ ...p, subcategory: e.target.value }))} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <option value="">Select</option>
                        {['Previous Year Papers', 'Lab Manuals', 'Practical Files', 'Viva Notes'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Category: BOOKS */}
              {form.category === 'Books' && (
                <div className="animate-fadeInUp" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Author Name *</label>
                    <input className="form-input" placeholder="e.g. B.S. Grewal" value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Condition</label>
                      <select className="form-select" value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pickup Location</label>
                      <select className="form-select" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Category: ELECTRONICS / MISC */}
              {(form.category === 'Electronics' || form.category === 'Miscellaneous') && (
                <div className="animate-fadeInUp" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Condition</label>
                    <select className="form-select" value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pickup Location</label>
                    <select className="form-select" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="form-group" style={{ marginTop: '14px' }}>
                <label className="form-label">Description (Optional)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Provide details about flaws, syllabus scope, topics covered, or specs..." 
                  rows={4}
                  value={form.description} 
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Pricing & Type */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} style={{ color: 'var(--accent-primary)' }} /> Pricing & Listing Type
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: 'var(--space-6)' }}>
                Academic resources are usually shared for Free (Donate), but you can sell/rent them.
              </p>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Listing Type</label>
                <select 
                  className="form-select" 
                  value={form.listingType} 
                  onChange={e => setForm(p => ({ ...p, listingType: e.target.value }))}
                  style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {LISTING_TYPES.map(t => <option key={t} value={t}>{t} Item</option>)}
                </select>
              </div>

              {(form.listingType === 'Sell' || form.listingType === 'Rent') ? (
                <div className="form-group animate-fadeInUp">
                  <label className="form-label">Price (₹) *</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    placeholder="e.g. 150" 
                    value={form.price} 
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    style={{ background: '#0b0f19', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              ) : (
                <div className="form-group animate-fadeInUp" style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.08)', border: '1px dashed rgba(16, 185, 129, 0.3)', borderRadius: '12px' }}>
                  <p style={{ color: '#34d399', fontSize: '13px', margin: 0, fontWeight: '500' }}>
                    🌱 Marked as <strong>{form.listingType}</strong>. Listed as Free to assist campus students!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Review and Publish */}
          {step === 4 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} style={{ color: 'var(--accent-primary)' }} /> Review & Publish
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                
                {/* Visual Overview */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                  {preview ? (
                    <img src={preview} alt="Thumbnail" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    <div style={{ width: '64px', height: '64px', background: '#1e293b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                      {(form.category === 'Notes' || form.category === 'PYQs') ? '📝' : 
                       form.category === 'Assignments' ? '📋' : 
                       form.category === 'Study Materials' ? '📁' : '📦'}
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{form.title}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                      Category: {form.category} • Condition: {isDocumentCategory(form.category) ? 'Digital File' : form.condition}
                    </p>
                  </div>
                </div>
 
                {/* Specific details card */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', background: 'rgba(255,255,255,0.01)', padding: '16px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Listing Type</span>
                    <strong>{form.listingType}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Price</span>
                    <strong>{(form.listingType === 'Donate' || form.listingType === 'Exchange') ? 'Free' : `₹${form.price || 0}`}</strong>
                  </div>
                  
                  {isDocumentCategory(form.category) ? (
                    <>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Subject</span>
                        <strong>{form.subjectName}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Semester</span>
                        <strong>Semester {form.semester}</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Pickup Location</span>
                        <strong>{form.location}</strong>
                      </div>
                      {form.category === 'Books' && (
                        <div>
                          <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Author</span>
                          <strong>{form.author}</strong>
                        </div>
                      )}
                    </>
                  )}
 
                  {(form.category === 'Notes' || form.category === 'PYQs') && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Department</span>
                      <strong style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{form.department}</strong>
                    </div>
                  )}
                  {form.category === 'Assignments' && (
                    <>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Assignment Type</span>
                        <strong>{form.assignmentType}</strong>
                      </div>
                      {form.facultyName && (
                        <div>
                          <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Faculty</span>
                          <strong>{form.facultyName}</strong>
                        </div>
                      )}
                    </>
                  )}
                  {form.category === 'Study Materials' && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Subcategory</span>
                      <strong>{form.subcategory}</strong>
                    </div>
                  )}
                </div>

                {/* File Attachment confirmation */}
                {pdfName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.15)', fontSize: '13px' }}>
                    <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ color: '#93c5fd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Attached PDF: {pdfName}</span>
                  </div>
                )}

                {/* Cloudinary Upload Progress Indicators */}
                {loading && (
                  <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="spinner spinner-sm" style={{ width: 14, height: 14 }} /> Uploading Assets to Cloudinary...
                    </h4>
                    
                    {image && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          <span>Image Upload</span>
                          <span>{imageProgress}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${imageProgress}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.2s ease-out' }} />
                        </div>
                      </div>
                    )}

                    {pdfFile && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          <span>PDF Document Upload</span>
                          <span>{pdfProgress}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${pdfProgress}%`, height: '100%', background: 'var(--accent-success)', transition: 'width 0.2s ease-out' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
            {step > 1 ? (
              <button onClick={prevStep} type="button" className="btn btn-secondary" style={{ gap: '6px' }} disabled={loading}>
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <div />
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
                style={{ gap: '6px', background: 'var(--gradient-success)', color: 'white' }}
                disabled={loading}
              >
                {loading ? 'Publishing...' : (
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
