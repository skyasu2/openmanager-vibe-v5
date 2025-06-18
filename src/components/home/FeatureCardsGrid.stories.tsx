import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import FeatureCardsGrid from './FeatureCardsGrid';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';

const meta: Meta<typeof FeatureCardsGrid> = {
    title: 'Home/FeatureCardsGrid',
    component: FeatureCardsGrid,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: `
## FeatureCardsGrid 컴포넌트

홈페이지의 주요 기능 카드들을 표시하는 그리드 컴포넌트입니다.

### 주요 기능
- 4개의 메인 카드: AI 시스템, 풀스택 개발, 적용 기술, Cursor AI 통합
- 개발과정 보기 버튼 (/about 페이지로 연결)
- 다크모드 지원
- 애니메이션 효과
- AI 에이전트 상태에 따른 동적 표시
- 모달을 통한 상세 정보 표시

### 최근 업데이트
- /vibe-coding → /about 경로 변경
- 새로운 "개발과정 보기" 버튼 추가
- AI 에이전트 상태 연동 개선
        `,
            },
        },
    },
    decorators: [
        (Story) => (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof FeatureCardsGrid>;

// 기본 상태
export const Default: Story = {
    name: '기본 상태',
    parameters: {
        docs: {
            description: {
                story: '기본적인 FeatureCardsGrid의 모습입니다. 4개의 메인 카드와 개발과정 보기 버튼이 표시됩니다.',
            },
        },
    },
};

// 다크모드
export const DarkMode: Story = {
    name: '다크모드',
    decorators: [
        (Story) => (
            <div className="min-h-screen bg-black p-8" data-theme="dark">
                <Story />
            </div>
        ),
    ],
    parameters: {
        docs: {
            description: {
                story: '다크모드에서의 FeatureCardsGrid 모습입니다.',
            },
        },
    },
};

// 라이트모드
export const LightMode: Story = {
    name: '라이트모드',
    decorators: [
        (Story) => (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8" data-theme="light">
                <Story />
            </div>
        ),
    ],
    parameters: {
        docs: {
            description: {
                story: '라이트모드에서의 FeatureCardsGrid 모습입니다.',
            },
        },
    },
};

// AI 에이전트 활성화 상태
export const WithAIAgentEnabled: Story = {
    name: 'AI 에이전트 활성화',
    decorators: [
        (Story) => {
            // AI 에이전트 상태를 활성화로 설정하는 Mock
            const MockedStory = () => {
                // useUnifiedAdminStore의 상태를 모킹
                const originalStore = useUnifiedAdminStore.getState();
                useUnifiedAdminStore.setState({
                    ...originalStore,
                    aiAgent: {
                        ...originalStore.aiAgent,
                        isEnabled: true,
                        state: 'enabled',
                    },
                });

                return <Story />;
            };
            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
                    <MockedStory />
                </div>
            );
        },
    ],
    parameters: {
        docs: {
            description: {
                story: 'AI 에이전트가 활성화된 상태의 FeatureCardsGrid입니다. AI 관련 카드들이 활성화되어 표시됩니다.',
            },
        },
    },
};

// AI 에이전트 비활성화 상태
export const WithAIAgentDisabled: Story = {
    name: 'AI 에이전트 비활성화',
    decorators: [
        (Story) => {
            const MockedStory = () => {
                const originalStore = useUnifiedAdminStore.getState();
                useUnifiedAdminStore.setState({
                    ...originalStore,
                    aiAgent: {
                        ...originalStore.aiAgent,
                        isEnabled: false,
                        state: 'disabled',
                    },
                });

                return <Story />;
            };
            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
                    <MockedStory />
                </div>
            );
        },
    ],
    parameters: {
        docs: {
            description: {
                story: 'AI 에이전트가 비활성화된 상태의 FeatureCardsGrid입니다. AI 관련 카드들에 "AI 에이전트 모드 필요" 메시지가 표시됩니다.',
            },
        },
    },
};

// 모바일 뷰
export const MobileView: Story = {
    name: '모바일 뷰',
    parameters: {
        viewport: {
            defaultViewport: 'mobile1',
        },
        docs: {
            description: {
                story: '모바일 화면에서의 FeatureCardsGrid 모습입니다. 반응형 디자인이 적용됩니다.',
            },
        },
    },
};

// 태블릿 뷰
export const TabletView: Story = {
    name: '태블릿 뷰',
    parameters: {
        viewport: {
            defaultViewport: 'tablet',
        },
        docs: {
            description: {
                story: '태블릿 화면에서의 FeatureCardsGrid 모습입니다.',
            },
        },
    },
};

// 인터랙션 테스트
export const InteractionTest: Story = {
    name: '인터랙션 테스트',
    play: async ({ canvasElement }) => {
        // 스토리북의 인터랙션 테스트
        action('card-clicked')('AI 시스템 카드 클릭됨');
        action('about-button-clicked')('개발과정 보기 버튼 클릭됨');
    },
    parameters: {
        docs: {
            description: {
                story: '카드 클릭과 버튼 클릭 등의 인터랙션을 테스트할 수 있는 스토리입니다.',
            },
        },
    },
}; 