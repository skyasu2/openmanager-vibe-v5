import type { Meta, StoryObj } from '@storybook/nextjs';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';

const meta: Meta<typeof Alert> = {
    title: 'UI/Alert',
    component: Alert,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: '다양한 알림 상황에 사용되는 Alert 컴포넌트입니다.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    name: '기본 알림',
    render: () => (
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>정보</AlertTitle>
            <AlertDescription>
                이것은 기본적인 정보 알림입니다.
            </AlertDescription>
        </Alert>
    ),
};

export const Success: Story = {
    name: '성공 알림',
    render: () => (
        <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>성공</AlertTitle>
            <AlertDescription>
                작업이 성공적으로 완료되었습니다.
            </AlertDescription>
        </Alert>
    ),
};

export const Warning: Story = {
    name: '경고 알림',
    render: () => (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>경고</AlertTitle>
            <AlertDescription>
                주의가 필요한 상황이 발생했습니다.
            </AlertDescription>
        </Alert>
    ),
};

export const Error: Story = {
    name: '오류 알림',
    render: () => (
        <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>오류</AlertTitle>
            <AlertDescription>
                시스템에서 오류가 발생했습니다. 관리자에게 문의하세요.
            </AlertDescription>
        </Alert>
    ),
};

export const ServerAlert: Story = {
    name: '서버 알림',
    render: () => (
        <div className="space-y-4">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>서버 상태 정상</AlertTitle>
                <AlertDescription>
                    모든 서버가 정상적으로 작동하고 있습니다.
                </AlertDescription>
            </Alert>

            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>CPU 사용률 경고</AlertTitle>
                <AlertDescription>
                    웹서버-01의 CPU 사용률이 85%를 초과했습니다. 확인이 필요합니다.
                </AlertDescription>
            </Alert>
        </div>
    ),
}; 