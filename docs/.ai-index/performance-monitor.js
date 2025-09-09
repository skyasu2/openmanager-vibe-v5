#!/usr/bin/env node

/**
 * AI Document Cache Performance Monitor
 * 캐시 성능 및 효율성 실시간 모니터링
 */

const fs = require('fs').promises;
const path = require('path');

class CachePerformanceMonitor {
  constructor() {
    this.indexPath = path.join(__dirname);
    this.metricsPath = path.join(this.indexPath, 'performance-metrics.json');
    this.metrics = {
      cache_hits: 0,
      cache_misses: 0,
      total_requests: 0,
      average_load_time: 0,
      memory_usage: 0,
      token_efficiency: 0,
      last_updated: new Date().toISOString()
    };
  }

  async loadMetrics() {
    try {
      const data = await fs.readFile(this.metricsPath, 'utf8');
      this.metrics = JSON.parse(data);
    } catch (error) {
      console.log('📊 새로운 메트릭 파일 생성...');
      await this.saveMetrics();
    }
  }

  async saveMetrics() {
    await fs.writeFile(this.metricsPath, JSON.stringify(this.metrics, null, 2));
  }

  recordCacheHit(loadTime, tokens) {
    this.metrics.cache_hits++;
    this.metrics.total_requests++;
    this.updateAverageLoadTime(loadTime);
    this.updateTokenEfficiency(tokens);
    this.metrics.last_updated = new Date().toISOString();
  }

  recordCacheMiss(loadTime, tokens) {
    this.metrics.cache_misses++;
    this.metrics.total_requests++;
    this.updateAverageLoadTime(loadTime);
    this.updateTokenEfficiency(tokens);
    this.metrics.last_updated = new Date().toISOString();
  }

  updateAverageLoadTime(newTime) {
    const totalTime = this.metrics.average_load_time * (this.metrics.total_requests - 1);
    this.metrics.average_load_time = (totalTime + newTime) / this.metrics.total_requests;
  }

  updateTokenEfficiency(tokens) {
    // 토큰 효율성 = 캐시된 토큰 / 전체 토큰 * 100
    const cachedRatio = this.metrics.cache_hits / this.metrics.total_requests;
    this.metrics.token_efficiency = cachedRatio * 100;
  }

  getCacheHitRatio() {
    if (this.metrics.total_requests === 0) return 0;
    return (this.metrics.cache_hits / this.metrics.total_requests) * 100;
  }

  async generateReport() {
    await this.loadMetrics();
    
    const cacheHitRatio = this.getCacheHitRatio();
    const report = {
      timestamp: new Date().toISOString(),
      performance: {
        cache_hit_ratio: `${cacheHitRatio.toFixed(2)}%`,
        target: "95%",
        status: cacheHitRatio >= 95 ? "✅ 목표달성" : "⚠️ 최적화필요"
      },
      load_time: {
        average: `${this.metrics.average_load_time.toFixed(2)}s`,
        target: "< 1s",
        status: this.metrics.average_load_time < 1 ? "✅ 목표달성" : "⚠️ 최적화필요"
      },
      token_efficiency: {
        current: `${this.metrics.token_efficiency.toFixed(2)}%`,
        target: "> 90%",
        status: this.metrics.token_efficiency > 90 ? "✅ 목표달성" : "⚠️ 최적화필요"
      },
      requests: {
        total: this.metrics.total_requests,
        hits: this.metrics.cache_hits,
        misses: this.metrics.cache_misses
      },
      recommendations: this.generateRecommendations(cacheHitRatio)
    };

    console.log('📊 AI 캐시 성능 리포트');
    console.log('====================');
    console.log(`🎯 캐시 히트율: ${report.performance.cache_hit_ratio} ${report.performance.status}`);
    console.log(`⚡ 평균 로딩: ${report.load_time.average} ${report.load_time.status}`);
    console.log(`🧠 토큰 효율성: ${report.token_efficiency.current} ${report.token_efficiency.status}`);
    console.log(`📈 총 요청: ${report.requests.total} (히트: ${report.requests.hits}, 미스: ${report.requests.misses})`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 최적화 제안:');
      report.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }

    await fs.writeFile(
      path.join(this.indexPath, 'performance-report.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  generateRecommendations(cacheHitRatio) {
    const recommendations = [];

    if (cacheHitRatio < 90) {
      recommendations.push("preload 목록에 자주 사용하는 문서 추가");
      recommendations.push("L1 캐시 크기 증가 검토");
    }

    if (this.metrics.average_load_time > 2) {
      recommendations.push("문서 분할로 토큰 사이즈 최적화");
      recommendations.push("캐시 계층 재조정 필요");
    }

    if (this.metrics.token_efficiency < 80) {
      recommendations.push("중복 로딩 패턴 분석 및 개선");
      recommendations.push("문서 의존성 그래프 최적화");
    }

    return recommendations;
  }

  async validateCacheConsistency() {
    const cacheFiles = [
      'keywords.json',
      'categories.json', 
      'workflows.json',
      'priorities.json'
    ];

    const results = [];
    
    for (const file of cacheFiles) {
      try {
        const content = await fs.readFile(path.join(this.indexPath, file), 'utf8');
        const data = JSON.parse(content);
        
        results.push({
          file,
          status: '✅ 정상',
          last_updated: data.last_updated,
          size: Buffer.byteLength(content, 'utf8')
        });
      } catch (error) {
        results.push({
          file,
          status: '❌ 오류',
          error: error.message
        });
      }
    }

    console.log('\n🔍 캐시 일관성 검증');
    console.log('==================');
    results.forEach(result => {
      console.log(`${result.file}: ${result.status}`);
      if (result.last_updated) {
        console.log(`  최종 업데이트: ${result.last_updated}`);
        console.log(`  파일 크기: ${result.size} bytes`);
      }
      if (result.error) {
        console.log(`  오류: ${result.error}`);
      }
    });

    return results;
  }
}

// CLI 실행
if (require.main === module) {
  const monitor = new CachePerformanceMonitor();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'report':
      monitor.generateReport();
      break;
    case 'validate':
      monitor.validateCacheConsistency();
      break;
    case 'hit':
      const loadTime = parseFloat(process.argv[3]) || 1.0;
      const tokens = parseInt(process.argv[4]) || 500;
      monitor.loadMetrics().then(() => {
        monitor.recordCacheHit(loadTime, tokens);
        return monitor.saveMetrics();
      }).then(() => {
        console.log(`✅ 캐시 히트 기록: ${loadTime}s, ${tokens} tokens`);
      });
      break;
    case 'miss':
      const missLoadTime = parseFloat(process.argv[3]) || 2.0;
      const missTokens = parseInt(process.argv[4]) || 500;
      monitor.loadMetrics().then(() => {
        monitor.recordCacheMiss(missLoadTime, missTokens);
        return monitor.saveMetrics();
      }).then(() => {
        console.log(`⚠️ 캐시 미스 기록: ${missLoadTime}s, ${missTokens} tokens`);
      });
      break;
    default:
      console.log('사용법:');
      console.log('  node performance-monitor.js report     # 성능 리포트 생성');
      console.log('  node performance-monitor.js validate   # 캐시 일관성 검증');
      console.log('  node performance-monitor.js hit 1.2 450 # 캐시 히트 기록');
      console.log('  node performance-monitor.js miss 2.5 600 # 캐시 미스 기록');
  }
}

module.exports = CachePerformanceMonitor;