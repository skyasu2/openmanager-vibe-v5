#!/usr/bin/env node

/**
 * Free Tier Usage Tracker
 * GCP 무료 티어 사용량 추적 및 관리 도구
 * 
 * 주요 기능:
 * - API 호출 횟수 추적
 * - 네트워크 대역폭 모니터링
 * - 일별/월별 사용량 계산
 * - 한계치 경고
 * 
 * 무료 티어 한계:
 * - e2-micro VM: 744시간/월 (항상 켜짐 OK)
 * - 네트워크: 1GB/월 아웃바운드 (중국/호주 제외)
 * - 디스크: 30GB 표준 저장소
 */

const fs = require('fs');
const path = require('path');

// 사용량 데이터 파일
const USAGE_FILE = path.join(__dirname, '..', 'data', 'free-tier-usage.json');
const USAGE_DIR = path.dirname(USAGE_FILE);

// 무료 티어 한계 (월간)
const FREE_TIER_LIMITS = {
  vm: {
    hours: 744,              // e2-micro: 744시간/월 (1개 인스턴스)
    disk_gb: 30,            // 30GB 표준 영구 디스크
    snapshot_gb: 5,         // 5GB 스냅샷
  },
  network: {
    egress_gb: 1,           // 1GB/월 (북미)
    egress_gb_china: 0,     // 중국/호주는 무료 없음
    load_balancer_hours: 0, // Load Balancer는 무료 없음
  },
  api: {
    // VM API 호출은 네트워크 사용량에 포함
    daily_calls: 10000,      // 자체 제한 (안전 마진)
    hourly_calls: 500,       // 시간당 제한
  },
  monitoring: {
    metrics_mb: 150,         // 150MB/월 모니터링 데이터
    logs_gb: 50,            // 50GB/월 로그 (첫 달)
  }
};

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 사용량 데이터 구조
class UsageTracker {
  constructor() {
    this.loadUsageData();
  }

  loadUsageData() {
    if (!fs.existsSync(USAGE_DIR)) {
      fs.mkdirSync(USAGE_DIR, { recursive: true });
    }

    if (fs.existsSync(USAGE_FILE)) {
      try {
        const data = fs.readFileSync(USAGE_FILE, 'utf8');
        this.data = JSON.parse(data);
      } catch (e) {
        this.initializeData();
      }
    } else {
      this.initializeData();
    }

    this.validateDataStructure();
  }

  initializeData() {
    const now = new Date();
    this.data = {
      created: now.toISOString(),
      lastUpdated: now.toISOString(),
      currentMonth: {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        usage: {
          vm_hours: 0,
          network_egress_bytes: 0,
          api_calls: 0,
          monitoring_bytes: 0,
          log_bytes: 0
        },
        daily: {}
      },
      history: [],
      alerts: []
    };
  }

  validateDataStructure() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 새로운 달이 시작되면 리셋
    if (this.data.currentMonth.month !== currentMonth || 
        this.data.currentMonth.year !== currentYear) {
      
      // 이전 달 데이터를 히스토리에 저장
      this.data.history.push({
        ...this.data.currentMonth,
        endDate: new Date().toISOString()
      });

      // 새 달 초기화
      this.initializeData();
    }

    // 오늘 데이터 확인
    const today = now.toISOString().split('T')[0];
    if (!this.data.currentMonth.daily[today]) {
      this.data.currentMonth.daily[today] = {
        api_calls: 0,
        network_bytes: 0,
        monitoring_events: 0
      };
    }
  }

  saveUsageData() {
    this.data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(USAGE_FILE, JSON.stringify(this.data, null, 2));
  }

  // API 호출 기록
  recordApiCall(bytes = 1024) {
    const today = new Date().toISOString().split('T')[0];
    
    this.data.currentMonth.usage.api_calls++;
    this.data.currentMonth.usage.network_egress_bytes += bytes;
    this.data.currentMonth.daily[today].api_calls++;
    this.data.currentMonth.daily[today].network_bytes += bytes;

    this.checkLimits();
    this.saveUsageData();
  }

  // VM 시간 계산 (자동)
  calculateVmHours() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const hoursSinceStart = Math.floor((now - monthStart) / (1000 * 60 * 60));
    
    this.data.currentMonth.usage.vm_hours = hoursSinceStart;
    return hoursSinceStart;
  }

  // 한계 체크
  checkLimits() {
    const usage = this.data.currentMonth.usage;
    const alerts = [];

    // VM 시간 체크 (항상 켜져있으므로 월말에만 체크)
    const vmHours = this.calculateVmHours();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const expectedHours = (new Date().getDate() / daysInMonth) * 744;
    
    if (vmHours > expectedHours * 1.1) {
      alerts.push({
        level: 'WARNING',
        message: `VM hours higher than expected: ${vmHours}h`,
        timestamp: new Date().toISOString()
      });
    }

    // 네트워크 사용량 체크
    const networkGB = usage.network_egress_bytes / (1024 * 1024 * 1024);
    const networkPercent = (networkGB / FREE_TIER_LIMITS.network.egress_gb) * 100;
    
    if (networkPercent > 80) {
      alerts.push({
        level: 'CRITICAL',
        message: `Network usage at ${networkPercent.toFixed(1)}% of free tier limit`,
        timestamp: new Date().toISOString()
      });
    } else if (networkPercent > 50) {
      alerts.push({
        level: 'WARNING',
        message: `Network usage at ${networkPercent.toFixed(1)}% of free tier limit`,
        timestamp: new Date().toISOString()
      });
    }

    // API 호출 체크 (일별)
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = this.data.currentMonth.daily[today];
    
    if (todayUsage.api_calls > FREE_TIER_LIMITS.api.daily_calls * 0.8) {
      alerts.push({
        level: 'WARNING',
        message: `Daily API calls at ${todayUsage.api_calls}/${FREE_TIER_LIMITS.api.daily_calls}`,
        timestamp: new Date().toISOString()
      });
    }

    // 알림 저장
    if (alerts.length > 0) {
      this.data.alerts = [...this.data.alerts, ...alerts].slice(-50); // 최근 50개만 유지
    }

    return alerts;
  }

  // 사용량 리포트
  generateReport() {
    const usage = this.data.currentMonth.usage;
    const vmHours = this.calculateVmHours();
    const networkGB = usage.network_egress_bytes / (1024 * 1024 * 1024);
    
    const report = {
      period: `${this.data.currentMonth.year}-${String(this.data.currentMonth.month).padStart(2, '0')}`,
      usage: {
        vm: {
          hours: vmHours,
          limit: FREE_TIER_LIMITS.vm.hours,
          percentage: (vmHours / FREE_TIER_LIMITS.vm.hours) * 100,
          status: vmHours <= FREE_TIER_LIMITS.vm.hours ? 'OK' : 'EXCEEDED'
        },
        network: {
          gb: networkGB,
          limit: FREE_TIER_LIMITS.network.egress_gb,
          percentage: (networkGB / FREE_TIER_LIMITS.network.egress_gb) * 100,
          status: this.getStatus(networkGB / FREE_TIER_LIMITS.network.egress_gb)
        },
        api_calls: {
          total: usage.api_calls,
          daily_average: usage.api_calls / new Date().getDate(),
          status: 'OK'
        }
      },
      cost_estimate: this.estimateCost(usage),
      recommendations: this.getRecommendations(usage),
      recent_alerts: this.data.alerts.slice(-5)
    };

    return report;
  }

  getStatus(ratio) {
    if (ratio >= 1) return 'EXCEEDED';
    if (ratio >= 0.8) return 'CRITICAL';
    if (ratio >= 0.5) return 'WARNING';
    return 'OK';
  }

  estimateCost(usage) {
    // GCP 가격 (대략적)
    const prices = {
      vm_hour_excess: 0.006,      // e2-micro 초과시 시간당
      network_gb_excess: 0.12,    // GB당 (북미)
    };

    let cost = 0;
    
    // VM 초과 비용
    const vmHours = this.calculateVmHours();
    if (vmHours > FREE_TIER_LIMITS.vm.hours) {
      cost += (vmHours - FREE_TIER_LIMITS.vm.hours) * prices.vm_hour_excess;
    }

    // 네트워크 초과 비용
    const networkGB = usage.network_egress_bytes / (1024 * 1024 * 1024);
    if (networkGB > FREE_TIER_LIMITS.network.egress_gb) {
      cost += (networkGB - FREE_TIER_LIMITS.network.egress_gb) * prices.network_gb_excess;
    }

    return {
      estimated_cost_usd: cost.toFixed(2),
      breakdown: {
        vm_excess: vmHours > FREE_TIER_LIMITS.vm.hours ? 
          `$${((vmHours - FREE_TIER_LIMITS.vm.hours) * prices.vm_hour_excess).toFixed(2)}` : '$0.00',
        network_excess: networkGB > FREE_TIER_LIMITS.network.egress_gb ?
          `$${((networkGB - FREE_TIER_LIMITS.network.egress_gb) * prices.network_gb_excess).toFixed(2)}` : '$0.00'
      }
    };
  }

  getRecommendations(usage) {
    const recommendations = [];
    const networkGB = usage.network_egress_bytes / (1024 * 1024 * 1024);
    const networkPercent = (networkGB / FREE_TIER_LIMITS.network.egress_gb) * 100;

    if (networkPercent > 50) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Reduce monitoring frequency',
        impact: 'Can save 30-50% network usage'
      });
      recommendations.push({
        priority: 'HIGH',
        action: 'Implement local caching',
        impact: 'Reduce API calls by 60%'
      });
    }

    if (usage.api_calls > 5000) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Batch API requests',
        impact: 'Reduce call count by 40%'
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const todayUsage = this.data.currentMonth.daily[today];
    if (todayUsage && todayUsage.api_calls > 200) {
      recommendations.push({
        priority: 'LOW',
        action: 'Increase monitoring interval',
        impact: 'From 60s to 300s can save 80% calls'
      });
    }

    return recommendations;
  }
}

// 사용량 표시
function displayReport(report) {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}📊 FREE TIER USAGE REPORT${colors.reset}`);
  console.log('='.repeat(70));
  console.log(`Period: ${report.period}`);
  console.log('='.repeat(70));

  // VM 사용량
  const vmColor = report.usage.vm.status === 'OK' ? colors.green : colors.red;
  console.log(`\n${colors.blue}💻 VM Usage:${colors.reset}`);
  console.log(`  Hours: ${report.usage.vm.hours}/${report.usage.vm.limit} (${report.usage.vm.percentage.toFixed(1)}%)`);
  console.log(`  Status: ${vmColor}${report.usage.vm.status}${colors.reset}`);

  // 네트워크 사용량
  const netColor = report.usage.network.status === 'OK' ? colors.green :
                   report.usage.network.status === 'WARNING' ? colors.yellow : colors.red;
  console.log(`\n${colors.blue}🌐 Network Usage:${colors.reset}`);
  console.log(`  Egress: ${report.usage.network.gb.toFixed(3)}GB/${report.usage.network.limit}GB (${report.usage.network.percentage.toFixed(1)}%)`);
  console.log(`  Status: ${netColor}${report.usage.network.status}${colors.reset}`);

  // API 호출
  console.log(`\n${colors.blue}📡 API Calls:${colors.reset}`);
  console.log(`  Total: ${report.usage.api_calls.total}`);
  console.log(`  Daily Average: ${report.usage.api_calls.daily_average.toFixed(0)}`);
  console.log(`  Status: ${colors.green}${report.usage.api_calls.status}${colors.reset}`);

  // 예상 비용
  const costColor = parseFloat(report.cost_estimate.estimated_cost_usd) > 0 ? colors.yellow : colors.green;
  console.log(`\n${colors.blue}💰 Estimated Cost:${colors.reset}`);
  console.log(`  Total: ${costColor}$${report.cost_estimate.estimated_cost_usd}${colors.reset}`);
  if (parseFloat(report.cost_estimate.estimated_cost_usd) > 0) {
    console.log(`  VM Excess: ${report.cost_estimate.breakdown.vm_excess}`);
    console.log(`  Network Excess: ${report.cost_estimate.breakdown.network_excess}`);
  }

  // 권장사항
  if (report.recommendations.length > 0) {
    console.log(`\n${colors.cyan}💡 Recommendations:${colors.reset}`);
    report.recommendations.forEach(rec => {
      const priorityColor = rec.priority === 'HIGH' ? colors.red :
                           rec.priority === 'MEDIUM' ? colors.yellow : colors.blue;
      console.log(`  ${priorityColor}[${rec.priority}]${colors.reset} ${rec.action}`);
      console.log(`    Impact: ${rec.impact}`);
    });
  }

  // 최근 알림
  if (report.recent_alerts.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Recent Alerts:${colors.reset}`);
    report.recent_alerts.forEach(alert => {
      const alertColor = alert.level === 'CRITICAL' ? colors.red : colors.yellow;
      console.log(`  ${alertColor}[${alert.level}]${colors.reset} ${alert.message}`);
    });
  }

  console.log('\n' + '='.repeat(70));
}

// 메인 함수
async function main() {
  const args = process.argv.slice(2);
  const tracker = new UsageTracker();

  if (args.includes('--record')) {
    // API 호출 기록
    const bytes = parseInt(args[args.indexOf('--record') + 1]) || 1024;
    tracker.recordApiCall(bytes);
    console.log(`${colors.green}✅ Recorded API call (${bytes} bytes)${colors.reset}`);
  }

  if (args.includes('--reset')) {
    // 월간 데이터 리셋
    tracker.initializeData();
    tracker.saveUsageData();
    console.log(`${colors.yellow}🔄 Usage data reset${colors.reset}`);
  }

  if (args.includes('--export')) {
    // JSON으로 내보내기
    const report = tracker.generateReport();
    const filename = `free-tier-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`${colors.green}📄 Report exported to ${filename}${colors.reset}`);
  }

  // 리포트 생성 및 표시
  const report = tracker.generateReport();
  displayReport(report);

  // 경고 수준에 따른 종료 코드
  if (report.usage.network.status === 'EXCEEDED') {
    process.exit(2);
  } else if (report.usage.network.status === 'CRITICAL') {
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

// 모듈로 내보내기
module.exports = UsageTracker;