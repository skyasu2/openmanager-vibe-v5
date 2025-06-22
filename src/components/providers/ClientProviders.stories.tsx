/**
 * ClientProviders Stories
 * 
 * 클라이언트 사이드 Provider들을 관리하는 컴포넌트
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { ClientProviders } from './ClientProviders';

const meta: Meta<typeof ClientProviders> = {
  title: 'Components/ClientProviders',
  component: ClientProviders,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**ClientProviders Component**

클라이언트 사이드 Provider들을 관리하는 컴포넌트

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\`\`\`tsx
<ClientProviders />
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
        story: 'ClientProviders의 기본 상태입니다.',
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
        story: '사용자 상호작용을 테스트할 수 있는 ClientProviders입니다.',
      },
    },
  },
};
