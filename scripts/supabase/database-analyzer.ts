#!/usr/bin/env ts-node
/**
 * 🔍 Supabase 데이터베이스 자동 분석 도구
 * 
 * 기능:
 * - 테이블 크기 및 사용률 분석
 * - 불필요한 컬럼/인덱스 탐지
 * - 중복 데이터 식별
 * - 정리 권장사항 생성
 * - 무료 티어 사용률 모니터링
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// 환경 설정
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface TableAnalysis {
  name: string;
  totalSize: string;
  tableSize: string;
  indexSize: string;
  rowCount: number;
  nullEmbeddings: number;
  emptyContent: number;
  duplicateContent: number;
  categories: string[];
  usageScore: number;
}

interface IndexAnalysis {
  name: string;
  tableName: string;
  size: string;
  timesUsed: number;
  usageStatus: 'unused' | 'low' | 'normal' | 'high';
  recommendation: string;
}

interface DatabaseSummary {
  totalSize: string;
  freeSpaceLeft: string;
  freeSpacePercentage: number;
  tables: TableAnalysis[];
  indexes: IndexAnalysis[];
  cleanupRecommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

class SupabaseDatabaseAnalyzer {
  private supabase;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }

  /**
   * 🔍 전체 데이터베이스 분석 실행
   */
  async analyzeDatabase(): Promise<DatabaseSummary> {
    console.log('🔍 Supabase 데이터베이스 분석 시작...');

    try {
      // 1. 기본 통계 수집
      const totalSize = await this.getTotalDatabaseSize();
      const freeSpace = this.calculateFreeSpace(totalSize);

      // 2. 테이블 분석
      console.log('📊 테이블 분석 중...');
      const tables = await this.analyzeAllTables();

      // 3. 인덱스 분석
      console.log('🔍 인덱스 분석 중...');
      const indexes = await this.analyzeIndexes();

      // 4. 정리 권장사항 생성
      console.log('💡 정리 권장사항 생성 중...');
      const cleanupRecommendations = this.generateCleanupRecommendations(tables, indexes, freeSpace.percentage);

      // 5. 위험도 평가
      const riskLevel = this.assessRiskLevel(freeSpace.percentage, tables, indexes);

      const summary: DatabaseSummary = {
        totalSize: totalSize,
        freeSpaceLeft: freeSpace.left,
        freeSpacePercentage: freeSpace.percentage,
        tables,
        indexes,
        cleanupRecommendations,
        riskLevel
      };

      console.log('✅ 데이터베이스 분석 완료');
      return summary;

    } catch (error) {
      console.error('❌ 데이터베이스 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 📊 전체 데이터베이스 크기 조회
   */
  private async getTotalDatabaseSize(): Promise<string> {
    const { data, error } = await this.supabase.rpc('execute_sql', {
      query: `SELECT pg_size_pretty(pg_database_size(current_database())) as size;`
    });

    if (error) {
      throw new Error(`데이터베이스 크기 조회 실패: ${error.message}`);
    }

    return data?.[0]?.size || '0 bytes';
  }

  /**
   * 📊 무료 티어 여유 공간 계산
   */
  private calculateFreeSpace(totalSize: string): { left: string; percentage: number } {
    // 무료 티어 제한: 500MB
    const freeLimit = 500 * 1024 * 1024; // 500MB in bytes
    
    // 크기 문자열을 바이트로 변환 (단순화된 방식)
    const sizeMatch = totalSize.match(/(\d+\.?\d*)\s*(\w+)/);
    let sizeInBytes = 0;
    
    if (sizeMatch) {
      const value = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2].toLowerCase();
      
      switch (unit) {
        case 'bytes':
          sizeInBytes = value;
          break;
        case 'kb':
          sizeInBytes = value * 1024;
          break;
        case 'mb':
          sizeInBytes = value * 1024 * 1024;
          break;
        case 'gb':
          sizeInBytes = value * 1024 * 1024 * 1024;
          break;
      }
    }

    const freeSpaceBytes = Math.max(0, freeLimit - sizeInBytes);
    const freeSpacePercentage = Math.round((freeSpaceBytes / freeLimit) * 100);
    
    let freeSpaceText = '';
    if (freeSpaceBytes >= 1024 * 1024) {
      freeSpaceText = `${Math.round(freeSpaceBytes / (1024 * 1024))}MB`;
    } else if (freeSpaceBytes >= 1024) {
      freeSpaceText = `${Math.round(freeSpaceBytes / 1024)}KB`;
    } else {
      freeSpaceText = `${freeSpaceBytes}bytes`;
    }

    return {
      left: freeSpaceText,
      percentage: freeSpacePercentage
    };
  }

  /**
   * 📋 모든 테이블 분석
   */
  private async analyzeAllTables(): Promise<TableAnalysis[]> {
    const tables: TableAnalysis[] = [];

    // command_vectors 테이블 분석 (RAG 시스템의 핵심 테이블)
    const ragTableAnalysis = await this.analyzeRAGTable();
    if (ragTableAnalysis) {
      tables.push(ragTableAnalysis);
    }

    // 기타 사용자 테이블 분석
    const otherTables = await this.analyzeOtherTables();
    tables.push(...otherTables);

    return tables;
  }

  /**
   * 🤖 RAG 테이블 상세 분석
   */
  private async analyzeRAGTable(): Promise<TableAnalysis | null> {
    try {
      // 기본 통계 조회
      const { data: stats } = await this.supabase
        .from('command_vectors')
        .select('*', { count: 'exact' });

      if (!stats) return null;

      // 상세 분석 쿼리
      const { data: detailStats, error } = await this.supabase.rpc('execute_sql', {
        query: `
          SELECT 
            COUNT(*) as total_rows,
            COUNT(CASE WHEN embedding IS NULL THEN 1 END) as null_embeddings,
            COUNT(CASE WHEN content IS NULL OR LENGTH(TRIM(content)) < 10 THEN 1 END) as empty_content,
            COUNT(DISTINCT metadata->>'category') as unique_categories,
            pg_size_pretty(pg_total_relation_size('command_vectors')) as total_size,
            pg_size_pretty(pg_relation_size('command_vectors')) as table_size,
            pg_size_pretty(pg_total_relation_size('command_vectors') - pg_relation_size('command_vectors')) as index_size
          FROM command_vectors;
        `
      });

      if (error) {
        console.warn('⚠️ RAG 테이블 상세 분석 실패:', error.message);
        return null;
      }

      const detail = detailStats?.[0];
      if (!detail) return null;

      // 중복 콘텐츠 분석
      const { data: duplicates } = await this.supabase.rpc('execute_sql', {
        query: `
          SELECT COUNT(*) as duplicate_count
          FROM (
            SELECT MD5(content), COUNT(*) 
            FROM command_vectors 
            WHERE content IS NOT NULL AND LENGTH(content) > 10
            GROUP BY MD5(content) 
            HAVING COUNT(*) > 1
          ) dups;
        `
      });

      // 카테고리 목록 조회
      const { data: categoryData } = await this.supabase.rpc('execute_sql', {
        query: `
          SELECT DISTINCT metadata->>'category' as category
          FROM command_vectors 
          WHERE metadata->>'category' IS NOT NULL
          ORDER BY category;
        `
      });

      const categories = categoryData?.map(row => row.category).filter(Boolean) || [];

      // 사용률 점수 계산 (0-100)
      const usageScore = this.calculateTableUsageScore({
        totalRows: detail.total_rows,
        nullEmbeddings: detail.null_embeddings,
        emptyContent: detail.empty_content,
        duplicateContent: duplicates?.[0]?.duplicate_count || 0
      });

      return {
        name: 'command_vectors',
        totalSize: detail.total_size,
        tableSize: detail.table_size,
        indexSize: detail.index_size,
        rowCount: detail.total_rows,
        nullEmbeddings: detail.null_embeddings,
        emptyContent: detail.empty_content,
        duplicateContent: duplicates?.[0]?.duplicate_count || 0,
        categories,
        usageScore
      };

    } catch (error) {
      console.warn('⚠️ RAG 테이블 분석 중 오류:', error);
      return null;
    }
  }

  /**
   * 📋 기타 테이블 분석
   */
  private async analyzeOtherTables(): Promise<TableAnalysis[]> {
    try {
      const { data: tableList, error } = await this.supabase.rpc('execute_sql', {
        query: `
          SELECT 
            tablename,
            pg_size_pretty(pg_total_relation_size(tablename::regclass)) as total_size,
            pg_size_pretty(pg_relation_size(tablename::regclass)) as table_size,
            pg_size_pretty(pg_total_relation_size(tablename::regclass) - pg_relation_size(tablename::regclass)) as index_size
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename != 'command_vectors'
          ORDER BY pg_total_relation_size(tablename::regclass) DESC;
        `
      });

      if (error || !tableList) {
        return [];
      }

      const tables: TableAnalysis[] = [];

      for (const table of tableList) {
        // 각 테이블의 행 수 조회
        const { count } = await this.supabase
          .from(table.tablename)
          .select('*', { count: 'exact', head: true });

        tables.push({
          name: table.tablename,
          totalSize: table.total_size,
          tableSize: table.table_size,
          indexSize: table.index_size,
          rowCount: count || 0,
          nullEmbeddings: 0, // RAG 테이블이 아니므로 N/A
          emptyContent: 0,   // RAG 테이블이 아니므로 N/A
          duplicateContent: 0, // 간단화
          categories: [],
          usageScore: count > 0 ? 80 : 20 // 단순한 점수 계산
        });
      }

      return tables;

    } catch (error) {
      console.warn('⚠️ 기타 테이블 분석 중 오류:', error);
      return [];
    }
  }

  /**
   * 🔍 인덱스 분석
   */
  private async analyzeIndexes(): Promise<IndexAnalysis[]> {
    try {
      const { data: indexStats, error } = await this.supabase.rpc('execute_sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            indexname,
            idx_scan as times_used,
            pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
          FROM pg_stat_user_indexes
          WHERE schemaname = 'public'
          ORDER BY idx_scan ASC;
        `
      });

      if (error || !indexStats) {
        return [];
      }

      return indexStats.map(index => {
        let usageStatus: 'unused' | 'low' | 'normal' | 'high';
        let recommendation: string;

        if (index.times_used === 0) {
          usageStatus = 'unused';
          recommendation = '⚠️ 사용되지 않음 - 제거 검토';
        } else if (index.times_used < 100) {
          usageStatus = 'low';
          recommendation = '⚡ 저사용 - 필요성 검토';
        } else if (index.times_used < 1000) {
          usageStatus = 'normal';
          recommendation = '✅ 정상 사용';
        } else {
          usageStatus = 'high';
          recommendation = '🔥 높은 사용률 - 유지 필수';
        }

        return {
          name: index.indexname,
          tableName: index.tablename,
          size: index.index_size,
          timesUsed: index.times_used,
          usageStatus,
          recommendation
        };
      });

    } catch (error) {
      console.warn('⚠️ 인덱스 분석 중 오류:', error);
      return [];
    }
  }

  /**
   * 📊 테이블 사용률 점수 계산
   */
  private calculateTableUsageScore(stats: {
    totalRows: number;
    nullEmbeddings: number;
    emptyContent: number;
    duplicateContent: number;
  }): number {
    if (stats.totalRows === 0) return 0;

    // 100점에서 문제점들을 차감
    let score = 100;

    // 임베딩 없는 문서 비율 (최대 -30점)
    const nullEmbeddingRatio = stats.nullEmbeddings / stats.totalRows;
    score -= Math.min(30, nullEmbeddingRatio * 100);

    // 빈 콘텐츠 비율 (최대 -25점)
    const emptyContentRatio = stats.emptyContent / stats.totalRows;
    score -= Math.min(25, emptyContentRatio * 100);

    // 중복 콘텐츠 비율 (최대 -20점)
    const duplicateRatio = stats.duplicateContent / stats.totalRows;
    score -= Math.min(20, duplicateRatio * 50); // 중복은 절반만 차감

    return Math.max(0, Math.round(score));
  }

  /**
   * 💡 정리 권장사항 생성
   */
  private generateCleanupRecommendations(
    tables: TableAnalysis[],
    indexes: IndexAnalysis[],
    freeSpacePercentage: number
  ): string[] {
    const recommendations: string[] = [];

    // 1. 무료 티어 여유 공간 기반 권장사항
    if (freeSpacePercentage < 20) {
      recommendations.push('🚨 긴급: 무료 티어 한계 근접 - 즉시 데이터 정리 필요');
    } else if (freeSpacePercentage < 40) {
      recommendations.push('⚠️ 주의: 무료 티어 여유 공간 부족 - 정기 정리 권장');
    }

    // 2. 테이블별 권장사항
    for (const table of tables) {
      if (table.usageScore < 60) {
        recommendations.push(`📋 ${table.name}: 사용률 ${table.usageScore}% - 데이터 품질 개선 필요`);
      }

      if (table.nullEmbeddings > 0) {
        recommendations.push(`🤖 ${table.name}: 임베딩 없는 문서 ${table.nullEmbeddings}개 - 임베딩 생성 또는 삭제`);
      }

      if (table.emptyContent > 0) {
        recommendations.push(`📝 ${table.name}: 빈 콘텐츠 문서 ${table.emptyContent}개 - 삭제 권장`);
      }

      if (table.duplicateContent > 0) {
        recommendations.push(`🔄 ${table.name}: 중복 문서 ${table.duplicateContent}개 - 중복 제거로 공간 절약`);
      }
    }

    // 3. 인덱스 권장사항
    const unusedIndexes = indexes.filter(idx => idx.usageStatus === 'unused');
    if (unusedIndexes.length > 0) {
      recommendations.push(`🗑️ 사용되지 않는 인덱스 ${unusedIndexes.length}개 - 제거로 공간 절약`);
    }

    const lowUsageIndexes = indexes.filter(idx => idx.usageStatus === 'low');
    if (lowUsageIndexes.length > 0) {
      recommendations.push(`⚡ 저사용 인덱스 ${lowUsageIndexes.length}개 - 필요성 재검토`);
    }

    // 4. 일반적인 유지보수 권장사항
    recommendations.push('🧹 주간 정리: SELECT weekly_cleanup(); 실행 권장');
    recommendations.push('📊 월간 분석: VACUUM ANALYZE 실행으로 성능 최적화');

    return recommendations;
  }

  /**
   * ⚠️ 위험도 평가
   */
  private assessRiskLevel(
    freeSpacePercentage: number,
    tables: TableAnalysis[],
    indexes: IndexAnalysis[]
  ): 'low' | 'medium' | 'high' {
    // 무료 티어 여유 공간 기준
    if (freeSpacePercentage < 20) return 'high';
    if (freeSpacePercentage < 40) return 'medium';

    // 데이터 품질 기준
    const avgUsageScore = tables.reduce((sum, table) => sum + table.usageScore, 0) / tables.length;
    if (avgUsageScore < 50) return 'high';
    if (avgUsageScore < 70) return 'medium';

    // 인덱스 효율성 기준
    const unusedIndexes = indexes.filter(idx => idx.usageStatus === 'unused').length;
    if (unusedIndexes > 3) return 'medium';

    return 'low';
  }

  /**
   * 📄 분석 리포트 생성
   */
  async generateReport(summary: DatabaseSummary): Promise<string> {
    const report = `# 🔍 Supabase 데이터베이스 분석 리포트

**생성일**: ${new Date().toLocaleString('ko-KR')}
**위험도**: ${this.getRiskEmoji(summary.riskLevel)} ${summary.riskLevel.toUpperCase()}

## 📊 전체 현황

- **전체 크기**: ${summary.totalSize}
- **무료 티어 여유**: ${summary.freeSpaceLeft} (${summary.freeSpacePercentage}%)
- **위험도**: ${summary.riskLevel}

## 📋 테이블 분석

${summary.tables.map(table => `
### ${table.name}
- **크기**: ${table.totalSize} (테이블: ${table.tableSize}, 인덱스: ${table.indexSize})
- **행 수**: ${table.rowCount.toLocaleString()}개
- **사용률 점수**: ${table.usageScore}/100
${table.nullEmbeddings > 0 ? `- **임베딩 없음**: ${table.nullEmbeddings}개` : ''}
${table.emptyContent > 0 ? `- **빈 콘텐츠**: ${table.emptyContent}개` : ''}
${table.duplicateContent > 0 ? `- **중복 문서**: ${table.duplicateContent}개` : ''}
${table.categories.length > 0 ? `- **카테고리**: ${table.categories.join(', ')}` : ''}
`).join('')}

## 🔍 인덱스 분석

${summary.indexes.map(index => `
- **${index.name}** (${index.tableName}): ${index.size}, ${index.timesUsed.toLocaleString()}회 사용 - ${index.recommendation}
`).join('')}

## 💡 정리 권장사항

${summary.cleanupRecommendations.map(rec => `- ${rec}`).join('\n')}

## 🚀 실행 권장 명령어

\`\`\`bash
# 데이터베이스 분석 실행
npm run db:analyze

# 정리 작업 실행 (주의: 백업 후 실행)
psql -h [SUPABASE_HOST] -f scripts/supabase/cleanup-recommendations.sql

# 주간 정리 작업
SELECT weekly_cleanup();
\`\`\`

---
*이 리포트는 자동 생성되었습니다. 실제 정리 작업 전에는 반드시 백업을 수행하세요.*
`;

    return report;
  }

  private getRiskEmoji(risk: string): string {
    switch (risk) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '✅';
      default: return '❓';
    }
  }
}

/**
 * 🚀 메인 실행 함수
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';

  switch (command) {
    case 'analyze':
      console.log('🔍 Supabase 데이터베이스 분석 시작...');
      
      const analyzer = new SupabaseDatabaseAnalyzer();
      const summary = await analyzer.analyzeDatabase();
      
      // 콘솔 출력
      console.log('\n📊 === 분석 결과 요약 ===');
      console.log(`💾 전체 크기: ${summary.totalSize}`);
      console.log(`🆓 여유 공간: ${summary.freeSpaceLeft} (${summary.freeSpacePercentage}%)`);
      console.log(`⚠️ 위험도: ${summary.riskLevel}`);
      console.log(`📋 테이블 수: ${summary.tables.length}개`);
      console.log(`🔍 인덱스 수: ${summary.indexes.length}개`);
      console.log(`💡 권장사항: ${summary.cleanupRecommendations.length}개`);

      // 리포트 파일 생성
      const report = await analyzer.generateReport(summary);
      const reportPath = path.join(process.cwd(), 'reports', `supabase-analysis-${Date.now()}.md`);
      
      try {
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, report, 'utf-8');
        console.log(`📄 상세 리포트 생성: ${reportPath}`);
      } catch (error) {
        console.warn('⚠️ 리포트 파일 생성 실패:', error);
      }

      // 위험도별 메시지
      if (summary.riskLevel === 'high') {
        console.log('\n🚨 높은 위험도: 즉시 정리 작업이 필요합니다!');
      } else if (summary.riskLevel === 'medium') {
        console.log('\n⚠️ 보통 위험도: 정기 정리를 권장합니다.');
      } else {
        console.log('\n✅ 낮은 위험도: 현재 상태 양호합니다.');
      }

      break;

    case 'help':
      console.log(`
🔍 Supabase 데이터베이스 분석 도구

사용법:
  npm run db:analyze          # 전체 분석 실행
  npm run db:analyze help     # 도움말 표시

주요 기능:
  ✅ 테이블 크기 및 사용률 분석
  ✅ 불필요한 인덱스 탐지
  ✅ 중복/빈 데이터 식별
  ✅ 무료 티어 사용률 모니터링
  ✅ 자동 정리 권장사항 생성
  ✅ 위험도 평가 및 알림

리포트 위치:
  reports/supabase-analysis-*.md

환경 변수:
  SUPABASE_URL              # Supabase 프로젝트 URL
  SUPABASE_SERVICE_ROLE_KEY # 서비스 롤 키 (분석용)
      `);
      break;

    default:
      console.error(`❌ 알 수 없는 명령어: ${command}`);
      process.exit(1);
  }
}

// 직접 실행 시에만 main 함수 호출
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
}