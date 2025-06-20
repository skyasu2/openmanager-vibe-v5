/**
 * 🧠 지능형 모니터링 페이지 스토리북 (v5.44.4)
 *
 * AI 기반 실시간 인프라 모니터링과 예측 분석 컴포넌트
 * 최신 업데이트: 15개 서버 실시간 모니터링, AI 예측 분석, 자동 알림 시스템
 */

import type { Meta, StoryObj } from '@storybook/react';
import IntelligentMonitoringPage from './IntelligentMonitoringPage';

const meta: Meta<typeof IntelligentMonitoringPage> = {
    title: 'AI/지능형 모니터링 페이지',
    component: IntelligentMonitoringPage,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    '🧠 지능형 모니터링 페이지 (v5.44.4)\n\n' +
                    '✅ 15개 서버 실시간 모니터링\n' +
                    '✅ AI 기반 예측 분석 엔진 (11개 AI 통합)\n' +
                    '✅ 자동 알림 및 경고 시스템\n' +
                    '✅ 실시간 메트릭 차트 및 그래프\n' +
                    '✅ 성능 최적화 제안 (AI 추천)\n' +
                    '✅ 이상 징후 자동 감지\n' +
                    '✅ Redis 캐시 및 데이터베이스 모니터링\n' +
                    '✅ 네트워크 트래픽 분석\n' +
                    '✅ 시스템 리소스 사용률 추적',
            },
        },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="min-h-screen bg-gray-50">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 🎯 기본 지능형 모니터링 (실시간 15개 서버)
 */
export const Default: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    '15개 실제 서버의 실시간 모니터링 대시보드입니다. AI 엔진이 성능 메트릭을 분석하고 예측 분석을 제공합니다.',
            },
        },
    },
};

/**
 * 🚨 알림 시스템 활성화 모드
 */
export const AlertsActive: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    'AI 기반 자동 알림 시스템이 활성화된 상태입니다. 임계값 초과 시 실시간 알림과 예측 경고를 표시합니다.',
            },
        },
    },
};

/**
 * 📊 실시간 메트릭 차트 모드
 */
export const RealTimeCharts: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    '실시간 성능 메트릭을 시각화하는 차트 모드입니다. CPU, 메모리, 디스크, 네트워크 사용률을 실시간으로 추적합니다.',
            },
        },
    },
};

/**
 * 🤖 AI 예측 분석 모드
 */
export const PredictiveAnalysis: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    '11개 AI 엔진을 활용한 예측 분석 모드입니다. 미래 성능 추세를 예측하고 최적화 제안을 제공합니다.',
            },
        },
    },
};

/**
 * 🔍 이상 징후 감지 모드
 */
export const AnomalyDetection: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    'AI 기반 이상 징후 자동 감지 시스템입니다. 비정상적인 패턴을 실시간으로 식별하고 경고합니다.',
            },
        },
    },
};

/**
 * 💾 Redis 캐시 모니터링 모드
 */
export const RedisCaching: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    'Redis 캐시 시스템의 성능을 모니터링하는 모드입니다. 캐시 히트율, 메모리 사용량, 연결 상태를 추적합니다.',
            },
        },
    },
};

/**
 * 🌐 네트워크 트래픽 분석 모드
 */
export const NetworkAnalysis: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    '네트워크 트래픽을 실시간으로 분석하는 모드입니다. 대역폭 사용률, 연결 상태, 트래픽 패턴을 모니터링합니다.',
            },
        },
    },
};

/**
 * 🔧 시스템 최적화 제안 모드
 */
export const OptimizationSuggestions: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    'AI가 분석한 시스템 성능 데이터를 바탕으로 최적화 제안을 제공하는 모드입니다. 리소스 배분과 성능 개선 방안을 추천합니다.',
            },
        },
    },
};

/**
 * 📈 성능 트렌드 분석 모드
 */
export const PerformanceTrends: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    '장기간의 성능 트렌드를 분석하는 모드입니다. 시간대별, 일별, 주별 성능 패턴을 시각화하고 분석합니다.',
            },
        },
    },
};

/**
 * ⚡ 실시간 대시보드 모드
 */
export const RealTimeDashboard: Story = {
    parameters: {
        docs: {
            description: {
                story:
                    '모든 모니터링 기능이 통합된 실시간 대시보드입니다. 15개 서버의 상태를 한눈에 파악할 수 있습니다.',
            },
        },
    },
}; 