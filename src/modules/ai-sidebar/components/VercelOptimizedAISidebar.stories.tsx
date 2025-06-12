import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { VercelOptimizedAISidebar } from './VercelOptimizedAISidebar';
import { useState } from 'react';

const meta: Meta<typeof VercelOptimizedAISidebar> = {
  title: 'AI/VercelOptimizedAISidebar',
  component: VercelOptimizedAISidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
🚀 **Vercel 최적화 AI 사이드바**

메인 AI 어시스턴트 사이드바로 다음 기능들을 제공합니다:

### ✨ 주요 기능
- **스트리밍 응답**: 실시간 AI 응답 처리
- **사고 과정 시각화**: AI가 생각하는 과정을 단계별로 표시
- **대화 히스토리**: 질문과 답변을 저장하고 관리
- **재질문 기능**: 같은 질문으로 다시 질의 가능
- **시스템 로그 표시**: 각 단계별 세부 로그 정보 제공
- **접기/펴기 애니메이션**: 사고 과정과 로그를 토글로 관리

### 🎯 사용 사례
- 서버 상태 분석 질의
- 시스템 로그 분석 요청
- AI 기반 서버 진단 및 추천
- 실시간 모니터링 질의응답

### 🔧 기술 구현
- ChatGPT 스타일 UX
- 타이핑 효과와 애니메이션
- 실제 시스템 로그 연동
- 단계별 사고 과정 추적
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: '사이드바 열림/닫힘 상태',
    },
    onClose: {
      action: 'closed',
      description: '사이드바 닫기 콜백',
    },
    className: {
      control: 'text',
      description: '추가 CSS 클래스',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VercelOptimizedAISidebar>;

// 기본 스토리 래퍼 컴포넌트
const AISidebarWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='relative w-full h-screen bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden'>
      {/* 배경 대시보드 시뮬레이션 */}
      <div className='p-6 space-y-6'>
        <div className='bg-white rounded-xl shadow-sm p-6'>
          <h2 className='text-xl font-semibold text-gray-800 mb-4'>
            서버 대시보드
          </h2>
          <div className='grid grid-cols-3 gap-4'>
            {[1, 2, 3].map(i => (
              <div key={i} className='bg-gray-50 rounded-lg p-4'>
                <div className='w-4 h-4 bg-green-500 rounded-full mb-2'></div>
                <p className='text-sm text-gray-600'>Server {i}</p>
                <p className='text-xs text-gray-500'>CPU: {80 + i * 5}%</p>
              </div>
            ))}
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-sm p-6'>
          <h3 className='text-lg font-medium text-gray-800 mb-3'>
            시스템 로그
          </h3>
          <div className='space-y-2 font-mono text-xs text-gray-600'>
            <div>[INFO] Server monitoring initialized</div>
            <div>[WARN] High CPU usage detected on server-03</div>
            <div>[INFO] AI analysis request received</div>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
};

// 인터랙티브 스토리 컴포넌트
const InteractiveAISidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <AISidebarWrapper>
      <div className='absolute top-4 right-4 z-40'>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors shadow-lg'
        >
          {isOpen ? 'AI 닫기' : 'AI 열기'}
        </button>
      </div>

      <VercelOptimizedAISidebar
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </AISidebarWrapper>
  );
};

/**
 * 🎯 **기본 사용 예시**
 *
 * AI 사이드바가 열린 상태로 표시됩니다.
 * 프리셋 질문을 클릭하여 AI 응답 과정을 체험할 수 있습니다.
 */
export const Default: Story = {
  render: () => <InteractiveAISidebar />,
};

/**
 * 📱 **모바일 반응형**
 *
 * 모바일 환경에서의 AI 사이드바 표시를 확인합니다.
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => <InteractiveAISidebar />,
};

/**
 * 🌙 **다크 모드**
 *
 * 다크 테마에서의 AI 사이드바 표시를 확인합니다.
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  render: () => (
    <div className='dark'>
      <InteractiveAISidebar />
    </div>
  ),
};

/**
 * ⚡ **빠른 상호작용 테스트**
 *
 * AI 사이드바의 다양한 상호작용 요소들을 테스트할 수 있습니다:
 * - 프리셋 질문 클릭
 * - 사고 과정 펼치기/접기
 * - 시스템 로그 보기
 * - 재질문 기능
 * - 대화 히스토리 탐색
 */
export const InteractionTest: Story = {
  render: () => (
    <AISidebarWrapper>
      <div className='absolute top-4 left-4 z-40 bg-white p-4 rounded-lg shadow-lg max-w-sm'>
        <h3 className='font-semibold text-gray-800 mb-2'>🧪 테스트 가이드</h3>
        <div className='space-y-2 text-sm text-gray-600'>
          <div>✅ 프리셋 질문 클릭해보기</div>
          <div>✅ &quot;사고 과정&quot; 펼치기/접기</div>
          <div>✅ 시스템 로그 상세보기</div>
          <div>✅ &quot;재질문&quot; 버튼 클릭</div>
          <div>✅ 대화 네비게이션 사용</div>
        </div>
      </div>

      <VercelOptimizedAISidebar
        isOpen={true}
        onClose={action('AI 사이드바 닫기')}
      />
    </AISidebarWrapper>
  ),
};

/**
 * 🎨 **커스텀 스타일링**
 *
 * 사용자 정의 클래스를 적용한 AI 사이드바입니다.
 */
export const CustomStyling: Story = {
  args: {
    isOpen: true,
    onClose: action('사이드바 닫기'),
    className: 'border-4 border-purple-500 shadow-2xl',
  },
  render: args => (
    <AISidebarWrapper>
      <VercelOptimizedAISidebar {...args} />
    </AISidebarWrapper>
  ),
};

/**
 * 🚀 **성능 테스트**
 *
 * 여러 대화가 진행된 상황에서의 성능을 확인합니다.
 * 메모리 사용량과 렌더링 성능을 모니터링할 수 있습니다.
 */
export const PerformanceTest: Story = {
  render: () => (
    <AISidebarWrapper>
      <div className='absolute top-4 left-4 z-40 bg-yellow-100 border border-yellow-400 p-3 rounded-lg max-w-sm'>
        <h4 className='font-medium text-yellow-800 mb-1'>⚡ 성능 모니터링</h4>
        <p className='text-xs text-yellow-700'>
          개발자 도구에서 메모리 및 렌더링 성능을 확인하세요. 여러 질문을
          연속으로 실행하여 최적화 상태를 테스트할 수 있습니다.
        </p>
      </div>

      <VercelOptimizedAISidebar
        isOpen={true}
        onClose={action('성능 테스트 - 사이드바 닫기')}
      />
    </AISidebarWrapper>
  ),
};
