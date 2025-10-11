'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Activity,
  AlertTriangle,
  RefreshCw,
  Brain,
  CheckCircle,
  Target,
  Search,
  Clock,
  Eye,
  Edit,
  Zap,
  BarChart3,
  MessageSquare,
} from 'lucide-react';

// 분리된 컴포넌트들 import
import { useAIAssistantData } from '../../hooks/useAIAssistantData';
import AIAssistantStatsCards from './admin/AIAssistantStatsCards';
import RealTimeLogMonitor from './RealTimeLogMonitor';
import LogAnalyticsDashboard from '../admin/LogAnalyticsDashboard';
import type {
  ResponseLogData,
  ContextDocument,
  AIAssistantStats,
} from '../../types/ai-assistant';

export default function AIAssistantAdminDashboard() {
  const {
    // 데이터
    _responseLogs,
    _patternSuggestions,
    contextDocuments,
    _systemHealth,

    // 상태
    loading,
    error,

    // 필터링된 데이터
    filteredLogs,
    stats,

    // 액션
    loadAllData,
    _handlePatternAction,

    // 필터
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
  } = useAIAssistantData();

  // UI 상태
  const [selectedTab, setSelectedTab] = useState('logs');
  const [selectedLog, setSelectedLog] = useState<ResponseLogData | null>(null);
  const [_selectedDocument, setSelectedDocument] =
    useState<ContextDocument | null>(null);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-purple-600" />
          <span className="text-gray-600">
            AI 어시스턴트 데이터를 불러오는 중...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            데이터 로드 실패
          </h3>
          <p className="mb-4 text-gray-600">{error}</p>
          <Button onClick={loadAllData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6">
      {/* 상단 통계 카드 */}
      <AIAssistantStatsCards stats={stats as unknown as AIAssistantStats} />

      {/* 탭 네비게이션 */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="logs">🤖 AI 로그</TabsTrigger>
          <TabsTrigger value="analytics">📊 로그 분석</TabsTrigger>
          <TabsTrigger value="contexts">📚 컨텍스트 관리</TabsTrigger>
          <TabsTrigger value="ab-test">🧪 A/B 테스트</TabsTrigger>
          <TabsTrigger value="feedback">👍 품질 피드백</TabsTrigger>
        </TabsList>

        {/* 탭 1: AI 로그 뷰어 (실시간 + 히스토리) */}
        <TabsContent value="logs" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 실시간 로그 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  실시간 AI 추론 로그
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RealTimeLogMonitor />
              </CardContent>
            </Card>

            {/* 히스토리 로그 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    응답 히스토리
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                      <input
                        aria-label="질문 검색"
                        type="text"
                        placeholder="질문 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="rounded-lg border py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <select
                      aria-label="상태 필터"
                      value={filters.status}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">모든 상태</option>
                      <option value="success">성공</option>
                      <option value="fallback">Fallback</option>
                      <option value="failed">실패</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {filteredLogs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-50"
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge
                              variant={
                                log.status === 'success'
                                  ? 'default'
                                  : log.status === 'fallback'
                                    ? 'secondary'
                                    : 'destructive'
                              }
                            >
                              {log.status === 'success'
                                ? '성공'
                                : log.status === 'fallback'
                                  ? 'Fallback'
                                  : '실패'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {log.responseTime}ms
                            </span>
                          </div>
                          <p className="mb-1 text-sm font-medium text-gray-900">
                            {log.question}
                          </p>
                          <p className="truncate text-xs text-gray-600">
                            {log.response}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 탭 2: 로그 분석 대시보드 */}
        <TabsContent value="analytics" className="space-y-6">
          <LogAnalyticsDashboard />
        </TabsContent>

        {/* 탭 3: 컨텍스트 버전 관리자 */}
        <TabsContent value="contexts" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* 현재 활성 컨텍스트 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  현재 적용 중
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">
                        Advanced Context
                      </span>
                    </div>
                    <p className="text-sm text-green-700">
                      고급 서버 모니터링 및 AI 분석 컨텍스트가 적용되어
                      있습니다.
                    </p>
                    <div className="mt-3 text-xs text-green-600">
                      • 문서 수: 12개 • 마지막 업데이트: 2시간 전 • 상태: 정상
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">빠른 전환</h4>
                    <div className="space-y-2">
                      <button className="w-full rounded border bg-gray-50 p-2 text-left text-sm hover:bg-gray-100">
                        Basic Context
                      </button>
                      <button className="w-full rounded border border-green-300 bg-green-100 p-2 text-left text-sm font-medium">
                        Advanced Context (현재)
                      </button>
                      <button className="w-full rounded border bg-gray-50 p-2 text-left text-sm hover:bg-gray-100">
                        Custom Context
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 컨텍스트 문서 목록 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  컨텍스트 문서 관리
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {contextDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-gray-50"
                      onClick={() => setSelectedDocument(doc)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge
                              variant={
                                doc.category === 'advanced'
                                  ? 'default'
                                  : doc.category === 'custom'
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {doc.category === 'basic'
                                ? '기본'
                                : doc.category === 'advanced'
                                  ? '고급'
                                  : '커스텀'}
                            </Badge>
                            <span className="text-sm font-medium text-gray-900">
                              {doc.filename}
                            </span>
                          </div>
                          <p className="mb-2 text-xs text-gray-600">
                            {doc.wordCount.toLocaleString()} 단어 •{' '}
                            {(doc.size / 1024).toFixed(1)}KB
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {doc.keywords.slice(0, 3).map((keyword) => (
                              <span
                                key={keyword}
                                className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700"
                              >
                                {keyword}
                              </span>
                            ))}
                            {doc.keywords.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{doc.keywords.length - 3}개
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded p-1 hover:bg-gray-200"
                            aria-label="문서 보기"
                            title="문서 보기"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            className="rounded p-1 hover:bg-gray-200"
                            aria-label="문서 편집"
                            title="문서 편집"
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 탭 4: A/B 테스트 현황 */}
        <TabsContent value="ab-test" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 실험 그룹 분포 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  실험 그룹 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h4 className="mb-2 font-medium text-blue-800">
                      실험 A: 기본 응답 전략
                    </h4>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-blue-700">참여자 비율</span>
                      <span className="font-medium text-blue-800">
                        50% (245명)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-blue-200">
                      <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: '50%' }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      평균 응답시간: 1.2초 | 만족도: 8.2/10
                    </div>
                  </div>

                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h4 className="mb-2 font-medium text-green-800">
                      실험 B: 향상된 응답 전략
                    </h4>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-green-700">
                        참여자 비율
                      </span>
                      <span className="font-medium text-green-800">
                        50% (255명)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-green-200">
                      <div
                        className="h-2 rounded-full bg-green-600"
                        style={{ width: '50%' }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-green-600">
                      평균 응답시간: 1.8초 | 만족도: 8.7/10
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 전략별 성능 비교 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  전략별 성능 비교
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left">지표</th>
                          <th className="py-2 text-center">실험 A</th>
                          <th className="py-2 text-center">실험 B</th>
                          <th className="py-2 text-center">개선율</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">평균 응답시간</td>
                          <td className="text-center">1.2초</td>
                          <td className="text-center">1.8초</td>
                          <td className="text-center text-red-600">-33%</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">사용자 만족도</td>
                          <td className="text-center">8.2/10</td>
                          <td className="text-center">8.7/10</td>
                          <td className="text-center text-green-600">+6%</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">정확도</td>
                          <td className="text-center">92%</td>
                          <td className="text-center">96%</td>
                          <td className="text-center text-green-600">+4%</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">에러율</td>
                          <td className="text-center">3.2%</td>
                          <td className="text-center">1.8%</td>
                          <td className="text-center text-green-600">-44%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 탭 5: 품질 피드백 */}
        <TabsContent value="feedback" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* 품질 통계 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  품질 통계
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                    <div className="mb-1 text-2xl font-bold text-green-600">
                      87%
                    </div>
                    <div className="text-sm text-green-700">전체 만족도</div>
                    <div className="mt-1 text-xs text-green-600">
                      👍 347 / 👎 52
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">매우 좋음</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{ width: '65%' }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-800">65%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">좋음</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: '22%' }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-800">22%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">보통</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-yellow-500"
                            style={{ width: '8%' }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-800">8%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">나쁨</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-red-500"
                            style={{ width: '5%' }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-800">5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 최근 피드백 로그 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  최근 피드백 로그
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {/* 모의 피드백 데이터 */}
                  {[
                    {
                      id: 1,
                      timestamp: '2025-12-19 14:32',
                      question: 'CPU 사용률이 높은 서버를 찾아주세요',
                      feedback: 'positive',
                      comment:
                        '정확한 서버 목록과 상세 정보를 제공해줘서 도움이 되었습니다.',
                      rating: 5,
                    },
                    {
                      id: 2,
                      timestamp: '2025-12-19 14:28',
                      question: '네트워크 트래픽 분석 결과는?',
                      feedback: 'negative',
                      comment: '응답이 너무 늦고 정보가 부족합니다.',
                      rating: 2,
                    },
                    {
                      id: 3,
                      timestamp: '2025-12-19 14:25',
                      question: '시스템 전체 상태를 요약해주세요',
                      feedback: 'positive',
                      comment: '종합적이고 이해하기 쉬운 요약이었습니다.',
                      rating: 4,
                    },
                  ].map((feedback) => (
                    <div
                      key={feedback.id}
                      className="rounded-lg border p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              feedback.feedback === 'positive'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {feedback.feedback === 'positive'
                              ? '👍 긍정'
                              : '👎 부정'}
                          </Badge>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${
                                  i < feedback.rating
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {feedback.timestamp}
                        </span>
                      </div>
                      <p className="mb-1 text-sm font-medium text-gray-900">
                        {feedback.question}
                      </p>
                      <p className="text-xs text-gray-600">
                        {feedback.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 상세 모달들 */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="m-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">응답 로그 상세</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  질문
                </label>
                <p className="mt-1 rounded bg-gray-50 p-2">
                  {selectedLog.question}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  응답
                </label>
                <p className="mt-1 rounded bg-gray-50 p-2">
                  {selectedLog.response}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    상태
                  </label>
                  <p className="mt-1">{selectedLog.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    신뢰도
                  </label>
                  <p className="mt-1">
                    {(selectedLog.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    응답 시간
                  </label>
                  <p className="mt-1">{selectedLog.responseTime}ms</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    시간
                  </label>
                  <p className="mt-1">
                    {new Date(selectedLog.timestamp).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
