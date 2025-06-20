/**
 * 📚 UnifiedProfileComponent Storybook Stories
 *
 * 통합 프로필 컴포넌트 문서화
 * - 사용자 프로필 관리
 * - AI 에이전트 설정
 * - 시스템 설정 통합
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import UnifiedProfileComponent from './UnifiedProfileComponent';

const meta: Meta<typeof UnifiedProfileComponent> = {
  title: 'Components/UnifiedProfileComponent',
  component: UnifiedProfileComponent,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**🎯 UnifiedProfileComponent**

사용자 프로필과 시스템 설정을 통합 관리하는 컴포넌트입니다.

### 🚀 주요 기능
- **사용자 프로필**: 기본 정보 관리
- **AI 에이전트 설정**: AI 기능 활성화/비활성화
- **시스템 통합**: 시스템 설정과 연동
- **드롭다운 메뉴**: 직관적인 UI/UX

### 💡 사용법
\`\`\`tsx
<UnifiedProfileComponent userName="사용자명" />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    userName: {
      control: 'text',
      description: '사용자 이름',
      defaultValue: '사용자',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 스토리
export const Default: Story = {
  args: {
    userName: '사용자',
  },
};

export const AdminUser: Story = {
  args: {
    userName: '관리자',
  },
  parameters: {
    docs: {
      description: {
        story: '**관리자 사용자**: 관리자 권한을 가진 사용자 프로필',
      },
    },
  },
};

export const LongUserName: Story = {
  args: {
    userName: '매우긴사용자이름입니다',
  },
  parameters: {
    docs: {
      description: {
        story: '**긴 사용자명**: 긴 사용자명 처리 테스트',
      },
    },
  },
};

export const KoreanUserName: Story = {
  args: {
    userName: '홍길동',
  },
  parameters: {
    docs: {
      description: {
        story: '**한국어 사용자명**: 한글 사용자명 지원',
      },
    },
  },
};

export const EnglishUserName: Story = {
  args: {
    userName: 'John Doe',
  },
  parameters: {
    docs: {
      description: {
        story: '**영어 사용자명**: 영문 사용자명 지원',
      },
    },
  },
};
