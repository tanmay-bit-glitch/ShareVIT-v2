'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AssignmentsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/marketplace/assignments');
  }, [router]);
  return null;
}