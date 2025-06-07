/**
 * 📄 자동 장애 보고서 조회 패널 컴포넌트 (사이드 패널용)
 *
 * - 자동 생성된 보고서 조회
 * - 보고서 다운로드
 * - 실시간 상태 확인
 * - 보고서 관리는 관리 페이지에서만 가능
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react';
import BasePanelLayout from './shared/BasePanelLayout';
import { useDataLoader } from '@/hooks/useDataLoader';

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
}

interface AutoReportPanelProps {
  className?: string;
}

// Mock 데이터 생성 함수
const generateMockReports = (): ReportData[] => [
  {
    id: 'report_1',
    title: '일일 시스템 상태 보고서',
    generatedAt: new Date(Date.now() - 1800000), // 30분 전
    status: 'completed',
    type: 'daily',
    summary: '전체적으로 안정적인 상태이나 일부 서버에서 주의가 필요합니다.',
    details: {
      totalServers: 16,
      healthyServers: 14,
      warningServers: 2,
      criticalServers: 0,
      totalIncidents: 3,
      resolvedIncidents: 3,
      avgResponseTime: 125,
      cpuUsage: 68,
      memoryUsage: 72,
      diskUsage: 45,
    },
  },
  {
    id: 'report_2',
    title: '성능 분석 보고서',
    generatedAt: new Date(Date.now() - 3600000), // 1시간 전
    status: 'completed',
    type: 'performance',
    summary: 'CPU 사용률이 점진적으로 증가하는 추세입니다.',
    details: {
      totalServers: 16,
      healthyServers: 13,
      warningServers: 3,
      criticalServers: 0,
      totalIncidents: 1,
      resolvedIncidents: 1,
      avgResponseTime: 148,
      cpuUsage: 78,
      memoryUsage: 65,
      diskUsage: 52,
    },
  },
  {
    id: 'report_3',
    title: '장애 분석 보고서',
    generatedAt: new Date(Date.now() - 7200000), // 2시간 전
    status: 'completed',
    type: 'incident',
    summary: '어제 발생한 3건의 장애를 분석한 결과입니다.',
    details: {
      totalServers: 16,
      healthyServers: 16,
      warningServers: 0,
      criticalServers: 0,
      totalIncidents: 3,
      resolvedIncidents: 3,
      avgResponseTime: 112,
      cpuUsage: 62,
      memoryUsage: 58,
      diskUsage: 41,
    },
  },
  {
    id: 'report_4',
    title: '자동 생성 중...',
    generatedAt: new Date(),
    status: 'generating',
    type: 'security',
    summary: '보안 상태 보고서를 생성하고 있습니다...',
    details: {
      totalServers: 16,
      healthyServers: 0,
      warningServers: 0,
      criticalServers: 0,
      totalIncidents: 0,
      resolvedIncidents: 0,
      avgResponseTime: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
    },
  },
];

const AutoReportPanel: React.FC<AutoReportPanelProps> = ({
  className = '',
}) => {
  // 데이터 로딩 (30초마다 자동 새로고침)
  // Mock 데이터 사용
  const [reports, setReports] = React.useState<ReportData[]>(
    generateMockReports()
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const reload = React.useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setReports(generateMockReports());
      setIsLoading(false);
    }, 1000);
  }, []);

  // 필터 상태 관리
  const [selectedFilter, setSelectedFilter] = React.useState<
    'all' | 'daily' | 'incident' | 'performance' | 'security'
  >('all');

  // 필터 설정
  const reportTypes = [
    { id: 'all', label: '전체', icon: '📊' },
    { id: 'daily', label: '일일 보고서', icon: '📋' },
    { id: 'incident', label: '장애 분석', icon: '🚨' },
    { id: 'performance', label: '성능 분석', icon: '⚡' },
    { id: 'security', label: '보안 상태', icon: '🔒' },
  ];

  // 필터링된 보고서들
  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return selectedFilter === 'all'
      ? reports
      : reports.filter((report: ReportData) => report.type === selectedFilter);
  }, [reports, selectedFilter]);

  // 유틸리티 함수들
  const downloadReport = (reportId: string) => {
    console.log('보고서 다운로드:', reportId);
    alert('보고서 다운로드가 시작됩니다.');
  };

  const getStatusIcon = (status: ReportData['status']) => {
    switch (status) {
      case 'generating':
        return <Clock className='w-4 h-4 text-yellow-400 animate-pulse' />;
      case 'completed':
        return <CheckCircle className='w-4 h-4 text-green-400' />;
      case 'error':
        return <AlertTriangle className='w-4 h-4 text-red-400' />;
    }
  };

  const getStatusText = (status: ReportData['status']) => {
    switch (status) {
      case 'generating':
        return '생성 중';
      case 'completed':
        return '완료';
      case 'error':
        return '오류';
    }
  };

  const getTypeIcon = (type: string) => {
    const typeMap = {
      daily: '📋',
      incident: '🚨',
      performance: '⚡',
      security: '🔒',
    };
    return typeMap[type as keyof typeof typeMap] || '📊';
  };

  return (
    <BasePanelLayout
      title='자동 보고서'
      subtitle='AI가 자동 생성한 분석 보고서'
      icon={<FileText className='w-4 h-4 text-white' />}
      iconGradient='bg-gradient-to-br from-green-500 to-blue-600'
      onRefresh={reload}
      isLoading={isLoading}
      adminPath='/admin/ai-agent/reports'
      adminLabel='관리'
      filters={reportTypes}
      selectedFilter={selectedFilter}
      onFilterChange={filterId => setSelectedFilter(filterId as any)}
      bottomInfo={{
        primary: '🤖 보고서는 AI가 자동으로 분석하여 생성합니다',
        secondary:
          '보고서 스케줄링 및 상세 관리는 관리자 페이지에서 가능합니다',
      }}
      className={className}
    >
      {/* 보고서 목록 */}
      <div className='p-4'>
        <div className='space-y-3'>
          {filteredReports.map((report: ReportData) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-gray-800/50 border border-gray-600/30 rounded-lg p-4 hover:bg-gray-700/30 transition-colors'
            >
              {/* 보고서 헤더 */}
              <div className='flex items-start justify-between mb-3'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='text-lg'>{getTypeIcon(report.type)}</span>
                    <h4 className='text-white font-medium text-sm'>
                      {report.title}
                    </h4>
                    {getStatusIcon(report.status as ReportData['status'])}
                    <span className='text-xs text-gray-400'>
                      {getStatusText(report.status as ReportData['status'])}
                    </span>
                  </div>
                  <p className='text-gray-400 text-xs'>
                    {report.generatedAt.toLocaleString()}
                  </p>
                </div>

                {report.status === 'completed' && (
                  <motion.button
                    onClick={() => downloadReport(report.id)}
                    className='p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 
                               rounded-lg text-green-300 transition-colors'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download className='w-4 h-4' />
                  </motion.button>
                )}
              </div>

              {/* 보고서 요약 */}
              <p className='text-gray-200 text-sm mb-3'>{report.summary}</p>

              {/* 보고서 상세 통계 (완료된 보고서만) */}
              {report.status === 'completed' && (
                <div className='grid grid-cols-2 gap-2 text-xs'>
                  <div className='bg-gray-700/30 rounded-lg p-2'>
                    <div className='flex items-center gap-1 mb-1'>
                      <Activity className='w-3 h-3 text-green-400' />
                      <span className='text-gray-400'>정상 서버</span>
                    </div>
                    <span className='text-green-300 font-medium'>
                      {report.details.healthyServers}/
                      {report.details.totalServers}
                    </span>
                  </div>

                  <div className='bg-gray-700/30 rounded-lg p-2'>
                    <div className='flex items-center gap-1 mb-1'>
                      <AlertTriangle className='w-3 h-3 text-yellow-400' />
                      <span className='text-gray-400'>경고</span>
                    </div>
                    <span className='text-yellow-300 font-medium'>
                      {report.details.warningServers}
                    </span>
                  </div>

                  <div className='bg-gray-700/30 rounded-lg p-2'>
                    <div className='flex items-center gap-1 mb-1'>
                      <TrendingUp className='w-3 h-3 text-blue-400' />
                      <span className='text-gray-400'>CPU</span>
                    </div>
                    <span className='text-blue-300 font-medium'>
                      {report.details.cpuUsage}%
                    </span>
                  </div>

                  <div className='bg-gray-700/30 rounded-lg p-2'>
                    <div className='flex items-center gap-1 mb-1'>
                      <Clock className='w-3 h-3 text-purple-400' />
                      <span className='text-gray-400'>응답시간</span>
                    </div>
                    <span className='text-purple-300 font-medium'>
                      {report.details.avgResponseTime}ms
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {filteredReports.length === 0 && (
            <div className='text-center text-gray-500 mt-8'>
              <FileText className='w-12 h-12 mx-auto mb-4 opacity-50' />
              <p className='text-sm'>
                {selectedFilter === 'all'
                  ? '생성된 보고서가 없습니다'
                  : `${reportTypes.find(t => t.id === selectedFilter)?.label} 보고서가 없습니다`}
              </p>
              <p className='text-xs text-gray-600 mt-1'>
                보고서는 자동으로 주기적으로 생성됩니다
              </p>
            </div>
          )}
        </div>
      </div>
    </BasePanelLayout>
  );
};

export default AutoReportPanel;
