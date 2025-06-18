'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [selectedCategory, setSelectedCategory] = useState<'ai' | 'system'>(
    'ai'
  );

  const aiManagementFeatures = [
    {
      title: 'AI 에이전트 관리',
      description: 'AI 에이전트 설정, 패턴 데모, 예측 분석',
      icon: <Brain className='w-8 h-8' />,
      path: '/admin/ai-agent',
      color: 'from-purple-500 to-pink-500',
      features: ['패턴 매칭', '예측 분석', '메트릭 브리지'],
    },
    {
      title: 'MCP 서버 모니터링',
      description: 'MCP 서버 상태 및 성능 모니터링',
      icon: <Monitor className='w-8 h-8' />,
      path: '/admin/mcp-monitoring',
      color: 'from-green-500 to-emerald-500',
      features: ['서버 상태', '성능 메트릭', '로그 분석'],
    },
  ];

  const systemManagementFeatures = [
    {
      title: '시스템 로그',
      description: '전체 시스템 로그 조회 및 분석',
      icon: <FileText className='w-8 h-8' />,
      path: '/logs',
      color: 'from-gray-500 to-slate-500',
      features: ['실시간 로그', '검색 필터', '로그 분석'],
    },
    {
      title: '개발 도구',
      description: '시스템 개발 및 디버깅 도구',
      icon: <Wrench className='w-8 h-8' />,
      path: '/dev-tools',
      color: 'from-yellow-500 to-orange-500',
      features: ['디버깅', '성능 분석', '개발 지원'],
    },
    {
      title: '데이터베이스 관리',
      description: 'Supabase 데이터베이스 연동 및 관리',
      icon: <Database className='w-8 h-8' />,
      path: '/notes',
      color: 'from-teal-500 to-green-500',
      features: ['데이터 조회', 'CRUD 작업', '연결 테스트'],
    },
  ];

  const currentFeatures =
    selectedCategory === 'ai' ? aiManagementFeatures : systemManagementFeatures;

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-blue-50'>
      {/* 헤더 */}
      <div className='bg-white border-b border-gray-200 sticky top-0 z-10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center gap-4'>
              <Link
                href='/'
                className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors'
              >
                <Home className='w-4 h-4' />
                <span>홈으로</span>
              </Link>
              <div className='h-6 w-px bg-gray-300'></div>
              <h1 className='text-xl font-bold text-gray-900'>
                🛠️ 관리자 대시보드
              </h1>
            </div>

            <div className='flex items-center gap-4'>
              <Link
                href='/dashboard'
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                대시보드
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* 카테고리 선택 */}
        <div className='mb-8'>
          <div className='flex items-center justify-center gap-4'>
            <motion.button
              onClick={() => setSelectedCategory('ai')}
              className={`px-8 py-4 rounded-xl font-semibold transition-all flex items-center gap-3 ${
                selectedCategory === 'ai'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Brain className='w-6 h-6' />
              🤖 AI 관리
            </motion.button>

            <motion.button
              onClick={() => setSelectedCategory('system')}
              className={`px-8 py-4 rounded-xl font-semibold transition-all flex items-center gap-3 ${
                selectedCategory === 'system'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className='w-6 h-6' />
              ⚙️ 시스템 관리
            </motion.button>
          </div>
        </div>

        {/* 선택된 카테고리 제목 */}
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center mb-8'
        >
          <h2 className='text-3xl font-bold text-gray-900 mb-2'>
            {selectedCategory === 'ai'
              ? '🤖 AI 관리 허브'
              : '⚙️ 시스템 관리 허브'}
          </h2>
          <p className='text-gray-600'>
            {selectedCategory === 'ai'
              ? 'AI 엔진과 MCP 서버를 통합 관리합니다'
              : '시스템 로그, 개발 도구, 데이터베이스를 통합 관리합니다'}
          </p>
        </motion.div>

        {/* 기능 카드 그리드 */}
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className='grid grid-cols-1 md:grid-cols-2 gap-6'
        >
          {currentFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={feature.path}>
                <div className='bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 group cursor-pointer'>
                  <div className='flex items-start gap-4'>
                    <div
                      className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} text-white`}
                    >
                      {feature.icon}
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors'>
                        {feature.title}
                      </h3>
                      <p className='text-gray-600 mb-4'>
                        {feature.description}
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        {feature.features.map(feat => (
                          <span
                            key={feat}
                            className='px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm'
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* 통계 요약 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className='mt-12 bg-white rounded-xl p-6 border border-gray-200'
        >
          <h3 className='text-lg font-bold text-gray-900 mb-4'>📊 관리 현황</h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>4</div>
              <div className='text-sm text-gray-600'>AI 관리 도구</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>4</div>
              <div className='text-sm text-gray-600'>시스템 관리 도구</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>99.5%</div>
              <div className='text-sm text-gray-600'>시스템 가동률</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-orange-600'>실시간</div>
              <div className='text-sm text-gray-600'>모니터링 상태</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
