'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  CheckSquare,
  Compass,
  HeartPulse,
  Lightbulb,
  Link as LinkIcon,
  Lock,
  Rocket,
  Search,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * 🔧 개발과정 페이지 (관리자 전용)
 *
 * 📍 원상복구 방법:
 * 1. 이 파일을 src/app/about/page.tsx로 복사
 * 2. useAdminAuth 훅과 관련 로직 제거
 * 3. /about 경로로 접근 가능하게 복원
 *
 * 📝 변경 이력:
 * - 2025.06.20: 관리자 전용으로 이동 (기존: /about → 현재: /admin/development-process)
 */

// 🔒 간단한 관리자 인증 체크 (임시)
function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 🔧 TODO: 실제 관리자 인증 로직으로 교체 필요
    const checkAdminAuth = () => {
      try {
        // 브라우저 환경에서만 실행
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }

        // 현재는 localStorage 기반 간단 체크
        const adminToken = localStorage.getItem('admin_access');

        // 🚨 빌드 시 process.env 접근 오류 방지 - window 객체로만 판단
        const isDevMode =
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1';

        // 개발 모드에서는 자동 허용, 프로덕션에서는 토큰 체크
        if (isDevMode || adminToken === 'vibe_admin_2025') {
          setIsAdmin(true);
        } else {
          // 관리자 토큰이 없으면 간편 설정 제안
          const userConfirm = confirm(
            '개발과정 페이지에 접근하시겠습니까? (임시 관리자 권한 부여)'
          );
          if (userConfirm) {
            localStorage.setItem('admin_access', 'vibe_admin_2025');
            setIsAdmin(true);
          } else {
            router.push('/main');
          }
        }
      } catch (error) {
        console.error('Admin auth check error:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, [router]);

  return { isAdmin, isLoading };
}

export default function DevelopmentProcessPage() {
  const { isAdmin, isLoading } = useAdminAuth();

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className='bg-gray-900 text-white min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <Lock className='w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse' />
          <p className='text-gray-400'>관리자 권한 확인 중...</p>
        </div>
      </div>
    );
  }

  // 관리자가 아닐 때 (실제로는 리다이렉트되지만 안전장치)
  if (!isAdmin) {
    return (
      <div className='bg-gray-900 text-white min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <Lock className='w-12 h-12 text-red-400 mx-auto mb-4' />
          <p className='text-gray-400 mb-4'>접근 권한이 없습니다.</p>
          <button
            onClick={() => (window.location.href = '/main')}
            className='text-purple-400 hover:text-purple-300 transition-colors'
          >
            메인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 🔧 원상복구 시 아래 JSX를 그대로 /about/page.tsx로 복사하면 됩니다
  return (
    <div className='bg-gray-900 text-white min-h-screen'>
      {/* 관리자 헤더 */}
      <div className='bg-gray-800 border-b border-gray-700 px-4 py-3'>
        <div className='container mx-auto flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Lock className='w-5 h-5 text-purple-400' />
            <span className='text-sm text-gray-400'>관리자 전용 페이지</span>
          </div>
          <button
            onClick={() => (window.location.href = '/admin')}
            className='flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
            관리자 페이지로
          </button>
        </div>
      </div>

      <main className='container mx-auto px-4 py-16'>
        <section className='text-center mb-16'>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 mb-4'
          >
            AI 기반 개발 프로젝트 기록
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='text-lg text-gray-400 max-w-3xl mx-auto'
          >
            Vibe Coding 사내 경연대회 출품작: 시스템 엔지니어의 20일간 AI 도구
            활용 웹 개발 과정
          </motion.p>
        </section>

        <section className='grid md:grid-cols-3 gap-8 mb-16'>
          {/* 학습 과정 */}
          <div className='bg-gray-800/50 p-6 rounded-lg border border-gray-700'>
            <h3 className='text-2xl font-bold mb-6 flex items-center gap-3'>
              <BookOpen size={28} className='text-indigo-400' /> 학습 과정
            </h3>
            <div>
              <h4 className='font-semibold text-lg mb-3 text-indigo-300 flex items-center gap-2'>
                <Compass size={20} /> 주요 학습 내용
              </h4>
              <ul className='list-disc list-inside text-gray-300 space-y-2'>
                <li>시스템 엔지니어 → 웹 개발 기초 학습</li>
                <li>20일간 새로운 기술 영역 도전</li>
                <li>AI 도구 활용법 체험</li>
                <li>타입 안전성을 고려한 개발 시도</li>
              </ul>
            </div>
            <div className='mt-8'>
              <h4 className='font-semibold text-lg mb-3 text-indigo-300 flex items-center gap-2'>
                <LinkIcon size={20} /> 기존 경험과의 연결
              </h4>
              <ul className='list-disc list-inside text-gray-300 space-y-2'>
                <li>시스템 운영 경험을 개발에 활용</li>
                <li>실무 제약사항을 고려한 현실적 접근</li>
                <li>실제 업무 상황을 반영한 UI 설계</li>
                <li>사용자 관점에서의 편의성 추구</li>
              </ul>
            </div>
          </div>

          {/* 주요 경험 */}
          <div className='bg-gray-800/50 p-6 rounded-lg border border-gray-700'>
            <h3 className='text-2xl font-bold mb-6 flex items-center gap-3'>
              <TrendingUp size={28} className='text-emerald-400' /> 주요 경험
            </h3>
            <div>
              <h4 className='font-semibold text-lg mb-3 text-emerald-300 flex items-center gap-2'>
                <Search size={20} /> 기술 적용 및 탐색
              </h4>
              <ul className='list-disc list-inside text-gray-300 space-y-2'>
                <li>기존 시스템 이해 기반의 개선 아이디어 구상</li>
                <li>새로운 기술 스택 적용 가능성 탐색</li>
                <li>AI 코드 생성 및 디버깅 활용</li>
                <li>운영 지식을 바탕으로 한 인터페이스 설계</li>
              </ul>
            </div>
            <div className='mt-8'>
              <h4 className='font-semibold text-lg mb-3 text-emerald-300 flex items-center gap-2'>
                <Briefcase size={20} /> 프로젝트 관리 및 설계
              </h4>
              <ul className='list-disc list-inside text-gray-300 space-y-2'>
                <li>오픈소스 및 무료 도구를 활용한 프로젝트 완성</li>
                <li>외부 의존성을 줄인 설계 학습</li>
                <li>인프라 경험을 활용한 배포 시도</li>
                <li>복잡한 기술 없이 실용적 결과물 제작에 집중</li>
              </ul>
            </div>
          </div>

          {/* 프로젝트 회고 */}
          <div className='bg-gray-800/50 p-6 rounded-lg border border-gray-700'>
            <h3 className='text-2xl font-bold mb-6 flex items-center gap-3'>
              <Rocket size={28} className='text-rose-400' /> 프로젝트 회고
            </h3>
            <div>
              <h4 className='font-semibold text-lg mb-3 text-rose-300 flex items-center gap-2'>
                <HeartPulse size={20} /> 기술적 소회
              </h4>
              <ul className='list-disc list-inside text-gray-300 space-y-2'>
                <li>기존 업무 지식이 시스템 설계에 미친 영향 확인</li>
                <li>AI 개발 도구의 생산성과 한계점 직접 체험</li>
                <li>TypeScript가 제공하는 안정성의 중요성 체감</li>
                <li>새로운 기술에 대한 지속적인 학습의 필요성 절감</li>
              </ul>
            </div>
            <div className='mt-8'>
              <h4 className='font-semibold text-lg mb-3 text-rose-300 flex items-center gap-2'>
                <Lightbulb size={20} /> 개인적 성찰
              </h4>
              <ul className='list-disc list-inside text-gray-300 space-y-2'>
                <li>AI 도구 자체에 대한 관심 증대</li>
                <li>아이디어를 빠르게 프로토타이핑하는 즐거움</li>
                <li>
                  사이드 프로젝트를 통해 학습을 이어가는 것에 대한 흥미를 느낌
                </li>
                <li>새로운 분야에 대한 도전의 가치 체감</li>
              </ul>
            </div>
          </div>
        </section>

        <section className='bg-gray-800/50 p-8 rounded-lg border border-gray-700'>
          <h2 className='text-3xl font-bold text-center mb-8 flex items-center justify-center gap-3'>
            <Award size={32} className='text-amber-400' /> 주요 학습 및 경험
            정리
          </h2>
          <div className='grid md:grid-cols-2 gap-8'>
            <div>
              <h3 className='text-xl font-semibold mb-4 text-amber-300'>
                프로젝트를 통해 얻은 점
              </h3>
              <ul className='space-y-2'>
                <li className='flex items-center gap-2'>
                  <CheckSquare size={20} className='text-emerald-400' /> 첫 웹
                  애플리케이션 프로젝트 완성
                </li>
                <li className='flex items-center gap-2'>
                  <CheckSquare size={20} className='text-emerald-400' />{' '}
                  Next.js, React 기초 경험
                </li>
                <li className='flex items-center gap-2'>
                  <CheckSquare size={20} className='text-emerald-400' /> AI 도구
                  활용법 학습
                </li>
                <li className='flex items-center gap-2'>
                  <CheckSquare size={20} className='text-emerald-400' />{' '}
                  개발-운영 연결고리 이해
                </li>
                <li className='flex items-center gap-2'>
                  <CheckSquare size={20} className='text-emerald-400' /> 새로운
                  기술 영역에 대한 도전의 중요성 체감
                </li>
              </ul>
            </div>
            <div>
              <h3 className='text-xl font-semibold mb-4 text-amber-300'>
                주요 기술 경험
              </h3>
              <ul className='space-y-2'>
                <li className='flex items-center gap-2'>
                  <CheckSquare size={20} className='text-emerald-400' />{' '}
                  TypeScript를 이용한 타입 안전성 확보 시도
                </li>
                <li className='flex items-center gap-2'>
                  <CheckSquare size={20} className='text-emerald-400' /> 정적
                  사이트 생성 및 최적화 경험
                </li>
                <li className='flex items-center gap-2'>
                  <CheckSquare size={20} className='text-emerald-400' /> AI 응답
                  최적화 학습
                </li>
                <li className='flex items-center gap-2'>
                  <CheckSquare size={20} className='text-emerald-400' /> 무료
                  인프라 활용 경험
                </li>
                <li className='flex items-center gap-2'>
                  <CheckSquare size={20} className='text-emerald-400' /> 테스트
                  코드 작성 기초 학습
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className='mt-16 text-center'>
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className='text-xl italic text-gray-300 max-w-4xl mx-auto'
          >
            &quot;시스템 엔지니어로서의 관점과 경험이 웹 개발에서도 큰 도움이
            되었고, AI 도구를 적극 활용함으로써 빠른 시간 내에 의미 있는
            결과물을 만들 수 있었습니다. 이 프로젝트는 새로운 기술에 대한 학습의
            시작점이자, 개발자로서의 새로운 가능성을 발견한 소중한
            경험이었습니다.&quot;
          </motion.blockquote>
        </section>
      </main>
    </div>
  );
}
