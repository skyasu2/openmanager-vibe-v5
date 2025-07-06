import { Lock } from 'lucide-react';
import { Metadata } from 'next';

// 🚀 정적 생성 최적화
export const dynamic = 'force-static';
export const revalidate = 3600; // 1시간마다 재생성

export const metadata: Metadata = {
  title: 'About - OpenManager v5',
  description: 'OpenManager v5 프로젝트 소개 및 개발 과정',
  keywords: ['OpenManager', 'v5', 'development', 'about'],
};

export default function AboutPage() {
  return (
    <div className='bg-gray-900 text-white min-h-screen'>
      <div className='container mx-auto px-4 py-16'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-center mb-12'>
            <Lock className='w-16 h-16 text-purple-400 mx-auto mb-6' />
            <h1 className='text-4xl font-bold mb-4'>OpenManager v5</h1>
            <p className='text-xl text-gray-400'>
              차세대 서버 관리 및 모니터링 플랫폼
            </p>
          </div>

          <div className='grid md:grid-cols-2 gap-8 mb-12'>
            <div className='bg-gray-800 p-6 rounded-lg'>
              <h2 className='text-2xl font-semibold mb-4 text-purple-400'>
                🚀 주요 기능
              </h2>
              <ul className='space-y-2 text-gray-300'>
                <li>• 실시간 서버 모니터링</li>
                <li>• AI 기반 이상 탐지</li>
                <li>• 통합 대시보드</li>
                <li>• 자동화된 알림 시스템</li>
                <li>• 클라우드 네이티브 아키텍처</li>
              </ul>
            </div>

            <div className='bg-gray-800 p-6 rounded-lg'>
              <h2 className='text-2xl font-semibold mb-4 text-blue-400'>
                🛠️ 기술 스택
              </h2>
              <ul className='space-y-2 text-gray-300'>
                <li>• Next.js 15 (App Router)</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Supabase</li>
                <li>• Google AI (Gemini)</li>
                <li>• Vercel 배포</li>
              </ul>
            </div>
          </div>

          <div className='bg-gray-800 p-8 rounded-lg mb-8'>
            <h2 className='text-2xl font-semibold mb-6 text-green-400'>
              📈 프로젝트 현황
            </h2>
            <div className='grid md:grid-cols-3 gap-6'>
              <div className='text-center'>
                <div className='text-3xl font-bold text-green-400 mb-2'>v5.44.1</div>
                <div className='text-gray-400'>현재 버전</div>
              </div>
              <div className='text-center'>
                <div className='text-3xl font-bold text-blue-400 mb-2'>98%</div>
                <div className='text-gray-400'>완성도</div>
              </div>
              <div className='text-center'>
                <div className='text-3xl font-bold text-purple-400 mb-2'>24/7</div>
                <div className='text-gray-400'>모니터링</div>
              </div>
            </div>
          </div>

          <div className='text-center'>
            <a
              href='/admin/development-process'
              className='inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors'
            >
              개발 과정 보기
              <Lock className='w-4 h-4 ml-2' />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
