'use client';

import { ArrowLeft, Users, TrendingUp, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function DevelopmentProcessPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black'>
      <div className='container mx-auto px-6 py-12'>
        <Link
          href='/'
          className='inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 text-white'
        >
          <ArrowLeft className='w-4 h-4' />
          홈으로 돌아가기
        </Link>

        <div className='text-center mb-16'>
          <h1 className='text-5xl font-bold mb-4 text-white'>
            <span className='bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
              개인 학습 경험
            </span>
            <br />
            <span className='text-3xl text-white/80'>
              시스템 엔지니어의 새로운 기술 학습 도전
            </span>
          </h1>

          <p className='text-xl text-white/80 max-w-4xl mx-auto mb-8'>
            4년간의 서버 운영 경험을 바탕으로 20일간 웹 개발과 AI 도구를 학습한
            경험 기록
          </p>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-16'>
            <div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6'>
              <div className='text-3xl font-bold text-blue-400 mb-2'>4년</div>
              <div className='text-sm text-white/80'>서버 운영 경험</div>
            </div>
            <div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6'>
              <div className='text-3xl font-bold text-purple-400 mb-2'>
                20일
              </div>
              <div className='text-sm text-white/80'>첫 웹 개발 완주</div>
            </div>
            <div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6'>
              <div className='text-3xl font-bold text-green-400 mb-2'>3배</div>
              <div className='text-sm text-white/80'>AI 협업 생산성</div>
            </div>
            <div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6'>
              <div className='text-3xl font-bold text-orange-400 mb-2'>$0</div>
              <div className='text-sm text-white/80'>운영 비용</div>
            </div>
          </div>
        </div>

        {/* 3단 구성 */}
        <div className='grid md:grid-cols-3 gap-8 mb-16'>
          {/* 1️⃣ 개인 여정 (왼쪽) */}
          <div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center'>
                <Users className='w-6 h-6 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-white'>개인 여정</h3>
            </div>

            <div className='space-y-6'>
              <div>
                <h4 className='text-lg font-semibold text-blue-400 mb-3'>
                  🌱 학습 과정
                </h4>
                <ul className='text-sm text-white/80 space-y-2'>
                  <li>• 시스템 엔지니어 → 웹 개발 기초 학습</li>
                  <li>• 20일간 새로운 기술 영역 도전</li>
                  <li>• AI 도구 활용법 체험</li>
                  <li>• 처음으로 타입 안전성을 고려한 개발 시도</li>
                </ul>
              </div>

              <div>
                <h4 className='text-lg font-semibold text-purple-400 mb-3'>
                  💪 활용한 경험
                </h4>
                <ul className='text-sm text-white/80 space-y-2'>
                  <li>• 4년 운영 경험을 개발에 활용</li>
                  <li>• 실무 제약사항을 고려한 현실적 접근</li>
                  <li>• 실제 업무 상황을 반영한 UI 설계</li>
                  <li>• 사용자 관점에서의 편의성 추구</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 2️⃣ 실질적 기여 (가운데) */}
          <div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center'>
                <TrendingUp className='w-6 h-6 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-white'>실질적 기여</h3>
            </div>

            <div className='space-y-6'>
              <div>
                <h4 className='text-lg font-semibold text-green-400 mb-3'>
                  🎯 시도한 개선점
                </h4>
                <ul className='text-sm text-white/80 space-y-2'>
                  <li>• 기존 제품 사용성 개선 아이디어 제안</li>
                  <li>• 새로운 기술 적용 가능성 탐색</li>
                  <li>• AI 도구 활용 경험 공유</li>
                  <li>• 실무자 관점의 인터페이스 설계 시도</li>
                </ul>
              </div>

              <div>
                <h4 className='text-lg font-semibold text-blue-400 mb-3'>
                  💰 학습한 효율성
                </h4>
                <ul className='text-sm text-white/80 space-y-2'>
                  <li>• 무료 도구들로 프로젝트 완성 경험</li>
                  <li>• 외부 의존성을 줄인 설계 학습</li>
                  <li>• 인프라 경험을 활용한 배포 시도</li>
                  <li>• 복잡한 기술 없이도 실용적인 결과물 제작</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3️⃣ 미래 가능성 (오른쪽) */}
          <div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center'>
                <Rocket className='w-6 h-6 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-white'>미래 가능성</h3>
            </div>

            <div className='space-y-6'>
              <div>
                <h4 className='text-lg font-semibold text-purple-400 mb-3'>
                  🚀 학습 방향성
                </h4>
                <ul className='text-sm text-white/80 space-y-2'>
                  <li>• 개발-운영 연결 영역에 대한 관심 증가</li>
                  <li>• AI 시대 변화에 대한 적응 의지</li>
                  <li>• 새로운 기술 트렌드 학습 지속</li>
                  <li>• DevOps 영역으로의 학습 확장 고려</li>
                </ul>
              </div>

              <div>
                <h4 className='text-lg font-semibold text-pink-400 mb-3'>
                  🤝 경험 공유
                </h4>
                <ul className='text-sm text-white/80 space-y-2'>
                  <li>• 개발팀과의 소통 경험 축적</li>
                  <li>• 동료들과 새로운 도구 경험 공유</li>
                  <li>• 실무 중심의 기술 도입 관점 제공</li>
                  <li>• AI 도구 활용 경험 전파</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 핵심 성과 하이라이트 */}
        <div className='bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-white/20 rounded-xl p-8 mb-16'>
          <h3 className='text-2xl font-bold text-white text-center mb-8'>
            🏆 학습 성과 정리
          </h3>
          <div className='grid md:grid-cols-2 gap-8'>
            <div>
              <h4 className='text-lg font-semibold text-blue-400 mb-4'>
                개인적 학습
              </h4>
              <ul className='text-sm text-white/80 space-y-2'>
                <li>✅ 첫 웹 애플리케이션 프로젝트 완성</li>
                <li>✅ Next.js, React 기초 경험</li>
                <li>✅ AI 도구 활용법 학습</li>
                <li>✅ 개발-운영 연결고리 이해</li>
                <li>✅ 새로운 영역에 도전할 수 있다는 자신감 획득</li>
              </ul>
            </div>
            <div>
              <h4 className='text-lg font-semibold text-purple-400 mb-4'>
                기술적 경험
              </h4>
              <ul className='text-sm text-white/80 space-y-2'>
                <li>✅ TypeScript로 안정성 있는 코드 작성 시도</li>
                <li>✅ 정적 사이트 생성 및 최적화 경험</li>
                <li>✅ AI 응답 최적화 학습</li>
                <li>✅ 무료 인프라 활용 경험</li>
                <li>✅ 테스트 코드 작성 기초 학습</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 샘 알트만 인용문으로 마무리 */}
        <div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 text-center'>
          <div className='text-6xl mb-6'>💬</div>
          <blockquote className='text-lg text-white/90 italic mb-6 max-w-4xl mx-auto leading-relaxed'>
            &ldquo;명백한 전술적 조언은 AI 도구 사용에 정말 능숙해지는 것입니다.
            제가 고등학교를 졸업할 때는 명백한 전술적 조언이 &lsquo;코딩을 정말
            잘하게 되는 것&rsquo;이었습니다. 그리고 이것이 바로 그것의 새로운
            버전입니다.&rdquo;
          </blockquote>
          <footer className='text-white/60'>
            <strong className='text-white'>샘 알트만 (Sam Altman)</strong>,
            OpenAI CEO
            <br />
            <span className='text-sm'>2025년 3월</span>
          </footer>
          <div className='mt-6 text-white/80'>
            <p className='font-semibold'>
              AI 어시스턴트가 바로 그 학습의 결과입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
