/**
 * 📚 Card Storybook Stories
 *
 * UI Card 컴포넌트 문서화
 * - 카드 레이아웃 시스템
 * - Header, Content, Footer 구조
 * - 다양한 사용 사례
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';
import { Button } from './button';
import { Badge } from './badge';
import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**🎯 Card Component**

정보를 그룹화하고 표시하는 카드 컴포넌트입니다.

### 🚀 주요 구성 요소
- **CardHeader**: 제목과 설명 영역
- **CardContent**: 주요 내용 영역
- **CardFooter**: 액션 버튼이나 추가 정보
- **CardTitle**: 카드 제목
- **CardDescription**: 카드 설명

### 🎨 디자인 특징
- **그림자**: 미묘한 shadow-sm 적용
- **테두리**: 둥근 모서리 (rounded-lg)
- **배경**: card 배경색 사용
- **간격**: 적절한 padding 시스템

### 💡 사용법
\`\`\`tsx
<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
    <CardDescription>설명</CardDescription>
  </CardHeader>
  <CardContent>
    내용
  </CardContent>
  <CardFooter>
    <Button>액션</Button>
  </CardFooter>
</Card>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 스토리
export const Default: Story = {
  render: () => (
    <Card className='w-96'>
      <CardHeader>
        <CardTitle>카드 제목</CardTitle>
        <CardDescription>
          카드에 대한 설명입니다. 여기에 간단한 정보를 제공합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          카드의 주요 내용이 여기에 들어갑니다. 텍스트, 이미지, 차트 등 다양한
          콘텐츠를 포함할 수 있습니다.
        </p>
      </CardContent>
      <CardFooter>
        <Button>액션 버튼</Button>
      </CardFooter>
    </Card>
  ),
};

export const SystemStatus: Story = {
  render: () => (
    <Card className='w-96'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <CheckCircle className='h-5 w-5 text-green-500' />
          시스템 상태
        </CardTitle>
        <CardDescription>모든 서비스가 정상 작동 중입니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-500'>99.9%</div>
            <div className='text-sm text-gray-500'>가동 시간</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-500'>15ms</div>
            <div className='text-sm text-gray-500'>응답 시간</div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant='outline' className='w-full'>
          자세히 보기
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: '**시스템 상태**: 서버 모니터링용 상태 카드',
      },
    },
  },
};

export const AlertCard: Story = {
  render: () => (
    <Card className='w-96 border-red-200 bg-red-50'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-red-700'>
          <AlertCircle className='h-5 w-5' />
          경고 알림
        </CardTitle>
        <CardDescription className='text-red-600'>
          시스템에 문제가 감지되었습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <p className='text-sm text-red-800'>
            서버 CPU 사용률이 85%를 초과했습니다.
          </p>
          <Badge variant='destructive'>긴급</Badge>
        </div>
      </CardContent>
      <CardFooter className='gap-2'>
        <Button variant='destructive' size='sm'>
          즉시 조치
        </Button>
        <Button variant='outline' size='sm'>
          나중에
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: '**경고 카드**: 시스템 경고를 표시하는 카드',
      },
    },
  },
};

export const MetricsCard: Story = {
  render: () => (
    <Card className='w-96'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <TrendingUp className='h-5 w-5 text-blue-500' />
          성능 지표
        </CardTitle>
        <CardDescription>최근 24시간 서버 성능</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='flex justify-between items-center'>
            <span className='text-sm'>CPU 사용률</span>
            <span className='font-medium'>45%</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-blue-500 h-2 rounded-full'
              style={{ width: '45%' }}
            ></div>
          </div>

          <div className='flex justify-between items-center'>
            <span className='text-sm'>메모리 사용률</span>
            <span className='font-medium'>62%</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-green-500 h-2 rounded-full'
              style={{ width: '62%' }}
            ></div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant='outline' className='w-full'>
          상세 분석
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: '**메트릭 카드**: 성능 지표를 시각화하는 카드',
      },
    },
  },
};

export const SimpleCard: Story = {
  render: () => (
    <Card className='w-96'>
      <CardContent className='pt-6'>
        <div className='text-center'>
          <Clock className='h-12 w-12 mx-auto mb-4 text-gray-400' />
          <h3 className='text-lg font-semibold'>대기 중</h3>
          <p className='text-sm text-gray-500 mt-2'>
            시스템이 준비될 때까지 잠시 기다려주세요.
          </p>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: '**심플 카드**: Header/Footer 없이 Content만 사용',
      },
    },
  },
};

export const CardGrid: Story = {
  render: () => (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      <Card>
        <CardHeader>
          <CardTitle>서버 1</CardTitle>
          <CardDescription>프로덕션 서버</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge>온라인</Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>서버 2</CardTitle>
          <CardDescription>스테이징 서버</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant='secondary'>유지보수</Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>서버 3</CardTitle>
          <CardDescription>개발 서버</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant='destructive'>오프라인</Badge>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '**카드 그리드**: 여러 카드를 그리드로 배치',
      },
    },
  },
};
