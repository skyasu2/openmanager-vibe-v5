import type { Meta, StoryObj } from '@storybook/nextjs';
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const PerformanceMetrics = ({ serverCount = 15 }: { serverCount?: number }) => {
  const [servers, setServers] = useState<any[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // 초기 서버 데이터 생성
    const initialServers = Array.from({ length: serverCount }, (_, i) => ({
      id: `server-${i + 1}`,
      name: `Server ${i + 1}`,
      cpu: Math.floor(Math.random() * 80) + 10,
      memory: Math.floor(Math.random() * 90) + 5,
      disk: Math.floor(Math.random() * 85) + 10,
      network: Math.floor(Math.random() * 1000) + 100,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      health: 'healthy',
    }));

    // 헬스 상태 계산
    initialServers.forEach(server => {
      const avgUsage = (server.cpu + server.memory + server.disk) / 3;
      if (avgUsage > 80) server.health = 'critical';
      else if (avgUsage > 60) server.health = 'warning';
      else server.health = 'healthy';
    });

    setServers(initialServers);
  }, [serverCount]);

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setServers(prevServers =>
        prevServers
          .map(server => ({
            ...server,
            cpu: Math.max(
              0,
              Math.min(100, server.cpu + (Math.random() - 0.5) * 10)
            ),
            memory: Math.max(
              0,
              Math.min(100, server.memory + (Math.random() - 0.5) * 8)
            ),
            disk: Math.max(
              0,
              Math.min(100, server.disk + (Math.random() - 0.5) * 3)
            ),
            network: Math.max(0, server.network + (Math.random() - 0.5) * 200),
          }))
          .map(server => {
            const avgUsage = (server.cpu + server.memory + server.disk) / 3;
            return {
              ...server,
              health:
                avgUsage > 80
                  ? 'critical'
                  : avgUsage > 60
                    ? 'warning'
                    : 'healthy',
            };
          })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const healthStats = servers.reduce(
    (acc, server) => {
      acc[server.health] = (acc[server.health] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const averages = servers.reduce(
    (acc, server) => {
      acc.cpu += server.cpu;
      acc.memory += server.memory;
      acc.disk += server.disk;
      acc.network += server.network;
      return acc;
    },
    { cpu: 0, memory: 0, disk: 0, network: 0 }
  );

  Object.keys(averages).forEach(key => {
    averages[key] = Math.round(averages[key] / servers.length);
  });

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (value: number) => {
    if (value > 80) return 'bg-red-500';
    if (value > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className='w-full max-w-7xl mx-auto p-6 space-y-6'>
      <div className='text-center space-y-4'>
        <h1 className='text-3xl font-bold'>실시간 성능 모니터링</h1>
        <p className='text-gray-600'>
          {serverCount}개 서버의 실시간 성능 메트릭을 모니터링합니다
        </p>

        <div className='flex justify-center gap-4'>
          <Button
            onClick={() => setIsMonitoring(!isMonitoring)}
            variant={isMonitoring ? 'destructive' : 'default'}
          >
            {isMonitoring ? '모니터링 중지' : '모니터링 시작'}
          </Button>
        </div>
      </div>

      {/* 전체 요약 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg'>전체 서버</CardTitle>
            <CardDescription>{servers.length}개</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {servers.filter(s => s.status === 'active').length}
            </div>
            <div className='text-sm text-gray-600'>활성 서버</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg'>평균 CPU</CardTitle>
            <CardDescription>전체 서버 평균</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{averages.cpu}%</div>
            <Progress value={averages.cpu} className='mt-2' />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg'>평균 메모리</CardTitle>
            <CardDescription>전체 서버 평균</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{averages.memory}%</div>
            <Progress value={averages.memory} className='mt-2' />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg'>헬스 상태</CardTitle>
            <CardDescription>서버 건강도</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            {Object.entries(healthStats).map(([health, count]) => (
              <div key={health} className='flex justify-between items-center'>
                <Badge className={getHealthColor(health)} variant='secondary'>
                  {health}
                </Badge>
                <span className='font-bold'>{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 서버 목록 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {servers.map(server => (
          <Card key={server.id} className='hover:shadow-lg transition-shadow'>
            <CardHeader className='pb-2'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm'>{server.name}</CardTitle>
                <Badge
                  className={getHealthColor(server.health)}
                  variant='secondary'
                >
                  {server.health}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='space-y-2'>
                <div className='flex justify-between text-xs'>
                  <span>CPU</span>
                  <span>{Math.round(server.cpu)}%</span>
                </div>
                <Progress value={server.cpu} className='h-2' />
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between text-xs'>
                  <span>메모리</span>
                  <span>{Math.round(server.memory)}%</span>
                </div>
                <Progress value={server.memory} className='h-2' />
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between text-xs'>
                  <span>디스크</span>
                  <span>{Math.round(server.disk)}%</span>
                </div>
                <Progress value={server.disk} className='h-2' />
              </div>

              <div className='text-xs text-gray-600'>
                네트워크: {Math.round(server.network)} Mbps
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const meta: Meta<typeof PerformanceMetrics> = {
  title: 'System/Performance Metrics',
  component: PerformanceMetrics,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    serverCount: {
      control: 'number',
      description: '모니터링할 서버 개수',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    serverCount: 15,
  },
};

export const SmallScale: Story = {
  args: {
    serverCount: 8,
  },
};

export const LargeScale: Story = {
  args: {
    serverCount: 30,
  },
};
