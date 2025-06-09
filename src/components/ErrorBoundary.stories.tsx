import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import ErrorBoundary from './ErrorBoundary';

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '오류 경계(Error Boundary) 컴포넌트로 JavaScript 오류를 포착하고 fallback UI를 제공합니다.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 정상 동작하는 컴포넌트
const NormalComponent = () => (
  <div className='p-6 bg-green-100 rounded-lg'>
    <h3 className='text-lg font-semibold text-green-800'>정상 동작</h3>
    <p className='text-green-600'>이 컴포넌트는 정상적으로 동작합니다.</p>
  </div>
);

// 오류를 발생시키는 컴포넌트
const ErrorComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('테스트 에러입니다');
  }
  return <div>정상 동작</div>;
};

// Hydration 오류를 시뮬레이션하는 컴포넌트
const HydrationErrorComponent = () => {
  throw new Error(
    'Hydration failed. Text content does not match server-rendered HTML.'
  );
};

// 시스템 헬스 오류를 시뮬레이션하는 컴포넌트
const SystemHealthErrorComponent = () => {
  throw new Error('System health check failed: Service unavailable 503');
};

export const Default: Story = {
  args: {
    children: <NormalComponent />,
  },
};

export const WithError: Story = {
  args: {
    children: <ErrorComponent shouldThrow={true} />,
  },
  parameters: {
    docs: {
      description: {
        story:
          '일반적인 JavaScript 오류가 발생했을 때의 ErrorBoundary 동작을 보여줍니다.',
      },
    },
  },
};

export const WithCustomFallback: Story = {
  args: {
    children: <ErrorComponent shouldThrow={true} />,
    fallback: (
      <div className='p-6 bg-yellow-100 border border-yellow-300 rounded-lg'>
        <h3 className='text-lg font-semibold text-yellow-800'>
          커스텀 오류 UI
        </h3>
        <p className='text-yellow-600'>커스텀 fallback UI가 표시됩니다.</p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '커스텀 fallback UI를 제공했을 때의 동작을 보여줍니다.',
      },
    },
  },
};

export const HydrationError: Story = {
  args: {
    children: <HydrationErrorComponent />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Hydration 오류가 발생했을 때의 특별한 처리를 보여줍니다.',
      },
    },
  },
};

export const SystemHealthError: Story = {
  args: {
    children: <SystemHealthErrorComponent />,
  },
  parameters: {
    docs: {
      description: {
        story:
          '시스템 헬스 체크 오류가 발생했을 때의 간소화된 UI를 보여줍니다.',
      },
    },
  },
};

export const MultipleChildren: Story = {
  args: {
    children: (
      <div className='space-y-4'>
        <NormalComponent />
        <div className='p-4 bg-blue-100 rounded-lg'>
          <h3 className='text-lg font-semibold text-blue-800'>추가 컴포넌트</h3>
          <p className='text-blue-600'>
            여러 자식 컴포넌트가 있을 때도 정상 동작합니다.
          </p>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          '여러 자식 컴포넌트가 있을 때 ErrorBoundary의 동작을 보여줍니다.',
      },
    },
  },
};
