import fs from 'fs';
import path from 'path';

/**
 * 날짜 기준 JSON 로그 저장기
 * - 압축 없이 개별 JSON 파일로 저장
 * - 날짜별 자동 분류
 * - 실시간 로그 추가 가능
 */
export class LogSaver {
  private static instance: LogSaver;
  private logsPath: string;

  private constructor() {
    this.logsPath = path.join(process.cwd(), 'logs');
    this.ensureDirectories();
  }

  public static getInstance(): LogSaver {
    if (!LogSaver.instance) {
      LogSaver.instance = new LogSaver();
    }
    return LogSaver.instance;
  }

  /**
   * 로그 디렉토리 구조 생성
   */
  private ensureDirectories(): void {
    const directories = [
      this.logsPath,
      path.join(this.logsPath, 'failures'),
      path.join(this.logsPath, 'improvements'),
      path.join(this.logsPath, 'analysis'),
      path.join(this.logsPath, 'interactions'),
      path.join(this.logsPath, 'patterns'),
      path.join(this.logsPath, 'summaries'),
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 [LogSaver] 디렉토리 생성: ${dir}`);
      }
    });
  }

  /**
   * 실패 로그 저장
   */
  async saveFailureLog(
    date: string, // YYYY-MM-DD 형식
    failures: any[]
  ): Promise<boolean> {
    try {
      const filename = `${date}-failure-log.json`;
      const filePath = path.join(this.logsPath, 'failures', filename);

      const logData = {
        metadata: {
          date,
          type: 'failure_log',
          count: failures.length,
          savedAt: new Date().toISOString(),
          version: '1.0.0',
        },
        failures,
      };

      fs.writeFileSync(filePath, JSON.stringify(logData, null, 2), 'utf-8');
      console.log(`✅ [LogSaver] 실패 로그 저장: ${filePath}`);
      return true;
    } catch (error) {
      console.error('❌ [LogSaver] 실패 로그 저장 실패:', error);
      return false;
    }
  }

  /**
   * 개선 로그 저장
   */
  async saveImprovementLog(
    date: string,
    improvements: any[]
  ): Promise<boolean> {
    try {
      const filename = `${date}-improvement-log.json`;
      const filePath = path.join(this.logsPath, 'improvements', filename);

      const logData = {
        metadata: {
          date,
          type: 'improvement_log',
          count: improvements.length,
          savedAt: new Date().toISOString(),
          version: '1.0.0',
        },
        improvements,
      };

      fs.writeFileSync(filePath, JSON.stringify(logData, null, 2), 'utf-8');
      console.log(`✅ [LogSaver] 개선 로그 저장: ${filePath}`);
      return true;
    } catch (error) {
      console.error('❌ [LogSaver] 개선 로그 저장 실패:', error);
      return false;
    }
  }

  /**
   * 분석 결과 저장
   */
  async saveAnalysisLog(
    date: string,
    analysisType: string,
    results: any
  ): Promise<boolean> {
    try {
      const filename = `${date}-${analysisType}-analysis.json`;
      const filePath = path.join(this.logsPath, 'analysis', filename);

      const logData = {
        metadata: {
          date,
          type: 'analysis_log',
          analysisType,
          savedAt: new Date().toISOString(),
          version: '1.0.0',
        },
        results,
      };

      fs.writeFileSync(filePath, JSON.stringify(logData, null, 2), 'utf-8');
      console.log(`✅ [LogSaver] 분석 로그 저장: ${filePath}`);
      return true;
    } catch (error) {
      console.error('❌ [LogSaver] 분석 로그 저장 실패:', error);
      return false;
    }
  }

  /**
   * 상호작용 로그 저장 (실시간 추가)
   */
  async saveInteractionLog(date: string, interaction: any): Promise<boolean> {
    try {
      const filename = `${date}-interactions.json`;
      const filePath = path.join(this.logsPath, 'interactions', filename);

      let existingData: any = {
        metadata: {
          date,
          type: 'interaction_log',
          count: 0,
          lastUpdated: new Date().toISOString(),
          version: '1.0.0',
        },
        interactions: [],
      };

      // 기존 파일이 있으면 로드
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        existingData = JSON.parse(content);
      }

      // 새 상호작용 추가
      existingData.interactions.push({
        ...interaction,
        timestamp: new Date().toISOString(),
      });

      // 메타데이터 업데이트
      existingData.metadata.count = existingData.interactions.length;
      existingData.metadata.lastUpdated = new Date().toISOString();

      fs.writeFileSync(
        filePath,
        JSON.stringify(existingData, null, 2),
        'utf-8'
      );
      console.log(
        `✅ [LogSaver] 상호작용 로그 추가: ${filePath} (총 ${existingData.metadata.count}개)`
      );
      return true;
    } catch (error) {
      console.error('❌ [LogSaver] 상호작용 로그 저장 실패:', error);
      return false;
    }
  }

  /**
   * 패턴 분석 결과 저장
   */
  async savePatternLog(date: string, patterns: any[]): Promise<boolean> {
    try {
      const filename = `${date}-patterns.json`;
      const filePath = path.join(this.logsPath, 'patterns', filename);

      const logData = {
        metadata: {
          date,
          type: 'pattern_log',
          count: patterns.length,
          savedAt: new Date().toISOString(),
          version: '1.0.0',
        },
        patterns,
      };

      fs.writeFileSync(filePath, JSON.stringify(logData, null, 2), 'utf-8');
      console.log(`✅ [LogSaver] 패턴 로그 저장: ${filePath}`);
      return true;
    } catch (error) {
      console.error('❌ [LogSaver] 패턴 로그 저장 실패:', error);
      return false;
    }
  }

  /**
   * 요약 분석 저장
   */
  async saveSummaryLog(
    type: string, // 'intent-analysis', 'daily-summary' 등
    data: any
  ): Promise<boolean> {
    try {
      const filename = `summary-${type}.json`;
      const filePath = path.join(this.logsPath, 'summaries', filename);

      const logData = {
        metadata: {
          type: 'summary_log',
          summaryType: type,
          savedAt: new Date().toISOString(),
          version: '1.0.0',
        },
        data,
      };

      fs.writeFileSync(filePath, JSON.stringify(logData, null, 2), 'utf-8');
      console.log(`✅ [LogSaver] 요약 로그 저장: ${filePath}`);
      return true;
    } catch (error) {
      console.error('❌ [LogSaver] 요약 로그 저장 실패:', error);
      return false;
    }
  }

  /**
   * 로그 파일 로드
   */
  async loadLog(
    category:
      | 'failures'
      | 'improvements'
      | 'analysis'
      | 'interactions'
      | 'patterns'
      | 'summaries',
    filename: string
  ): Promise<any | null> {
    try {
      const filePath = path.join(this.logsPath, category, filename);

      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ [LogSaver] 로그 파일 없음: ${filePath}`);
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const logData = JSON.parse(content);
      console.log(`📖 [LogSaver] 로그 로드: ${filePath}`);
      return logData;
    } catch (error) {
      console.error('❌ [LogSaver] 로그 로드 실패:', error);
      return null;
    }
  }

  /**
   * 날짜 범위별 로그 목록 조회
   */
  async getLogsByDateRange(
    category:
      | 'failures'
      | 'improvements'
      | 'analysis'
      | 'interactions'
      | 'patterns',
    startDate: string, // YYYY-MM-DD
    endDate: string // YYYY-MM-DD
  ): Promise<string[]> {
    try {
      const categoryPath = path.join(this.logsPath, category);

      if (!fs.existsSync(categoryPath)) {
        return [];
      }

      const files = fs.readdirSync(categoryPath);
      const logFiles = files
        .filter(file => file.endsWith('.json'))
        .filter(file => {
          const match = file.match(/^(\d{4}-\d{2}-\d{2})/);
          if (!match) return false;

          const fileDate = match[1];
          return fileDate >= startDate && fileDate <= endDate;
        })
        .sort(); // 날짜순 정렬

      return logFiles;
    } catch (error) {
      console.error('❌ [LogSaver] 날짜 범위 로그 조회 실패:', error);
      return [];
    }
  }

  /**
   * 로그 통계 조회
   */
  async getLogStatistics(): Promise<{
    categories: Record<string, number>;
    totalFiles: number;
    totalSize: string;
    oldestLog: string | null;
    newestLog: string | null;
  }> {
    try {
      const categories = [
        'failures',
        'improvements',
        'analysis',
        'interactions',
        'patterns',
        'summaries',
      ];
      const stats: Record<string, number> = {};
      let totalFiles = 0;
      let totalSize = 0;
      let oldestLog: string | null = null;
      let newestLog: string | null = null;

      for (const category of categories) {
        const categoryPath = path.join(this.logsPath, category);

        if (fs.existsSync(categoryPath)) {
          const files = fs
            .readdirSync(categoryPath)
            .filter(f => f.endsWith('.json'));
          stats[category] = files.length;
          totalFiles += files.length;

          // 파일 크기 계산
          for (const file of files) {
            const filePath = path.join(categoryPath, file);
            const fileStat = fs.statSync(filePath);
            totalSize += fileStat.size;

            // 날짜 추출
            const match = file.match(/^(\d{4}-\d{2}-\d{2})/);
            if (match) {
              const fileDate = match[1];
              if (!oldestLog || fileDate < oldestLog) oldestLog = fileDate;
              if (!newestLog || fileDate > newestLog) newestLog = fileDate;
            }
          }
        } else {
          stats[category] = 0;
        }
      }

      // 크기를 읽기 쉬운 형태로 변환
      const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
      };

      return {
        categories: stats,
        totalFiles,
        totalSize: formatSize(totalSize),
        oldestLog,
        newestLog,
      };
    } catch (error) {
      console.error('❌ [LogSaver] 로그 통계 조회 실패:', error);
      return {
        categories: {},
        totalFiles: 0,
        totalSize: '0B',
        oldestLog: null,
        newestLog: null,
      };
    }
  }

  /**
   * 오래된 로그 정리 (선택적)
   */
  async cleanupOldLogs(
    category:
      | 'failures'
      | 'improvements'
      | 'analysis'
      | 'interactions'
      | 'patterns',
    daysToKeep: number = 30
  ): Promise<number> {
    try {
      const categoryPath = path.join(this.logsPath, category);

      if (!fs.existsSync(categoryPath)) {
        return 0;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

      const files = fs.readdirSync(categoryPath);
      let deletedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const match = file.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match && match[1] < cutoffDateStr) {
          const filePath = path.join(categoryPath, file);
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`🗑️ [LogSaver] 오래된 로그 삭제: ${filePath}`);
        }
      }

      if (deletedCount > 0) {
        console.log(
          `✅ [LogSaver] ${category} 카테고리에서 ${deletedCount}개 오래된 로그 정리 완료`
        );
      }

      return deletedCount;
    } catch (error) {
      console.error('❌ [LogSaver] 로그 정리 실패:', error);
      return 0;
    }
  }

  /**
   * 현재 날짜 문자열 생성 (YYYY-MM-DD)
   */
  getCurrentDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 로그 백업 생성
   */
  async createBackup(
    category:
      | 'failures'
      | 'improvements'
      | 'analysis'
      | 'interactions'
      | 'patterns'
      | 'summaries',
    backupName?: string
  ): Promise<boolean> {
    try {
      const sourcePath = path.join(this.logsPath, category);
      const backupPath = path.join(
        this.logsPath,
        'backups',
        backupName || `${category}-backup-${Date.now()}`
      );

      if (!fs.existsSync(sourcePath)) {
        console.warn(`⚠️ [LogSaver] 백업할 디렉토리 없음: ${sourcePath}`);
        return false;
      }

      // 백업 디렉토리 생성
      if (!fs.existsSync(path.dirname(backupPath))) {
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      }

      // 디렉토리 복사 (재귀적)
      const copyDir = (src: string, dest: string) => {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }

        const items = fs.readdirSync(src);
        for (const item of items) {
          const srcPath = path.join(src, item);
          const destPath = path.join(dest, item);

          if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };

      copyDir(sourcePath, backupPath);
      console.log(`💾 [LogSaver] 백업 생성 완료: ${backupPath}`);
      return true;
    } catch (error) {
      console.error('❌ [LogSaver] 백업 생성 실패:', error);
      return false;
    }
  }
}
