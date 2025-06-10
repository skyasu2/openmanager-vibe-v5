/**
 * 🤖 Google AI 베타 모드 설정 컴포넌트
 *
 * ✨ 기능:
 * - 베타 모드 온/오프 토글
 * - Google AI Studio API 키 설정
 * - 모델 선택 (Gemini 1.5 Flash/Pro)
 * - 연결 테스트 및 상태 표시
 * - 사용량 통계 표시
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  Brain,
  Gauge,
  Info,
} from 'lucide-react';

interface GoogleAIBetaSettingsProps {
  className?: string;
}

// 🎛️ 설정 상태 타입
interface GoogleAIConfig {
  enabled: boolean;
  apiKey: string;
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro';
  showApiKey: boolean;
}

// 📊 상태 정보 타입
interface GoogleAIStatus {
  connected: boolean;
  model: string;
  currentUsage: {
    minute: number;
    day: number;
  };
  rateLimits: {
    rpm: number;
    daily: number;
  };
  latency?: number;
}

export default function GoogleAIBetaSettings({
  className = '',
}: GoogleAIBetaSettingsProps) {
  // 🎛️ 설정 상태
  const [config, setConfig] = useState<GoogleAIConfig>({
    enabled: false,
    apiKey: '',
    model: 'gemini-1.5-flash',
    showApiKey: false,
  });

  // 📊 연결 상태
  const [status, setStatus] = useState<GoogleAIStatus>({
    connected: false,
    model: 'gemini-1.5-flash',
    currentUsage: { minute: 0, day: 0 },
    rateLimits: { rpm: 15, daily: 1500 },
  });

  // 🔄 UI 상태
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latency?: number;
  } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 🔧 초기 설정 로드
  useEffect(() => {
    loadConfig();
    loadStatus();
  }, []);

  // 📚 설정 로드
  const loadConfig = async () => {
    try {
      const response = await fetch('/api/ai/google-ai/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  };

  // 📊 상태 로드
  const loadStatus = async () => {
    try {
      const response = await fetch('/api/ai/google-ai/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('상태 로드 실패:', error);
    }
  };

  // 💾 설정 저장
  const saveConfig = async (newConfig: Partial<GoogleAIConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      setConfig(updatedConfig);

      const response = await fetch('/api/ai/google-ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });

      if (!response.ok) {
        throw new Error('설정 저장 실패');
      }

      // 상태 새로고침
      if (updatedConfig.enabled) {
        await loadStatus();
      }
    } catch (error) {
      console.error('설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    }
  };

  // 🧪 연결 테스트
  const testConnection = async () => {
    if (!config.apiKey) {
      setTestResult({ success: false, message: 'API 키를 입력해주세요.' });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/ai/google-ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: config.apiKey,
          model: config.model,
        }),
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        await loadStatus();
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `연결 오류: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 🎨 사용량 게이지 컴포넌트
  const UsageGauge = ({
    current,
    max,
    label,
  }: {
    current: number;
    max: number;
    label: string;
  }) => {
    const percentage = Math.min((current / max) * 100, 100);
    const getColor = () => {
      if (percentage > 80) return 'text-red-500';
      if (percentage > 60) return 'text-yellow-500';
      return 'text-green-500';
    };

    return (
      <div className='space-y-1'>
        <div className='flex justify-between text-xs'>
          <span className='text-gray-600'>{label}</span>
          <span className={`font-medium ${getColor()}`}>
            {current}/{max}
          </span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              percentage > 80
                ? 'bg-red-500'
                : percentage > 60
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 🎯 헤더 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-purple-100 rounded-lg'>
            <Sparkles className='w-5 h-5 text-purple-600' />
          </div>
          <div>
            <h3 className='font-semibold text-gray-900'>Google AI Studio</h3>
            <p className='text-sm text-gray-500'>베타 모드 고급 기능</p>
          </div>
        </div>

        {/* 베타 배지 */}
        <motion.div
          animate={{ scale: config.enabled ? 1.1 : 1 }}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            config.enabled
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {config.enabled ? '🚀 활성화' : '⏸️ 비활성화'}
        </motion.div>
      </div>

      {/* 🔄 메인 토글 */}
      <div className='bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Brain className='w-5 h-5 text-purple-600' />
            <div>
              <h4 className='font-medium text-gray-900'>베타 모드 활성화</h4>
              <p className='text-sm text-gray-600'>
                Google AI Studio (Gemini) 사용
              </p>
            </div>
          </div>

          <motion.button
            onClick={() => saveConfig({ enabled: !config.enabled })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              config.enabled ? 'bg-purple-500' : 'bg-gray-300'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ x: config.enabled ? 24 : 2 }}
              className='absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm'
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.button>
        </div>

        {/* 활성화 시 추가 정보 */}
        <AnimatePresence>
          {config.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='mt-3 pt-3 border-t border-purple-200'
            >
              <div className='flex items-center gap-2 text-sm'>
                <Zap className='w-4 h-4 text-purple-500' />
                <span className='text-purple-700'>
                  고급 분석, 실시간 학습, 예측 기능 활성화됨
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🔑 API 키 설정 */}
      <AnimatePresence>
        {config.enabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className='space-y-4'
          >
            {/* API 키 입력 */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Google AI Studio API 키
              </label>
              <div className='relative'>
                <input
                  type={config.showApiKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={e =>
                    setConfig(prev => ({ ...prev, apiKey: e.target.value }))
                  }
                  placeholder='AIza...'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                />
                <button
                  onClick={() =>
                    setConfig(prev => ({
                      ...prev,
                      showApiKey: !prev.showApiKey,
                    }))
                  }
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  {config.showApiKey ? (
                    <EyeOff className='w-4 h-4' />
                  ) : (
                    <Eye className='w-4 h-4' />
                  )}
                </button>
              </div>

              {/* API 키 안내 */}
              <div className='flex items-start gap-2 mt-2 p-3 bg-blue-50 rounded-lg'>
                <Info className='w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0' />
                <div className='text-sm text-blue-700'>
                  <p>Google AI Studio에서 무료 API 키를 받으세요:</p>
                  <a
                    href='https://aistudio.google.com'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline hover:text-blue-800'
                  >
                    https://aistudio.google.com
                  </a>
                </div>
              </div>
            </div>

            {/* 모델 선택 */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Gemini 모델 선택
              </label>
              <select
                value={config.model}
                onChange={e =>
                  setConfig(prev => ({ ...prev, model: e.target.value as any }))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500'
              >
                <option value='gemini-1.5-flash'>
                  Gemini 1.5 Flash (빠름, 15 RPM)
                </option>
                <option value='gemini-1.5-pro'>
                  Gemini 1.5 Pro (고품질, 2 RPM)
                </option>
              </select>
            </div>

            {/* 연결 테스트 및 저장 */}
            <div className='flex gap-3'>
              <button
                onClick={testConnection}
                disabled={isLoading || !config.apiKey}
                className='flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {isLoading ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  <Zap className='w-4 h-4' />
                )}
                연결 테스트
              </button>

              <button
                onClick={() => saveConfig(config)}
                className='flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors'
              >
                <Settings className='w-4 h-4' />
                설정 저장
              </button>
            </div>

            {/* 테스트 결과 */}
            <AnimatePresence>
              {testResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className='w-4 h-4' />
                  ) : (
                    <AlertCircle className='w-4 h-4' />
                  )}
                  <span className='text-sm'>
                    {testResult.message}
                    {testResult.latency && ` (${testResult.latency}ms)`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 사용량 통계 */}
            {status.connected && (
              <div className='bg-gray-50 p-4 rounded-lg space-y-3'>
                <div className='flex items-center gap-2'>
                  <Gauge className='w-4 h-4 text-gray-600' />
                  <span className='font-medium text-gray-900'>사용량 통계</span>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <UsageGauge
                    current={status.currentUsage.minute}
                    max={status.rateLimits.rpm}
                    label='분당 요청'
                  />
                  <UsageGauge
                    current={status.currentUsage.day}
                    max={status.rateLimits.daily}
                    label='일일 요청'
                  />
                </div>

                <div className='text-xs text-gray-500 mt-2'>
                  모델: {status.model} • 연결 상태:{' '}
                  <span className='text-green-600'>정상</span>
                  {status.latency && ` • 응답시간: ${status.latency}ms`}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
