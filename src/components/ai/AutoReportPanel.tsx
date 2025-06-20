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

const AutoReportPanel: React.FC<AutoReportPanelProps> = ({
  className = '',
}) => {
  // 데이터 로딩 (30초마다 자동 새로고침)
  const [reports, setReports] = React.useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // 실제 API에서 데이터 로드
  const loadReports = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai/auto-report');

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        // API 응답 데이터를 컴포넌트 형식에 맞게 변환
        const transformedReports = data.data.map((report: any) => ({
          ...report,
          generatedAt: new Date(report.generatedAt),
        }));
        setReports(transformedReports);
      } else {
        console.error('보고서 데이터 로드 실패:', data.error);
        // 실패 시 빈 배열로 설정
        setReports([]);
      }
    } catch (error) {
      console.error('보고서 API 호출 실패:', error);
      // 에러 시 빈 배열로 설정
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 데이터 로드
  React.useEffect(() => {
    loadReports();
  }, [loadReports]);

  // 30초마다 자동 새로고침
  React.useEffect(() => {
    const interval = setInterval(loadReports, 30000);
    return () => clearInterval(interval);
  }, [loadReports]);

  const reload = React.useCallback(() => {
    loadReports();
  }, [loadReports]);

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
      adminPath='/admin'
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
