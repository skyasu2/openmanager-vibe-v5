import type { Meta, StoryObj } from '@storybook/react';
import { AnomalyFeed } from './AnomalyFeed';

// Mock 데이터
const mockAnomalies = [
    {
        id: 'anomaly-1',
        serverId: 'server-01',
        serverName: 'Web Server 01',
        type: 'cpu' as const,
        severity: 'critical' as const,
        message: 'CPU 사용률이 임계치를 초과했습니다',
        value: 95.2,
        threshold: 80,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5분 전
        status: 'active' as const,
        source: 'metrics' as const,
        description: 'CPU 사용률이 95.2%로 임계치 80%를 초과했습니다',
    },
    {
        id: 'anomaly-2',
        serverId: 'server-02',
        serverName: 'Database Server',
        type: 'memory' as const,
        severity: 'high' as const,
        message: '메모리 사용률 급증',
        value: 87.5,
        threshold: 75,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15분 전
        status: 'investigating' as const,
        source: 'metrics' as const,
        description: '메모리 사용률이 87.5%로 급증했습니다',
    },
    {
        id: 'anomaly-3',
        serverId: 'server-03',
        serverName: 'API Gateway',
        type: 'response_time' as const,
        severity: 'medium' as const,
        message: '응답 시간 지연',
        value: 2500,
        threshold: 2000,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30분 전
        status: 'resolved' as const,
        source: 'logs' as const,
        description: '평균 응답 시간이 2.5초로 증가했습니다',
    },
    {
        id: 'anomaly-4',
        serverId: 'server-04',
        serverName: 'Load Balancer',
        type: 'error_rate' as const,
        severity: 'low' as const,
        message: '에러율 소폭 증가',
        value: 3.2,
        threshold: 5,
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1시간 전
        status: 'active' as const,
        source: 'logs' as const,
        description: '에러율이 3.2%로 소폭 증가했습니다',
    },
];

// API Mock 설정
const setupApiMock = (anomalies: any[] = mockAnomalies) => {
    const originalFetch = global.fetch;
    global.fetch = ((url: string) => {
        if (url.includes('/api/ai/anomaly-detection')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    anomalies: anomalies,
                }),
            });
        }
        return originalFetch(url);
    }) as typeof fetch;
};

const meta: Meta<typeof AnomalyFeed> = {
    title: 'Shared/AnomalyFeed',
    component: AnomalyFeed,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `
## AnomalyFeed 컴포넌트 (v5.44.4)

실시간 이상 징후를 표시하는 피드 컴포넌트입니다.

### 주요 기능
- 실시간 이상 징후 데이터 표시
- 자동 새로고침 (20초 간격)
- 수동 새로고침 기능
- 심각도별 색상 구분
- 타입별 아이콘 표시
- Dashboard/Admin 두 가지 변형
- SWR을 통한 데이터 캐싱

### 최근 업데이트
- /about 페이지 연동
- AI 에이전트 상태 개선
- 새로운 스토리북 스토리 추가
        `,
            },
        },
    },
    decorators: [
        (Story) => {
            setupApiMock();
            return (
                <div className="min-h-screen bg-gray-900 p-8">
                    <Story />
                </div>
            );
        },
    ],
    argTypes: {
        maxItems: {
            control: { type: 'number', min: 1, max: 50 },
            description: '최대 표시 항목 수',
        },
        autoRefresh: {
            control: 'boolean',
            description: '자동 새로고침 활성화',
        },
        refreshInterval: {
            control: { type: 'number', min: 5000, max: 60000, step: 1000 },
            description: '새로고침 간격 (밀리초)',
        },
        variant: {
            control: { type: 'select' },
            options: ['admin', 'dashboard'],
            description: '컴포넌트 변형',
        },
        showDetails: {
            control: 'boolean',
            description: '상세 정보 표시',
        },
    },
};

export default meta;
type Story = StoryObj<typeof AnomalyFeed>;

// 기본 상태 (Dashboard 변형)
export const Default: Story = {
    args: {
        variant: 'dashboard',
        maxItems: 20,
        autoRefresh: false, // 스토리북에서는 비활성화
        showDetails: true,
    },
    parameters: {
        docs: {
            description: {
                story: '기본적인 AnomalyFeed 컴포넌트입니다. Dashboard 변형으로 표시됩니다.',
            },
        },
    },
};

// Admin 변형
export const AdminVariant: Story = {
    args: {
        variant: 'admin',
        maxItems: 15,
        autoRefresh: false,
        showDetails: true,
    },
    parameters: {
        docs: {
            description: {
                story: 'Admin 변형의 AnomalyFeed입니다. 관리자 페이지에서 사용됩니다.',
            },
        },
    },
};

// 심각한 이상 징후만
export const CriticalOnly: Story = {
    args: {
        variant: 'dashboard',
        maxItems: 10,
        autoRefresh: false,
        showDetails: true,
    },
    decorators: [
        (Story) => {
            const criticalAnomalies = mockAnomalies.filter(a => a.severity === 'critical');
            setupApiMock(criticalAnomalies);
            return (
                <div className="min-h-screen bg-gray-900 p-8">
                    <Story />
                </div>
            );
        },
    ],
    parameters: {
        docs: {
            description: {
                story: '심각한 이상 징후만 표시하는 상태입니다.',
            },
        },
    },
};

// 빈 상태 (이상 징후 없음)
export const EmptyState: Story = {
    args: {
        variant: 'dashboard',
        maxItems: 20,
        autoRefresh: false,
        showDetails: true,
    },
    decorators: [
        (Story) => {
            setupApiMock([]); // 빈 배열
            return (
                <div className="min-h-screen bg-gray-900 p-8">
                    <Story />
                </div>
            );
        },
    ],
    parameters: {
        docs: {
            description: {
                story: '이상 징후가 없는 정상 상태입니다.',
            },
        },
    },
};

// 로딩 상태
export const LoadingState: Story = {
    args: {
        variant: 'dashboard',
        maxItems: 20,
        autoRefresh: false,
        showDetails: true,
    },
    decorators: [
        (Story) => {
            // 지연된 응답으로 로딩 상태 시뮬레이션
            global.fetch = (() => {
                return new Promise(() => { }); // 무한 대기로 로딩 상태 유지
            }) as typeof fetch;
            return (
                <div className="min-h-screen bg-gray-900 p-8">
                    <Story />
                </div>
            );
        },
    ],
    parameters: {
        docs: {
            description: {
                story: '데이터를 로딩 중인 상태입니다.',
            },
        },
    },
};

// 에러 상태
export const ErrorState: Story = {
    args: {
        variant: 'dashboard',
        maxItems: 20,
        autoRefresh: false,
        showDetails: true,
    },
    decorators: [
        (Story) => {
            global.fetch = (() => {
                return Promise.reject(new Error('API 연결 실패'));
            }) as typeof fetch;
            return (
                <div className="min-h-screen bg-gray-900 p-8">
                    <Story />
                </div>
            );
        },
    ],
    parameters: {
        docs: {
            description: {
                story: 'API 에러가 발생한 상태입니다.',
            },
        },
    },
};

// 제한된 항목 수
export const LimitedItems: Story = {
    args: {
        variant: 'dashboard',
        maxItems: 3,
        autoRefresh: false,
        showDetails: true,
    },
    parameters: {
        docs: {
            description: {
                story: '최대 3개 항목만 표시하는 제한된 상태입니다.',
            },
        },
    },
};

// 상세 정보 숨김
export const WithoutDetails: Story = {
    args: {
        variant: 'dashboard',
        maxItems: 20,
        autoRefresh: false,
        showDetails: false,
    },
    parameters: {
        docs: {
            description: {
                story: '상세 정보를 숨긴 간단한 표시 모드입니다.',
            },
        },
    },
};

// 라이트 테마
export const LightTheme: Story = {
    args: {
        variant: 'dashboard',
        maxItems: 20,
        autoRefresh: false,
        showDetails: true,
    },
    decorators: [
        (Story) => {
            setupApiMock();
            return (
                <div className="min-h-screen bg-gray-100 p-8">
                    <Story />
                </div>
            );
        },
    ],
    parameters: {
        docs: {
            description: {
                story: '라이트 테마 배경에서의 AnomalyFeed입니다.',
            },
        },
    },
}; 