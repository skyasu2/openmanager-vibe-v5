import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EnhancedServerModal from '@/components/dashboard/EnhancedServerModal';

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

describe('EnhancedServerModal', () => {
  it('renders correctly and matches snapshot', () => {
    const { container } = render(
      <EnhancedServerModal server={mockServer} onClose={() => {}} />
    );

    expect(container).toMatchSnapshot();
  });
});
