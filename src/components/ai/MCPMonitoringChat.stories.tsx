/**
 * MCPMonitoringChat Stories
 * 
 * 🤖 MCP 기반 서버 모니터링 에이전트 채팅
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { MCPMonitoringChat } from './MCPMonitoringChat';

const meta: Meta<typeof MCPMonitoringChat> = {
  title: '🤖 AI Components/MCPMonitoringChat',
  component: MCPMonitoringChat,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**MCPMonitoringChat Component**

🤖 MCP 기반 서버 모니터링 에이전트 채팅

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<MCPMonitoringChat />
\`\`\`
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
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'MCPMonitoringChat의 기본 상태입니다.',
      },
    },
  },
};

export const Interactive: Story = {
  name: '인터랙티브',
  args: {},
  parameters: {
    docs: {
      description: {
        story: '사용자 상호작용을 테스트할 수 있는 MCPMonitoringChat입니다.',
      },
    },
  },
};
