import { Activity, FileText, Lightbulb, MessageSquare } from 'lucide-react';
import type { AIAgentStats } from '../../../types/ai-agent';
import { Card, CardContent } from '../../ui/card';

interface AIAgentStatsCardsProps {
  stats: AIAgentStats;
}

export default function AIAgentStatsCards({ stats }: AIAgentStatsCardsProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
      {/* 총 응답 로그 카드 */}
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>총 응답 로그</p>
              <p className='text-2xl font-bold text-blue-600'>
                {stats.totalLogs}
              </p>
            </div>
            <MessageSquare className='w-8 h-8 text-blue-500' />
          </div>
          <p className='text-xs text-gray-500 mt-2'>
            성공률: {stats.successRate.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      {/* 패턴 제안 카드 */}
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>패턴 제안</p>
              <p className='text-2xl font-bold text-orange-600'>
                {stats.patternSuggestions}
              </p>
            </div>
            <Lightbulb className='w-8 h-8 text-orange-500' />
          </div>
          <p className='text-xs text-gray-500 mt-2'>
            대기중: {stats.pendingPatterns}개
          </p>
        </CardContent>
      </Card>

      {/* 컨텍스트 문서 카드 */}
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>컨텍스트 문서</p>
              <p className='text-2xl font-bold text-green-600'>
                {stats.contextDocuments}
              </p>
            </div>
            <FileText className='w-8 h-8 text-green-500' />
          </div>
          <p className='text-xs text-gray-500 mt-2'>
            총 {stats.totalWords}K 단어
          </p>
        </CardContent>
      </Card>

      {/* 시스템 상태 카드 */}
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>시스템 상태</p>
              <p className='text-2xl font-bold text-purple-600'>
                {stats.systemStatus}
              </p>
            </div>
            <Activity className='w-8 h-8 text-purple-500' />
          </div>
          <p className='text-xs text-gray-500 mt-2'>실시간 모니터링 중</p>
        </CardContent>
      </Card>
    </div>
  );
}
