'use client';

import { motion } from 'framer-motion';

export default function MainPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* 헤더 스켈레톤 */}
      <header className="relative z-50 flex items-center justify-between p-6">
        <div className="flex items-center space-x-3">
          <div className="_animate-pulse h-10 w-10 rounded-lg bg-white/10" />
          <div>
            <div className="_animate-pulse mb-1 h-6 w-32 rounded bg-white/10" />
            <div className="_animate-pulse h-4 w-24 rounded bg-white/10" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="_animate-pulse h-10 w-10 rounded-full bg-white/10" />
        </div>
      </header>

      {/* 메인 콘텐츠 스켈레톤 */}
      <div className="container relative z-10 mx-auto px-6 pt-8">
        {/* 타이틀 스켈레톤 */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="_animate-pulse mx-auto mb-4 h-12 w-96 rounded-lg bg-white/10" />
          <div className="_animate-pulse mx-auto h-6 w-64 rounded bg-white/10" />
        </motion.div>

        {/* 제어 패널 스켈레톤 */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 flex flex-col items-center space-y-4">
              <div className="_animate-pulse h-16 w-64 rounded-xl bg-white/10" />
              <div className="_animate-pulse h-4 w-48 rounded bg-white/10" />
            </div>
          </div>
        </motion.div>

        {/* 기능 카드 그리드 스켈레톤 */}
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="_animate-pulse rounded-2xl bg-white/10 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
            >
              <div className="mb-3 h-12 w-12 rounded-xl bg-white/20" />
              <div className="mb-2 h-6 w-3/4 rounded bg-white/20" />
              <div className="mb-1 h-4 w-full rounded bg-white/20" />
              <div className="h-4 w-5/6 rounded bg-white/20" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
