'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import ParticleBackground from './ParticleBackground';

interface HeroSectionProps {
  onStartSystem: () => void;
  isLoading?: boolean;
}

export default function HeroSection({ onStartSystem, isLoading = false }: HeroSectionProps) {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      
      {/* 배경 애니메이션 */}
      <ParticleBackground />
      
      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-slate-900/30" />
      
      {/* 메인 콘텐츠 */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        
        {/* 배지 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm 
                     rounded-full border border-white/20 mb-8"
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-white">
            MCP 시스템 + AI 협업 개발로 구현
          </span>
        </motion.div>

        {/* 메인 타이틀 */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
        >
          <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 
                          bg-clip-text text-transparent leading-tight block">
            OpenManager
          </span>
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-2xl md:text-4xl lg:text-5xl font-light text-white/90 block mt-2"
          >
            V5.0
          </motion.span>
        </motion.h1>

        {/* 서브타이틀 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl lg:text-3xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
        >
          실제 구현된 MCP AI 시스템과 데이터 생성 엔진
          <br />
          <span className="text-lg md:text-xl text-gray-400 font-light">
            Cursor AI 협업 개발로 구축한 현실적이고 측정 가능한 모니터링 시스템
          </span>
        </motion.p>

        {/* CTA 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
        >
          <motion.button
            onClick={onStartSystem}
            disabled={isLoading}
            className={`
              group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 
              rounded-full text-white font-semibold text-lg shadow-2xl
              transition-all duration-300 transform-gpu
              ${isLoading 
                ? 'opacity-75 cursor-not-allowed' 
                : 'hover:shadow-blue-500/25 hover:scale-105 active:scale-95'
              }
            `}
            whileHover={!isLoading ? { y: -2 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
          >
            <div className="flex items-center space-x-3">
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <span className="text-2xl">🛠️</span>
              )}
              <span>{isLoading ? '시스템 시작 중...' : '실제 구현 확인하기'}</span>
              {!isLoading && (
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
            </div>
            
            {/* 버튼 그림자 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-full blur-xl opacity-50 -z-10 group-hover:opacity-75 transition-opacity" />
          </motion.button>

          {/* 데모 버튼 */}
          <motion.a
            href="/dashboard"
            className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 
                       rounded-full text-white font-medium hover:bg-white/20 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            라이브 데모 확인
          </motion.a>
        </motion.div>

        {/* 실제 성과 통계 정보 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
        >
          {[
            { label: '데이터 생성 엔진', value: '507줄', icon: '🧪' },
            { label: '압축 효율성', value: '65%', icon: '📊' },
            { label: 'TypeScript 적용', value: '100%', icon: '💎' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* 스크롤 인디케이터 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-3 bg-white/50 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
} 