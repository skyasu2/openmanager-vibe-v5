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
              개인 성장 여정
            </span>
            <br />
            <span className='text-3xl text-white/80'>
              시스템 엔지니어에서 AI 협업 개발자로
            </span>
          </h1>

          <p className='text-xl text-white/80 max-w-4xl mx-auto mb-8'>
            4년간의 서버 운영 경험을 바탕으로 20일 만에 웹 개발 영역까지 확장한
            성장 스토리
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
                  🌱 성장 스토리
                </h4>
                <ul className='text-sm text-white/80 space-y-2'>
                  <li>• 시스템 엔지니어 → 개발 영역 확장</li>
                  <li>• 20일간 웹 개발 첫 도전 완주</li>
                  <li>• AI 협업으로 생산성 혁신 경험</li>
                  <li>• 개발 첫 도전에서 타입 안전성까지 고려</li>
                </ul>
              </div>

              <div>
                <h4 className='text-lg font-semibold text-purple-400 mb-3'>
                  💪 차별화 강점
                </h4>
                <ul className='text-sm text-white/80 space-y-2'>
                  <li>• 4년 운영 경험 기반 실무적 관점</li>
                  <li>• 현실적 제약 고려한 합리적 설계</li>
                  <li>• 새벽 장애 상황도 고려한 실무 친화적 UI</li>
                  <li>• 비전문가도 쉽게 쓸 수 있는 UX 추구</li>
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
                  🎯 회사 가치 창출
                </h4>
                <ul className='text-sm text-white/80 space-y-2'>
                  <li>• 기존 제품 UX 개선 방향 제시</li>
                  <li>• 최신 기술 도입 가능성 검증</li>
                  <li>• 사내 AI 도구 활용 문화 선도</li>
                  <li>• 실무자 관점의 직관적 인터페이스 설계</li>
                </ul>
              </div>

              <div>
                <h4 className='text-lg font-semibold text-blue-400 mb-3'>
                  💰 효율성 달성
                </h4>
                <ul className='text-sm text-white/80 space-y-2'>
                  <li>• 무료 티어만으로 24/7 안정 운영</li>
                  <li>• 외부 의존성 최소화한 지속가능 설계</li>
                  <li>• 인프라 경험을 활용한 안정적 배포</li>
                  <li>• 복잡한 AI 없이도 실용적인 지능형 시스템</li>
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
                  🚀 확장 가능성
                </h4>
                <ul className='text-sm text-white/80 space-y-2'>
                  <li>• 개발-운영 융합 새로운 역할 정의</li>
                  <li>• AI 시대 적응력과 학습 능력 증명</li>
                  <li>• 기술 트렌드 선도적 수용</li>
                  <li>• DevOps 엔지니어로의 자연스러운 발전</li>
                </ul>
              </div>

              <div>
                <h4 className='text-lg font-semibold text-pink-400 mb-3'>
                  🤝 조직 기여
                </h4>
                <ul className='text-sm text-white/80 space-y-2'>
                  <li>• 개발팀-인프라팀 소통 다리 역할</li>
                  <li>• 동료들의 새로운 도구 관심 증대</li>
                  <li>• 실무 중심의 기술 도입 의사결정 지원</li>
                  <li>• AI 도구 활용 문화 확산 선도</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 핵심 성과 하이라이트 */}
        <div className='bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-white/20 rounded-xl p-8 mb-16'>
          <h3 className='text-2xl font-bold text-white text-center mb-8'>
            🏆 핵심 성과 하이라이트
          </h3>
          <div className='grid md:grid-cols-2 gap-8'>
            <div>
              <h4 className='text-lg font-semibold text-blue-400 mb-4'>
                개인적 성장
              </h4>
              <ul className='text-sm text-white/80 space-y-2'>
                <li>✅ 처음으로 웹 애플리케이션 완성</li>
                <li>✅ Next.js, React 기초 경험 습득</li>
                <li>✅ AI 도구 활용법 체득</li>
                <li>✅ 개발-운영 연결고리 이해</li>
                <li>
                  ✅ &ldquo;개발은 개발자만 하는 것&rdquo;이라는 고정관념 탈피
                </li>
              </ul>
            </div>
            <div>
              <h4 className='text-lg font-semibold text-purple-400 mb-4'>
                기술적 달성
              </h4>
              <ul className='text-sm text-white/80 space-y-2'>
                <li>✅ TypeScript 0개 오류로 안정성 확보</li>
                <li>✅ 128개 정적 페이지 8초 빌드 달성</li>
                <li>✅ AI 응답시간 100ms 이하 최적화</li>
                <li>✅ 무료 인프라로 24/7 안정 운영</li>
                <li>✅ 94% 테스트 통과율 달성</li>
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
              OpenManager Vibe v5가 바로 그 증명입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
