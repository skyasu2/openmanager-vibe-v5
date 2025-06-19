'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  Link as LinkIcon,
  Search,
  Briefcase,
  Award,
  CheckSquare,
  Compass,
  Users,
  TrendingUp,
  Rocket,
  HeartPulse,
  Lightbulb,
} from 'lucide-react';

export default function DevelopmentProcessPage() {
  return (
    <div className='bg-gray-900 text-white min-h-screen'>
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
                <li>운영 경험이 시스템 설계에 미치는 영향 확인</li>
                <li>AI 개발 도구의 생산성 및 한계점 체험</li>
                <li>TypeScript의 안정성 중요성 체감</li>
                <li>지속적인 학습의 필요성 절감</li>
              </ul>
            </div>
            <div className='mt-8'>
              <h4 className='font-semibold text-lg mb-3 text-rose-300 flex items-center gap-2'>
                <Lightbulb size={20} /> 개인적 성찰
              </h4>
              <ul className='list-disc list-inside text-gray-300 space-y-2'>
                <li>&apos;개발&apos;이라는 새로운 분야에 대한 이해 증진</li>
                <li>아이디어를 빠르게 프로토타이핑하는 경험</li>
                <li>AI를 통한 비개발 직군의 결과물 창출 가능성 확인</li>
                <li>개발 문화와 프로세스에 대한 존중심 증대</li>
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
      </main>
    </div>
  );
}
