'use client';

import { motion } from 'framer-motion';

export default function MainPageSkeleton() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900'>
      {/* 헤더 스켈레톤 */}
      <header className='relative z-50 flex justify-between items-center p-6'>
        <div className='flex items-center space-x-3'>
          <div className='w-10 h-10 rounded-lg bg-white/10 animate-pulse' />
          <div>
            <div className='h-6 w-32 bg-white/10 rounded animate-pulse mb-1' />
            <div className='h-4 w-24 bg-white/10 rounded animate-pulse' />
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-full bg-white/10 animate-pulse' />
        </div>
      </header>

      {/* 메인 콘텐츠 스켈레톤 */}
      <div className='relative z-10 container mx-auto px-6 pt-8'>
        {/* 타이틀 스켈레톤 */}
        <motion.div
          className='text-center mb-12'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className='h-12 w-96 bg-white/10 rounded-lg mx-auto mb-4 animate-pulse' />
          <div className='h-6 w-64 bg-white/10 rounded mx-auto animate-pulse' />
        </motion.div>

        {/* 제어 패널 스켈레톤 */}
        <motion.div
          className='mb-12'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className='max-w-2xl mx-auto text-center'>
            <div className='flex flex-col items-center mb-6 space-y-4'>
              <div className='w-64 h-16 bg-white/10 rounded-xl animate-pulse' />
              <div className='h-4 w-48 bg-white/10 rounded animate-pulse' />
            </div>
          </div>
        </motion.div>

        {/* 기능 카드 그리드 스켈레톤 */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto'>
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className='p-4 bg-white/10 rounded-2xl animate-pulse'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
            >
              <div className='w-12 h-12 bg-white/20 rounded-xl mb-3' />
              <div className='h-6 w-3/4 bg-white/20 rounded mb-2' />
              <div className='h-4 w-full bg-white/20 rounded mb-1' />
              <div className='h-4 w-5/6 bg-white/20 rounded' />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
