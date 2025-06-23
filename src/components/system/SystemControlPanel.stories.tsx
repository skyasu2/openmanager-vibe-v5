import type { Meta, StoryObj } from '@storybook/react';
import { SystemControlPanel } from './SystemControlPanel';

const meta: Meta<typeof SystemControlPanel> = {
    title: 'System/SystemControlPanel',
    component: SystemControlPanel,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: '시스템 온오프를 제어하는 통합 제어 패널입니다. 크론 제거 후 사용자 주도 시스템 관리를 위한 핵심 컴포넌트입니다.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SystemRunning: Story = {
    parameters: {
        mockData: {
            systemStatus: {
                isRunning: true,
                health: 'healthy',
                processes: [
                    {
                        id: 'data-generator',
                        status: 'running',
                        healthScore: 95,
                        restartCount: 0,
                        uptime: 3600000,
                        errorCount: 0,
                    },
                    {
                        id: 'ai-engine',
                        status: 'running',
                        healthScore: 88,
                        restartCount: 1,
                        uptime: 2400000,
                        errorCount: 2,
                    },
                ],
                metrics: {
                    totalProcesses: 2,
                    runningProcesses: 2,
                    healthyProcesses: 2,
                    systemUptime: 3600000,
                    memoryUsage: 67,
                    averageHealthScore: 91.5,
                    totalRestarts: 1,
                },
                startTime: new Date(Date.now() - 3600000),
            },
        },
    },
};

export const SystemStopped: Story = {
    parameters: {
        mockData: {
            systemStatus: {
                isRunning: false,
                health: 'critical',
                processes: [
                    {
                        id: 'data-generator',
                        status: 'stopped',
                        healthScore: 0,
                        restartCount: 0,
                        uptime: 0,
                        errorCount: 0,
                    },
                    {
                        id: 'ai-engine',
                        status: 'stopped',
                        healthScore: 0,
                        restartCount: 0,
                        uptime: 0,
                        errorCount: 0,
                    },
                ],
                metrics: {
                    totalProcesses: 2,
                    runningProcesses: 0,
                    healthyProcesses: 0,
                    systemUptime: 0,
                    memoryUsage: 0,
                    averageHealthScore: 0,
                    totalRestarts: 0,
                },
            },
        },
    },
};

export const SystemDegraded: Story = {
    parameters: {
        mockData: {
            systemStatus: {
                isRunning: true,
                health: 'degraded',
                processes: [
                    {
                        id: 'data-generator',
                        status: 'running',
                        healthScore: 95,
                        restartCount: 0,
                        uptime: 3600000,
                        errorCount: 0,
                    },
                    {
                        id: 'ai-engine',
                        status: 'error',
                        healthScore: 25,
                        restartCount: 5,
                        uptime: 300000,
                        errorCount: 15,
                    },
                ],
                metrics: {
                    totalProcesses: 2,
                    runningProcesses: 1,
                    healthyProcesses: 1,
                    systemUptime: 3600000,
                    memoryUsage: 89,
                    averageHealthScore: 60,
                    totalRestarts: 5,
                },
                startTime: new Date(Date.now() - 3600000),
            },
        },
    },
};

export const SystemStarting: Story = {
    parameters: {
        mockData: {
            systemStatus: {
                isRunning: false,
                health: 'degraded',
                processes: [
                    {
                        id: 'data-generator',
                        status: 'starting',
                        healthScore: 50,
                        restartCount: 0,
                        uptime: 30000,
                        errorCount: 0,
                    },
                    {
                        id: 'ai-engine',
                        status: 'starting',
                        healthScore: 30,
                        restartCount: 0,
                        uptime: 15000,
                        errorCount: 0,
                    },
                ],
                metrics: {
                    totalProcesses: 2,
                    runningProcesses: 0,
                    healthyProcesses: 0,
                    systemUptime: 30000,
                    memoryUsage: 35,
                    averageHealthScore: 40,
                    totalRestarts: 0,
                },
                startTime: new Date(Date.now() - 30000),
            },
        },
    },
}; 