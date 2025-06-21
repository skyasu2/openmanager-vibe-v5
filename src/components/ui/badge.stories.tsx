import type { Meta, StoryObj } from '@storybook/nextjs';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
    title: 'UI/Badge',
    component: Badge,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: ['default', 'secondary', 'destructive', 'outline'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: '기본 배지',
    },
};

export const Secondary: Story = {
    args: {
        variant: 'secondary',
        children: '보조 배지',
    },
};

export const Destructive: Story = {
    args: {
        variant: 'destructive',
        children: '위험 배지',
    },
};

export const Outline: Story = {
    args: {
        variant: 'outline',
        children: '아웃라인 배지',
    },
};

export const StatusBadges: Story = {
    name: '상태 배지들',
    render: () => (
        <div className="flex gap-2 flex-wrap">
            <Badge variant="default">활성</Badge>
            <Badge variant="secondary">대기</Badge>
            <Badge variant="destructive">오류</Badge>
            <Badge variant="outline">비활성</Badge>
        </div>
    ),
}; 