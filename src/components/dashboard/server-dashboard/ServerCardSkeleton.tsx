'use client';

import React from 'react';

const ServerCardSkeleton: React.FC = () => {
  return (
    <div className='bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-pulse'>
      {/* Header */}
      <div className='flex justify-between items-center mb-4'>
        <div className='h-5 bg-gray-300 rounded w-1/3'></div>
        <div className='h-5 bg-gray-300 rounded w-1/4'></div>
      </div>

      {/* Gauges */}
      <div className='grid grid-cols-3 gap-4 mb-4'>
        <div className='text-center'>
          <div className='w-16 h-16 bg-gray-300 rounded-full mx-auto mb-1'></div>
          <div className='h-3 bg-gray-300 rounded w-1/2 mx-auto'></div>
        </div>
        <div className='text-center'>
          <div className='w-16 h-16 bg-gray-300 rounded-full mx-auto mb-1'></div>
          <div className='h-3 bg-gray-300 rounded w-1/2 mx-auto'></div>
        </div>
        <div className='text-center'>
          <div className='w-16 h-16 bg-gray-300 rounded-full mx-auto mb-1'></div>
          <div className='h-3 bg-gray-300 rounded w-1/2 mx-auto'></div>
        </div>
      </div>

      {/* Details */}
      <div className='space-y-2'>
        <div className='flex justify-between'>
          <div className='h-3 bg-gray-300 rounded w-1/4'></div>
          <div className='h-3 bg-gray-300 rounded w-1/2'></div>
        </div>
        <div className='flex justify-between'>
          <div className='h-3 bg-gray-300 rounded w-1/3'></div>
          <div className='h-3 bg-gray-300 rounded w-1/4'></div>
        </div>
        <div className='flex justify-between'>
          <div className='h-3 bg-gray-300 rounded w-1/5'></div>
          <div className='h-3 bg-gray-300 rounded w-1/3'></div>
        </div>
      </div>
    </div>
  );
};

export default ServerCardSkeleton;
