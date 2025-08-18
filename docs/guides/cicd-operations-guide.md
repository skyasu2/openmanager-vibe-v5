# 🔄 CI/CD & 운영 관리 가이드

> **GitHub Actions + 모니터링 + 무료 티어 운영 최적화**  
> 최종 업데이트: 2025-08-18  
> 시스템: GitHub Actions + 실시간 모니터링 + 자동 롤백

## 🎯 개요

OpenManager VIBE v5의 CI/CD 파이프라인 구축, 실시간 모니터링 시스템, 무료 티어 최적화 운영, 장애 대응 및 롤백 전략을 완전히 관리하는 가이드입니다.

## 📋 목차

1. [CI/CD 파이프라인](#cicd-파이프라인)
2. [모니터링 및 알림](#모니터링-및-알림)
3. [무료 티어 최적화](#무료-티어-최적화)
4. [문제 해결 및 롤백](#문제-해결-및-롤백)
5. [운영 체크리스트](#운영-체크리스트)

## 🔄 CI/CD 파이프라인

### GitHub Actions 워크플로우

```yaml
# .github/workflows/deploy.yml
name: 🚀 Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '22'
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    name: 🧪 Test & Quality Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check (Production)
        run: npm run type-check:prod

      - name: Lint check
        run: npm run lint:check

      - name: Run tests
        run: npm run test:coverage

      - name: AI tools validation
        run: |
          npm install -g @anthropic-ai/claude-code @google/gemini-cli @qwen-code/qwen-code
          npx ts-node scripts/deploy/ai-validation.ts

  build:
    name: 🏗️ Build Application
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build:prod
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-files
          path: .next/

  deploy-vercel:
    name: 🌐 Deploy to Vercel
    needs: [test, build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-gcp:
    name: ☁️ Deploy to GCP
    needs: [test, build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Setup GCP CLI
        uses: google-github-actions/setup-gcloud@v2
        with:
          service_account_key: ${{ secrets.GCP_SERVICE_ACCOUNT_KEY }}
          project_id: openmanager-free-tier

      - name: Deploy to GCP VM
        run: |
          chmod +x scripts/deploy/gcp-deploy.sh
          ./scripts/deploy/gcp-deploy.sh

  post-deploy:
    name: 📊 Post-deployment checks
    needs: [deploy-vercel, deploy-gcp]
    runs-on: ubuntu-latest
    steps:
      - name: Health check - Vercel
        run: |
          curl -f https://openmanager-vibe-v5.vercel.app/api/health || exit 1

      - name: Health check - GCP VM
        run: |
          curl -f http://104.154.205.25:10000/health || exit 1

      - name: Notify success
        run: |
          echo "🎉 배포 완료!"
          echo "- Vercel: https://openmanager-vibe-v5.vercel.app"
          echo "- GCP VM: http://104.154.205.25:10000"
```

### 고급 CI/CD 워크플로우

```yaml
# .github/workflows/advanced-deploy.yml
name: 🚀 Advanced Production Deploy

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  security-scan:
    name: 🔒 Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run security audit
        run: npm audit --audit-level moderate
        
      - name: Dependency vulnerability scan
        run: |
          npx audit-ci --moderate
          
      - name: Code security scan
        uses: github/codeql-action/analyze@v2
        with:
          languages: typescript, javascript

  performance-test:
    name: ⚡ Performance Test
    runs-on: ubuntu-latest
    needs: security-scan
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build for performance test
        run: npm run build:prod
        
      - name: Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
          
      - name: Bundle size check
        run: |
          npm run build:analyze
          npx bundlesize

  canary-deploy:
    name: 🐤 Canary Deployment
    runs-on: ubuntu-latest
    needs: [security-scan, performance-test]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to staging
        run: vercel --scope preview --token ${{ secrets.VERCEL_TOKEN }}
        
      - name: Smoke tests
        run: |
          # 스테이징 환경 스모크 테스트
          curl -f $VERCEL_PREVIEW_URL/api/health
          npm run test:e2e:staging
          
      - name: Gradual rollout
        run: |
          # 점진적 트래픽 증가
          echo "Starting 10% traffic rollout..."
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 📊 모니터링 및 알림

### 1단계: 헬스체크 모니터링

```typescript
// src/lib/monitoring/health-monitor.ts
interface HealthStatus {
  vercel: boolean;
  supabase: boolean;
  gcp: boolean;
  timestamp: string;
}

export class HealthMonitor {
  private endpoints = {
    vercel: 'https://openmanager-vibe-v5.vercel.app/api/health',
    gcp: 'http://104.154.205.25:10000/health',
    supabase: 'https://your-project.supabase.co/rest/v1/profiles?select=count',
  };

  async checkAllServices(): Promise<HealthStatus> {
    const status: HealthStatus = {
      vercel: false,
      supabase: false,
      gcp: false,
      timestamp: new Date().toISOString(),
    };

    // Vercel 헬스체크
    try {
      const vercelResponse = await fetch(this.endpoints.vercel);
      status.vercel = vercelResponse.ok;
    } catch (error) {
      console.error('Vercel health check failed:', error);
    }

    // GCP 헬스체크
    try {
      const gcpResponse = await fetch(this.endpoints.gcp);
      status.gcp = gcpResponse.ok;
    } catch (error) {
      console.error('GCP health check failed:', error);
    }

    // Supabase 헬스체크
    try {
      const supabaseResponse = await fetch(this.endpoints.supabase, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      });
      status.supabase = supabaseResponse.ok;
    } catch (error) {
      console.error('Supabase health check failed:', error);
    }

    return status;
  }

  async sendAlert(message: string, level: 'info' | 'warning' | 'error') {
    // Discord Webhook, Slack, 이메일 등으로 알림 발송
    console.log(`[${level.toUpperCase()}] ${message}`);

    // 실제 구현 시 webhook URL 사용
    if (process.env.DISCORD_WEBHOOK_URL) {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🚨 **${level.toUpperCase()}**: ${message}`,
        }),
      });
    }
  }
}
```

### 2단계: 성능 모니터링

```typescript
// src/lib/monitoring/performance-monitor.ts
interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeUsers: number;
  errorRate: number;
}

export class PerformanceMonitor {
  async collectMetrics(): Promise<PerformanceMetrics> {
    const startTime = Date.now();

    // API 응답 시간 측정
    try {
      await fetch('/api/health');
    } catch (error) {
      console.error('API health check failed:', error);
    }

    const responseTime = Date.now() - startTime;

    return {
      responseTime,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: await this.getCPUUsage(),
      activeUsers: await this.getActiveUsers(),
      errorRate: await this.getErrorRate(),
    };
  }

  private getMemoryUsage(): number {
    if (typeof window !== 'undefined') {
      // 클라이언트 사이드: 브라우저 메모리 사용량
      return (performance as any).memory?.usedJSHeapSize || 0;
    } else {
      // 서버 사이드: Node.js 메모리 사용량
      return process.memoryUsage().heapUsed;
    }
  }

  private async getCPUUsage(): Promise<number> {
    // 간단한 CPU 사용량 측정
    const start = process.hrtime();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const [seconds, nanoseconds] = process.hrtime(start);
    return (seconds * 1000 + nanoseconds / 1000000) / 100; // 백분율
  }

  private async getActiveUsers(): Promise<number> {
    // Supabase에서 활성 사용자 수 조회
    try {
      const response = await fetch('/api/analytics/active-users');
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Failed to get active users:', error);
      return 0;
    }
  }

  private async getErrorRate(): Promise<number> {
    // 최근 1시간 에러율 계산
    try {
      const response = await fetch('/api/analytics/error-rate');
      const data = await response.json();
      return data.rate || 0;
    } catch (error) {
      console.error('Failed to get error rate:', error);
      return 0;
    }
  }
}
```

### 3단계: 실시간 알림 시스템

```typescript
// src/lib/monitoring/alert-manager.ts
interface AlertRule {
  name: string;
  condition: (metrics: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // 분 단위
}

export class AlertManager {
  private alertHistory: Map<string, Date> = new Map();

  private rules: AlertRule[] = [
    {
      name: 'High Response Time',
      condition: (metrics) => metrics.responseTime > 5000,
      severity: 'high',
      cooldown: 15,
    },
    {
      name: 'High Error Rate',
      condition: (metrics) => metrics.errorRate > 0.05,
      severity: 'critical',
      cooldown: 5,
    },
    {
      name: 'Memory Usage High',
      condition: (metrics) => metrics.memoryUsage > 500 * 1024 * 1024,
      severity: 'medium',
      cooldown: 30,
    },
  ];

  async checkAndAlert(metrics: any): Promise<void> {
    for (const rule of this.rules) {
      if (rule.condition(metrics)) {
        if (this.shouldSendAlert(rule.name, rule.cooldown)) {
          await this.sendAlert(rule.name, rule.severity, metrics);
          this.alertHistory.set(rule.name, new Date());
        }
      }
    }
  }

  private shouldSendAlert(ruleName: string, cooldownMinutes: number): boolean {
    const lastAlert = this.alertHistory.get(ruleName);
    if (!lastAlert) return true;

    const cooldownMs = cooldownMinutes * 60 * 1000;
    return Date.now() - lastAlert.getTime() > cooldownMs;
  }

  private async sendAlert(
    ruleName: string,
    severity: string,
    metrics: any
  ): Promise<void> {
    const message = `🚨 **${severity.toUpperCase()}**: ${ruleName}
    
Response Time: ${metrics.responseTime}ms
Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB
Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%
Active Users: ${metrics.activeUsers}

Timestamp: ${new Date().toISOString()}`;

    // Discord Webhook
    if (process.env.DISCORD_WEBHOOK_URL) {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });
    }

    // Slack Webhook
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          username: 'OpenManager Monitor',
          icon_emoji: ':warning:',
        }),
      });
    }

    console.log(`🚨 Alert sent: ${ruleName} (${severity})`);
  }
}
```

## 💰 무료 티어 최적화

### Vercel 최적화 전략

```typescript
// src/lib/optimization/vercel-optimizer.ts
export class VercelOptimizer {
  // 이미지 최적화로 대역폭 절약
  static optimizeImages() {
    return {
      formats: ['image/webp', 'image/avif'],
      sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      quality: 75,
      minimumCacheTTL: 31536000, // 1년
    };
  }

  // Edge Functions 실행 시간 최적화
  static optimizeEdgeFunctions() {
    return {
      maxDuration: 10, // 10초 제한
      regions: ['icn1', 'hnd1'], // 아시아 태평양 지역만
      runtime: 'edge',
    };
  }

  // 정적 파일 캐시 최적화
  static optimizeStaticAssets() {
    return {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Vercel-Cache': 'HIT',
    };
  }
}
```

### Supabase 최적화 전략

```sql
-- 데이터베이스 최적화 쿼리
-- 1. 인덱스 최적화
CREATE INDEX CONCURRENTLY idx_servers_user_id_status
ON public.servers(user_id, status)
WHERE status IN ('active', 'error');

-- 2. 파티셔닝 (로그 테이블)
CREATE TABLE public.server_logs_2025_08 PARTITION OF public.server_logs
FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

-- 3. 자동 정리 (오래된 로그 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.server_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 스케줄러 설정 (pg_cron 확장 필요)
SELECT cron.schedule('cleanup-logs', '0 2 * * *', 'SELECT cleanup_old_logs();');
```

### GCP 최적화 전략

```bash
# scripts/optimization/gcp-optimizer.sh
#!/bin/bash

echo "💰 GCP 무료 티어 최적화..."

# 1. 메모리 사용량 최적화
echo "1. 메모리 최적화..."
sudo sysctl vm.swappiness=10
sudo sysctl vm.dirty_ratio=15
sudo sysctl vm.dirty_background_ratio=5

# 2. 불필요한 서비스 중단
echo "2. 불필요한 서비스 중단..."
sudo systemctl disable snapd
sudo systemctl disable apache2 2>/dev/null || true
sudo systemctl disable mysql 2>/dev/null || true

# 3. 로그 로테이션 설정
echo "3. 로그 로테이션 설정..."
cat > /etc/logrotate.d/openmanager << 'EOF'
/home/*/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    copytruncate
}
EOF

# 4. 자동 정리 스크립트
echo "4. 자동 정리 크론 작업 설정..."
(crontab -l 2>/dev/null; echo "0 3 * * * find ~/logs -name '*.log' -mtime +7 -delete") | crontab -

echo "✅ GCP 최적화 완료"
```

### 무료 티어 사용량 모니터링

```typescript
// src/lib/monitoring/usage-monitor.ts
interface UsageMetrics {
  vercel: {
    bandwidth: number; // GB
    functions: number; // 실행 횟수
    builds: number;
  };
  supabase: {
    database: number; // MB
    storage: number; // MB
    requests: number;
  };
  gcp: {
    compute: number; // 시간
    storage: number; // GB
    network: number; // GB
  };
}

export class UsageMonitor {
  async getUsageMetrics(): Promise<UsageMetrics> {
    return {
      vercel: await this.getVercelUsage(),
      supabase: await this.getSupabaseUsage(),
      gcp: await this.getGCPUsage(),
    };
  }

  private async getVercelUsage() {
    // Vercel API를 통한 사용량 조회
    try {
      const response = await fetch('/api/vercel/usage', {
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
        },
      });
      const data = await response.json();
      return {
        bandwidth: data.bandwidth || 0,
        functions: data.functions || 0,
        builds: data.builds || 0,
      };
    } catch (error) {
      console.error('Vercel usage fetch failed:', error);
      return { bandwidth: 0, functions: 0, builds: 0 };
    }
  }

  private async getSupabaseUsage() {
    // Supabase API를 통한 사용량 조회
    try {
      const response = await fetch('/api/supabase/usage');
      const data = await response.json();
      return {
        database: data.database || 0,
        storage: data.storage || 0,
        requests: data.requests || 0,
      };
    } catch (error) {
      console.error('Supabase usage fetch failed:', error);
      return { database: 0, storage: 0, requests: 0 };
    }
  }

  private async getGCPUsage() {
    // GCP API를 통한 사용량 조회
    try {
      const response = await fetch('/api/gcp/usage');
      const data = await response.json();
      return {
        compute: data.compute || 0,
        storage: data.storage || 0,
        network: data.network || 0,
      };
    } catch (error) {
      console.error('GCP usage fetch failed:', error);
      return { compute: 0, storage: 0, network: 0 };
    }
  }

  async checkLimits(): Promise<void> {
    const usage = await this.getUsageMetrics();

    // 임계값 확인 (80% 도달 시 경고)
    const limits = {
      vercel: { bandwidth: 100 }, // 100GB
      supabase: { database: 500, storage: 1000 }, // 500MB, 1GB
      gcp: { compute: 744 }, // 744시간/월
    };

    if (usage.vercel.bandwidth > limits.vercel.bandwidth * 0.8) {
      await this.sendLimitWarning('Vercel 대역폭', usage.vercel.bandwidth, limits.vercel.bandwidth);
    }

    if (usage.supabase.database > limits.supabase.database * 0.8) {
      await this.sendLimitWarning('Supabase DB', usage.supabase.database, limits.supabase.database);
    }

    if (usage.gcp.compute > limits.gcp.compute * 0.8) {
      await this.sendLimitWarning('GCP 컴퓨팅', usage.gcp.compute, limits.gcp.compute);
    }
  }

  private async sendLimitWarning(service: string, current: number, limit: number) {
    const percentage = (current / limit) * 100;
    const message = `⚠️ **무료 티어 한계 접근**: ${service}
    
현재 사용량: ${current}
한계: ${limit}
사용률: ${percentage.toFixed(1)}%

곧 한계에 도달할 수 있습니다. 최적화를 검토해주세요.`;

    console.log(message);
    // 알림 시스템으로 전송
  }
}
```

## 🚨 문제 해결 및 롤백

### 배포 실패 시 자동 롤백

```bash
# scripts/deploy/rollback.sh
#!/bin/bash

echo "🔄 자동 롤백 시작..."

# 이전 배포 상태 확인
LAST_DEPLOY=$(vercel --scope production list | head -2 | tail -1 | awk '{print $1}')

if [ -z "$LAST_DEPLOY" ]; then
    echo "❌ 이전 배포를 찾을 수 없습니다."
    exit 1
fi

echo "📋 이전 배포로 롤백: $LAST_DEPLOY"

# Vercel 롤백
vercel --scope production promote $LAST_DEPLOY

# GCP VM 롤백
echo "☁️ GCP VM 롤백..."
gcloud compute ssh openmanager-vm --zone=us-central1-a --command="
    pm2 stop all
    git checkout HEAD~1
    npm install --production
    pm2 start ecosystem.config.js --env production
"

# 헬스체크
echo "🔍 롤백 후 헬스체크..."
sleep 30

if curl -f https://openmanager-vibe-v5.vercel.app/api/health && \
   curl -f http://104.154.205.25:10000/health; then
    echo "✅ 롤백 완료 및 서비스 정상"
else
    echo "❌ 롤백 후에도 서비스 문제 발생"
    exit 1
fi
```

### 장애 대응 매뉴얼

```typescript
// src/lib/incident/incident-manager.ts
interface Incident {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedServices: string[];
  startTime: Date;
  endTime?: Date;
  status: 'open' | 'investigating' | 'resolved';
}

export class IncidentManager {
  private incidents: Incident[] = [];

  async createIncident(
    severity: Incident['severity'],
    description: string,
    affectedServices: string[]
  ): Promise<Incident> {
    const incident: Incident = {
      id: `INC-${Date.now()}`,
      severity,
      description,
      affectedServices,
      startTime: new Date(),
      status: 'open',
    };

    this.incidents.push(incident);
    await this.notifyIncident(incident);
    await this.triggerAutoResponse(incident);

    return incident;
  }

  private async triggerAutoResponse(incident: Incident) {
    switch (incident.severity) {
      case 'critical':
        // 즉시 롤백 실행
        await this.executeRollback();
        break;
      case 'high':
        // 트래픽 제한
        await this.enableRateLimit();
        break;
      case 'medium':
        // 모니터링 강화
        await this.increaseMonitoring();
        break;
    }
  }

  private async executeRollback() {
    console.log('🚨 긴급 롤백 실행...');
    // 롤백 스크립트 실행
  }

  private async enableRateLimit() {
    console.log('⚠️ 트래픽 제한 활성화...');
    // Vercel Edge Config 업데이트
  }

  private async increaseMonitoring() {
    console.log('📊 모니터링 강화...');
    // 모니터링 주기 단축
  }

  private async notifyIncident(incident: Incident) {
    // 팀 알림, 상태 페이지 업데이트 등
    console.log(`🚨 장애 발생: ${incident.description}`);
  }
}
```

## 📚 운영 체크리스트

### 배포 전 체크리스트

- [ ] TypeScript 타입 에러 0개
- [ ] 테스트 커버리지 80% 이상
- [ ] 린트 에러 0개
- [ ] 환경변수 모든 플랫폼 설정 완료
- [ ] AI CLI 도구 정상 작동 확인
- [ ] 백업 시스템 작동 확인
- [ ] 모니터링 알림 설정 완료

### 배포 후 체크리스트

- [ ] Vercel 헬스체크 통과
- [ ] GCP VM 헬스체크 통과
- [ ] Supabase 연결 확인
- [ ] 주요 기능 수동 테스트
- [ ] 성능 메트릭 정상 범위
- [ ] 에러율 임계값 이하
- [ ] 사용자 피드백 모니터링

### 일일 운영 체크리스트

- [ ] 모든 서비스 헬스체크 확인
- [ ] 무료 티어 사용량 모니터링
- [ ] 에러 로그 검토
- [ ] 성능 메트릭 분석
- [ ] 백업 상태 확인
- [ ] 보안 업데이트 확인

### 주간 운영 체크리스트

- [ ] 성능 트렌드 분석
- [ ] 비용 최적화 검토
- [ ] 보안 취약점 스캔
- [ ] 의존성 업데이트 확인
- [ ] 로그 아카이브 정리
- [ ] 장애 복구 테스트

---

## 📚 관련 문서

- [플랫폼 구성 가이드](./platform-configuration-guide.md)
- [개발 & 빌드 도구 가이드](./development-build-tools-guide.md)
- [모니터링 가이드](../monitoring/system-status-monitoring-guide.md)
- [보안 가이드](../security/security-complete-guide.md)

---

**💡 핵심 원칙**: 자동화된 CI/CD + 실시간 모니터링 + 무료 티어 최적화

🔄 **성공 요소**: 점진적 배포 + 자동 롤백 + 지속적 개선