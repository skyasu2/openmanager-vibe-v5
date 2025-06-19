'use client';

import { ArrowLeft, Users, TrendingUp, Rocket, Compass } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Link as LinkIcon,
  Search,
  Briefcase,
  Award,
  CheckSquare,
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
            학습 및 개발 기록
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='text-lg text-gray-400 max-w-3xl mx-auto'
          >
            시스템 엔지니어의 웹 개발 학습 과정
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className='text-md text-gray-500 max-w-3xl mx-auto mt-2'
          >
            4년간의 서버 운영 경험을 바탕으로, 20일간 진행한 웹 애플리케이션
            개발 및 AI 도구 활용 기록입니다.
          </motion.p>
        </section>

        <section className='grid md:grid-cols-3 gap-8 mb-16'>
          {/* 개인 여정 -> 학습 과정 */}
          <div className='bg-gray-800/50 p-6 rounded-lg border border-gray-700'>
            <h3 className='text-2xl font-bold mb-6 flex items-center gap-3'>
              <BookOpen size={28} className='text-indigo-400' /> 학습 과정
            </h3>
            <div>
              <h4 className='font-semibold text-lg mb-3 text-indigo-300 flex items-center gap-2'>
                <BookOpen size={20} /> 주요 학습 내용
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
                <li>4년 운영 경험을 개발에 활용</li>
                <li>실무 제약사항을 고려한 현실적 접근</li>
                <li>실제 업무 상황을 반영한 UI 설계</li>
                <li>사용자 관점에서의 편의성 추구</li>
              </ul>
            </div>
          </div>

          {/* 실질적 기여 -> 주요 경험 */}
          <div className='bg-gray-800/50 p-6 rounded-lg border border-gray-700'>
            <h3 className='text-2xl font-bold mb-6 flex items-center gap-3'>
              <TrendingUp size={28} className='text-emerald-400' /> 주요 경험
            </h3>
            <div>
              <h4 className='font-semibold text-lg mb-3 text-emerald-300 flex items-center gap-2'>
                <Search size={20} /> 기술 적용 및 탐색
              </h4>
              <ul className='list-disc list-inside text-gray-300 space-y-2'>
                <li>기존 제품의 사용성 개선 아이디어 탐색</li>
                <li>새로운 기술 적용 가능성 탐색</li>
                <li>AI 도구 활용 사례 연구</li>
                <li>실무자 관점의 인터페이스 설계 시도</li>
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
                <li>복잡한 기술 스택 없이 실용적 결과물 제작에 집중</li>
              </ul>
            </div>
          </div>

          {/* 미래 가능성 -> 향후 계획 */}
          <div className='bg-gray-800/50 p-6 rounded-lg border border-gray-700'>
            <h3 className='text-2xl font-bold mb-6 flex items-center gap-3'>
              <Rocket size={28} className='text-rose-400' /> 향후 계획
            </h3>
            <div>
              <h4 className='font-semibold text-lg mb-3 text-rose-300 flex items-center gap-2'>
                <Compass size={20} /> 관심 분야 및 학습 계획
              </h4>
              <ul className='list-disc list-inside text-gray-300 space-y-2'>
                <li>개발과 운영(DevOps)의 연결점에 대한 관심 증대</li>
                <li>AI 기술 변화에 대한 지속적인 학습 의지</li>
                <li>새로운 기술 트렌드 학습 지속</li>
                <li>DevOps 영역으로의 학습 확장 고려</li>
              </ul>
            </div>
            <div className='mt-8'>
              <h4 className='font-semibold text-lg mb-3 text-rose-300 flex items-center gap-2'>
                <Users size={20} /> 팀 기여 및 협업
              </h4>
              <ul className='list-disc list-inside text-gray-300 space-y-2'>
                <li>개발팀과의 원활한 소통을 위한 노력</li>
                <li>동료들과 새로운 도구 경험 공유</li>
                <li>실무적 관점에서 기술 도입에 대한 의견 제시</li>
                <li>AI 도구 활용 경험 공유 및 논의</li>
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
