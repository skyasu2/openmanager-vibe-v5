'use client';

import { emergencyMode } from '@/lib/emergency-mode';
import { useEffect, useState } from 'react';

export function EmergencyBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(emergencyMode.isEmergencyMode());
  }, []);

  if (!isVisible) return null;

  return (
    <div className='fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2 text-center'>
      <div className='flex items-center justify-center gap-2'>
        <span className='_animate-pulse'>🚨</span>
        <span className='font-semibold'>
          {emergencyMode.getEmergencyMessage()}
        </span>
        <span className='_animate-pulse'>🚨</span>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className='absolute right-4 top-1/2 transform -translate-y-1/2 hover:bg-red-700 px-2 py-1 rounded'
      >
        ×
      </button>
    </div>
  );
}
