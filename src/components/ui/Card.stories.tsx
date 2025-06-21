import type { Meta, StoryObj } from '@storybook/nextjs';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

const meta: Meta<typeof Card> = {
    title: 'UI/Card',
    component: Card,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'UI Card 컴포넌트 - 다양한 카드 레이아웃과 스타일을 지원합니다.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    name: '기본 카드',
    render: () => (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>기본 카드</CardTitle>
                <CardDescription>간단한 카드 레이아웃입니다.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>이것은 기본적인 카드 콘텐츠입니다.</p>
            </CardContent>
            <CardFooter>
                <Button>액션</Button>
            </CardFooter>
        </Card>
    ),
};

export const ProductCard: Story = {
    name: '제품 카드',
    render: () => (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>OpenManager Vibe v5</CardTitle>
                <CardDescription>AI 기반 서버 모니터링 시스템</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                        실시간 서버 모니터링, AI 예측 분석을 제공합니다.
                    </p>
                    <div className="flex space-x-2">
                        <Badge variant="outline">AI</Badge>
                        <Badge variant="outline">모니터링</Badge>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button>시작하기</Button>
            </CardFooter>
        </Card>
    ),
};