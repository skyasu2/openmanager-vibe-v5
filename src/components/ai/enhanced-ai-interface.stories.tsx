import type { Meta, StoryObj } from '@storybook/nextjs';
import EnhancedAIInterface from './enhanced-ai-interface';

const meta: Meta<typeof EnhancedAIInterface> = {
  title: 'AI Components/EnhancedAIInterface',
  component: EnhancedAIInterface,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '🧠 Enhanced AI Engine v2.0 - MCP 문서 활용 극대화 + TensorFlow.js 하이브리드 AI 인터페이스',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithMockingData: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        // API 응답 모킹
        {
          url: '/api/ai/enhanced',
          method: 'post',
          status: 200,
          response: {
            success: true,
            mode: 'smart',
            query: '프로젝트 성능 최적화 방법을 알려주세요',
            result: {
              answer:
                '프로젝트 성능 최적화를 위한 다양한 방법을 제안드립니다:\n\n1. **코드 최적화**\n   - 번들 크기 줄이기\n   - Tree shaking 적용\n   - 코드 스플리팅 구현\n\n2. **리소스 최적화**\n   - 이미지 최적화 (WebP, AVIF 형식 사용)\n   - CDN 활용\n   - 캐싱 전략 구현\n\n3. **렌더링 최적화**\n   - 지연 로딩 구현\n   - 가상화 기술 적용\n   - React.memo 활용\n\n4. **데이터베이스 최적화**\n   - 쿼리 최적화\n   - 인덱스 활용\n   - 커넥션 풀링\n\n이러한 방법들을 체계적으로 적용하면 성능을 크게 향상시킬 수 있습니다.',
              confidence: 0.92,
              sources: [
                {
                  path: '/docs/performance-guide.md',
                  relevanceScore: 0.95,
                  summary: '성능 최적화 가이드 문서',
                },
                {
                  path: '/docs/best-practices.md',
                  relevanceScore: 0.88,
                  summary: '개발 모범 사례 문서',
                },
              ],
              reasoning: [
                '사용자가 프로젝트 성능 최적화에 대해 질문함',
                '관련 문서에서 최적화 방법들을 검색함',
                '코드, 리소스, 렌더링, 데이터베이스 관점에서 분류하여 정리함',
                '실용적이고 구현 가능한 방법들을 우선적으로 제시함',
              ],
              mcpActions: [
                'document-search: performance optimization',
                'context-analysis: project optimization',
                'best-practices-lookup: code optimization',
              ],
              renderStatus: 'active',
            },
            performance: {
              aiProcessingTime: 1250,
              totalApiTime: 1580,
              efficiency: 0.79,
            },
            metadata: {
              timestamp: new Date().toISOString(),
              documentsAnalyzed: 12,
              intentDetected: 'optimization',
              mcpActionsUsed: 3,
              aiEngineVersion: 'v2.0.1',
            },
          },
        },
      ],
    },
  },
};

export const LoadingState: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        {
          url: '/api/ai/enhanced',
          method: 'post',
          delay: 30000, // 30초 지연으로 로딩 상태 시뮬레이션
          status: 200,
          response: { success: true },
        },
      ],
    },
  },
};

export const ErrorState: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        {
          url: '/api/ai/enhanced',
          method: 'post',
          status: 500,
          response: {
            success: false,
            error: {
              message:
                'AI 서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
            },
          },
        },
      ],
    },
  },
};

export const TroubleshootingIntent: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        {
          url: '/api/ai/enhanced',
          method: 'post',
          status: 200,
          response: {
            success: true,
            mode: 'smart',
            query: '웹사이트가 느려요. 문제를 해결해 주세요.',
            result: {
              answer:
                '웹사이트 속도 문제 진단 및 해결 방법을 제안드립니다:\n\n**1. 진단 결과**\n- 초기 로딩 시간: 5.2초 (권장: 3초 이하)\n- 번들 크기: 2.1MB (권장: 1MB 이하)\n- 이미지 최적화 미적용\n\n**2. 즉시 해결 방법**\n- 이미지 압축 및 WebP 변환\n- JavaScript 번들 분할\n- 불필요한 라이브러리 제거\n\n**3. 장기 개선 방안**\n- CDN 도입\n- 서버 사이드 렌더링 고려\n- 프리로딩 전략 수립\n\n**4. 모니터링 도구**\n- Lighthouse 정기 검사\n- Core Web Vitals 추적\n- 사용자 경험 메트릭 수집',
              confidence: 0.89,
              sources: [
                {
                  path: '/docs/troubleshooting-guide.md',
                  relevanceScore: 0.92,
                  summary: '성능 문제 해결 가이드',
                },
              ],
              reasoning: [
                '사용자가 웹사이트 속도 문제를 보고함',
                '문제 해결 의도로 분류함',
                '진단, 즉시 해결, 장기 개선, 모니터링 단계로 구분하여 답변 구성',
              ],
              mcpActions: [
                'performance-analysis: website speed',
                'troubleshooting-guide: loading issues',
              ],
              renderStatus: 'active',
            },
            performance: {
              aiProcessingTime: 980,
              totalApiTime: 1200,
              efficiency: 0.82,
            },
            metadata: {
              timestamp: new Date().toISOString(),
              documentsAnalyzed: 8,
              intentDetected: 'troubleshooting',
              mcpActionsUsed: 2,
              aiEngineVersion: 'v2.0.1',
            },
          },
        },
      ],
    },
  },
};
