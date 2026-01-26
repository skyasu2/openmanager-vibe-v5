'use client';

import { useEffect, useState } from 'react';
import { emergencyMode } from '@/lib/emergency-mode';

export function EmergencyBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(emergencyMode.isEmergencyMode());
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 bg-red-600 px-4 py-2 text-center text-white">
      <div className="flex items-center justify-center gap-2">
        <span className="animate-pulse">🚨</span>
        <span className="font-semibold">
          {emergencyMode.getEmergencyMessage()}
        </span>
        <span className="animate-pulse">🚨</span>
      </div>
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 transform rounded px-2 py-1 hover:bg-red-700"
      >
        ×
      </button>
    </div>
  );
}
