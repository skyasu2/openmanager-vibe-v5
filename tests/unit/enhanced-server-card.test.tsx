import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EnhancedServerCard from '@/components/dashboard/EnhancedServerCard';
import { vi } from 'vitest';

// 💡 스냅샷 테스트용 목업 서버 데이터
const mockServer = {
  id: 'api-eu-045',
  hostname: 'api-eu-045.internal',
  name: 'api-eu-045',
  type: 'api',
  environment: 'production',
  location: 'EU West',
  provider: 'AWS',
  status: 'warning' as const,
  cpu: 67,
  memory: 72,
  disk: 54,
  network: 45,
  uptime: '8일 12시간',
  lastUpdate: new Date(),
  alerts: 2,
  services: [
    { name: 'nodejs', status: 'running' as const, port: 3000 },
    { name: 'nginx', status: 'running' as const, port: 80 },
  ],
  specs: {
    cpu_cores: 4,
    memory_gb: 16,
    disk_gb: 100,
  },
  os: 'Ubuntu 22.04',
  ip: '10.0.0.12',
  networkStatus: 'good' as const,
};

describe('EnhancedServerCard', () => {
  it('renders correctly and matches snapshot', () => {
    // 🔒 Math.random 및 Date.now 고정으로 스냅샷 결정론적 생성
    const originalRandom = Math.random;
    const originalNow = Date.now;
    Math.random = () => 0.42; // 고정된 임의 값
    Date.now = () => 1718800000000; // 2025-06-20T00:00:00.000Z

    const { container } = render(
      <EnhancedServerCard server={mockServer as any} index={0} />
    );

    expect(container).toMatchSnapshot();

    // 복원
    Math.random = originalRandom;
    Date.now = originalNow;

    // 모듈 캐시 초기화로 이후 테스트 영향 제거
    vi.resetModules();
  });
});
