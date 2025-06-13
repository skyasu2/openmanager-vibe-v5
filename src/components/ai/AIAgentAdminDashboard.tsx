'use client';

import React, { useState } from 'react';
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
import { useAIAgentData } from '../../hooks/useAIAgentData';
import AIAgentStatsCards from './admin/AIAgentStatsCards';
import RealTimeLogMonitor from './RealTimeLogMonitor';
import LogAnalyticsDashboard from '../admin/LogAnalyticsDashboard';
import type { ResponseLogData, ContextDocument } from '../../types/ai-agent';

export default function AIAgentAdminDashboard() {
  const {
    // 데이터
    responseLogs,
    patternSuggestions,
    contextDocuments,
    systemHealth,

    // 상태
    loading,
    error,

    // 필터링된 데이터
    filteredLogs,
    stats,

    // 액션
    loadAllData,
    handlePatternAction,

    // 필터
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
  } = useAIAgentData();

  // UI 상태
  const [selectedTab, setSelectedTab] = useState('logs');
  const [selectedLog, setSelectedLog] = useState<ResponseLogData | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<ContextDocument | null>(null);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='flex items-center gap-3'>
          <RefreshCw className='w-5 h-5 animate-spin text-purple-600' />
          <span className='text-gray-600'>
            AI 에이전트 데이터를 불러오는 중...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <AlertTriangle className='w-12 h-12 text-red-500 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            데이터 로드 실패
          </h3>
          <p className='text-gray-600 mb-4'>{error}</p>
          <Button onClick={loadAllData} variant='outline'>
            <RefreshCw className='w-4 h-4 mr-2' />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6 bg-gray-50 min-h-screen'>
      {/* 상단 통계 카드 */}
      <AIAgentStatsCards stats={stats} />

      {/* 탭 네비게이션 */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className='w-full'
      >
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='logs'>🤖 AI 로그</TabsTrigger>
          <TabsTrigger value='analytics'>📊 로그 분석</TabsTrigger>
          <TabsTrigger value='contexts'>📚 컨텍스트 관리</TabsTrigger>
          <TabsTrigger value='ab-test'>🧪 A/B 테스트</TabsTrigger>
          <TabsTrigger value='feedback'>👍 품질 피드백</TabsTrigger>
        </TabsList>

        {/* 탭 1: AI 로그 뷰어 (실시간 + 히스토리) */}
        <TabsContent value='logs' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* 실시간 로그 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Activity className='w-5 h-5' />
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
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2'>
                    <Clock className='w-5 h-5' />
                    응답 히스토리
                  </CardTitle>
                  <div className='flex items-center gap-2'>
                    <div className='relative'>
                      <Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                      <input
                        aria-label='질문 검색'
                        type='text'
                        placeholder='질문 검색...'
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className='pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'
                      />
                    </div>
                    <select
                      aria-label='상태 필터'
                      value={filters.status}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className='border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'
                    >
                      <option value='all'>모든 상태</option>
                      <option value='success'>성공</option>
                      <option value='fallback'>Fallback</option>
                      <option value='failed'>실패</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-3 max-h-96 overflow-y-auto'>
                  {filteredLogs.slice(0, 10).map(log => (
                    <div
                      key={log.id}
                      className='border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors'
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
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
                            <span className='text-xs text-gray-500'>
                              {log.responseTime}ms
                            </span>
                          </div>
                          <p className='text-sm font-medium text-gray-900 mb-1'>
                            {log.question}
                          </p>
                          <p className='text-xs text-gray-600 truncate'>
                            {log.response}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-xs text-gray-500'>
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
        <TabsContent value='analytics' className='space-y-6'>
          <LogAnalyticsDashboard />
        </TabsContent>

        {/* 탭 3: 컨텍스트 버전 관리자 */}
        <TabsContent value='contexts' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* 현재 활성 컨텍스트 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Target className='w-5 h-5' />
                  현재 적용 중
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                    <div className='flex items-center gap-2 mb-2'>
                      <CheckCircle className='w-5 h-5 text-green-600' />
                      <span className='font-medium text-green-800'>
                        Advanced Context
                      </span>
                    </div>
                    <p className='text-sm text-green-700'>
                      고급 서버 모니터링 및 AI 분석 컨텍스트가 적용되어
                      있습니다.
                    </p>
                    <div className='mt-3 text-xs text-green-600'>
                      • 문서 수: 12개 • 마지막 업데이트: 2시간 전 • 상태: 정상
                    </div>
                  </div>

                  <div>
                    <h4 className='font-medium text-gray-900'>빠른 전환</h4>
                    <div className='space-y-2'>
                      <button className='w-full p-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded border'>
                        Basic Context
                      </button>
                      <button className='w-full p-2 text-left text-sm bg-green-100 border border-green-300 rounded font-medium'>
                        Advanced Context (현재)
                      </button>
                      <button className='w-full p-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded border'>
                        Custom Context
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 컨텍스트 문서 목록 */}
            <Card className='lg:col-span-2'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Brain className='w-5 h-5' />
                  컨텍스트 문서 관리
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3 max-h-96 overflow-y-auto'>
                  {contextDocuments.map(doc => (
                    <div
                      key={doc.id}
                      className='border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors'
                      onClick={() => setSelectedDocument(doc)}
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
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
                            <span className='text-sm font-medium text-gray-900'>
                              {doc.filename}
                            </span>
                          </div>
                          <p className='text-xs text-gray-600 mb-2'>
                            {doc.wordCount.toLocaleString()} 단어 •{' '}
                            {(doc.size / 1024).toFixed(1)}KB
                          </p>
                          <div className='flex flex-wrap gap-1'>
                            {doc.keywords.slice(0, 3).map(keyword => (
                              <span
                                key={keyword}
                                className='px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded'
                              >
                                {keyword}
                              </span>
                            ))}
                            {doc.keywords.length > 3 && (
                              <span className='text-xs text-gray-500'>
                                +{doc.keywords.length - 3}개
                              </span>
                            )}
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <button
                            className='p-1 hover:bg-gray-200 rounded'
                            aria-label='문서 보기'
                            title='문서 보기'
                          >
                            <Eye className='w-4 h-4 text-gray-500' />
                          </button>
                          <button
                            className='p-1 hover:bg-gray-200 rounded'
                            aria-label='문서 편집'
                            title='문서 편집'
                          >
                            <Edit className='w-4 h-4 text-gray-500' />
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
        <TabsContent value='ab-test' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* 실험 그룹 분포 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <BarChart3 className='w-5 h-5' />
                  실험 그룹 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                    <h4 className='font-medium text-blue-800 mb-2'>
                      실험 A: 기본 응답 전략
                    </h4>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm text-blue-700'>참여자 비율</span>
                      <span className='font-medium text-blue-800'>
                        50% (245명)
                      </span>
                    </div>
                    <div className='w-full bg-blue-200 rounded-full h-2'>
                      <div
                        className='bg-blue-600 h-2 rounded-full'
                        style={{ width: '50%' }}
                      ></div>
                    </div>
                    <div className='mt-2 text-xs text-blue-600'>
                      평균 응답시간: 1.2초 | 만족도: 8.2/10
                    </div>
                  </div>

                  <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                    <h4 className='font-medium text-green-800 mb-2'>
                      실험 B: 향상된 응답 전략
                    </h4>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm text-green-700'>
                        참여자 비율
                      </span>
                      <span className='font-medium text-green-800'>
                        50% (255명)
                      </span>
                    </div>
                    <div className='w-full bg-green-200 rounded-full h-2'>
                      <div
                        className='bg-green-600 h-2 rounded-full'
                        style={{ width: '50%' }}
                      ></div>
                    </div>
                    <div className='mt-2 text-xs text-green-600'>
                      평균 응답시간: 1.8초 | 만족도: 8.7/10
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 전략별 성능 비교 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Zap className='w-5 h-5' />
                  전략별 성능 비교
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className='border-b'>
                          <th className='text-left py-2'>지표</th>
                          <th className='text-center py-2'>실험 A</th>
                          <th className='text-center py-2'>실험 B</th>
                          <th className='text-center py-2'>개선율</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className='border-b'>
                          <td className='py-2'>평균 응답시간</td>
                          <td className='text-center'>1.2초</td>
                          <td className='text-center'>1.8초</td>
                          <td className='text-center text-red-600'>-33%</td>
                        </tr>
                        <tr className='border-b'>
                          <td className='py-2'>사용자 만족도</td>
                          <td className='text-center'>8.2/10</td>
                          <td className='text-center'>8.7/10</td>
                          <td className='text-center text-green-600'>+6%</td>
                        </tr>
                        <tr className='border-b'>
                          <td className='py-2'>정확도</td>
                          <td className='text-center'>92%</td>
                          <td className='text-center'>96%</td>
                          <td className='text-center text-green-600'>+4%</td>
                        </tr>
                        <tr className='border-b'>
                          <td className='py-2'>에러율</td>
                          <td className='text-center'>3.2%</td>
                          <td className='text-center'>1.8%</td>
                          <td className='text-center text-green-600'>-44%</td>
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
        <TabsContent value='feedback' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* 품질 통계 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <BarChart3 className='w-5 h-5' />
                  품질 통계
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='text-center p-4 bg-green-50 border border-green-200 rounded-lg'>
                    <div className='text-2xl font-bold text-green-600 mb-1'>
                      87%
                    </div>
                    <div className='text-sm text-green-700'>전체 만족도</div>
                    <div className='text-xs text-green-600 mt-1'>
                      👍 347 / 👎 52
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>매우 좋음</span>
                      <div className='flex items-center gap-2'>
                        <div className='w-20 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-green-500 h-2 rounded-full'
                            style={{ width: '65%' }}
                          ></div>
                        </div>
                        <span className='text-sm text-gray-800'>65%</span>
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>좋음</span>
                      <div className='flex items-center gap-2'>
                        <div className='w-20 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-blue-500 h-2 rounded-full'
                            style={{ width: '22%' }}
                          ></div>
                        </div>
                        <span className='text-sm text-gray-800'>22%</span>
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>보통</span>
                      <div className='flex items-center gap-2'>
                        <div className='w-20 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-yellow-500 h-2 rounded-full'
                            style={{ width: '8%' }}
                          ></div>
                        </div>
                        <span className='text-sm text-gray-800'>8%</span>
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>나쁨</span>
                      <div className='flex items-center gap-2'>
                        <div className='w-20 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-red-500 h-2 rounded-full'
                            style={{ width: '5%' }}
                          ></div>
                        </div>
                        <span className='text-sm text-gray-800'>5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 최근 피드백 로그 */}
            <Card className='lg:col-span-2'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MessageSquare className='w-5 h-5' />
                  최근 피드백 로그
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3 max-h-96 overflow-y-auto'>
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
                  ].map(feedback => (
                    <div
                      key={feedback.id}
                      className='border rounded-lg p-4 hover:bg-gray-50 transition-colors'
                    >
                      <div className='flex items-start justify-between mb-2'>
                        <div className='flex items-center gap-2'>
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
                          <div className='flex items-center'>
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
                        <span className='text-xs text-gray-500'>
                          {feedback.timestamp}
                        </span>
                      </div>
                      <p className='text-sm font-medium text-gray-900 mb-1'>
                        {feedback.question}
                      </p>
                      <p className='text-xs text-gray-600'>
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
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>응답 로그 상세</h3>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSelectedLog(null)}
              >
                ×
              </Button>
            </div>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-gray-600'>
                  질문
                </label>
                <p className='mt-1 p-2 bg-gray-50 rounded'>
                  {selectedLog.question}
                </p>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-600'>
                  응답
                </label>
                <p className='mt-1 p-2 bg-gray-50 rounded'>
                  {selectedLog.response}
                </p>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    상태
                  </label>
                  <p className='mt-1'>{selectedLog.status}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    신뢰도
                  </label>
                  <p className='mt-1'>
                    {(selectedLog.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    응답 시간
                  </label>
                  <p className='mt-1'>{selectedLog.responseTime}ms</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    시간
                  </label>
                  <p className='mt-1'>
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
