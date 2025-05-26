'use client';

import { useState, useEffect } from 'react';
import { SystemStatus, IntegratedReport } from '@/services/ai-agent/ContinuousLearningService';

export default function ContinuousLearningTest() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [integratedReport, setIntegratedReport] = useState<IntegratedReport | null>(null);
  const [reportHistory, setReportHistory] = useState<IntegratedReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [, setIsInitialized] = useState(false);

  // 컴포넌트 마운트 시 시스템 상태 로드
  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/ai-agent/learning/continuous?action=system-status');
      const result = await response.json();
      
      if (result.success) {
        setSystemStatus(result.data);
      } else {
        console.error('시스템 상태 로드 실패:', result.error);
      }
    } catch (error) {
      console.error('시스템 상태 로드 요청 실패:', error);
    }
  };

  const initializeSystem = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-agent/learning/continuous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 시스템 초기화 완료');
        setIsInitialized(true);
        await loadSystemStatus();
      } else {
        console.error('❌ 시스템 초기화 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 시스템 초기화 요청 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startAllComponents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-agent/learning/continuous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start-all' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 모든 컴포넌트 시작 완료');
        await loadSystemStatus();
      } else {
        console.error('❌ 컴포넌트 시작 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 컴포넌트 시작 요청 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopAllComponents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-agent/learning/continuous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop-all' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 모든 컴포넌트 중지 완료');
        await loadSystemStatus();
      } else {
        console.error('❌ 컴포넌트 중지 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 컴포넌트 중지 요청 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateIntegratedReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-agent/learning/continuous?action=integrated-report');
      const result = await response.json();
      
      if (result.success) {
        setIntegratedReport(result.data);
        console.log('✅ 통합 보고서 생성 완료:', result.data);
      } else {
        console.error('❌ 통합 보고서 생성 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 통합 보고서 생성 요청 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReportHistory = async () => {
    try {
      const response = await fetch('/api/ai-agent/learning/continuous?action=report-history&limit=10');
      const result = await response.json();
      
      if (result.success) {
        setReportHistory(result.data);
        console.log('✅ 보고서 히스토리 로드 완료:', result.data.length, '개');
      } else {
        console.error('❌ 보고서 히스토리 로드 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 보고서 히스토리 로드 요청 실패:', error);
    }
  };

  const runAutoOptimization = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-agent/learning/continuous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto-optimize' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 자동 최적화 완료:', result.data);
        await loadSystemStatus();
      } else {
        console.error('❌ 자동 최적화 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 자동 최적화 요청 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🚀 지속적 학습 시스템 (Phase 3)
        </h2>
        
        {/* 제어 버튼들 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={initializeSystem}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '초기화 중...' : '시스템 초기화'}
          </button>
          
          <button
            onClick={startAllComponents}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            모든 컴포넌트 시작
          </button>
          
          <button
            onClick={stopAllComponents}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            모든 컴포넌트 중지
          </button>
          
          <button
            onClick={generateIntegratedReport}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            통합 보고서 생성
          </button>
          
          <button
            onClick={loadReportHistory}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            보고서 히스토리
          </button>
          
          <button
            onClick={runAutoOptimization}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            자동 최적화 실행
          </button>
          
          <button
            onClick={loadSystemStatus}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            상태 새로고침
          </button>
        </div>

        {/* 시스템 상태 표시 */}
        {systemStatus && (
          <div className="space-y-6">
            {/* 전체 시스템 상태 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  🏥 시스템 건강 상태
                </h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(systemStatus.overall.status)}`}>
                  {systemStatus.overall.status.toUpperCase()}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getHealthScoreColor(systemStatus.overall.healthScore)}`}>
                    {systemStatus.overall.healthScore}점
                  </div>
                  <div className="text-sm text-gray-600">건강 점수</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${systemStatus.scheduler.isRunning ? 'text-green-600' : 'text-red-600'}`}>
                    {systemStatus.scheduler.isRunning ? '실행 중' : '중지됨'}
                  </div>
                  <div className="text-sm text-gray-600">자동 학습</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${systemStatus.monitoring.isMonitoring ? 'text-green-600' : 'text-red-600'}`}>
                    {systemStatus.monitoring.isMonitoring ? '모니터링 중' : '중지됨'}
                  </div>
                  <div className="text-sm text-gray-600">성능 모니터링</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {systemStatus.contextUpdate.pendingUpdates}개
                  </div>
                  <div className="text-sm text-gray-600">대기 업데이트</div>
                </div>
              </div>
            </div>

            {/* 컴포넌트별 상세 상태 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 스케줄러 상태 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">⏰ 자동 학습 스케줄러</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>상태:</span>
                    <span className={systemStatus.scheduler.isRunning ? 'text-green-600' : 'text-red-600'}>
                      {systemStatus.scheduler.isRunning ? '실행 중' : '중지됨'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>다음 분석:</span>
                    <span className="text-gray-600">
                      {new Date(systemStatus.scheduler.nextAnalysis).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>분석 간격:</span>
                    <span className="text-gray-600">
                      {systemStatus.scheduler.config.analysisInterval}분
                    </span>
                  </div>
                </div>
              </div>

              {/* 컨텍스트 업데이트 상태 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3">🔄 컨텍스트 업데이트</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>대기 업데이트:</span>
                    <span className="text-orange-600">{systemStatus.contextUpdate.pendingUpdates}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>적용된 업데이트:</span>
                    <span className="text-green-600">{systemStatus.contextUpdate.appliedUpdates}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>현재 버전:</span>
                    <span className="text-gray-600">{systemStatus.contextUpdate.currentVersion}</span>
                  </div>
                </div>
              </div>

              {/* 모니터링 상태 */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-3">📊 성능 모니터링</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>모니터링:</span>
                    <span className={systemStatus.monitoring.isMonitoring ? 'text-green-600' : 'text-red-600'}>
                      {systemStatus.monitoring.isMonitoring ? '활성' : '비활성'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>활성 알림:</span>
                    <span className={systemStatus.monitoring.activeAlerts > 0 ? 'text-red-600' : 'text-green-600'}>
                      {systemStatus.monitoring.activeAlerts}개
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>마지막 체크:</span>
                    <span className="text-gray-600">
                      {systemStatus.monitoring.lastCheckTime ? 
                        new Date(systemStatus.monitoring.lastCheckTime).toLocaleString() : 
                        '없음'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 통합 보고서 표시 */}
        {integratedReport && (
          <div className="mt-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  📋 통합 보고서 (ID: {integratedReport.id.slice(-8)})
                </h3>
                <div className="text-sm text-gray-600">
                  생성 시간: {new Date(integratedReport.timestamp).toLocaleString()}
                </div>
              </div>

              {/* 요약 */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">📝 요약</h4>
                <p className="text-gray-700">{integratedReport.summary}</p>
              </div>

              {/* 주요 메트릭 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {(integratedReport.learningMetrics.successRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">성공률</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {(integratedReport.learningMetrics.averageConfidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">평균 신뢰도</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {integratedReport.performanceMetrics.averageResponseTime.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-gray-600">평균 응답시간</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-orange-600">
                    {integratedReport.activeAlerts.length}개
                  </div>
                  <div className="text-sm text-gray-600">활성 알림</div>
                </div>
              </div>

              {/* 권장사항 */}
              {integratedReport.recommendations.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">💡 권장사항</h4>
                  <ul className="space-y-1 text-sm">
                    {integratedReport.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-600">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 액션 아이템 */}
              {integratedReport.actionItems.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">🎯 액션 아이템</h4>
                  <div className="space-y-2">
                    {integratedReport.actionItems.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                              {item.priority.toUpperCase()}
                            </span>
                            <span className="text-sm font-medium">{item.component}</span>
                          </div>
                          <div className="text-sm text-gray-700 mt-1">{item.action}</div>
                        </div>
                        <div className="text-sm text-gray-600">
                          영향도: {item.estimatedImpact}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 보고서 히스토리 */}
        {reportHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📚 보고서 히스토리</h3>
            <div className="space-y-2">
              {reportHistory.map((report, index) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">보고서 #{index + 1}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(report.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getHealthScoreColor(report.systemStatus.overall.healthScore)}`}>
                      건강도: {report.systemStatus.overall.healthScore}점
                    </div>
                    <div className="text-xs text-gray-600">
                      알림: {report.activeAlerts.length}개
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 상태 정보 */}
        <div className="mt-6 text-sm text-gray-600">
          <p>🚀 이 컴포넌트는 AI 학습 시스템의 Phase 3 기능을 테스트합니다.</p>
          <p>⏰ 자동 학습 스케줄러, 컨텍스트 업데이트 엔진, 성능 모니터링 시스템을 통합 관리합니다.</p>
          <p>📊 실시간 시스템 상태 모니터링과 자동 최적화 기능을 제공합니다.</p>
        </div>
      </div>
    </div>
  );
} 