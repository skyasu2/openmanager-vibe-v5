/**
 * 🎛️ 통합 관리자 대시보드 스토리북 - 2025.06.27 KST
 *
 * ✅ 5개 핵심 탭 시스템
 * ✅ 실제 API 연동 테스트
 * ✅ 목업 데이터 제거 완료
 * ✅ 모던 UI/UX 디자인
 */

import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UnifiedAdminDashboard from './UnifiedAdminDashboard';

// React Query 클라이언트 설정 (스토리북용)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5분
    },
  },
});

const meta: Meta<typeof UnifiedAdminDashboard> = {
  title: 'Admin/UnifiedAdminDashboard',
  component: UnifiedAdminDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**OpenManager Vibe v5 통합 관리자 대시보드 v4.0**

목업 데이터를 완전히 제거하고 실제 API 연동으로 동작하는 관리자 인터페이스입니다.

### 🎯 주요 특징
- **5개 핵심 탭**: 개요, 서비스, 성능, 로그, 알림
- **실시간 데이터**: 100% 실제 API 기반
- **모던 UI**: Framer Motion 애니메이션 적용
- **한국시간 기준**: KST 타임스탬프 표시

### 📊 탭별 기능
1. **개요**: 시스템 전체 상태 요약
2. **서비스**: 5개 핵심 서비스 상태 모니터링  
3. **성능**: 실시간 성능 메트릭 대시보드
4. **로그**: 시스템 로그 조회 및 분석
5. **알림**: 실시간 알림 관리 시스템
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <div className='min-h-screen bg-gray-50'>
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 기본 관리자 대시보드 상태
 */
export const Default: Story = {
  name: '🏠 기본 상태',
  parameters: {
    docs: {
      description: {
        story:
          '관리자 대시보드의 기본 상태입니다. 개요 탭이 기본적으로 선택되어 있습니다.',
      },
    },
  },
};

/**
 * 모바일 뷰
 */
export const MobileView: Story = {
  name: '📱 모바일 뷰',
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story:
          '모바일 환경에서의 관리자 대시보드 표시입니다. 반응형 디자인이 적용됩니다.',
      },
    },
  },
};
