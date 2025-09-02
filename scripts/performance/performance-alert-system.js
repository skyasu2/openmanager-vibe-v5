#!/usr/bin/env node

/**
 * 🚨 성능 알림 시스템 - Phase 2 완성
 * 
 * Core Web Vitals & Box-Muller 캐시 성능 임계값 모니터링
 * GitHub Actions, Slack, Discord 통합 알림
 */

const fs = require('fs');
const path = require('path');

// 🎯 성능 임계값 설정 (Core Web Vitals 기준 - 현실적 조정)
const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals 임계값 (lighthouserc.js와 동기화)
  performanceScore: { min: 50, name: 'Performance Score', unit: '%' }, // CI 환경 고려하여 50%로 조정
  largestContentfulPaint: { max: 2500, name: 'Largest Contentful Paint', unit: 'ms' },
  firstInputDelay: { max: 100, name: 'First Input Delay', unit: 'ms' },
  cumulativeLayoutShift: { max: 0.1, name: 'Cumulative Layout Shift', unit: '' },
  firstContentfulPaint: { max: 1800, name: 'First Contentful Paint', unit: 'ms' },
  timeToFirstByte: { max: 800, name: 'Time to First Byte', unit: 'ms' },
  
  // Box-Muller 캐시 성능 임계값
  boxMullerHitRate: { min: 95, name: 'Box-Muller Cache Hit Rate', unit: '%' },
  boxMullerMemoryUsage: { max: 1024, name: 'Box-Muller Memory Usage', unit: 'KB' },
  
  // API 응답 시간 임계값
  apiResponseTime: { max: 500, name: 'API Response Time', unit: 'ms' },
  
  // 번들 크기 임계값
  totalBundleSize: { max: 1024 * 1024, name: 'Total Bundle Size', unit: 'bytes' }
};

// 🚨 알림 심각도 레벨
const SEVERITY_LEVELS = {
  INFO: { emoji: 'ℹ️', color: '#0066CC', priority: 1 },
  WARNING: { emoji: '⚠️', color: '#FF9900', priority: 2 },
  CRITICAL: { emoji: '🚨', color: '#CC0000', priority: 3 },
  SUCCESS: { emoji: '✅', color: '#00CC00', priority: 0 }
};

class PerformanceAlertSystem {
  constructor() {
    this.alerts = [];
    this.context = process.env.GITHUB_ACTIONS ? 'github-actions' : 'local';
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  }

  // 📊 Lighthouse 결과 분석
  async analyzeLighthouseResults(resultsPath = '.lighthouseci') {
    console.log('🔍 Lighthouse 결과 분석 시작...');
    
    if (!fs.existsSync(resultsPath)) {
      this.addAlert('CRITICAL', 'Lighthouse 결과 폴더를 찾을 수 없습니다', { path: resultsPath });
      return null;
    }

    const resultFiles = fs.readdirSync(resultsPath).filter(file => file.startsWith('lhr-') && file.endsWith('.json'));
    
    if (resultFiles.length === 0) {
      this.addAlert('CRITICAL', 'Lighthouse 결과 파일을 찾을 수 없습니다', { path: resultsPath });
      return null;
    }

    console.log(`📈 ${resultFiles.length}개의 Lighthouse 결과 분석 중...`);
    
    const allResults = [];
    
    for (const file of resultFiles) {
      try {
        const filePath = path.join(resultsPath, file);
        const result = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        allResults.push(result);
      } catch (error) {
        console.error(`❌ 파일 읽기 오류: ${file}`, error);
        this.addAlert('WARNING', `Lighthouse 결과 파일 파싱 실패: ${file}`, { error: error.message });
      }
    }

    if (allResults.length === 0) {
      this.addAlert('CRITICAL', '유효한 Lighthouse 결과가 없습니다');
      return null;
    }

    // 📊 평균 메트릭 계산
    const metrics = this.calculateAverageMetrics(allResults);
    
    // 🚨 임계값 체크
    this.checkPerformanceThresholds(metrics);
    
    return metrics;
  }

  // 📊 평균 메트릭 계산
  calculateAverageMetrics(results) {
    const metrics = {
      performanceScore: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      firstContentfulPaint: 0,
      timeToFirstByte: 0,
      totalBundleSize: 0
    };

    const count = results.length;
    
    results.forEach(result => {
      const categories = result.categories;
      const audits = result.audits;
      
      metrics.performanceScore += (categories?.performance?.score || 0) * 100;
      metrics.largestContentfulPaint += audits?.['largest-contentful-paint']?.numericValue || 0;
      metrics.firstInputDelay += audits?.['max-potential-fid']?.numericValue || 0; // FID 대용
      metrics.cumulativeLayoutShift += audits?.['cumulative-layout-shift']?.numericValue || 0;
      metrics.firstContentfulPaint += audits?.['first-contentful-paint']?.numericValue || 0;
      metrics.timeToFirstByte += audits?.['server-response-time']?.numericValue || 0;
      
      // 번들 크기 계산 (Resource Summary에서)
      const resourceSummary = audits?.['resource-summary'];
      if (resourceSummary?.details?.items) {
        const totalBytes = resourceSummary.details.items.reduce((sum, item) => sum + (item.size || 0), 0);
        metrics.totalBundleSize += totalBytes;
      }
    });

    // 평균 계산
    Object.keys(metrics).forEach(key => {
      metrics[key] = Math.round(metrics[key] / count * 100) / 100;
    });

    console.log('📊 계산된 평균 메트릭:', JSON.stringify(metrics, null, 2));
    return metrics;
  }

  // 🚨 성능 임계값 체크
  checkPerformanceThresholds(metrics) {
    console.log('🔍 성능 임계값 체크 시작...');
    
    let criticalIssues = 0;
    let warningIssues = 0;
    
    Object.entries(PERFORMANCE_THRESHOLDS).forEach(([key, threshold]) => {
      const value = metrics[key];
      if (value === undefined) return;
      
      let violation = null;
      
      if (threshold.min !== undefined && value < threshold.min) {
        violation = {
          type: 'below_minimum',
          expected: `>= ${threshold.min}${threshold.unit}`,
          actual: `${value}${threshold.unit}`
        };
      }
      
      if (threshold.max !== undefined && value > threshold.max) {
        violation = {
          type: 'above_maximum', 
          expected: `<= ${threshold.max}${threshold.unit}`,
          actual: `${value}${threshold.unit}`
        };
      }
      
      if (violation) {
        const severity = this.getSeverityLevel(key, value, threshold);
        
        this.addAlert(severity, `${threshold.name} 임계값 초과`, {
          metric: threshold.name,
          expected: violation.expected,
          actual: violation.actual,
          violationType: violation.type
        });
        
        if (severity === 'CRITICAL') criticalIssues++;
        if (severity === 'WARNING') warningIssues++;
        
        console.log(`${SEVERITY_LEVELS[severity].emoji} ${threshold.name}: ${violation.actual} (예상: ${violation.expected})`);
      } else {
        console.log(`✅ ${threshold.name}: ${value}${threshold.unit} (정상)`);
      }
    });
    
    // 전체 결과 요약
    if (criticalIssues === 0 && warningIssues === 0) {
      this.addAlert('SUCCESS', '모든 성능 메트릭이 목표치를 달성했습니다! 🎉', {
        totalMetrics: Object.keys(PERFORMANCE_THRESHOLDS).length,
        passedMetrics: Object.keys(PERFORMANCE_THRESHOLDS).length
      });
    } else {
      this.addAlert('INFO', `성능 분석 완료: ${criticalIssues}개 심각, ${warningIssues}개 경고`, {
        criticalIssues,
        warningIssues,
        totalMetrics: Object.keys(PERFORMANCE_THRESHOLDS).length
      });
    }
    
    return { criticalIssues, warningIssues };
  }

  // Box-Muller 캐시 성능 체크 (API에서 가져오기)
  async checkBoxMullerPerformance() {
    console.log('🧮 Box-Muller 캐시 성능 체크...');
    
    try {
      // 로컬 개발 서버나 배포된 URL에서 Box-Muller 캐시 성능 가져오기
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/servers/all`);
      
      if (!response.ok) {
        this.addAlert('WARNING', 'Box-Muller API 응답 실패', { 
          status: response.status,
          url: `${baseUrl}/api/servers/all`
        });
        return null;
      }
      
      const data = await response.json();
      const cacheStats = data.metadata?.boxMullerCache;
      
      if (!cacheStats) {
        this.addAlert('WARNING', 'Box-Muller 캐시 통계를 찾을 수 없습니다', { 
          hasMetadata: !!data.metadata
        });
        return null;
      }
      
      // Box-Muller 캐시 임계값 체크
      const hitRate = cacheStats.hitRate;
      const memoryUsageKB = parseFloat(cacheStats.memoryUsage.replace(/[^0-9.]/g, ''));
      
      if (hitRate < PERFORMANCE_THRESHOLDS.boxMullerHitRate.min) {
        this.addAlert('CRITICAL', `Box-Muller 캐시 히트율이 낮습니다: ${hitRate}%`, {
          expected: `>= ${PERFORMANCE_THRESHOLDS.boxMullerHitRate.min}%`,
          actual: `${hitRate}%`,
          totalRequests: cacheStats.totalRequests
        });
      } else {
        this.addAlert('SUCCESS', `Box-Muller 캐시 히트율 우수: ${hitRate}%`, {
          hitRate: `${hitRate}%`,
          totalRequests: cacheStats.totalRequests,
          memoryUsage: cacheStats.memoryUsage
        });
      }
      
      if (memoryUsageKB > PERFORMANCE_THRESHOLDS.boxMullerMemoryUsage.max) {
        this.addAlert('WARNING', `Box-Muller 캐시 메모리 사용량이 높습니다: ${memoryUsageKB}KB`, {
          expected: `<= ${PERFORMANCE_THRESHOLDS.boxMullerMemoryUsage.max}KB`,
          actual: `${memoryUsageKB}KB`
        });
      }
      
      return cacheStats;
      
    } catch (error) {
      this.addAlert('WARNING', 'Box-Muller 캐시 성능 체크 실패', { 
        error: error.message 
      });
      return null;
    }
  }

  // 🚨 심각도 레벨 결정
  getSeverityLevel(metricKey, value, threshold) {
    // Core Web Vitals는 성능에 직접적 영향을 미치므로 더 엄격하게 처리
    const criticalMetrics = ['performanceScore', 'largestContentfulPaint', 'cumulativeLayoutShift'];
    
    if (criticalMetrics.includes(metricKey)) {
      return 'CRITICAL';
    }
    
    // Box-Muller 캐시는 내부 최적화이므로 경고 수준
    if (metricKey.startsWith('boxMuller')) {
      return 'WARNING';
    }
    
    return 'WARNING';
  }

  // 🚨 알림 추가
  addAlert(severity, message, details = {}) {
    const alert = {
      severity,
      message,
      details,
      timestamp: new Date().toISOString(),
      emoji: SEVERITY_LEVELS[severity].emoji
    };
    
    this.alerts.push(alert);
    console.log(`${alert.emoji} [${severity}] ${message}`);
    
    if (Object.keys(details).length > 0) {
      console.log('   세부사항:', JSON.stringify(details, null, 2));
    }
  }

  // 📤 GitHub Actions 요약 생성
  generateGitHubSummary() {
    if (this.context !== 'github-actions') return;
    
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryFile) return;
    
    let summary = '## 🚀 실시간 성능 모니터링 결과 - Phase 2\n\n';
    
    // 알림 심각도별 분류
    const alertsBySeverity = this.alerts.reduce((acc, alert) => {
      if (!acc[alert.severity]) acc[alert.severity] = [];
      acc[alert.severity].push(alert);
      return acc;
    }, {});
    
    // 전체 상태 판단
    const hasCritical = alertsBySeverity.CRITICAL?.length > 0;
    const hasWarnings = alertsBySeverity.WARNING?.length > 0;
    
    if (hasCritical) {
      summary += '### 🚨 심각한 성능 문제 감지됨\n\n';
    } else if (hasWarnings) {
      summary += '### ⚠️ 성능 경고 감지됨\n\n';
    } else {
      summary += '### ✅ 모든 성능 메트릭 정상\n\n';
    }
    
    // 심각도별 알림 표시
    ['CRITICAL', 'WARNING', 'INFO', 'SUCCESS'].forEach(severity => {
      const severityAlerts = alertsBySeverity[severity];
      if (!severityAlerts || severityAlerts.length === 0) return;
      
      summary += `#### ${SEVERITY_LEVELS[severity].emoji} ${severity} (${severityAlerts.length}개)\n\n`;
      
      severityAlerts.forEach(alert => {
        summary += `- **${alert.message}**\n`;
        if (alert.details && Object.keys(alert.details).length > 0) {
          Object.entries(alert.details).forEach(([key, value]) => {
            summary += `  - ${key}: \`${value}\`\n`;
          });
        }
        summary += '\n';
      });
    });
    
    // 권장 조치사항
    if (hasCritical || hasWarnings) {
      summary += '### 🔧 권장 조치사항\n\n';
      summary += '1. 🔍 **Box-Muller 캐시 분석**: `npm run test -- box-muller-cache-performance.test.ts`\n';
      summary += '2. 📊 **실시간 성능 위젯 확인**: 대시보드 우측 성능 모니터링 위젯\n';
      summary += '3. 🧹 **번들 최적화**: 불필요한 JavaScript 및 CSS 제거\n';
      summary += '4. 🖼️ **이미지 최적화**: WebP 형식 및 lazy loading 적용\n';
      summary += '5. ⚡ **Core Web Vitals 개선**: LCP, CLS, FID 최적화\n\n';
    }
    
    summary += `---\n*생성 시간: ${new Date().toLocaleString('ko-KR')}*\n`;
    summary += `*컨텍스트: ${this.context}*\n`;
    
    fs.writeFileSync(summaryFile, summary);
    console.log('📝 GitHub Actions 요약 생성 완료');
  }

  // 📤 웹훅 알림 전송 (Slack/Discord)
  async sendWebhookNotification() {
    if (!this.webhookUrl) {
      console.log('⚠️ 웹훅 URL이 설정되지 않아 외부 알림을 건너뜁니다');
      return;
    }
    
    const criticalAlerts = this.alerts.filter(a => a.severity === 'CRITICAL');
    const warningAlerts = this.alerts.filter(a => a.severity === 'WARNING');
    const successAlerts = this.alerts.filter(a => a.severity === 'SUCCESS');
    
    let color = '#00CC00'; // 기본: 녹색 (성공)
    let title = '✅ 성능 모니터링: 모든 지표 정상';
    
    if (criticalAlerts.length > 0) {
      color = '#CC0000'; // 빨간색 (심각)
      title = `🚨 성능 문제 감지: ${criticalAlerts.length}개 심각한 문제`;
    } else if (warningAlerts.length > 0) {
      color = '#FF9900'; // 주황색 (경고)
      title = `⚠️ 성능 경고: ${warningAlerts.length}개 경고사항`;
    }
    
    const message = {
      embeds: [{
        title: title,
        color: parseInt(color.substring(1), 16),
        timestamp: new Date().toISOString(),
        fields: []
      }]
    };
    
    // 심각한 문제들 추가
    if (criticalAlerts.length > 0) {
      message.embeds[0].fields.push({
        name: '🚨 심각한 문제',
        value: criticalAlerts.map(a => `• ${a.message}`).join('\n'),
        inline: false
      });
    }
    
    // 경고사항들 추가
    if (warningAlerts.length > 0) {
      message.embeds[0].fields.push({
        name: '⚠️ 경고사항',
        value: warningAlerts.map(a => `• ${a.message}`).join('\n'),
        inline: false
      });
    }
    
    // 성공 메시지들 추가
    if (successAlerts.length > 0) {
      message.embeds[0].fields.push({
        name: '✅ 정상 지표',
        value: successAlerts.map(a => `• ${a.message}`).join('\n'),
        inline: false
      });
    }
    
    // 환경 정보 추가
    message.embeds[0].fields.push({
      name: '🔍 환경 정보',
      value: `컨텍스트: ${this.context}\n시간: ${new Date().toLocaleString('ko-KR')}`,
      inline: true
    });
    
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      if (response.ok) {
        console.log('📤 웹훅 알림 전송 성공');
      } else {
        console.error('❌ 웹훅 알림 전송 실패:', response.status);
      }
    } catch (error) {
      console.error('❌ 웹훅 알림 전송 오류:', error);
    }
  }

  // 🏃‍♂️ 메인 실행 함수
  async run() {
    console.log('🚀 성능 알림 시스템 시작...');
    console.log(`📍 실행 컨텍스트: ${this.context}`);
    
    // 1. Lighthouse 결과 분석
    const metrics = await this.analyzeLighthouseResults();
    
    // 2. Box-Muller 캐시 성능 체크
    await this.checkBoxMullerPerformance();
    
    // 3. 알림 생성 및 전송
    this.generateGitHubSummary();
    await this.sendWebhookNotification();
    
    // 4. 결과 요약 출력
    const criticalCount = this.alerts.filter(a => a.severity === 'CRITICAL').length;
    const warningCount = this.alerts.filter(a => a.severity === 'WARNING').length;
    const successCount = this.alerts.filter(a => a.severity === 'SUCCESS').length;
    
    console.log('\n📊 성능 모니터링 결과 요약:');
    console.log(`🚨 심각: ${criticalCount}개`);
    console.log(`⚠️ 경고: ${warningCount}개`);
    console.log(`✅ 정상: ${successCount}개`);
    console.log(`📝 총 알림: ${this.alerts.length}개`);
    
    // GitHub Actions에서 심각한 문제 발견 시 exit 1로 워크플로우 실패 처리
    if (this.context === 'github-actions' && criticalCount > 0) {
      console.log('\n🚨 심각한 성능 문제로 인해 워크플로우를 실패 처리합니다.');
      process.exit(1);
    }
    
    console.log('✅ 성능 알림 시스템 완료');
    return {
      success: criticalCount === 0,
      alerts: this.alerts,
      summary: { critical: criticalCount, warning: warningCount, success: successCount }
    };
  }
}

// 🏃‍♂️ 스크립트 실행부
if (require.main === module) {
  const alertSystem = new PerformanceAlertSystem();
  alertSystem.run().catch(error => {
    console.error('❌ 성능 알림 시스템 오류:', error);
    process.exit(1);
  });
}

module.exports = PerformanceAlertSystem;