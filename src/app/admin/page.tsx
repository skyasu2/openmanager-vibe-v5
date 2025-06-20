'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Server,
  Settings,
  BarChart3,
  Shield,
  Database,
  Cpu,
  Monitor,
  FileText,
  Wrench,
  Home,
  Activity,
  Zap,
  CheckCircle,
  TrendingUp,
  Users,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [selectedCategory, setSelectedCategory] = useState<'ai' | 'system'>(
    'ai'
  );
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const aiManagementFeatures = [
    {
      title: 'AI 에이전트 관리',
      description: '11개 AI 엔진 통합 관리 및 실시간 모니터링',
      icon: <Brain className='w-8 h-8' />,
      path: '/admin/ai-agent',
      color: 'from-purple-500 to-pink-500',
      features: ['11개 AI 엔진', '실시간 상태', '성능 분석'],
      status: 'active',
      complexity: 'high',
    },
    {
      title: 'MCP 서버 모니터링',
      description: 'MCP 시스템 상태 및 엔터프라이즈급 모니터링',
      icon: <Monitor className='w-8 h-8' />,
      path: '/admin/mcp-monitoring',
      color: 'from-green-500 to-emerald-500',
      features: ['시스템 상태', '성능 메트릭', '알림 관리'],
      status: 'active',
      complexity: 'high',
    },
  ];

  const systemManagementFeatures = [
    {
      title: '개발과정 기록',
      description: '20일간 AI 기반 개발 프로젝트 전체 기록',
      icon: <FileText className='w-8 h-8' />,
      path: '/admin/development-process',
      color: 'from-purple-500 to-indigo-500',
      features: ['개발 과정', '기술 경험', '프로젝트 회고'],
      status: 'active',
      complexity: 'low',
    },
    {
      title: '시스템 로그',
      description: '전체 시스템 로그 조회 및 실시간 분석',
      icon: <Activity className='w-8 h-8' />,
      path: '/logs',
      color: 'from-gray-500 to-slate-500',
      features: ['실시간 로그', '검색 필터', '로그 분석'],
      status: 'active',
      complexity: 'medium',
    },
    {
      title: '개발 도구',
      description: '시스템 개발 및 디버깅 통합 도구',
      icon: <Wrench className='w-8 h-8' />,
      path: '/dev-tools',
      color: 'from-yellow-500 to-orange-500',
      features: ['디버깅', '성능 분석', '개발 지원'],
      status: 'active',
      complexity: 'medium',
    },
    {
      title: '데이터베이스 관리',
      description: 'Supabase 데이터베이스 연동 및 관리',
      icon: <Database className='w-8 h-8' />,
      path: '/notes',
      color: 'from-teal-500 to-green-500',
      features: ['데이터 조회', 'CRUD 작업', '연결 테스트'],
      status: 'active',
      complexity: 'medium',
    },
  ];

  const currentFeatures =
    selectedCategory === 'ai' ? aiManagementFeatures : systemManagementFeatures;

  const stats = [
    {
      value: '2',
      label: 'AI 핵심 도구',
      icon: <Brain className='w-5 h-5' />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: '엔터프라이즈급',
    },
    {
      value: '3',
      label: '시스템 도구',
      icon: <Settings className='w-5 h-5' />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: '완전 통합',
    },
    {
      value: '99.9%',
      label: '시스템 가동률',
      icon: <CheckCircle className='w-5 h-5' />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: '안정성 보장',
    },
    {
      value: '실시간',
      label: '모니터링',
      icon: <Activity className='w-5 h-5' />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: '24/7 운영',
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      {/* 개선된 헤더 */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className='bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm'
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center gap-4'>
              <Link
                href='/'
                className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-200 hover:scale-105'
              >
                <Home className='w-4 h-4' />
                <span className='font-medium'>홈으로</span>
              </Link>
              <div className='h-6 w-px bg-gradient-to-b from-gray-300 to-transparent'></div>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                  <Settings className='w-4 h-4 text-white' />
                </div>
                <h1 className='text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'>
                  관리자 대시보드
                </h1>
              </div>
            </div>

            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                온라인
              </div>
              <Link
                href='/dashboard'
                className='px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105'
              >
                대시보드
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 메인 컨텐츠 */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* 개선된 카테고리 선택 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='mb-12'
        >
          <div className='flex items-center justify-center gap-2 p-2 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 w-fit mx-auto'>
            <motion.button
              onClick={() => setSelectedCategory('ai')}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 relative overflow-hidden ${selectedCategory === 'ai'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {selectedCategory === 'ai' && (
                <motion.div
                  layoutId='activeTab'
                  className='absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl'
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <div className='relative z-10 flex items-center gap-3'>
                <Brain className='w-6 h-6' />
                <span>🤖 AI 관리</span>
              </div>
            </motion.button>

            <motion.button
              onClick={() => setSelectedCategory('system')}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 relative overflow-hidden ${selectedCategory === 'system'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {selectedCategory === 'system' && (
                <motion.div
                  layoutId='activeTab'
                  className='absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl'
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <div className='relative z-10 flex items-center gap-3'>
                <Settings className='w-6 h-6' />
                <span>⚙️ 시스템 관리</span>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* 개선된 카테고리 제목 */}
        <AnimatePresence mode='wait'>
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className='text-center mb-12'
          >
            <motion.h2
              className='text-4xl font-bold mb-4'
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <span className='bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent'>
                {selectedCategory === 'ai'
                  ? '🤖 AI 관리 허브'
                  : '⚙️ 시스템 관리 허브'}
              </span>
            </motion.h2>
            <motion.p
              className='text-lg text-gray-600 max-w-2xl mx-auto'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {selectedCategory === 'ai'
                ? '11개 AI 엔진과 MCP 서버를 통합 관리하는 엔터프라이즈급 허브'
                : '시스템 로그, 개발 도구, 데이터베이스를 통합 관리하는 개발 환경'}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* 개선된 기능 카드 그리드 */}
        <AnimatePresence mode='wait'>
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, staggerChildren: 0.1 }}
            className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16'
          >
            {currentFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className='group'
              >
                <Link href={feature.path}>
                  <div className='bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group cursor-pointer relative overflow-hidden'>
                    {/* 배경 그라데이션 효과 */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                    ></div>

                    <div className='relative z-10'>
                      <div className='flex items-start gap-6'>
                        <motion.div
                          className={`p-4 rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg`}
                          whileHover={{ rotate: 5, scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {feature.icon}
                        </motion.div>
                        <div className='flex-1'>
                          <div className='flex items-center gap-3 mb-3'>
                            <h3 className='text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300'>
                              {feature.title}
                            </h3>
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-medium ${feature.complexity === 'high'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                                }`}
                            >
                              {feature.complexity === 'high' ? '고급' : '표준'}
                            </div>
                          </div>
                          <p className='text-gray-600 mb-6 text-lg leading-relaxed'>
                            {feature.description}
                          </p>
                          <div className='flex flex-wrap gap-3'>
                            {feature.features.map((feat, idx) => (
                              <motion.span
                                key={feat}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + idx * 0.1 }}
                                className='px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-xl text-sm font-medium border border-gray-200/50 hover:shadow-md transition-all duration-200'
                              >
                                {feat}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* 고도화된 통계 요약 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className='bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl'
        >
          <div className='flex items-center gap-3 mb-8'>
            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center'>
              <BarChart3 className='w-5 h-5 text-white' />
            </div>
            <h3 className='text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'>
              📊 시스템 현황
            </h3>
          </div>

          <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className='text-center p-6 bg-white/50 rounded-xl border border-gray-200/50 hover:shadow-lg transition-all duration-300'
              >
                <div
                  className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4`}
                >
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <motion.div
                  className={`text-3xl font-bold ${stat.color} mb-2`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.8 + index * 0.1,
                    type: 'spring',
                    stiffness: 200,
                  }}
                >
                  {stat.value}
                </motion.div>
                <div className='text-sm font-semibold text-gray-900 mb-1'>
                  {stat.label}
                </div>
                <div className='text-xs text-gray-500'>{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
