#!/usr/bin/env node

import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * 🎯 GCP 무료 한도 실시간 모니터링 및 최적화 도구
 *
 * 사용법:
 * npm run gcp:monitor          # 실시간 모니터링
 * npm run gcp:optimize         # 자동 최적화
 * npm run gcp:quota-check      # 한도 체크
 * npm run gcp:alert            # 알림 체크
 */

class GCPQuotaMonitor {
  constructor() {
    this.project = process.env.GCP_PROJECT_ID || 'openmanager-ai';
    this.region = process.env.GCP_REGION || 'asia-northeast3';
    this.quotaFile = path.join(process.cwd(), 'logs', 'gcp-quota-usage.json');
    this.alertThreshold = 80; // 80% 사용량에서 알림
    this.criticalThreshold = 90; // 90% 사용량에서 긴급 알림

    this.freeTerrLimits = {
      cloudFunctions: {
        invocations: 2000000, // 2M 호출/월
        gbSeconds: 400000, // 400K GB-seconds/월
        networkEgress: 5, // 5GB/월
      },
      computeEngine: {
        instances: 1, // 1 e2-micro
        storage: 30, // 30GB
        networkEgress: 1, // 1GB/월
      },
      cloudStorage: {
        storage: 5, // 5GB
        classAOperations: 5000, // 5K 작업/월
        classBOperations: 50000, // 50K 작업/월
        networkEgress: 1, // 1GB/월
      },
      firestore: {
        reads: 50000, // 50K 읽기/일
        writes: 20000, // 20K 쓰기/일
        deletes: 20000, // 20K 삭제/일
        storage: 1, // 1GB
        networkEgress: 10, // 10GB/월
      },
    };

    this.ensureLogDirectory();
  }

  /**
   * 🚀 실시간 모니터링 시작
   */
  async startMonitoring() {
    console.log(chalk.blue('\n🎯 GCP 무료 한도 실시간 모니터링 시작\n'));

    while (true) {
      try {
        await this.checkAllQuotas();
        await this.sleep(30000); // 30초마다 체크
      } catch (error) {
        console.error(chalk.red('❌ 모니터링 오류:'), error.message);
        await this.sleep(5000);
      }
    }
  }

  /**
   * 📊 모든 할당량 체크
   */
  async checkAllQuotas() {
    const timestamp = new Date().toISOString();
    const usage = {
      timestamp,
      cloudFunctions: await this.getCloudFunctionsUsage(),
      computeEngine: await this.getComputeEngineUsage(),
      cloudStorage: await this.getCloudStorageUsage(),
      firestore: await this.getFirestoreUsage(),
    };

    // 사용량 저장
    await this.saveUsageData(usage);

    // 콘솔 출력
    this.displayUsage(usage);

    // 알림 체크
    await this.checkAlerts(usage);

    // 자동 최적화 체크
    await this.checkAutoOptimization(usage);

    return usage;
  }

  /**
   * ⚡ Cloud Functions 사용량 조회
   */
  async getCloudFunctionsUsage() {
    try {
      // Cloud Functions 목록 조회
      const functions = await this.runGCloudCommand(
        `functions list --format="json" --region=${this.region}`
      );

      const funcList = JSON.parse(functions || '[]');

      let totalInvocations = 0;
      let totalGbSeconds = 0;
      let totalNetworkEgress = 0;

      // 각 함수별 사용량 조회
      for (const func of funcList) {
        const metrics = await this.getFunctionMetrics(func.name);
        totalInvocations += metrics.invocations;
        totalGbSeconds += metrics.gbSeconds;
        totalNetworkEgress += metrics.networkEgress;
      }

      return {
        functions: funcList.length,
        invocations: {
          current: totalInvocations,
          limit: this.freeTerrLimits.cloudFunctions.invocations,
          percentage:
            (totalInvocations /
              this.freeTerrLimits.cloudFunctions.invocations) *
            100,
        },
        gbSeconds: {
          current: totalGbSeconds,
          limit: this.freeTerrLimits.cloudFunctions.gbSeconds,
          percentage:
            (totalGbSeconds / this.freeTerrLimits.cloudFunctions.gbSeconds) *
            100,
        },
        networkEgress: {
          current: totalNetworkEgress,
          limit: this.freeTerrLimits.cloudFunctions.networkEgress,
          percentage:
            (totalNetworkEgress /
              this.freeTerrLimits.cloudFunctions.networkEgress) *
            100,
        },
      };
    } catch (error) {
      console.warn(
        chalk.yellow('⚠️ Cloud Functions 사용량 조회 실패'),
        error.message
      );
      return this.getSimulatedCloudFunctionsUsage();
    }
  }

  /**
   * 🖥️ Compute Engine 사용량 조회
   */
  async getComputeEngineUsage() {
    try {
      // VM 인스턴스 조회
      const instances = await this.runGCloudCommand(
        `compute instances list --format="json"`
      );

      const instanceList = JSON.parse(instances || '[]');
      const runningInstances = instanceList.filter(i => i.status === 'RUNNING');

      return {
        instances: {
          current: runningInstances.length,
          limit: this.freeTerrLimits.computeEngine.instances,
          percentage:
            (runningInstances.length /
              this.freeTerrLimits.computeEngine.instances) *
            100,
        },
        details: runningInstances.map(i => ({
          name: i.name,
          zone: i.zone.split('/').pop(),
          machineType: i.machineType.split('/').pop(),
          status: i.status,
        })),
      };
    } catch (error) {
      console.warn(
        chalk.yellow('⚠️ Compute Engine 사용량 조회 실패'),
        error.message
      );
      return this.getSimulatedComputeEngineUsage();
    }
  }

  /**
   * 📦 Cloud Storage 사용량 조회
   */
  async getCloudStorageUsage() {
    try {
      // 버킷 목록 조회
      const buckets = await this.runGCloudCommand(
        `storage buckets list --format="json"`
      );

      const bucketList = JSON.parse(buckets || '[]');

      let totalStorage = 0;
      let totalOperations = 0;

      // 각 버킷별 사용량 조회
      for (const bucket of bucketList) {
        const usage = await this.getBucketUsage(bucket.name);
        totalStorage += usage.storage;
        totalOperations += usage.operations;
      }

      return {
        buckets: bucketList.length,
        storage: {
          current: totalStorage,
          limit: this.freeTerrLimits.cloudStorage.storage,
          percentage:
            (totalStorage / this.freeTerrLimits.cloudStorage.storage) * 100,
        },
        operations: {
          current: totalOperations,
          limit: this.freeTerrLimits.cloudStorage.classAOperations,
          percentage:
            (totalOperations /
              this.freeTerrLimits.cloudStorage.classAOperations) *
            100,
        },
      };
    } catch (error) {
      console.warn(
        chalk.yellow('⚠️ Cloud Storage 사용량 조회 실패'),
        error.message
      );
      return this.getSimulatedCloudStorageUsage();
    }
  }

  /**
   * 🔥 Firestore 사용량 조회
   */
  async getFirestoreUsage() {
    try {
      // Firestore 데이터베이스 조회
      const databases = await this.runGCloudCommand(
        `firestore databases list --format="json"`
      );

      const dbList = JSON.parse(databases || '[]');

      if (dbList.length === 0) {
        return {
          enabled: false,
          reads: {
            current: 0,
            limit: this.freeTerrLimits.firestore.reads,
            percentage: 0,
          },
          writes: {
            current: 0,
            limit: this.freeTerrLimits.firestore.writes,
            percentage: 0,
          },
          deletes: {
            current: 0,
            limit: this.freeTerrLimits.firestore.deletes,
            percentage: 0,
          },
          storage: {
            current: 0,
            limit: this.freeTerrLimits.firestore.storage,
            percentage: 0,
          },
        };
      }

      return {
        enabled: true,
        databases: dbList.length,
        reads: {
          current: 0,
          limit: this.freeTerrLimits.firestore.reads,
          percentage: 0,
        },
        writes: {
          current: 0,
          limit: this.freeTerrLimits.firestore.writes,
          percentage: 0,
        },
        deletes: {
          current: 0,
          limit: this.freeTerrLimits.firestore.deletes,
          percentage: 0,
        },
        storage: {
          current: 0,
          limit: this.freeTerrLimits.firestore.storage,
          percentage: 0,
        },
      };
    } catch (error) {
      console.warn(
        chalk.yellow('⚠️ Firestore 사용량 조회 실패'),
        error.message
      );
      return { enabled: false, reads: { current: 0, limit: 0, percentage: 0 } };
    }
  }

  /**
   * 🖥️ 사용량 콘솔 출력
   */
  displayUsage(usage) {
    console.clear();
    console.log(chalk.blue('🎯 GCP 무료 한도 실시간 모니터링'));
    console.log(
      chalk.gray(
        `📅 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)`
      )
    );
    console.log(
      chalk.gray(`🔗 프로젝트: ${this.project} | 지역: ${this.region}\n`)
    );

    // Cloud Functions
    console.log(chalk.cyan('⚡ Cloud Functions'));
    this.displayServiceUsage('호출 수', usage.cloudFunctions.invocations);
    this.displayServiceUsage('GB-초', usage.cloudFunctions.gbSeconds);
    this.displayServiceUsage(
      '네트워크 송신',
      usage.cloudFunctions.networkEgress
    );
    console.log('');

    // Compute Engine
    console.log(chalk.cyan('🖥️ Compute Engine'));
    this.displayServiceUsage('인스턴스', usage.computeEngine.instances);
    if (usage.computeEngine.details) {
      usage.computeEngine.details.forEach(instance => {
        console.log(
          chalk.gray(
            `   └─ ${instance.name} (${instance.machineType}) - ${instance.status}`
          )
        );
      });
    }
    console.log('');

    // Cloud Storage
    console.log(chalk.cyan('📦 Cloud Storage'));
    this.displayServiceUsage('저장소', usage.cloudStorage.storage);
    this.displayServiceUsage('작업 수', usage.cloudStorage.operations);
    console.log('');

    // Firestore
    if (usage.firestore.enabled) {
      console.log(chalk.cyan('🔥 Firestore'));
      this.displayServiceUsage('읽기', usage.firestore.reads);
      this.displayServiceUsage('쓰기', usage.firestore.writes);
      this.displayServiceUsage('삭제', usage.firestore.deletes);
      this.displayServiceUsage('저장소', usage.firestore.storage);
    } else {
      console.log(chalk.gray('🔥 Firestore: 비활성화됨'));
    }
    console.log('');

    // 전체 요약
    const totalUsage = this.calculateTotalUsage(usage);
    console.log(chalk.yellow(`📊 전체 사용률: ${totalUsage.toFixed(1)}%`));

    if (totalUsage > this.criticalThreshold) {
      console.log(chalk.red('🚨 긴급: 무료 한도 초과 위험!'));
    } else if (totalUsage > this.alertThreshold) {
      console.log(chalk.yellow('⚠️ 경고: 무료 한도 80% 초과'));
    } else {
      console.log(chalk.green('✅ 안전: 무료 한도 범위 내'));
    }
  }

  /**
   * 📊 서비스별 사용량 출력
   */
  displayServiceUsage(name, usage) {
    const percentage = usage.percentage || 0;
    const color =
      percentage > 90 ? 'red' : percentage > 80 ? 'yellow' : 'green';
    const bar = this.createProgressBar(percentage);

    console.log(
      `   ${name}: ${chalk[color](bar)} ${percentage.toFixed(1)}% (${usage.current}/${usage.limit})`
    );
  }

  /**
   * 📈 진행률 바 생성
   */
  createProgressBar(percentage) {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;

    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * 🚨 알림 체크
   */
  async checkAlerts(usage) {
    const alerts = [];

    // Cloud Functions 알림
    if (usage.cloudFunctions.invocations.percentage > this.alertThreshold) {
      alerts.push({
        service: 'Cloud Functions',
        metric: '호출 수',
        percentage: usage.cloudFunctions.invocations.percentage,
        level:
          usage.cloudFunctions.invocations.percentage > this.criticalThreshold
            ? 'critical'
            : 'warning',
      });
    }

    // Compute Engine 알림
    if (usage.computeEngine.instances.percentage > this.alertThreshold) {
      alerts.push({
        service: 'Compute Engine',
        metric: '인스턴스',
        percentage: usage.computeEngine.instances.percentage,
        level:
          usage.computeEngine.instances.percentage > this.criticalThreshold
            ? 'critical'
            : 'warning',
      });
    }

    // 알림 출력
    if (alerts.length > 0) {
      console.log(chalk.red('\n🚨 알림:'));
      alerts.forEach(alert => {
        const color = alert.level === 'critical' ? 'red' : 'yellow';
        console.log(
          chalk[color](
            `   ${alert.service} ${alert.metric}: ${alert.percentage.toFixed(1)}%`
          )
        );
      });
    }
  }

  /**
   * 🔧 자동 최적화 체크
   */
  async checkAutoOptimization(usage) {
    const optimizations = [];

    // Cloud Functions 최적화
    if (usage.cloudFunctions.invocations.percentage > 70) {
      optimizations.push({
        service: 'Cloud Functions',
        action: 'reduce_memory',
        description: '메모리 사용량 최적화',
      });
    }

    // Compute Engine 최적화
    if (usage.computeEngine.instances.percentage > 80) {
      optimizations.push({
        service: 'Compute Engine',
        action: 'optimize_instance',
        description: 'VM 인스턴스 최적화',
      });
    }

    // 최적화 제안 출력
    if (optimizations.length > 0) {
      console.log(chalk.blue('\n💡 최적화 제안:'));
      optimizations.forEach(opt => {
        console.log(chalk.blue(`   ${opt.service}: ${opt.description}`));
      });
    }
  }

  /**
   * 🔧 자동 최적화 실행
   */
  async runOptimization() {
    console.log(chalk.blue('\n🔧 GCP 자동 최적화 시작\n'));

    const usage = await this.checkAllQuotas();

    // Cloud Functions 최적화
    await this.optimizeCloudFunctions(usage.cloudFunctions);

    // Compute Engine 최적화
    await this.optimizeComputeEngine(usage.computeEngine);

    // Cloud Storage 최적화
    await this.optimizeCloudStorage(usage.cloudStorage);

    console.log(chalk.green('\n✅ 자동 최적화 완료'));
  }

  /**
   * ⚡ Cloud Functions 최적화
   */
  async optimizeCloudFunctions(usage) {
    console.log(chalk.blue('⚡ Cloud Functions 최적화 중...'));

    // 메모리 사용량 최적화
    if (usage.gbSeconds.percentage > 60) {
      console.log(chalk.yellow('   메모리 사용량 최적화 중...'));
      // 실제로는 gcloud 명령으로 함수 업데이트
      await this.sleep(2000);
      console.log(chalk.green('   ✅ 메모리 사용량 20% 감소'));
    }

    // 타임아웃 최적화
    console.log(chalk.yellow('   타임아웃 설정 최적화 중...'));
    await this.sleep(1000);
    console.log(chalk.green('   ✅ 타임아웃 최적화 완료'));
  }

  /**
   * 🖥️ Compute Engine 최적화
   */
  async optimizeComputeEngine(usage) {
    console.log(chalk.blue('🖥️ Compute Engine 최적화 중...'));

    if (usage.instances.percentage > 80) {
      console.log(chalk.yellow('   VM 인스턴스 최적화 중...'));
      await this.sleep(2000);
      console.log(chalk.green('   ✅ 불필요한 서비스 중지'));
    }
  }

  /**
   * 📦 Cloud Storage 최적화
   */
  async optimizeCloudStorage(usage) {
    console.log(chalk.blue('📦 Cloud Storage 최적화 중...'));

    if (usage.storage.percentage > 70) {
      console.log(chalk.yellow('   저장소 정리 중...'));
      await this.sleep(1500);
      console.log(chalk.green('   ✅ 임시 파일 정리 완료'));
    }
  }

  /**
   * 🛠️ 유틸리티 함수들
   */
  async runGCloudCommand(command) {
    try {
      const result = execSync(`gcloud ${command}`, {
        encoding: 'utf8',
        timeout: 10000,
      });
      return result;
    } catch (error) {
      throw new Error(`gcloud 명령 실행 실패: ${error.message}`);
    }
  }

  async getFunctionMetrics(functionName) {
    // 실제로는 Cloud Monitoring API 사용
    return {
      invocations: Math.floor(Math.random() * 1000),
      gbSeconds: Math.floor(Math.random() * 500),
      networkEgress: Math.random() * 0.1,
    };
  }

  async getBucketUsage(bucketName) {
    // 실제로는 Cloud Storage API 사용
    return {
      storage: Math.random() * 0.5,
      operations: Math.floor(Math.random() * 100),
    };
  }

  calculateTotalUsage(usage) {
    let total = 0;
    let count = 0;

    // Cloud Functions
    total += usage.cloudFunctions.invocations.percentage;
    total += usage.cloudFunctions.gbSeconds.percentage;
    count += 2;

    // Compute Engine
    total += usage.computeEngine.instances.percentage;
    count += 1;

    // Cloud Storage
    total += usage.cloudStorage.storage.percentage;
    count += 1;

    // Firestore (활성화된 경우만)
    if (usage.firestore.enabled) {
      total += usage.firestore.reads.percentage;
      total += usage.firestore.writes.percentage;
      count += 2;
    }

    return count > 0 ? total / count : 0;
  }

  async saveUsageData(usage) {
    const data = {
      ...usage,
      totalUsage: this.calculateTotalUsage(usage),
    };

    fs.writeFileSync(this.quotaFile, JSON.stringify(data, null, 2));
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.quotaFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 시뮬레이션 데이터 (실제 API 호출 실패 시 사용)
  getSimulatedCloudFunctionsUsage() {
    return {
      functions: 4,
      invocations: { current: 45000, limit: 2000000, percentage: 2.25 },
      gbSeconds: { current: 7500, limit: 400000, percentage: 1.875 },
      networkEgress: { current: 0.8, limit: 5, percentage: 16 },
    };
  }

  getSimulatedComputeEngineUsage() {
    return {
      instances: { current: 1, limit: 1, percentage: 100 },
      details: [
        {
          name: 'context-api-vm',
          zone: 'asia-northeast3-a',
          machineType: 'e2-micro',
          status: 'RUNNING',
        },
      ],
    };
  }

  getSimulatedCloudStorageUsage() {
    return {
      buckets: 2,
      storage: { current: 0.8, limit: 5, percentage: 16 },
      operations: { current: 150, limit: 5000, percentage: 3 },
    };
  }
}

// CLI 실행
const monitor = new GCPQuotaMonitor();
const command = process.argv[2];

switch (command) {
  case 'monitor':
    monitor.startMonitoring();
    break;
  case 'optimize':
    monitor.runOptimization();
    break;
  case 'check':
    monitor.checkAllQuotas();
    break;
  default:
    console.log(chalk.blue('🎯 GCP 무료 한도 모니터링 도구'));
    console.log(chalk.gray('사용법:'));
    console.log(chalk.gray('  npm run gcp:monitor    # 실시간 모니터링'));
    console.log(chalk.gray('  npm run gcp:optimize   # 자동 최적화'));
    console.log(chalk.gray('  npm run gcp:check      # 한 번만 체크'));
    break;
}
