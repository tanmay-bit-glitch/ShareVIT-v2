'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <Navbar />
        <main className="page-wrapper">
          {children}
        </main>
        <Footer />
      </ToastProvider>
    </AuthProvider>
  );
}
