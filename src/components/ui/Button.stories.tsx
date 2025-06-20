/**
 * 📚 Button Storybook Stories
 *
 * UI Button 컴포넌트 문서화
 * - 다양한 variants 지원
 * - 크기 옵션
 * - 상태별 스타일링
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button } from './button';
import { Download, Heart, Search, Settings, Trash2 } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**🎯 Button Component**

다양한 스타일과 크기를 지원하는 범용 버튼 컴포넌트입니다.

### 🚀 주요 기능
- **Multiple Variants**: default, destructive, outline, secondary, ghost, link
- **다양한 크기**: sm, default, lg, icon
- **접근성**: ARIA 지원
- **TypeScript**: 완전한 타입 지원

### 🎨 Variants
- **default**: 기본 스타일 (Primary)
- **destructive**: 위험한 작업용 (빨간색)
- **outline**: 테두리만 있는 스타일
- **secondary**: 보조 버튼
- **ghost**: 투명 배경
- **link**: 링크 스타일

### 💡 사용법
\`\`\`tsx
<Button variant="default" size="md">
  버튼 텍스트
</Button>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ],
      description: '버튼 스타일 변형',
      defaultValue: 'default',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: '버튼 크기',
      defaultValue: 'default',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
      defaultValue: false,
    },
    asChild: {
      control: 'boolean',
      description: 'Slot 래퍼 사용',
      defaultValue: false,
    },
    children: {
      control: 'text',
      description: '버튼 내용',
      defaultValue: '버튼',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 스토리
export const Default: Story = {
  args: {
    children: '기본 버튼',
    variant: 'default',
    size: 'default',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className='flex flex-wrap gap-4'>
      <Button variant='default'>Default</Button>
      <Button variant='destructive'>Destructive</Button>
      <Button variant='outline'>Outline</Button>
      <Button variant='secondary'>Secondary</Button>
      <Button variant='ghost'>Ghost</Button>
      <Button variant='link'>Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '**모든 Variants**: 지원되는 모든 버튼 스타일',
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className='flex items-center gap-4'>
      <Button size='sm'>Small</Button>
      <Button size='default'>Default</Button>
      <Button size='lg'>Large</Button>
      <Button size='icon'>
        <Settings className='h-4 w-4' />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '**모든 크기**: sm, default, lg, icon 크기 비교',
      },
    },
  },
};

export const WithIcons: Story = {
  render: () => (
    <div className='flex flex-wrap gap-4'>
      <Button>
        <Download className='mr-2 h-4 w-4' />
        다운로드
      </Button>
      <Button variant='destructive'>
        <Trash2 className='mr-2 h-4 w-4' />
        삭제
      </Button>
      <Button variant='outline'>
        <Search className='mr-2 h-4 w-4' />
        검색
      </Button>
      <Button variant='ghost' size='icon'>
        <Heart className='h-4 w-4' />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '**아이콘 포함**: 다양한 아이콘과 함께 사용되는 버튼들',
      },
    },
  },
};

export const States: Story = {
  render: () => (
    <div className='flex flex-wrap gap-4'>
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
      <Button variant='destructive'>Hover me</Button>
      <Button variant='outline'>Focus me</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '**상태별**: normal, disabled, hover, focus 상태',
      },
    },
  },
};

export const Loading: Story = {
  render: () => (
    <div className='flex gap-4'>
      <Button disabled>
        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
        Loading...
      </Button>
      <Button variant='outline' disabled>
        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2'></div>
        Processing...
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '**로딩 상태**: 비동기 작업 중인 버튼 스타일',
      },
    },
  },
};
