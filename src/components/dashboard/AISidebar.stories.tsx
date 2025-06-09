import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { AISidebar } from './AISidebar';

const meta: Meta<typeof AISidebar> = {
  title: 'Components/Dashboard/AISidebar',
  component: AISidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'AI 기능들을 관리하는 사이드바 컴포넌트입니다. 패턴 분석, 예측, MCP 에이전트 등을 포함합니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: '사이드바 열림/닫힘 상태',
    },
    position: {
      control: 'select',
      options: ['left', 'right'],
      description: '사이드바 위치',
    },
    width: {
      control: 'number',
      description: '사이드바 너비 (픽셀)',
    },
  },
  decorators: [
    Story => (
      <div className='relative min-h-screen bg-gray-100'>
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='text-center p-8'>
            <h2 className='text-2xl font-bold text-gray-800 mb-4'>
              메인 콘텐츠 영역
            </h2>
            <p className='text-gray-600'>
              AI 사이드바가 이 영역 위에 오버레이됩니다.
              <br />
              우측 하단의 AI 버튼을 클릭하거나 컨트롤을 사용해 테스트하세요.
            </p>
          </div>
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: false,
    onToggle: () => console.log('Toggle clicked'),
    onClose: () => console.log('Close clicked'),
    position: 'right',
    width: 400,
  },
  parameters: {
    docs: {
      description: {
        story:
          '기본 상태의 AI 사이드바입니다. 우측에 위치하고 기본 너비를 가집니다.',
      },
    },
  },
};

export const Opened: Story = {
  args: {
    isOpen: true,
    onToggle: () => console.log('Toggle clicked'),
    onClose: () => console.log('Close clicked'),
    position: 'right',
    width: 400,
  },
  parameters: {
    docs: {
      description: {
        story: '열린 상태의 AI 사이드바입니다. AI 기능들이 표시됩니다.',
      },
    },
  },
};

export const LeftPosition: Story = {
  args: {
    isOpen: true,
    onToggle: () => console.log('Toggle clicked'),
    onClose: () => console.log('Close clicked'),
    position: 'left',
    width: 400,
  },
  parameters: {
    docs: {
      description: {
        story: '좌측에 위치한 AI 사이드바입니다.',
      },
    },
  },
};

export const WideWidth: Story = {
  args: {
    isOpen: true,
    onToggle: () => console.log('Toggle clicked'),
    onClose: () => console.log('Close clicked'),
    position: 'right',
    width: 500,
  },
  parameters: {
    docs: {
      description: {
        story:
          '더 넓은 너비를 가진 AI 사이드바입니다. 더 많은 정보를 표시할 수 있습니다.',
      },
    },
  },
};

export const NarrowWidth: Story = {
  args: {
    isOpen: true,
    onToggle: () => console.log('Toggle clicked'),
    onClose: () => console.log('Close clicked'),
    position: 'right',
    width: 300,
  },
  parameters: {
    docs: {
      description: {
        story:
          '더 좁은 너비를 가진 AI 사이드바입니다. 공간이 제한된 환경에 적합합니다.',
      },
    },
  },
};

// Interactive demo component
const InteractiveDemo = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState<'left' | 'right'>('right');
  const [width, setWidth] = React.useState(400);

  return (
    <div className='relative min-h-screen bg-gray-100'>
      {/* 컨트롤 패널 */}
      <div className='absolute top-4 left-4 z-50 bg-white p-4 rounded-lg shadow-lg'>
        <h3 className='font-semibold mb-3'>AI 사이드바 컨트롤</h3>
        <div className='space-y-3'>
          <div>
            <label className='block text-sm font-medium mb-1'>상태</label>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`px-3 py-1 rounded text-sm ${
                isOpen
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {isOpen ? '열림' : '닫힘'}
            </button>
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>위치</label>
            <select
              value={position}
              onChange={e => setPosition(e.target.value as 'left' | 'right')}
              className='border rounded px-2 py-1 text-sm'
            >
              <option value='right'>우측</option>
              <option value='left'>좌측</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>너비</label>
            <select
              value={width}
              onChange={e => setWidth(Number(e.target.value))}
              className='border rounded px-2 py-1 text-sm'
            >
              <option value={300}>300px (좁음)</option>
              <option value={400}>400px (기본)</option>
              <option value={500}>500px (넓음)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center p-8'>
          <h2 className='text-3xl font-bold text-gray-800 mb-4'>
            AI 사이드바 인터랙티브 데모
          </h2>
          <p className='text-gray-600 mb-6'>
            좌측 컨트롤 패널을 사용하여 사이드바를 조작해보세요.
            <br />
            또는 플로팅 AI 버튼을 클릭하여 토글할 수 있습니다.
          </p>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div className='bg-white p-4 rounded-lg shadow'>
              <h4 className='font-semibold mb-2'>현재 상태</h4>
              <p>열림: {isOpen ? '예' : '아니오'}</p>
              <p>위치: {position === 'right' ? '우측' : '좌측'}</p>
              <p>너비: {width}px</p>
            </div>
            <div className='bg-white p-4 rounded-lg shadow'>
              <h4 className='font-semibold mb-2'>기능</h4>
              <ul className='text-left space-y-1'>
                <li>• 패턴 분석</li>
                <li>• AI 예측</li>
                <li>• MCP 에이전트</li>
                <li>• 실시간 채팅</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* AI 사이드바 */}
      <AISidebar
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        onClose={() => setIsOpen(false)}
        position={position}
        width={width}
      />
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story:
          '인터랙티브하게 AI 사이드바의 다양한 설정을 테스트할 수 있습니다.',
      },
    },
  },
};

// Mobile responsive demo
const MobileDemo = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className='relative min-h-screen bg-gray-100'>
      {/* 모바일 헤더 시뮬레이션 */}
      <div className='bg-white shadow-sm p-4 flex items-center justify-between'>
        <h1 className='text-lg font-semibold'>모바일 대시보드</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='p-2 bg-purple-100 text-purple-600 rounded-lg'
        >
          AI
        </button>
      </div>

      {/* 모바일 콘텐츠 */}
      <div className='p-4'>
        <div className='grid grid-cols-1 gap-4'>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className='bg-white p-4 rounded-lg shadow'>
              <h3 className='font-semibold mb-2'>서버 {i}</h3>
              <div className='flex justify-between text-sm text-gray-600'>
                <span>CPU: {Math.floor(Math.random() * 100)}%</span>
                <span className='text-green-600'>온라인</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 모바일에서는 전체 너비로 표시 */}
      <AISidebar
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        onClose={() => setIsOpen(false)}
        position='right'
        width={
          typeof window !== 'undefined' && window.innerWidth < 768
            ? window.innerWidth - 20
            : 400
        }
      />
    </div>
  );
};

export const Mobile: Story = {
  render: () => <MobileDemo />,
  parameters: {
    docs: {
      description: {
        story: '모바일 환경에서의 AI 사이드바 동작을 시뮬레이션합니다.',
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
