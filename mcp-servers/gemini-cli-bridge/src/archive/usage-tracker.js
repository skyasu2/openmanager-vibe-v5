import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

/**
 * 📊 Gemini CLI 사용량 추적기
 * 일일 1,000회 제한 관리 및 알림 기능
 */
export class UsageTracker {
  constructor(options = {}) {
    this.dailyLimit = options.dailyLimit || 1000;
    this.warningThresholds = options.warningThresholds || [0.8, 0.9, 1.0]; // 80%, 90%, 100%
    this.dataFile =
      options.dataFile || join(homedir(), '.gemini-cli-bridge', 'usage.json');
    this.notifiedThresholds = new Set();

    // 데이터 파일 디렉토리 생성
    this._ensureDataDirectory();

    // 사용량 데이터 로드
    this.loadUsageData();
  }

  /**
   * 데이터 디렉토리 확인 및 생성
   */
  _ensureDataDirectory() {
    const dir = dirname(this.dataFile);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 사용량 데이터 로드
   */
  loadUsageData() {
    try {
      if (existsSync(this.dataFile)) {
        const data = JSON.parse(readFileSync(this.dataFile, 'utf8'));
        const today = this._getTodayKey();

        // 오늘 날짜 데이터만 유지
        if (data.date === today) {
          this.currentUsage = data.usage || 0;
          this.lastReset = new Date(data.lastReset || Date.now());
          this.history = data.history || [];
        } else {
          // 새로운 날짜 - 리셋
          this._resetDaily();
        }
      } else {
        this._resetDaily();
      }
    } catch (error) {
      console.error('[UsageTracker] 데이터 로드 실패:', error);
      this._resetDaily();
    }
  }

  /**
   * 사용량 데이터 저장
   */
  saveUsageData() {
    try {
      const data = {
        date: this._getTodayKey(),
        usage: this.currentUsage,
        lastReset: this.lastReset.toISOString(),
        history: this.history.slice(-100), // 최근 100개만 유지
        stats: {
          peakUsage: Math.max(
            ...this.history.map(h => h.usage),
            this.currentUsage
          ),
          averageResponseTime: this._calculateAverageResponseTime(),
        },
      };

      writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[UsageTracker] 데이터 저장 실패:', error);
    }
  }

  /**
   * 일일 사용량 리셋
   */
  _resetDaily() {
    this.currentUsage = 0;
    this.lastReset = new Date();
    this.history = [];
    this.notifiedThresholds.clear();
    this.saveUsageData();
    console.log('[UsageTracker] 일일 사용량이 리셋되었습니다.');
  }

  /**
   * 오늘 날짜 키 생성 (YYYY-MM-DD)
   */
  _getTodayKey() {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * 사용 가능 여부 확인
   */
  canUse() {
    this._checkDailyReset();
    return this.currentUsage < this.dailyLimit;
  }

  /**
   * 남은 사용량 확인
   */
  getRemainingQuota() {
    this._checkDailyReset();
    return Math.max(0, this.dailyLimit - this.currentUsage);
  }

  /**
   * 사용량 퍼센트 확인
   */
  getUsagePercent() {
    return (this.currentUsage / this.dailyLimit) * 100;
  }

  /**
   * 사용량 증가 및 알림
   */
  async incrementUsage(metadata = {}) {
    this._checkDailyReset();

    this.currentUsage++;

    // 사용 이력 추가
    this.history.push({
      timestamp: new Date().toISOString(),
      usage: this.currentUsage,
      model: metadata.model || 'default',
      responseTime: metadata.responseTime || 0,
      success: metadata.success !== false,
    });

    // 임계값 확인 및 알림
    this._checkThresholds();

    // 데이터 저장
    this.saveUsageData();

    return {
      current: this.currentUsage,
      remaining: this.getRemainingQuota(),
      percent: this.getUsagePercent(),
    };
  }

  /**
   * 일일 리셋 확인
   */
  _checkDailyReset() {
    const today = this._getTodayKey();
    const lastResetDay = this.lastReset.toISOString().split('T')[0];

    if (today !== lastResetDay) {
      this._resetDaily();
    }
  }

  /**
   * 임계값 확인 및 알림
   */
  _checkThresholds() {
    const usagePercent = this.getUsagePercent() / 100; // 0-1 범위로 변환

    for (const threshold of this.warningThresholds) {
      if (
        usagePercent >= threshold &&
        !this.notifiedThresholds.has(threshold)
      ) {
        this.notifiedThresholds.add(threshold);
        this._sendNotification(threshold);
      }
    }
  }

  /**
   * 사용량 알림 전송
   */
  _sendNotification(threshold) {
    const percent = Math.round(threshold * 100);
    const remaining = this.getRemainingQuota();

    let message = `⚠️ Gemini CLI 사용량 ${percent}% 도달!`;

    if (remaining > 0) {
      message += ` (남은 횟수: ${remaining}회)`;
    } else {
      message += ' 🔴 일일 한도 초과!';
    }

    console.warn(`[UsageTracker] ${message}`);

    // 추가 알림 로직 (예: 시스템 알림, 이메일 등)
    if (threshold >= 1.0) {
      console.error(
        '[UsageTracker] 💥 일일 사용 한도에 도달했습니다. 내일까지 사용이 제한됩니다.'
      );
    } else if (threshold >= 0.9) {
      console.warn(
        '[UsageTracker] ⚡ 곧 일일 한도에 도달합니다. 사용에 주의하세요.'
      );
    }
  }

  /**
   * 평균 응답 시간 계산
   */
  _calculateAverageResponseTime() {
    if (this.history.length === 0) return 0;

    const validTimes = this.history
      .filter(h => h.responseTime > 0)
      .map(h => h.responseTime);

    if (validTimes.length === 0) return 0;

    return validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
  }

  /**
   * 상세 통계 조회
   */
  getDetailedStats() {
    this._checkDailyReset();

    const successCount = this.history.filter(h => h.success).length;
    const failureCount = this.history.filter(h => !h.success).length;
    const modelUsage = {};

    // 모델별 사용량 집계
    this.history.forEach(h => {
      modelUsage[h.model] = (modelUsage[h.model] || 0) + 1;
    });

    return {
      current: this.currentUsage,
      limit: this.dailyLimit,
      remaining: this.getRemainingQuota(),
      percent: this.getUsagePercent(),
      successRate: successCount / (successCount + failureCount) || 0,
      averageResponseTime: this._calculateAverageResponseTime(),
      modelBreakdown: modelUsage,
      lastReset: this.lastReset.toISOString(),
      nextReset: this._getNextResetTime(),
    };
  }

  /**
   * 다음 리셋 시간 계산
   */
  _getNextResetTime() {
    const tomorrow = new Date(this.lastReset);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  /**
   * 사용량 예측
   */
  predictDailyUsage() {
    if (this.history.length < 10) {
      return { prediction: 'insufficient_data', estimatedTotal: null };
    }

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const elapsedHours = (now - dayStart) / (1000 * 60 * 60);
    const currentRate = this.currentUsage / elapsedHours;
    const estimatedTotal = Math.round(currentRate * 24);

    let status = 'normal';
    if (estimatedTotal > this.dailyLimit * 1.2) {
      status = 'critical';
    } else if (estimatedTotal > this.dailyLimit) {
      status = 'warning';
    }

    return {
      prediction: status,
      estimatedTotal,
      currentRate: Math.round(currentRate),
      recommendation: this._getUsageRecommendation(status),
    };
  }

  /**
   * 사용량 권장사항
   */
  _getUsageRecommendation(status) {
    switch (status) {
      case 'critical':
        return '🚨 사용량이 매우 높습니다. 즉시 사용을 줄이거나 Claude로 전환하세요.';
      case 'warning':
        return '⚠️ 현재 속도로는 일일 한도를 초과할 예정입니다. 사용량 조절이 필요합니다.';
      default:
        return '✅ 정상적인 사용 패턴입니다.';
    }
  }
}
