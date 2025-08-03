/**
 * 🎨 Alert 컴포넌트 스토리북
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { AlertCircle, AlertTriangle, CheckCircle, Info as InfoIcon } from 'lucide-react';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Alert 컴포넌트는 사용자에게 중요한 정보나 경고를 표시하는 데 사용됩니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
      description: 'Alert의 시각적 스타일을 정의합니다',
    },
    children: {
      control: 'text',
      description: 'Alert 내부에 표시될 내용',
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 Alert
export const Default: Story = {
  args: {
    children: (
      <>
        <AlertTitle>알림</AlertTitle>
        <AlertDescription>
          이것은 기본 알림 메시지입니다.
        </AlertDescription>
      </>
    ),
  },
};

// 에러 Alert
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: (
      <>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>오류</AlertTitle>
        <AlertDescription>
          작업을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.
        </AlertDescription>
      </>
    ),
  },
};

// 정보 Alert
export const Info: Story = {
  render: () => (
    <Alert>
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>정보</AlertTitle>
      <AlertDescription>
        시스템 점검이 2025년 7월 22일 오전 2시에 예정되어 있습니다.
      </AlertDescription>
    </Alert>
  ),
};

// 성공 Alert
export const Success: Story = {
  render: () => (
    <Alert className="border-green-500/50 text-green-600 [&>svg]:text-green-600">
      <CheckCircle className="h-4 w-4" />
      <AlertTitle>성공</AlertTitle>
      <AlertDescription>
        데이터가 성공적으로 저장되었습니다.
      </AlertDescription>
    </Alert>
  ),
};

// 경고 Alert
export const Warning: Story = {
  render: () => (
    <Alert className="border-yellow-500/50 text-yellow-600 [&>svg]:text-yellow-600">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>경고</AlertTitle>
      <AlertDescription>
        무료 티어 한도의 80%를 사용했습니다. 사용량을 확인해주세요.
      </AlertDescription>
    </Alert>
  ),
};

// 제목 없는 Alert
export const WithoutTitle: Story = {
  render: () => (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        제목 없이 설명만 있는 간단한 알림입니다.
      </AlertDescription>
    </Alert>
  ),
};

// 긴 내용의 Alert
export const LongContent: Story = {
  render: () => (
    <Alert>
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>시스템 업데이트 안내</AlertTitle>
      <AlertDescription>
        2025년 7월 22일 새벽 2시부터 4시까지 시스템 업데이트가 진행됩니다. 
        업데이트 중에는 서비스 이용이 일시적으로 제한될 수 있으며, 
        진행 중인 작업은 미리 저장해주시기 바랍니다. 
        업데이트 완료 후 새로운 기능과 개선사항이 적용됩니다.
      </AlertDescription>
    </Alert>
  ),
};

// 여러 Alert 조합
export const Multiple: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>정보</AlertTitle>
        <AlertDescription>
          새로운 기능이 추가되었습니다.
        </AlertDescription>
      </Alert>
      
      <Alert className="border-yellow-500/50 text-yellow-600 [&>svg]:text-yellow-600">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>경고</AlertTitle>
        <AlertDescription>
          API 사용량이 한도에 근접했습니다.
        </AlertDescription>
      </Alert>
      
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>오류</AlertTitle>
        <AlertDescription>
          서버 연결에 실패했습니다.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// 인터랙티브 예제
export const Interactive: Story = {
  render: () => {
    const [show, setShow] = React.useState(true);
    
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShow(!show)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Alert 토글
        </button>
        
        {show && (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>토글 가능한 Alert</AlertTitle>
            <AlertDescription>
              버튼을 클릭하여 이 Alert를 숨기거나 표시할 수 있습니다.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  },
};