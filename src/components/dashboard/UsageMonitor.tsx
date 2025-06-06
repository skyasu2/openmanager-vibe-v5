'use client';

import { useEffect, useState } from 'react';
import { useUsageMonitor } from '@/lib/usage-monitor';
import { useKeepAlive } from '@/lib/keep-alive-scheduler';
import { smartRedis } from '@/lib/redis';
import { smartSupabase } from '@/lib/supabase';

interface UsageStatus {
  supabase: {
    enabled: boolean;
    usage: {
      transferMB: number;
      requests: number;
      lastReset: Date;
    };
    limits: {
      monthlyTransferMB: number;
      requests: number;
    };
    percentage: {
      transfer: number;
      requests: number;
    };
  };
  redis: {
    enabled: boolean;
    usage: {
      commands: number;
      lastReset: Date;
    };
    limits: {
      dailyCommands: number;
    };
    percentage: {
      commands: number;
    };
  };
}

export default function UsageMonitor() {
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [keepAliveStatus, setKeepAliveStatus] = useState<any>(null);
  const [dangerStatus, setDangerStatus] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  const { getUsageStatus, forceEnable, disable } = useUsageMonitor();
  const { getStatus, getDangerStatus, manualPing, stopKeepAlive, restartKeepAlive } = useKeepAlive();

  // 사용량 상태 업데이트
  const updateAllStatus = () => {
    const usage = getUsageStatus();
    const keepAlive = getStatus();
    const danger = getDangerStatus();
    
    setUsageStatus(usage);
    setKeepAliveStatus(keepAlive);
    setDangerStatus(danger);
  };

  // 컴포넌트 마운트시 초기화
  useEffect(() => {
    updateAllStatus();
    
    // 30초마다 업데이트
    const interval = setInterval(updateAllStatus, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // 서비스 토글
  const toggleService = (service: 'supabase' | 'redis') => {
    const status = getUsageStatus();
    const isEnabled = service === 'supabase' ? status.supabase.enabled : status.redis.enabled;
    
    if (isEnabled) {
      disable(service);
    } else {
      forceEnable(service);
    }
    
    updateAllStatus();
  };

  // Keep-alive 토글
  const toggleKeepAlive = (service: 'supabase' | 'redis') => {
    const status = getStatus();
    const isActive = service === 'supabase' ? status.isActive.supabase : status.isActive.redis;
    
    if (isActive) {
      stopKeepAlive(service);
    } else {
      restartKeepAlive(service);
    }
    
    updateAllStatus();
  };

  // 수동 핑
  const handleManualPing = async (service: 'supabase' | 'redis') => {
    const success = await manualPing(service);
    if (success) {
      updateAllStatus();
    }
  };

  // 캐시 정리
  const clearCache = (service: 'supabase' | 'redis') => {
    if (service === 'supabase') {
      smartSupabase.clearCache();
    } else {
      smartRedis.clearFallbackCache();
    }
    updateAllStatus();
  };

  // 시간 포맷팅
  const formatTime = (ms: number | null) => {
    if (!ms) return 'N/A';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}시간 ${minutes}분`;
  };

  // 진행률 바 컴포넌트
  const ProgressBar = ({ percentage, color }: { percentage: number; color: string }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className={`h-2.5 rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );

  // 상태 컬러 결정
  const getStatusColor = (percentage: number, enabled: boolean) => {
    if (!enabled) return 'bg-gray-400';
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!usageStatus || !keepAliveStatus || !dangerStatus) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <h3 className="text-lg font-semibold mb-4">무료 티어 사용량 + Keep-Alive 모니터링</h3>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">🆓 무료 티어 + Keep-Alive 모니터</h3>
        <button
          onClick={updateAllStatus}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          🔄 새로고침
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Supabase 상태 */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${usageStatus.supabase.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <h4 className="font-semibold text-lg">Supabase</h4>
              {dangerStatus.supabase.danger && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">⚠️ 위험</span>
              )}
            </div>
          </div>

          {/* 사용량 정보 */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>월간 전송량</span>
                <span>{usageStatus.supabase.usage.transferMB.toFixed(1)}MB / {usageStatus.supabase.limits.monthlyTransferMB}MB</span>
              </div>
              <ProgressBar 
                percentage={usageStatus.supabase.percentage.transfer}
                color={getStatusColor(usageStatus.supabase.percentage.transfer, usageStatus.supabase.enabled)}
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>월간 요청수</span>
                <span>{usageStatus.supabase.usage.requests.toLocaleString()} / {usageStatus.supabase.limits.requests.toLocaleString()}</span>
              </div>
              <ProgressBar 
                percentage={usageStatus.supabase.percentage.requests}
                color={getStatusColor(usageStatus.supabase.percentage.requests, usageStatus.supabase.enabled)}
              />
            </div>
          </div>

          {/* Keep-Alive 정보 */}
          <div className="border-t pt-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Keep-Alive 상태</span>
              <div className={`w-2 h-2 rounded-full ${keepAliveStatus.isActive.supabase ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <div>마지막 핑: {keepAliveStatus.lastPing.supabase ? 
                new Date(keepAliveStatus.lastPing.supabase).toLocaleString() : '없음'}</div>
              <div>다음 핑: {formatTime(keepAliveStatus.timeToNext.supabase)}</div>
              {dangerStatus.supabase.danger && (
                <div className="text-red-600 font-medium">
                  ⚠️ {dangerStatus.supabase.daysLeft}일 후 휴면 위험!
                </div>
              )}
            </div>
          </div>

          {/* 제어 버튼들 */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => toggleService('supabase')}
              className={`px-2 py-1 rounded ${
                usageStatus.supabase.enabled 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {usageStatus.supabase.enabled ? '🔒 서비스OFF' : '🔄 서비스ON'}
            </button>
            
            <button
              onClick={() => toggleKeepAlive('supabase')}
              className={`px-2 py-1 rounded ${
                keepAliveStatus.isActive.supabase 
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {keepAliveStatus.isActive.supabase ? '⏸️ Keep-OFF' : '▶️ Keep-ON'}
            </button>
            
            <button
              onClick={() => handleManualPing('supabase')}
              className="px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
            >
              🔔 수동핑
            </button>
            
            <button
              onClick={() => clearCache('supabase')}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              🧹 캐시정리
            </button>
          </div>
        </div>

        {/* Redis 상태 */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${usageStatus.redis.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <h4 className="font-semibold text-lg">Upstash Redis</h4>
              {dangerStatus.redis.danger && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">⚠️ 위험</span>
              )}
            </div>
          </div>

          {/* 사용량 정보 */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>일일 명령수</span>
                <span>{usageStatus.redis.usage.commands.toLocaleString()} / {usageStatus.redis.limits.dailyCommands.toLocaleString()}</span>
              </div>
              <ProgressBar 
                percentage={usageStatus.redis.percentage.commands}
                color={getStatusColor(usageStatus.redis.percentage.commands, usageStatus.redis.enabled)}
              />
            </div>
          </div>

          {/* Keep-Alive 정보 */}
          <div className="border-t pt-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Keep-Alive 상태</span>
              <div className={`w-2 h-2 rounded-full ${keepAliveStatus.isActive.redis ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <div>마지막 핑: {keepAliveStatus.lastPing.redis ? 
                new Date(keepAliveStatus.lastPing.redis).toLocaleString() : '없음'}</div>
              <div>다음 핑: {formatTime(keepAliveStatus.timeToNext.redis)}</div>
              {dangerStatus.redis.danger && (
                <div className="text-red-600 font-medium">
                  ⚠️ {dangerStatus.redis.daysLeft}일 후 삭제 위험!
                </div>
              )}
            </div>
          </div>

          {/* 제어 버튼들 */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => toggleService('redis')}
              className={`px-2 py-1 rounded ${
                usageStatus.redis.enabled 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {usageStatus.redis.enabled ? '🔒 서비스OFF' : '🔄 서비스ON'}
            </button>
            
            <button
              onClick={() => toggleKeepAlive('redis')}
              className={`px-2 py-1 rounded ${
                keepAliveStatus.isActive.redis 
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {keepAliveStatus.isActive.redis ? '⏸️ Keep-OFF' : '▶️ Keep-ON'}
            </button>
            
            <button
              onClick={() => handleManualPing('redis')}
              className="px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
            >
              🔔 수동핑
            </button>
            
            <button
              onClick={() => clearCache('redis')}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              🧹 캐시정리
            </button>
          </div>
        </div>
      </div>

      {/* 전체 경고 메시지 */}
      <div className="mt-6 space-y-2">
        {(dangerStatus.supabase.danger || dangerStatus.redis.danger) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-red-600">🚨</span>
              <span className="text-sm font-semibold text-red-800">삭제 위험 알림!</span>
            </div>
            <div className="text-sm text-red-700 space-y-1">
              {dangerStatus.supabase.danger && (
                <div>• Supabase: {dangerStatus.supabase.daysLeft}일 후 휴면 위험</div>
              )}
              {dangerStatus.redis.danger && (
                <div>• Redis: {dangerStatus.redis.daysLeft}일 후 삭제 위험</div>
              )}
            </div>
          </div>
        )}

        {usageStatus.supabase.percentage.transfer > 80 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-sm text-yellow-800">
                Supabase 전송량이 80%를 초과했습니다. 사용량을 주의하세요.
              </span>
            </div>
          </div>
        )}
        
        {usageStatus.redis.percentage.commands > 80 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-sm text-yellow-800">
                Redis 명령수가 80%를 초과했습니다. 사용량을 주의하세요.
              </span>
            </div>
          </div>
        )}

        {(!usageStatus.supabase.enabled || !usageStatus.redis.enabled) && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">ℹ️</span>
              <span className="text-sm text-blue-800">
                일부 서비스가 비활성화되어 있습니다. 캐시된 데이터를 사용 중입니다.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Keep-Alive 설명 */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h5 className="font-semibold text-green-800 mb-2">🔄 Keep-Alive 시스템</h5>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Supabase</strong>: 4시간마다 자동 핑 (7일 휴면 방지)</li>
          <li>• <strong>Redis</strong>: 12시간마다 자동 핑 (30일 삭제 방지)</li>
          <li>• 사용량 제한 시 자동 건너뜀</li>
          <li>• 실패시 5분 후 자동 재시도</li>
          <li>• 수동 핑으로 즉시 활성화 가능</li>
        </ul>
      </div>
    </div>
  );
}