import type { Meta, StoryObj } from '@storybook/nextjs';
import RealtimeStatus from './RealtimeStatus';

const meta: Meta<typeof RealtimeStatus> = {
    title: 'Realtime/RealtimeStatus',
    component: RealtimeStatus,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: '실시간 시스템 상태를 표시하는 컴포넌트입니다.',
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
};

export const Connected: Story = {
    name: '연결됨',
    args: {},
    parameters: {
        docs: {
            description: {
                story: '실시간 데이터 스트림이 정상적으로 연결된 상태입니다.',
            },
        },
    },
};

export const Disconnected: Story = {
    name: '연결 끊김',
    args: {},
    parameters: {
        docs: {
            description: {
                story: '실시간 데이터 스트림 연결이 끊어진 상태입니다.',
            },
        },
    },
};

export const Reconnecting: Story = {
    name: '재연결 중',
    args: {},
    parameters: {
        docs: {
            description: {
                story: '실시간 데이터 스트림에 재연결을 시도하는 상태입니다.',
            },
        },
    },
};
