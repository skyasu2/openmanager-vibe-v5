/**
 * 🚨 자동 장애보고서 탭 컴포넌트
 *
 * - 현재/이전 서버 상태 비교 분석
 * - 육하원칙 기반 장애보고서 생성
 * - TXT 파일 다운로드 지원
 * - 실시간 서버 데이터 연동
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  AlertTriangle,
  Clock,
  Server,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  incidentReportService,
  type IncidentReport,
  type ServerStateComparison,
} from '../../../services/ai/IncidentReportService';
import type { ServerMetrics } from '../../../types/common';
import BasicTyping from '../../../components/ui/BasicTyping';

interface IncidentReportTabProps {
  className?: string;
}

export const IncidentReportTab: React.FC<IncidentReportTabProps> = ({
  className = '',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentReport, setCurrentReport] = useState<IncidentReport | null>(
    null
  );
  const [allReports, setAllReports] = useState<IncidentReport[]>([]);
  const [serverData, setServerData] = useState<{
    current: ServerMetrics[];
    previous: ServerMetrics[];
  }>({ current: [], previous: [] });
  const [isTyping, setIsTyping] = useState(false);

  // 컴포넌트 마운트 시 기존 보고서 로드
  useEffect(() => {
    loadExistingReports();
    fetchServerData();
  }, []);

  /**
   * 🔄 기존 보고서 로드
   */
  const loadExistingReports = () => {
    const reports = incidentReportService.getAllReports();
    setAllReports(reports);
    if (reports.length > 0) {
      setCurrentReport(reports[0]); // 최신 보고서 표시
    }
  };

  /**
   * 📊 서버 데이터 가져오기
   */
  const fetchServerData = async () => {
    try {
      // 현재 서버 데이터 가져오기
      const currentResponse = await fetch('/api/servers');
      const currentData = await currentResponse.json();

      // 이전 서버 데이터 시뮬레이션 (실제로는 캐시나 DB에서 가져와야 함)
      const previousData = generatePreviousServerData(
        currentData.servers || []
      );

      setServerData({
        current: currentData.servers || [],
        previous: previousData,
      });
    } catch (error) {
      console.error('서버 데이터 가져오기 실패:', error);
      // 데모용 데이터 생성
      const demoData = generateDemoServerData();
      setServerData(demoData);
    }
  };

  /**
   * 🎭 데모용 서버 데이터 생성
   */
  const generateDemoServerData = () => {
    const current: ServerMetrics[] = [
      {
        id: 'server-1',
        server_id: 'web-prod-01',
        cpu_usage: 85,
        memory_usage: 78,
        disk_usage: 65,
        network_in: 1024,
        network_out: 2048,
        response_time: 1200,
        active_connections: 150,
        status: 'warning',
        alerts: ['High CPU usage detected'],
        timestamp: new Date(),
      },
      {
        id: 'server-2',
        server_id: 'api-prod-02',
        cpu_usage: 92,
        memory_usage: 89,
        disk_usage: 70,
        network_in: 2048,
        network_out: 4096,
        response_time: 2500,
        active_connections: 200,
        status: 'critical',
        alerts: ['Critical CPU usage', 'High memory usage'],
        timestamp: new Date(),
      },
    ];

    const previous: ServerMetrics[] = [
      {
        ...current[0],
        cpu_usage: 45,
        memory_usage: 52,
        response_time: 300,
        status: 'healthy',
        alerts: [],
      },
      {
        ...current[1],
        cpu_usage: 38,
        memory_usage: 48,
        response_time: 250,
        status: 'healthy',
        alerts: [],
      },
    ];

    return { current, previous };
  };

  /**
   * 📈 이전 서버 데이터 시뮬레이션
   */
  const generatePreviousServerData = (
    currentServers: any[]
  ): ServerMetrics[] => {
    return currentServers.map(server => ({
      id: server.id,
      server_id: server.name || server.id,
      cpu_usage: Math.max(0, server.cpu - Math.random() * 30),
      memory_usage: Math.max(0, server.memory - Math.random() * 25),
      disk_usage: Math.max(0, server.disk - Math.random() * 10),
      network_in: Math.random() * 1000,
      network_out: Math.random() * 2000,
      response_time: Math.random() * 500 + 100,
      active_connections: Math.floor(Math.random() * 100),
      status: 'healthy' as const,
      alerts: [],
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5분 전
    }));
  };

  /**
   * 🚨 장애보고서 생성
   */
  const generateReport = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setIsTyping(true);

    try {
      const serverComparison: ServerStateComparison = {
        current: serverData.current,
        previous: serverData.previous,
        changes: [],
      };

      const report = await incidentReportService.generateIncidentReport(
        serverComparison,
        '실시간 모니터링 시스템에서 감지된 서버 상태 변화'
      );

      setCurrentReport(report);
      setAllReports(prev => [report, ...prev]);

      // 타이핑 효과 시뮬레이션
      setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    } catch (error) {
      console.error('장애보고서 생성 실패:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 💾 보고서 다운로드
   */
  const downloadReport = (report: IncidentReport) => {
    incidentReportService.downloadReport(report);
  };

  /**
   * 🎨 심각도별 색상 반환
   */
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  /**
   * 🎨 심각도별 아이콘 반환
   */
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className='w-4 h-4' />;
      case 'warning':
        return <AlertCircle className='w-4 h-4' />;
      case 'info':
        return <CheckCircle className='w-4 h-4' />;
      default:
        return <AlertTriangle className='w-4 h-4' />;
    }
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* 헤더 */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <FileText className='w-5 h-5 text-red-500' />
            <h3 className='font-semibold text-gray-900'>자동 장애보고서</h3>
          </div>
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className='flex items-center space-x-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm'
          >
            {isGenerating ? (
              <RefreshCw className='w-4 h-4 animate-spin' />
            ) : (
              <FileText className='w-4 h-4' />
            )}
            <span>{isGenerating ? '생성 중...' : '보고서 생성'}</span>
          </button>
        </div>

        {/* 서버 상태 요약 */}
        <div className='mt-3 grid grid-cols-2 gap-2 text-xs'>
          <div className='bg-gray-50 p-2 rounded'>
            <div className='flex items-center space-x-1'>
              <Server className='w-3 h-3 text-gray-500' />
              <span className='text-gray-600'>현재 서버</span>
            </div>
            <div className='font-medium'>{serverData.current.length}개</div>
          </div>
          <div className='bg-gray-50 p-2 rounded'>
            <div className='flex items-center space-x-1'>
              <TrendingUp className='w-3 h-3 text-gray-500' />
              <span className='text-gray-600'>변화 감지</span>
            </div>
            <div className='font-medium'>
              {serverData.current.filter(s => s.status !== 'healthy').length}개
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className='flex-1 overflow-y-auto'>
        {currentReport ? (
          <div className='p-4 space-y-4'>
            {/* 보고서 헤더 */}
            <div className='bg-white border border-gray-200 rounded-lg p-4'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center space-x-2 mb-2'>
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(currentReport.severity)}`}
                    >
                      {getSeverityIcon(currentReport.severity)}
                      <span>{currentReport.severity.toUpperCase()}</span>
                    </span>
                    <span className='text-xs text-gray-500'>
                      {new Date(currentReport.timestamp).toLocaleString(
                        'ko-KR'
                      )}
                    </span>
                  </div>

                  <h4 className='font-semibold text-gray-900 mb-1'>
                    {currentReport.title}
                  </h4>

                  <div className='flex items-center space-x-4 text-xs text-gray-500'>
                    <span>ID: {currentReport.id}</span>
                    <span>우선순위: {currentReport.priority}</span>
                    <span>상태: {currentReport.status}</span>
                  </div>
                </div>

                <button
                  onClick={() => downloadReport(currentReport)}
                  className='flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors'
                >
                  <Download className='w-3 h-3' />
                  <span>다운로드</span>
                </button>
              </div>
            </div>

            {/* 육하원칙 분석 */}
            <div className='bg-white border border-gray-200 rounded-lg p-4'>
              <h5 className='font-medium text-gray-900 mb-3 flex items-center space-x-2'>
                <AlertTriangle className='w-4 h-4 text-orange-500' />
                <span>육하원칙 분석 (5W1H)</span>
              </h5>

              <div className='space-y-3 text-sm'>
                {[
                  { label: '🔍 무엇이 (What)', content: currentReport.what },
                  { label: '⏰ 언제 (When)', content: currentReport.when },
                  { label: '📍 어디서 (Where)', content: currentReport.where },
                  { label: '👤 누가 (Who)', content: currentReport.who },
                  { label: '❓ 왜 (Why)', content: currentReport.why },
                  { label: '🔧 어떻게 (How)', content: currentReport.how },
                ].map((item, index) => (
                  <div key={index} className='border-l-2 border-gray-200 pl-3'>
                    <div className='font-medium text-gray-700 mb-1'>
                      {item.label}
                    </div>
                    <div className='text-gray-600 leading-relaxed'>
                      {isTyping && index === 0 ? (
                        <BasicTyping
                          text={item.content}
                          speed='fast'
                          showCursor={true}
                          className='text-gray-600'
                        />
                      ) : (
                        item.content
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 영향도 및 해결방안 */}
            <div className='grid grid-cols-1 gap-4'>
              <div className='bg-white border border-gray-200 rounded-lg p-4'>
                <h5 className='font-medium text-gray-900 mb-2'>💥 영향도</h5>
                <p className='text-sm text-gray-600'>{currentReport.impact}</p>
              </div>

              <div className='bg-white border border-gray-200 rounded-lg p-4'>
                <h5 className='font-medium text-gray-900 mb-2'>🛠️ 해결 방안</h5>
                <div className='text-sm text-gray-600 whitespace-pre-line'>
                  {currentReport.resolution}
                </div>
              </div>
            </div>

            {/* 타임라인 */}
            <div className='bg-white border border-gray-200 rounded-lg p-4'>
              <h5 className='font-medium text-gray-900 mb-3 flex items-center space-x-2'>
                <Clock className='w-4 h-4 text-blue-500' />
                <span>타임라인</span>
              </h5>

              <div className='space-y-2'>
                {currentReport.timeline.map((event, index) => (
                  <div
                    key={index}
                    className='flex items-start space-x-3 text-sm'
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        event.severity === 'critical'
                          ? 'bg-red-500'
                          : event.severity === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                      }`}
                    />
                    <div className='flex-1'>
                      <div className='flex items-center space-x-2'>
                        <span className='font-medium text-gray-700'>
                          {event.event}
                        </span>
                        <span className='text-xs text-gray-500'>
                          {new Date(event.timestamp).toLocaleTimeString(
                            'ko-KR'
                          )}
                        </span>
                      </div>
                      <p className='text-gray-600 mt-1'>{event.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // 보고서가 없을 때
          <div className='flex-1 flex items-center justify-center p-8'>
            <div className='text-center'>
              <FileText className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                장애보고서가 없습니다
              </h3>
              <p className='text-gray-500 mb-4'>
                현재 서버 상태를 분석하여 자동 장애보고서를 생성해보세요.
              </p>
              <button
                onClick={generateReport}
                disabled={isGenerating}
                className='inline-flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors'
              >
                {isGenerating ? (
                  <RefreshCw className='w-4 h-4 animate-spin' />
                ) : (
                  <FileText className='w-4 h-4' />
                )}
                <span>{isGenerating ? '생성 중...' : '보고서 생성'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 하단 보고서 목록 */}
      {allReports.length > 1 && (
        <div className='border-t border-gray-200 p-3'>
          <div className='text-xs text-gray-500 mb-2'>
            이전 보고서 ({allReports.length - 1}개)
          </div>
          <div className='space-y-1 max-h-20 overflow-y-auto'>
            {allReports.slice(1, 4).map(report => (
              <button
                key={report.id}
                onClick={() => setCurrentReport(report)}
                className='w-full text-left p-2 hover:bg-gray-50 rounded text-xs border border-gray-100'
              >
                <div className='flex items-center justify-between'>
                  <span className='truncate'>{report.title}</span>
                  <span
                    className={`px-1 py-0.5 rounded text-xs ${getSeverityColor(report.severity)}`}
                  >
                    {report.severity}
                  </span>
                </div>
                <div className='text-gray-500 mt-1'>
                  {new Date(report.timestamp).toLocaleString('ko-KR')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
