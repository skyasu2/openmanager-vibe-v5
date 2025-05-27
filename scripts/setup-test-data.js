#!/usr/bin/env node

/**
 * 🧪 Test Data Setup Script
 * 
 * 통합 AI 시스템 테스트를 위한 테스트 데이터 생성
 */

const fs = require('fs').promises;
const path = require('path');

// 테스트 서버 데이터 생성
function generateTestServerData() {
  const servers = [
    {
      id: 'web-prod-01',
      hostname: 'web-server-01',
      status: 'online',
      metrics: {
        cpu: 45.2,
        memory: 68.5,
        disk: 32.1,
        network: {
          bytesReceived: 1024000,
          bytesSent: 2048000
        }
      },
      location: 'Seoul, Korea',
      environment: 'production',
      provider: 'aws'
    },
    {
      id: 'api-prod-01',
      hostname: 'api-server-01',
      status: 'warning',
      metrics: {
        cpu: 82.3,
        memory: 89.1,
        disk: 45.7,
        network: {
          bytesReceived: 2048000,
          bytesSent: 4096000
        }
      },
      location: 'Seoul, Korea',
      environment: 'production',
      provider: 'aws'
    },
    {
      id: 'db-prod-01',
      hostname: 'database-01',
      status: 'critical',
      metrics: {
        cpu: 95.8,
        memory: 97.2,
        disk: 88.9,
        network: {
          bytesReceived: 512000,
          bytesSent: 1024000
        }
      },
      location: 'Seoul, Korea',
      environment: 'production',
      provider: 'aws'
    },
    {
      id: 'cache-prod-01',
      hostname: 'redis-cache-01',
      status: 'online',
      metrics: {
        cpu: 25.4,
        memory: 45.8,
        disk: 15.2,
        network: {
          bytesReceived: 8192000,
          bytesSent: 4096000
        }
      },
      location: 'Seoul, Korea',
      environment: 'production',
      provider: 'aws'
    },
    {
      id: 'monitor-01',
      hostname: 'monitoring-server',
      status: 'online',
      metrics: {
        cpu: 35.7,
        memory: 52.3,
        disk: 28.6,
        network: {
          bytesReceived: 1536000,
          bytesSent: 768000
        }
      },
      location: 'Seoul, Korea',
      environment: 'production',
      provider: 'aws'
    }
  ];

  return servers;
}

// 테스트 데이터를 API 엔드포인트에 전송
async function setupTestData() {
  try {
    console.log('🧪 테스트 데이터 설정 시작...');

    const servers = generateTestServerData();
    
    // 각 서버 데이터를 시뮬레이션 API에 전송
    for (const server of servers) {
      try {
        const response = await fetch('http://localhost:3000/api/servers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'register',
            serverData: server
          })
        });

        if (response.ok) {
          console.log(`✅ 서버 데이터 추가 완료: ${server.id}`);
        } else {
          console.warn(`⚠️ 서버 데이터 추가 실패: ${server.id}`);
        }
      } catch (error) {
        console.warn(`⚠️ 서버 데이터 전송 실패 (${server.id}):`, error.message);
      }
    }

    // 테스트 데이터 파일로도 저장
    const testDataPath = path.join(__dirname, '..', 'logs', 'test-server-data.json');
    await fs.writeFile(testDataPath, JSON.stringify(servers, null, 2));
    console.log(`📄 테스트 데이터 파일 저장: ${testDataPath}`);

    console.log('✅ 테스트 데이터 설정 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 데이터 설정 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  setupTestData();
}

module.exports = { setupTestData, generateTestServerData }; 