'use client';

// 🔧 RSC 프리렌더링 오류 방지: 동적 렌더링 강제
export const dynamic = 'force-dynamic';

/**
 * 📊 MCP 시스템 모니터링 대시보드 (단순화 버전)
 *
 * 🔧 Vercel 빌드 오류 해결을 위한 최소 구현
 * ✅ 정적 컴포넌트로 환경변수 접근 문제 해결
 */

import { Activity, CheckCircle, Cpu, RefreshCw, Server } from 'lucide-react';

export default function MCPMonitoringPage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      {/* 헤더 */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          📊 MCP 시스템 모니터링
        </h1>
        <p className='text-gray-600'>
          실시간 시스템 상태 및 성능 지표를 확인하세요.
        </p>
      </div>

      {/* 상태 카드 */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        {/* 전체 상태 */}
        <div className='bg-white rounded-lg shadow-sm border p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>전체 상태</h3>
            <CheckCircle className='w-5 h-5 text-green-600' />
          </div>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>상태</span>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                정상
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>총 컴포넌트</span>
              <span className='text-sm font-medium'>3</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>정상 컴포넌트</span>
              <span className='text-sm font-medium'>3</span>
            </div>
          </div>
        </div>

        {/* FastAPI 상태 */}
        <div className='bg-white rounded-lg shadow-sm border p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>FastAPI</h3>
            <Server className='w-5 h-5 text-blue-500' />
          </div>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>상태</span>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                정상
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>응답 시간</span>
              <span className='text-sm font-medium'>245ms</span>
            </div>
          </div>
        </div>

        {/* MCP 상태 */}
        <div className='bg-white rounded-lg shadow-sm border p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>MCP</h3>
            <Cpu className='w-5 h-5 text-purple-500' />
          </div>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>상태</span>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                정상
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>초기화</span>
              <span className='text-sm font-medium'>완료</span>
            </div>
          </div>
        </div>
      </div>

      {/* 성능 지표 */}
      <div className='bg-white rounded-lg shadow-sm border p-6 mb-8'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>성능 지표</h3>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-600'>1,247</div>
            <div className='text-sm text-gray-600'>총 쿼리</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>245ms</div>
            <div className='text-sm text-gray-600'>평균 응답 시간</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-600'>98.7%</div>
            <div className='text-sm text-gray-600'>성공률</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-orange-600'>89.3%</div>
            <div className='text-sm text-gray-600'>캐시 히트율</div>
          </div>
        </div>
      </div>

      {/* 정보 메시지 */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8'>
        <div className='flex items-center'>
          <Activity className='w-5 h-5 text-blue-500 mr-2' />
          <p className='text-blue-800'>
            실시간 모니터링 기능은 개발 중입니다. 현재는 정적 데이터를 표시하고
            있습니다.
          </p>
        </div>
      </div>

      {/* 새로고침 버튼 */}
      <div className='flex justify-center'>
        <button
          onClick={() => window.location.reload()}
          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        >
          <RefreshCw className='w-4 h-4 mr-2' />
          페이지 새로고침
        </button>
      </div>

      {/* 마지막 업데이트 시간 */}
      <div className='text-sm text-gray-500 text-center mt-8'>
        빌드 시간: {new Date().toLocaleString()}
      </div>
    </div>
  );
}
