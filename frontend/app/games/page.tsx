'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect Games page to Learning page since we've pivoted to educational content
export default function GamesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to learning page
    router.replace('/learning');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Learning...</h1>
        <p className="text-gray-600">We've transformed our platform into an educational experience!</p>
      </div>
    </div>
  );
}