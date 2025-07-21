#!/usr/bin/env node

/**
 * 🔍 컨텍스트 구조 분석기
 * 현재 시스템의 컨텍스트 사용량과 최적화 포인트를 분석합니다.
 */

const fs = require('fs');
const path = require('path');

class ContextAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.analysisResults = {
      contextManagers: [],
      memoryLimits: [],
      optimizationPoints: [],
      recommendations: [],
    };
  }

  async analyzeProject() {
    console.log('🔍 OpenManager Vibe v5 컨텍스트 구조 분석 시작...\n');

    // 1. 컨텍스트 관리자들 분석
    await this.analyzeContextManagers();

    // 2. 메모리 제한 설정 분석
    await this.analyzeMemoryLimits();

    // 3. 최적화 포인트 식별
    await this.identifyOptimizationPoints();

    // 4. 개선 권장사항 생성
    await this.generateRecommendations();

    // 5. 결과 출력
    this.printAnalysisResults();
  }

  async analyzeContextManagers() {
    console.log('1️⃣ 컨텍스트 관리자 분석');

    const contextFiles = [
      'src/core/context/context-manager.ts',
      'src/core/ai/ContextManager.ts',
      'src/context/advanced-context-manager.ts',
      'src/context/basic-context-manager.ts',
      'src/modules/ai-agent/learning/ContextUpdateEngine.ts',
    ];

    for (const file of contextFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const analysis = this.analyzeContextFile(content, file);
        this.analysisResults.contextManagers.push(analysis);
        console.log(`   ✅ ${file} 분석 완료`);
      } else {
        console.log(`   ⚠️ ${file} 파일 없음`);
      }
    }

    console.log(
      `   📊 총 ${this.analysisResults.contextManagers.length}개 컨텍스트 관리자 발견\n`
    );
  }

  analyzeContextFile(content, fileName) {
    const analysis = {
      file: fileName,
      className: this.extractClassName(content),
      memoryLimits: this.extractMemoryLimits(content),
      cacheStrategies: this.extractCacheStrategies(content),
      cleanupMethods: this.extractCleanupMethods(content),
      optimizationLevel: 'medium',
    };

    // 최적화 수준 평가
    if (
      analysis.cleanupMethods.length > 0 &&
      analysis.memoryLimits.length > 0
    ) {
      analysis.optimizationLevel = 'high';
    } else if (
      analysis.memoryLimits.length > 0 ||
      analysis.cacheStrategies.length > 0
    ) {
      analysis.optimizationLevel = 'medium';
    } else {
      analysis.optimizationLevel = 'low';
    }

    return analysis;
  }

  extractClassName(content) {
    const match = content.match(/export class (\w+)/);
    return match ? match[1] : 'Unknown';
  }

  extractMemoryLimits(content) {
    const limits = [];

    // 숫자 제한 패턴 찾기
    const patterns = [
      /maxPatterns\s*=\s*(\d+)/g,
      /MAX_.*?=\s*(\d+)/g,
      /length\s*>\s*(\d+)/g,
      /slice\(-(\d+)\)/g,
      /\.shift\(\)/g,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        limits.push({
          type: 'numeric_limit',
          value: match[1] || 'dynamic',
          context: match[0],
        });
      }
    });

    return limits;
  }

  extractCacheStrategies(content) {
    const strategies = [];

    if (content.includes('Map') || content.includes('cache')) {
      strategies.push('in_memory_cache');
    }
    if (content.includes('Redis') || content.includes('redis')) {
      strategies.push('redis_cache');
    }
    if (content.includes('TTL') || content.includes('expire')) {
      strategies.push('ttl_expiration');
    }
    if (content.includes('LRU') || content.includes('least_recently')) {
      strategies.push('lru_eviction');
    }

    return strategies;
  }

  extractCleanupMethods(content) {
    const methods = [];

    if (content.includes('cleanup') || content.includes('clean')) {
      methods.push('manual_cleanup');
    }
    if (content.includes('gc.collect') || content.includes('garbage')) {
      methods.push('garbage_collection');
    }
    if (content.includes('delete') || content.includes('remove')) {
      methods.push('explicit_deletion');
    }
    if (content.includes('shift()') || content.includes('slice(')) {
      methods.push('array_trimming');
    }

    return methods;
  }

  async analyzeMemoryLimits() {
    console.log('2️⃣ 메모리 제한 설정 분석');

    const configFiles = [
      'src/config/constants.ts',
      'src/services/data-generator/managers/EnvironmentConfigManager.ts',
      'src/utils/MemoryOptimizer.ts',
    ];

    for (const file of configFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const limits = this.extractMemoryConfiguration(content, file);
        this.analysisResults.memoryLimits.push(...limits);
        console.log(`   ✅ ${file} 분석 완료`);
      }
    }

    console.log(
      `   📊 총 ${this.analysisResults.memoryLimits.length}개 메모리 제한 설정 발견\n`
    );
  }

  extractMemoryConfiguration(content, fileName) {
    const configs = [];

    // 메모리 관련 설정 패턴
    const memoryPatterns = [
      /MAX_.*?:\s*(\d+)/g,
      /maxCacheSize:\s*(\d+)/g,
      /batchSize:\s*(\d+)/g,
      /poolSize\s*=\s*(\d+)/g,
    ];

    memoryPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        configs.push({
          file: fileName,
          setting: match[0],
          value: parseInt(match[1]),
          type: 'memory_limit',
        });
      }
    });

    return configs;
  }

  async identifyOptimizationPoints() {
    console.log('3️⃣ 최적화 포인트 식별');

    // 컨텍스트 관리자별 최적화 포인트
    this.analysisResults.contextManagers.forEach(manager => {
      if (manager.optimizationLevel === 'low') {
        this.analysisResults.optimizationPoints.push({
          type: 'low_optimization',
          target: manager.className,
          file: manager.file,
          issue: '메모리 제한 및 정리 메서드 부족',
          priority: 'high',
        });
      }

      if (manager.cacheStrategies.length === 0) {
        this.analysisResults.optimizationPoints.push({
          type: 'no_caching',
          target: manager.className,
          file: manager.file,
          issue: '캐싱 전략 없음',
          priority: 'medium',
        });
      }
    });

    // 메모리 제한 분석
    const highMemoryLimits = this.analysisResults.memoryLimits.filter(
      limit => limit.value > 100 * 1024 * 1024 // 100MB 이상
    );

    if (highMemoryLimits.length > 0) {
      this.analysisResults.optimizationPoints.push({
        type: 'high_memory_usage',
        target: 'memory_limits',
        issue: `${highMemoryLimits.length}개 설정이 100MB 이상 메모리 사용`,
        priority: 'medium',
      });
    }

    console.log(
      `   🎯 ${this.analysisResults.optimizationPoints.length}개 최적화 포인트 식별\n`
    );
  }

  async generateRecommendations() {
    console.log('4️⃣ 개선 권장사항 생성');

    // AI 제안사항 기반 권장사항
    this.analysisResults.recommendations = [
      {
        category: '캐싱 최적화',
        priority: 'high',
        description: 'Redis 캐싱을 모든 컨텍스트 관리자에 적용',
        implementation:
          'DevKeyManager의 Redis 설정을 활용하여 통합 캐싱 레이어 구축',
        estimatedImpact: '응답 속도 30-50% 향상',
      },
      {
        category: '메모리 관리',
        priority: 'high',
        description: '컨텍스트 크기 제한을 시연용으로 최적화',
        implementation:
          '패턴 저장소 20개 → 10개, 결과 저장소 50개 → 25개로 축소',
        estimatedImpact: '메모리 사용량 40% 감소',
      },
      {
        category: '비동기 처리',
        priority: 'medium',
        description: '컨텍스트 업데이트를 비동기로 처리',
        implementation: 'async/await 패턴을 모든 컨텍스트 저장 작업에 적용',
        estimatedImpact: 'UI 응답성 향상',
      },
      {
        category: '배치 처리',
        priority: 'medium',
        description: '컨텍스트 정리 작업을 배치로 처리',
        implementation: '1시간마다 일괄 정리 → 30분마다 소량 정리로 변경',
        estimatedImpact: '시스템 안정성 향상',
      },
      {
        category: '모니터링',
        priority: 'low',
        description: '컨텍스트 사용량 실시간 모니터링',
        implementation: '/dev-tools 페이지에 컨텍스트 메트릭 대시보드 추가',
        estimatedImpact: '디버깅 효율성 향상',
      },
    ];

    console.log(
      `   💡 ${this.analysisResults.recommendations.length}개 권장사항 생성\n`
    );
  }

  printAnalysisResults() {
    console.log('📊 컨텍스트 구조 분석 결과');
    console.log('='.repeat(60));

    // 요약 정보
    console.log('\n📈 요약 정보:');
    console.log(
      `   • 컨텍스트 관리자: ${this.analysisResults.contextManagers.length}개`
    );
    console.log(
      `   • 메모리 제한 설정: ${this.analysisResults.memoryLimits.length}개`
    );
    console.log(
      `   • 최적화 포인트: ${this.analysisResults.optimizationPoints.length}개`
    );
    console.log(
      `   • 개선 권장사항: ${this.analysisResults.recommendations.length}개`
    );

    // 컨텍스트 관리자별 상태
    console.log('\n🔧 컨텍스트 관리자 상태:');
    this.analysisResults.contextManagers.forEach(manager => {
      const statusIcon =
        manager.optimizationLevel === 'high'
          ? '✅'
          : manager.optimizationLevel === 'medium'
            ? '⚠️'
            : '❌';
      console.log(
        `   ${statusIcon} ${manager.className} (${manager.optimizationLevel})`
      );
      console.log(`      📁 ${manager.file}`);
      console.log(`      🔒 메모리 제한: ${manager.memoryLimits.length}개`);
      console.log(
        `      💾 캐시 전략: ${manager.cacheStrategies.join(', ') || '없음'}`
      );
      console.log(
        `      🧹 정리 메서드: ${manager.cleanupMethods.join(', ') || '없음'}`
      );
    });

    // 우선순위별 권장사항
    console.log('\n💡 우선순위별 권장사항:');
    ['high', 'medium', 'low'].forEach(priority => {
      const recommendations = this.analysisResults.recommendations.filter(
        r => r.priority === priority
      );
      if (recommendations.length > 0) {
        const priorityIcon =
          priority === 'high' ? '🔥' : priority === 'medium' ? '⚠️' : 'ℹ️';
        console.log(`\n   ${priorityIcon} ${priority.toUpperCase()} 우선순위:`);
        recommendations.forEach(rec => {
          console.log(`      • ${rec.category}: ${rec.description}`);
          console.log(`        구현: ${rec.implementation}`);
          console.log(`        효과: ${rec.estimatedImpact}`);
        });
      }
    });

    // 즉시 적용 가능한 최적화
    console.log('\n🚀 즉시 적용 가능한 최적화:');
    console.log('   1. 패턴 저장소 크기 축소 (20개 → 10개)');
    console.log('   2. 결과 저장소 크기 축소 (50개 → 25개)');
    console.log('   3. 컨텍스트 정리 주기 단축 (1시간 → 30분)');
    console.log('   4. 단기 메모리 TTL 단축 (1시간 → 30분)');

    console.log(
      '\n🎯 분석 완료! 위 권장사항을 단계별로 적용하여 시스템을 최적화하세요.'
    );
  }
}

// 실행
if (require.main === module) {
  const analyzer = new ContextAnalyzer();
  analyzer.analyzeProject().catch(error => {
    console.error('❌ 분석 오류:', error.message);
    process.exit(1);
  });
}

module.exports = ContextAnalyzer;
