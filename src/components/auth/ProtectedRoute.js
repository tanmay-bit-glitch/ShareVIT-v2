'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }) {
  const { user, userData, loading, isActive } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userData && !isActive) {
        router.push('/verify-otp');
      }
    }
  }, [user, userData, loading, isActive, router]);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div className="flex-col gap-4" style={{ alignItems: 'center' }}>
          <div className="spinner spinner-lg" />
          <p style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (userData && !isActive)) {
    return null;
  }

  return children;
}
