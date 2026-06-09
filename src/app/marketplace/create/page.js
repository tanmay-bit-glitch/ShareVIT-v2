'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const categories = ['Books', 'Electronics', 'Lab Equipment', 'Stationery', 'Sports', 'Furniture', 'Clothing', 'Other'];
const listingTypes = ['Sell', 'Rent', 'Donate', 'Exchange'];
const conditions = ['Like New', 'Good', 'Fair', 'Used'];

export default function CreateListingPage() {
  return <ProtectedRoute><CreateListingContent /></ProtectedRoute>;
}

function CreateListingContent() {
  const [form, setForm] = useState({ title: '', description: '', category: '', listingType: 'Sell', price: '', condition: 'Good', location: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, userData } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category) return toast.error('Title and category are required.');
    setLoading(true);
    try {
      let imageUrl = '';
      if (image) {
        const imageRef = ref(storage, `marketplace/${user.uid}/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }
      await addDoc(collection(db, 'marketplace'), {
        ...form,
        price: form.listingType === 'Donate' ? 0 : Number(form.price) || 0,
        imageUrl,
        sellerId: user.uid,
        sellerName: userData?.displayName || 'Anonymous',
        sellerEmail: user.email,
        status: 'active',
        views: 0,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'users', user.uid), { uploadsCount: increment(1) });
      toast.success('Listing created!');
      router.push('/marketplace');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: 700 }}>
        <div className="page-header animate-fadeInUp">
          <h1>Create Listing</h1>
          <p>List an item for fellow VIT students</p>
        </div>
        <form onSubmit={handleSubmit} className="card-glass animate-fadeInUp" style={{ padding: 'var(--space-8)' }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="e.g. Engineering Mathematics Textbook" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Describe your item..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Listing Type</label>
              <select className="form-select" value={form.listingType} onChange={e => setForm(p => ({ ...p, listingType: e.target.value }))}>
                {listingTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Price (₹){form.listingType === 'Donate' && ' — Free'}</label>
              <input className="form-input" type="number" placeholder="0" value={form.price} disabled={form.listingType === 'Donate'} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Condition</label>
              <select className="form-select" value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}>
                {conditions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Image</label>
            <div className="upload-area" onClick={() => document.getElementById('listing-image').click()}>
              {preview ? <Image src={preview} alt="Preview" width={200} height={200} style={{ maxHeight: 200, objectFit: 'contain', borderRadius: 'var(--radius-md)' }} unoptimized /> : <><p style={{ fontSize: '2rem' }}>📷</p><p>Click to upload an image</p></>}
              <input id="listing-image" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" /> Creating...</> : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}