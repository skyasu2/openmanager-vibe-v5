/**
 * 📄 자동 장애 보고서 페이지 컴포넌트
 *
 * 실시간 장애 리포트 생성 및 관리
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
} from 'lucide-react';

interface IncidentReport {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: Date;
  affectedServers: string[];
  description: string;
  status: 'active' | 'resolved' | 'investigating';
}

const MOCK_REPORTS: IncidentReport[] = [
  {
    id: '1',
    title: 'Server-03 CPU 사용률 임계치 초과',
    severity: 'critical',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    affectedServers: ['Server-03'],
    description: 'CPU 사용률이 95%를 초과하여 성능 저하가 예상됩니다.',
    status: 'active',
  },
  {
    id: '2',
    title: '메모리 사용률 증가 추세',
    severity: 'warning',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    affectedServers: ['Server-01', 'Server-05'],
    description:
      '지난 2시간 동안 메모리 사용률이 지속적으로 증가하고 있습니다.',
    status: 'investigating',
  },
  {
    id: '3',
    title: '디스크 공간 부족 경고',
    severity: 'warning',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    affectedServers: ['Server-07'],
    description: '디스크 사용률이 85%에 도달했습니다.',
    status: 'resolved',
  },
];

export default function AutoReportPage() {
  const [reports, setReports] = useState<IncidentReport[]>(MOCK_REPORTS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const handleGenerateReport = async () => {
    setIsGenerating(true);

    // 새 보고서 생성 시뮬레이션
    setTimeout(() => {
      const newReport: IncidentReport = {
        id: Date.now().toString(),
        title: '네트워크 지연 감지',
        severity: 'warning',
        timestamp: new Date(),
        affectedServers: ['Server-02', 'Server-04'],
        description: '평균 응답 시간이 200ms를 초과하고 있습니다.',
        status: 'active',
      };

      setReports((prev) => [newReport, ...prev]);
      setIsGenerating(false);
    }, 3000);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <div className="_animate-pulse h-2 w-2 rounded-full bg-red-500" />
        );
      case 'investigating':
        return (
          <div className="_animate-pulse h-2 w-2 rounded-full bg-yellow-500" />
        );
      default:
        return <div className="h-2 w-2 rounded-full bg-green-500" />;
    }
  };

  const filteredReports =
    selectedSeverity === 'all'
      ? reports
      : reports.filter((report) => report.severity === selectedSeverity);

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-red-50 to-pink-50">
      {/* 헤더 */}
      <div className="border-b border-red-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-pink-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                자동 장애보고서
              </h2>
              <p className="text-sm text-gray-600">실시간 장애 리포트 생성</p>
            </div>
          </div>

          <motion.button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center space-x-2 rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw
              className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`}
            />
            <span>{isGenerating ? '생성 중...' : '새 보고서'}</span>
          </motion.button>
        </div>
      </div>

      {/* 필터 */}
      <div className="border-b border-red-200 bg-white/50 p-4">
        <div className="flex space-x-2">
          {[
            { id: 'all', label: '전체', count: reports.length },
            {
              id: 'critical',
              label: '심각',
              count: reports.filter((r) => r.severity === 'critical').length,
            },
            {
              id: 'warning',
              label: '경고',
              count: reports.filter((r) => r.severity === 'warning').length,
            },
            {
              id: 'info',
              label: '정보',
              count: reports.filter((r) => r.severity === 'info').length,
            },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedSeverity(filter.id)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                selectedSeverity === filter.id
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-red-100'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* 보고서 목록 */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {filteredReports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-lg border p-4 ${getSeverityColor(report.severity)} transition-shadow hover:shadow-md`}
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {getSeverityIcon(report.severity)}
                <h3 className="font-medium text-gray-800">{report.title}</h3>
                {getStatusIcon(report.status)}
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {report.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>

            <p className="mb-3 text-sm text-gray-600">{report.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">
                  영향받는 서버: {report.affectedServers.join(', ')}
                </span>
              </div>

              <div className="flex space-x-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    report.status === 'active'
                      ? 'bg-red-100 text-red-700'
                      : report.status === 'investigating'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                  }`}
                >
                  {report.status === 'active'
                    ? '활성'
                    : report.status === 'investigating'
                      ? '조사중'
                      : '해결됨'}
                </span>

                <motion.button
                  className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="보고서 다운로드"
                >
                  <Download className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredReports.length === 0 && (
          <div className="py-8 text-center">
            <FileText className="mx-auto mb-2 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">해당 조건의 보고서가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 하단 통계 */}
      <div className="border-t border-red-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-red-600">
              {reports.filter((r) => r.status === 'active').length}
            </div>
            <div className="text-xs text-gray-500">활성 이슈</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">
              {reports.filter((r) => r.status === 'investigating').length}
            </div>
            <div className="text-xs text-gray-500">조사중</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {reports.filter((r) => r.status === 'resolved').length}
            </div>
            <div className="text-xs text-gray-500">해결됨</div>
          </div>
        </div>
      </div>
    </div>
  );
}
