/**
 * Update Server Services Script
 * 15개 서버에 애플리케이션/서비스 정보 추가
 *
 * 실행: npx tsx scripts/data/update-server-services.ts
 */

import fs from 'fs';
import path from 'path';

// 서버별 서비스 정의
const SERVER_SERVICES: Record<string, {
  services: string[];
  applications: {
    name: string;
    version: string;
    port?: number;
    status: 'running' | 'stopped';
  }[];
}> = {
  'web-prd-01': {
    services: ['nginx', 'node'],
    applications: [
      { name: 'Nginx', version: '1.24.0', port: 80, status: 'running' },
      { name: 'Nginx SSL', version: '1.24.0', port: 443, status: 'running' },
      { name: 'Node.js', version: '20.10.0', port: 3000, status: 'running' },
    ],
  },
  'web-prd-02': {
    services: ['nginx', 'node'],
    applications: [
      { name: 'Nginx', version: '1.24.0', port: 80, status: 'running' },
      { name: 'Nginx SSL', version: '1.24.0', port: 443, status: 'running' },
      { name: 'Node.js', version: '20.10.0', port: 3000, status: 'running' },
    ],
  },
  'web-stg-01': {
    services: ['nginx', 'node'],
    applications: [
      { name: 'Nginx', version: '1.24.0', port: 80, status: 'running' },
      { name: 'Node.js', version: '20.10.0', port: 3000, status: 'running' },
    ],
  },
  'api-prd-01': {
    services: ['node', 'pm2'],
    applications: [
      { name: 'Node.js', version: '20.10.0', port: 4000, status: 'running' },
      { name: 'PM2', version: '5.3.0', status: 'running' },
      { name: 'Express.js', version: '4.18.2', port: 4000, status: 'running' },
    ],
  },
  'api-prd-02': {
    services: ['node', 'pm2'],
    applications: [
      { name: 'Node.js', version: '20.10.0', port: 4000, status: 'running' },
      { name: 'PM2', version: '5.3.0', status: 'running' },
      { name: 'Express.js', version: '4.18.2', port: 4000, status: 'running' },
    ],
  },
  'db-main-01': {
    services: ['postgresql'],
    applications: [
      { name: 'PostgreSQL', version: '15.4', port: 5432, status: 'running' },
      { name: 'pgBouncer', version: '1.21.0', port: 6432, status: 'running' },
    ],
  },
  'db-repl-01': {
    services: ['postgresql'],
    applications: [
      { name: 'PostgreSQL', version: '15.4', port: 5432, status: 'running' },
      { name: 'PostgreSQL Replica', version: '15.4', status: 'running' },
    ],
  },
  'cache-redis-01': {
    services: ['redis'],
    applications: [
      { name: 'Redis', version: '7.2.3', port: 6379, status: 'running' },
      { name: 'Redis Sentinel', version: '7.2.3', port: 26379, status: 'running' },
    ],
  },
  'cache-redis-02': {
    services: ['redis'],
    applications: [
      { name: 'Redis', version: '7.2.3', port: 6379, status: 'running' },
      { name: 'Redis Sentinel', version: '7.2.3', port: 26379, status: 'running' },
    ],
  },
  'storage-nas-01': {
    services: ['nfs', 'samba'],
    applications: [
      { name: 'NFS Server', version: '4.2', port: 2049, status: 'running' },
      { name: 'Samba', version: '4.18.0', port: 445, status: 'running' },
    ],
  },
  'storage-s3-gateway': {
    services: ['minio'],
    applications: [
      { name: 'MinIO', version: '2024.01.01', port: 9000, status: 'running' },
      { name: 'MinIO Console', version: '2024.01.01', port: 9001, status: 'running' },
    ],
  },
  'lb-main-01': {
    services: ['haproxy', 'keepalived'],
    applications: [
      { name: 'HAProxy', version: '2.8.3', port: 80, status: 'running' },
      { name: 'HAProxy SSL', version: '2.8.3', port: 443, status: 'running' },
      { name: 'HAProxy Stats', version: '2.8.3', port: 8404, status: 'running' },
      { name: 'Keepalived', version: '2.2.8', status: 'running' },
    ],
  },
  'monitor-01': {
    services: ['prometheus', 'grafana', 'alertmanager'],
    applications: [
      { name: 'Prometheus', version: '2.48.0', port: 9090, status: 'running' },
      { name: 'Grafana', version: '10.2.0', port: 3000, status: 'running' },
      { name: 'Alertmanager', version: '0.26.0', port: 9093, status: 'running' },
      { name: 'Node Exporter', version: '1.7.0', port: 9100, status: 'running' },
    ],
  },
  'backup-server-01': {
    services: ['rsync', 'cron', 'pg_dump'],
    applications: [
      { name: 'rsync', version: '3.2.7', status: 'running' },
      { name: 'Cron', version: '3.0', status: 'running' },
      { name: 'Borgbackup', version: '1.2.6', status: 'running' },
    ],
  },
  'security-gateway-01': {
    services: ['nginx-waf', 'fail2ban', 'openvpn'],
    applications: [
      { name: 'ModSecurity WAF', version: '3.0.10', port: 80, status: 'running' },
      { name: 'Fail2ban', version: '1.0.2', status: 'running' },
      { name: 'OpenVPN', version: '2.6.0', port: 1194, status: 'running' },
      { name: 'ClamAV', version: '1.2.0', status: 'running' },
    ],
  },
};

// OS 정보 업데이트 (서버별 다양화)
const SERVER_OS: Record<string, string> = {
  'web-prd-01': 'Ubuntu 22.04.3 LTS',
  'web-prd-02': 'Ubuntu 22.04.3 LTS',
  'web-stg-01': 'Ubuntu 22.04.3 LTS',
  'api-prd-01': 'Ubuntu 22.04.3 LTS',
  'api-prd-02': 'Ubuntu 22.04.3 LTS',
  'db-main-01': 'Rocky Linux 9.3',
  'db-repl-01': 'Rocky Linux 9.3',
  'cache-redis-01': 'Debian 12 (Bookworm)',
  'cache-redis-02': 'Debian 12 (Bookworm)',
  'storage-nas-01': 'TrueNAS SCALE 23.10',
  'storage-s3-gateway': 'Ubuntu 22.04.3 LTS',
  'lb-main-01': 'Debian 12 (Bookworm)',
  'monitor-01': 'Ubuntu 22.04.3 LTS',
  'backup-server-01': 'Rocky Linux 9.3',
  'security-gateway-01': 'Debian 12 (Bookworm)',
};

async function updateHourlyData() {
  const dataDir = path.join(process.cwd(), 'cloud-run/ai-engine/data/hourly-data');

  console.log('🚀 Updating server services in hourly-data...\n');

  // 24시간 파일 순회
  for (let hour = 0; hour < 24; hour++) {
    const fileName = `hour-${hour.toString().padStart(2, '0')}.json`;
    const filePath = path.join(dataDir, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${fileName} not found, skipping...`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // 각 dataPoint의 servers 업데이트
    for (const dataPoint of data.dataPoints) {
      for (const serverId of Object.keys(dataPoint.servers)) {
        const server = dataPoint.servers[serverId];
        const serviceInfo = SERVER_SERVICES[serverId];
        const osInfo = SERVER_OS[serverId];

        if (serviceInfo) {
          server.services = serviceInfo.services;
          server.applications = serviceInfo.applications;
        }
        if (osInfo) {
          server.os = osInfo;
        }
      }
    }

    // 파일 저장
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    process.stdout.write(`\r✅ Updated ${fileName}`);
  }

  console.log('\n\n✅ All hourly-data files updated!');
  console.log(`   - Files updated: 24`);
  console.log(`   - Servers configured: ${Object.keys(SERVER_SERVICES).length}`);
}

// 실행
updateHourlyData().catch(console.error);
