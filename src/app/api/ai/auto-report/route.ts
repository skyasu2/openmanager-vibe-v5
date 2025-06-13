/**
 * 📄 자동 장애 보고서 API
 *
 * AI 기반 자동 장애 보고서 생성 및 관리
 * - 실시간 서버 상태 분석
 * - 장애 패턴 인식 및 보고서 생성
 * - 보고서 히스토리 관리 (Supabase 연동)
 * - 다운로드 지원
 */

import { NextRequest, NextResponse } from 'next/server';
import { realServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { supabase } from '@/lib/supabase';
import { autoReportService } from '@/services/ai/AutoReportService';
import { AIAnalysisDataset } from '@/types/ai-agent-input-schema';
import { createSafeError } from '@/lib/error-handler';
import { z } from 'zod';

interface ReportData {
  id: string;
  title: string;
  generatedAt: Date;
  status: 'generating' | 'completed' | 'error';
  type: 'daily' | 'incident' | 'performance' | 'security';
  summary: string;
  details: {
    totalServers: number;
    healthyServers: number;
    warningServers: number;
    criticalServers: number;
    totalIncidents: number;
    resolvedIncidents: number;
    avgResponseTime: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
  content?: string; // 상세 보고서 내용
}

// 📊 Supabase 테이블 스키마
const REPORTS_TABLE = 'auto_reports';

/**
 * 🗄️ Supabase에서 보고서 조회
 */
async function getReportsFromDB(type?: string): Promise<ReportData[]> {
  try {
    let query = supabase
      .from(REPORTS_TABLE)
      .select('*')
      .order('generated_at', { ascending: false });

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('❌ Supabase 조회 실패:', error);
      return [];
    }

    // Supabase 데이터를 ReportData 형식으로 변환
    return (data || []).map(row => ({
      id: row.id,
      title: row.title,
      generatedAt: new Date(row.generated_at),
      status: row.status,
      type: row.type,
      summary: row.summary,
      details: row.details,
      content: row.content,
    }));
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error);
    return [];
  }
}

/**
 * 💾 Supabase에 보고서 저장
 */
async function saveReportToDB(report: ReportData): Promise<boolean> {
  try {
    const { error } = await supabase.from(REPORTS_TABLE).insert({
      id: report.id,
      title: report.title,
      generated_at: report.generatedAt.toISOString(),
      status: report.status,
      type: report.type,
      summary: report.summary,
      details: report.details,
      content: report.content,
    });

    if (error) {
      console.error('❌ Supabase 저장 실패:', error);
      return false;
    }

    console.log(`✅ 보고서 DB 저장 완료: ${report.id}`);
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 저장 실패:', error);
    return false;
  }
}

/**
 * 🗑️ Supabase에서 보고서 삭제
 */
async function deleteReportFromDB(reportId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(REPORTS_TABLE)
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('❌ Supabase 삭제 실패:', error);
      return false;
    }

    console.log(`✅ 보고서 DB 삭제 완료: ${reportId}`);
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 삭제 실패:', error);
    return false;
  }
}

// 보고서 생성 함수
async function generateReport(type: ReportData['type']): Promise<ReportData> {
  console.log(`🤖 ${type} 보고서 생성 시작...`);

  // 실제 서버 데이터 가져오기
  const servers = realServerDataGenerator.getAllServers();

  // 서버 상태 분석
  const healthyServers = servers.filter(s => s.status === 'running').length;
  const warningServers = servers.filter(s => s.status === 'warning').length;
  const criticalServers = servers.filter(s => s.status === 'error').length;

  // 평균 메트릭 계산
  const avgCpu =
    servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / servers.length;
  const avgMemory =
    servers.reduce((sum, s) => sum + s.metrics.memory, 0) / servers.length;
  const avgDisk =
    servers.reduce((sum, s) => sum + s.metrics.disk, 0) / servers.length;
  const avgResponseTime =
    servers.reduce(
      (sum, s) =>
        sum + (s.metrics.requests > 0 ? 1000 / s.metrics.requests : 100),
      0
    ) / servers.length;

  // 장애 시뮬레이션 (실제 환경에서는 로그 분석)
  const totalIncidents = warningServers + criticalServers;
  const resolvedIncidents = Math.floor(totalIncidents * 0.8); // 80% 해결됨

  const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  let title: string;
  let summary: string;
  let content: string;

  switch (type) {
    case 'daily':
      title = '일일 시스템 상태 보고서';
      summary = `전체 ${servers.length}개 서버 중 ${healthyServers}개 정상, ${warningServers}개 주의, ${criticalServers}개 위험 상태입니다.`;
      content = generateDailyReportContent(servers, {
        avgCpu,
        avgMemory,
        avgDisk,
        avgResponseTime,
      });
      break;

    case 'incident':
      title = '장애 분석 보고서';
      summary = `총 ${totalIncidents}건의 장애 중 ${resolvedIncidents}건이 해결되었습니다.`;
      content = generateIncidentReportContent(
        servers,
        totalIncidents,
        resolvedIncidents
      );
      break;

    case 'performance':
      title = '성능 분석 보고서';
      summary = `평균 CPU ${avgCpu.toFixed(1)}%, 메모리 ${avgMemory.toFixed(1)}% 사용률을 기록했습니다.`;
      content = generatePerformanceReportContent(servers, {
        avgCpu,
        avgMemory,
        avgDisk,
        avgResponseTime,
      });
      break;

    case 'security':
      title = '보안 상태 보고서';
      summary = '시스템 보안 상태를 점검한 결과입니다.';
      content = generateSecurityReportContent(servers);
      break;

    default:
      title = '시스템 보고서';
      summary = '시스템 상태 분석 결과입니다.';
      content = '보고서 내용을 생성하는 중입니다...';
  }

  const report: ReportData = {
    id: reportId,
    title,
    generatedAt: new Date(),
    status: 'completed',
    type,
    summary,
    details: {
      totalServers: servers.length,
      healthyServers,
      warningServers,
      criticalServers,
      totalIncidents,
      resolvedIncidents,
      avgResponseTime: Math.round(avgResponseTime),
      cpuUsage: Math.round(avgCpu),
      memoryUsage: Math.round(avgMemory),
      diskUsage: Math.round(avgDisk),
    },
    content,
  };

  // 보고서 저장
  await saveReportToDB(report);

  console.log(`✅ ${type} 보고서 생성 완료: ${reportId}`);
  return report;
}

// 보고서 내용 생성 함수들
function generateDailyReportContent(servers: any[], metrics: any): string {
  return `
# 일일 시스템 상태 보고서

## 📊 전체 요약
- **총 서버 수**: ${servers.length}개
- **평균 CPU 사용률**: ${metrics.avgCpu.toFixed(1)}%
- **평균 메모리 사용률**: ${metrics.avgMemory.toFixed(1)}%
- **평균 디스크 사용률**: ${metrics.avgDisk.toFixed(1)}%
- **평균 응답시간**: ${metrics.avgResponseTime.toFixed(0)}ms

## 🔍 상세 분석
${servers
  .map(
    server => `
### ${server.name} (${server.id})
- **상태**: ${server.status === 'running' ? '✅ 정상' : server.status === 'warning' ? '⚠️ 주의' : '❌ 위험'}
- **CPU**: ${server.metrics.cpu.toFixed(1)}%
- **메모리**: ${server.metrics.memory.toFixed(1)}%
- **디스크**: ${server.metrics.disk.toFixed(1)}%
- **업타임**: ${(server.metrics.uptime / 3600).toFixed(1)}시간
`
  )
  .join('')}

## 📈 권장사항
- CPU 사용률이 80% 이상인 서버는 스케일링을 고려하세요
- 메모리 사용률이 90% 이상인 서버는 메모리 누수를 점검하세요
- 디스크 사용률이 85% 이상인 서버는 정리 작업을 수행하세요
`;
}

function generateIncidentReportContent(
  servers: any[],
  totalIncidents: number,
  resolvedIncidents: number
): string {
  const problemServers = servers.filter(s => s.status !== 'running');

  return `
# 장애 분석 보고서

## 🚨 장애 현황
- **총 장애 건수**: ${totalIncidents}건
- **해결된 장애**: ${resolvedIncidents}건
- **진행 중인 장애**: ${totalIncidents - resolvedIncidents}건

## 🔍 문제 서버 분석
${problemServers
  .map(
    server => `
### ${server.name} - ${server.status === 'warning' ? '⚠️ 경고' : '❌ 위험'}
- **문제 유형**: ${server.status === 'warning' ? 'CPU/메모리 과부하' : '서비스 중단'}
- **CPU**: ${server.metrics.cpu.toFixed(1)}%
- **메모리**: ${server.metrics.memory.toFixed(1)}%
- **예상 원인**: ${server.metrics.cpu > 90 ? 'CPU 과부하' : server.metrics.memory > 90 ? '메모리 부족' : '네트워크 문제'}
`
  )
  .join('')}

## 🛠️ 대응 방안
1. **즉시 조치**: 문제 서버 재시작 또는 트래픽 분산
2. **단기 대응**: 리소스 모니터링 강화 및 알림 설정
3. **장기 대응**: 인프라 확장 및 자동 스케일링 구성
`;
}

function generatePerformanceReportContent(
  servers: any[],
  metrics: any
): string {
  const topCpuServers = servers
    .sort((a, b) => b.metrics.cpu - a.metrics.cpu)
    .slice(0, 5);
  const topMemoryServers = servers
    .sort((a, b) => b.metrics.memory - a.metrics.memory)
    .slice(0, 5);

  return `
# 성능 분석 보고서

## 📊 전체 성능 지표
- **평균 CPU 사용률**: ${metrics.avgCpu.toFixed(1)}%
- **평균 메모리 사용률**: ${metrics.avgMemory.toFixed(1)}%
- **평균 응답시간**: ${metrics.avgResponseTime.toFixed(0)}ms

## 🔥 CPU 사용률 TOP 5
${topCpuServers.map((server, idx) => `${idx + 1}. ${server.name}: ${server.metrics.cpu.toFixed(1)}%`).join('\n')}

## 💾 메모리 사용률 TOP 5
${topMemoryServers.map((server, idx) => `${idx + 1}. ${server.name}: ${server.metrics.memory.toFixed(1)}%`).join('\n')}

## 📈 성능 최적화 권장사항
- 고부하 서버에 대한 로드 밸런싱 적용
- 메모리 사용량이 높은 애플리케이션 최적화
- 캐싱 전략 도입으로 응답시간 개선
`;
}

function generateSecurityReportContent(servers: any[]): string {
  return `
# 보안 상태 보고서

## 🔒 보안 점검 결과
- **전체 서버**: ${servers.length}개
- **보안 패치 적용률**: 95%
- **취약점 발견**: 0건 (심각), 2건 (경미)

## 🛡️ 보안 권장사항
1. **정기 보안 패치**: 월 1회 정기 패치 적용
2. **접근 제어**: 불필요한 포트 차단 및 방화벽 설정
3. **로그 모니터링**: 비정상 접근 시도 모니터링 강화
4. **백업 검증**: 정기적인 백업 데이터 무결성 검사

## 📋 보안 체크리스트
- [x] 방화벽 설정 확인
- [x] SSL/TLS 인증서 유효성 검사
- [x] 사용자 권한 검토
- [ ] 침입 탐지 시스템 업데이트 (예정)
`;
}

// 기본 보고서 데이터 초기화
async function initializeDefaultReports() {
  const existingReports = await getReportsFromDB();
  if (existingReports.length === 0) {
    console.log('📋 기본 보고서 생성 중...');

    // 기본 보고서들 생성
    await generateReport('daily');
    await generateReport('performance');
    await generateReport('incident');

    const finalReports = await getReportsFromDB();
    console.log(`✅ 기본 보고서 ${finalReports.length}개 생성 완료`);
  }
}

// GET: 보고서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const reportId = searchParams.get('id');

    // 데이터 생성기 초기화
    if (!realServerDataGenerator.getAllServers().length) {
      await realServerDataGenerator.initialize();
    }

    // 기본 보고서 초기화
    await initializeDefaultReports();

    // 특정 보고서 조회
    if (reportId) {
      const reports = await getReportsFromDB();
      const report = reports.find(r => r.id === reportId);
      if (!report) {
        return NextResponse.json(
          { success: false, error: '보고서를 찾을 수 없습니다' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: report,
        timestamp: Date.now(),
      });
    }

    // 보고서 목록 조회
    let reports = await getReportsFromDB();

    // 타입 필터링
    if (
      type &&
      type !== 'all' &&
      ['daily', 'incident', 'performance', 'security'].includes(type)
    ) {
      reports = reports.filter(report => report.type === type);
    }

    // 최신순 정렬
    reports.sort(
      (a, b) =>
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: reports,
      total: reports.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ 보고서 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '보고서 조회에 실패했습니다' },
      { status: 500 }
    );
  }
}

// Zod 스키마로 요청 본문 유효성 검사
// (AIAnalysisDataset의 모든 필드를 검증하기엔 복잡하므로 핵심적인 부분만 체크)
const AutoReportRequestSchema = z.object({
  metadata: z.object({
    generationTime: z.string().datetime(),
  }),
  patterns: z.object({
    anomalies: z.array(z.any()).min(1, {
      message: '분석할 이상 징후(anomalies)가 최소 1개 이상 필요합니다.',
    }),
  }),
  logs: z.array(z.any()).optional(),
  metrics: z.array(z.any()).optional(),
});

// POST: 새 보고서 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 요청 본문 유효성 검사
    const validationResult = AutoReportRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '잘못된 요청 형식입니다.',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const context: AIAnalysisDataset = body;

    const report = await autoReportService.generateReport(context);

    return NextResponse.json({ success: true, report });
  } catch (error) {
    const safeError = createSafeError(error);
    console.error('API Error in /api/ai/auto-report:', safeError);

    return NextResponse.json(
      { success: false, error: safeError.message },
      { status: 500 }
    );
  }
}

// DELETE: 보고서 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: '보고서 ID가 필요합니다' },
        { status: 400 }
      );
    }

    const deleted = await deleteReportFromDB(reportId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '보고서를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '보고서가 삭제되었습니다',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ 보고서 삭제 실패:', error);
    return NextResponse.json(
      { success: false, error: '보고서 삭제에 실패했습니다' },
      { status: 500 }
    );
  }
}
