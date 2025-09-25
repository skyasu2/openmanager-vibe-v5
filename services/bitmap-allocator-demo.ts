#!/usr/bin/env ts-node

/**
 * 🚀 O(1) Bitmap 포트 할당자 데모
 *
 * 성능 테스트 및 사용 예시
 */

import { BitmapPortAllocator, PortAllocatorFactory } from './BitmapPortAllocator';

async function main() {
  console.log('🚀 O(1) Bitmap 포트 할당자 데모\n');

  // 개발용 포트 할당자 (3000-4000 범위)
  const devAllocator = new BitmapPortAllocator({
    startPort: 3000,
    endPort: 4000,
    reservedPorts: [3000, 3001] // 예약된 포트
  });

  console.log('📊 초기 상태:');
  console.log(devAllocator.getStats());
  console.log();

  // 포트 할당 테스트
  console.log('⚡ 포트 할당 테스트:');
  const allocatedPorts: number[] = [];

  for (let i = 0; i < 10; i++) {
    const port = devAllocator.allocatePort();
    if (port !== -1) {
      allocatedPorts.push(port);
      console.log(`✅ 포트 ${port} 할당됨`);
    } else {
      console.log('❌ 포트 할당 실패');
    }
  }
  console.log();

  // 통계 확인
  console.log('📈 할당 후 통계:');
  console.log(devAllocator.getStats());
  console.log();

  // 포트 상태 확인
  console.log('🔍 포트 상태 확인:');
  const testPorts = [3000, 3002, 3005, 3010];
  testPorts.forEach(port => {
    const allocated = devAllocator.isPortAllocated(port);
    console.log(`포트 ${port}: ${allocated ? '사용됨' : '사용 가능'}`);
  });
  console.log();

  // 포트 해제 테스트
  console.log('🔓 포트 해제 테스트:');
  const portToRelease = allocatedPorts[0];
  if (portToRelease) {
    const success = devAllocator.deallocatePort(portToRelease);
    console.log(`포트 ${portToRelease} 해제: ${success ? '성공' : '실패'}`);
    console.log(`해제 후 상태: ${devAllocator.isPortAllocated(portToRelease) ? '사용됨' : '사용 가능'}`);
  }
  console.log();

  // 성능 테스트
  console.log('🏎️  성능 테스트 (1000회 할당/해제):');
  const perfAllocator = new BitmapPortAllocator({
    startPort: 10000,
    endPort: 60000
  });

  const startTime = performance.now();

  // 1000회 할당
  const perfPorts: number[] = [];
  for (let i = 0; i < 1000; i++) {
    const port = perfAllocator.allocatePort();
    if (port !== -1) {
      perfPorts.push(port);
    }
  }

  // 1000회 해제
  perfPorts.forEach(port => {
    perfAllocator.deallocatePort(port);
  });

  const endTime = performance.now();
  console.log(`⏱️  1000회 할당+해제 소요 시간: ${(endTime - startTime).toFixed(3)}ms`);
  console.log(`⚡ 평균 O(1) 연산 시간: ${((endTime - startTime) / 2000).toFixed(6)}ms`);
  console.log();

  // 팩토리 패턴 데모
  console.log('🏭 팩토리 패턴 데모:');
  const webServerAllocator = PortAllocatorFactory.getInstance('web-server', {
    startPort: 8000,
    endPort: 8999
  });

  const apiServerAllocator = PortAllocatorFactory.getInstance('api-server', {
    startPort: 9000,
    endPort: 9999
  });

  const webPort = webServerAllocator.allocatePort();
  const apiPort = apiServerAllocator.allocatePort();

  console.log(`🌐 웹 서버 포트: ${webPort}`);
  console.log(`🔌 API 서버 포트: ${apiPort}`);
  console.log(`📋 등록된 할당자들: ${PortAllocatorFactory.getInstanceNames().join(', ')}`);
  console.log();

  // 메모리 사용량 확인
  console.log('💾 메모리 사용량:');
  console.log(`Bitmap 크기: 8KB (${devAllocator.getStats().memoryUsage} bytes)`);
  console.log(`포트 범위: ${devAllocator.getStats().portRange.start}-${devAllocator.getStats().portRange.end}`);
  console.log(`할당률: ${devAllocator.getStats().allocationRatio.toFixed(2)}%`);

  console.log('\n✅ 데모 완료!');
}

if (require.main === module) {
  main().catch(console.error);
}

export { main as runBitmapAllocatorDemo };