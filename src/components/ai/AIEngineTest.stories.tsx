/**
 * AI Engine Test Component Stories
 * 
 * AI 엔진 테스트 컴포넌트의 다양한 상태와 시나리오를 문서화합니다.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { AIEngineTest } from './AIEngineTest';

const meta: Meta<typeof AIEngineTest> = {
    title: '🤖 AI Components/AIEngineTest',
    component: AIEngineTest,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: `
**AI Engine Test Component**

AI 엔진의 다양한 기능을 테스트하고 검증하는 컴포넌트입니다.

### 주요 기능
- **Multi-AI 엔진 테스트**: Google AI, UnifiedAI, RAG 엔진
- **실시간 응답 시간 측정**: 성능 모니터링
- **한국어 자연어 처리**: 한글 쿼리 지원
- **오류 처리**: Graceful degradation
- **목업 모드**: 개발/테스트 환경 지원

### 지원 엔진
- **Google AI Studio**: Gemini 모델 (베타)
- **UnifiedAI Engine**: 자체 개발 엔진
- **Korean RAG**: 한국어 특화 검색
- **MCP Client**: 문서 검색 시스템

### 사용 시나리오
- AI 기능 검증
- 성능 벤치마킹
- 한글 처리 테스트
- 장애 상황 시뮬레이션
                `,
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    name: '기본 상태',
    parameters: {
        docs: {
            description: {
                story: '기본적인 AI 엔진 테스트 인터페이스입니다. 모든 엔진이 활성화된 상태로 시작됩니다.',
            },
        },
    },
};

export const MockMode: Story = {
    name: '목업 모드',
    decorators: [
        (Story) => {
            // 목업 환경 설정
            if (typeof window !== 'undefined') {
                (window as any).process = {
                    ...((window as any).process || {}),
                    env: {
                        ...((window as any).process?.env || {}),
                        FORCE_MOCK_GOOGLE_AI: 'true',
                        FORCE_MOCK_REDIS: 'true',
                        STORYBOOK: 'true',
                    }
                };
            }
            return <Story />;
        },
    ],
    parameters: {
        docs: {
            description: {
                story: '**목업 모드**: 실제 AI 서비스 없이 시뮬레이션된 응답을 사용합니다. 개발 및 테스트 환경에 적합합니다.',
            },
        },
    },
};

export const KoreanQueries: Story = {
    name: '한국어 쿼리 테스트',
    parameters: {
        docs: {
            description: {
                story: `
**한국어 처리 테스트**

다양한 한국어 쿼리를 통해 AI 엔진의 한국어 처리 능력을 테스트합니다.

**테스트 쿼리 예시:**
- "서버 CPU 사용량 분석해줘"
- "메모리 부족 경고 상황 대처 방법"
- "네트워크 지연 문제 해결 방안"
- "데이터베이스 성능 최적화 팁"
                `,
            },
        },
    },
};

export const PerformanceTest: Story = {
    name: '성능 테스트',
    parameters: {
        docs: {
            description: {
                story: `
**성능 벤치마킹**

AI 엔진별 응답 시간과 처리 성능을 측정합니다.

**측정 지표:**
- 응답 시간 (ms)
- 처리량 (queries/sec)
- 메모리 사용량
- CPU 사용률
- 신뢰도 점수

**성능 목표:**
- Google AI: < 2초
- UnifiedAI: < 1초  
- Korean RAG: < 500ms
- MCP Client: < 300ms
                `,
            },
        },
    },
};

export const ErrorHandling: Story = {
    name: '오류 처리 테스트',
    decorators: [
        (Story) => {
            // 오류 시뮬레이션 환경
            if (typeof window !== 'undefined') {
                (window as any).process = {
                    ...((window as any).process || {}),
                    env: {
                        ...((window as any).process?.env || {}),
                        SIMULATE_AI_ERROR: 'true',
                        FORCE_FALLBACK_MODE: 'true',
                    }
                };
            }
            return <Story />;
        },
    ],
    parameters: {
        docs: {
            description: {
                story: `
**오류 처리 및 Fallback**

AI 엔진 장애 상황에서의 graceful degradation을 테스트합니다.

**테스트 시나리오:**
- API 키 오류
- 네트워크 타임아웃
- 할당량 초과
- 서비스 점검
- 예상치 못한 응답

**Fallback 전략:**
1. Primary 엔진 실패 → Secondary 엔진
2. 모든 AI 실패 → 캐시된 응답
3. 완전 실패 → 사용자 친화적 오류 메시지
                `,
            },
        },
    },
};

export const AccessibilityTest: Story = {
    name: '접근성 테스트',
    parameters: {
        a11y: {
            config: {
                rules: [
                    {
                        id: 'color-contrast',
                        enabled: true,
                    },
                    {
                        id: 'keyboard-navigation',
                        enabled: true,
                    },
                    {
                        id: 'focus-management',
                        enabled: true,
                    },
                    {
                        id: 'screen-reader',
                        enabled: true,
                    },
                ],
            },
        },
        docs: {
            description: {
                story: `
**접근성 검증**

AI 엔진 테스트 컴포넌트의 접근성을 검증합니다.

**검증 항목:**
- 키보드 네비게이션
- 스크린 리더 지원
- 색상 대비
- 포커스 관리
- ARIA 레이블

**접근성 기준:**
- WCAG 2.1 AA 준수
- 키보드만으로 모든 기능 접근 가능
- 스크린 리더 완전 지원
                `,
            },
        },
    },
}; 