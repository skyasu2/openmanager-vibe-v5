'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  User, 
  Bot, 
  Monitor, 
  AlertTriangle, 
  Power,
  Settings,
  LogOut,
  ChevronDown,
  Database,
  X,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Shield,
  StopCircle,
  HardDrive
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useToast } from '@/components/ui/ToastNotification';

interface UnifiedProfileComponentProps {
  userName?: string;
  userAvatar?: string;
}

// 통합 설정 패널 컴포넌트
const UnifiedSettingsPanel = ({ 
  isOpen, 
  onClose, 
  buttonRef 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'generator' | 'monitor' | 'general'>('ai');
  const [aiPassword, setAiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const { 
    aiAgent, 
    isSystemStarted,
    authenticateAIAgent, 
    disableAIAgent,
    attempts,
    isLocked,
    getRemainingLockTime
  } = useUnifiedAdminStore();
  
  const { success, error, info, warning } = useToast();

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape, { capture: true });
    return () => document.removeEventListener('keydown', handleEscape, { capture: true });
  }, [isOpen, onClose]);

  // 외부 클릭으로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      // 모달 영역 밖 클릭 시에만 닫기
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // 드롭다운 버튼 클릭이 아닌 경우에만 닫기
        if (buttonRef?.current && !buttonRef.current.contains(event.target as Node)) {
          onClose();
        }
      }
    };

    // 약간의 지연을 두어 드롭다운 버튼 클릭과 충돌 방지
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  // Body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // AI 에이전트 인증 처리
  const handleAIAuthentication = async () => {
    if (!aiPassword.trim()) {
      warning('비밀번호를 입력해주세요.');
      return;
    }

    setIsAuthenticating(true);
    
    try {
      // 실제 인증 처리
      const result = authenticateAIAgent(aiPassword);
      
      if (result.success) {
        success('🤖 AI 에이전트 모드가 활성화되었습니다!');
        setAiPassword('');
        setActiveTab('general');
      } else {
        error(result.message);
        if (isLocked) {
          const remainingTime = getRemainingLockTime();
          error(`계정이 잠겼습니다. ${Math.ceil(remainingTime / 1000)}초 후 다시 시도하세요.`);
        }
      }
    } catch (err: any) {
      error('인증 처리 중 오류가 발생했습니다.');
      console.error('AI 인증 오류:', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // AI 에이전트 비활성화
  const handleAIDisable = () => {
    disableAIAgent();
    success('AI 에이전트가 비활성화되었습니다.');
    setActiveTab('general');
  };

  // 서버 데이터 생성기 상태 확인
  const handleGeneratorCheck = async () => {
    try {
      info('서버 데이터 생성기 상태를 확인하고 있습니다...');
      
      // 🛡️ API 호출 시간 제한 설정
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 제한
      
      const response = await fetch('/api/data-generator', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        success(`서버 데이터 생성기가 정상 동작중입니다. ${data?.status ? `(상태: ${data.status})` : ''}`);
      } else if (response.status === 404) {
        warning('서버 데이터 생성기 엔드포인트를 찾을 수 없습니다.');
      } else {
        const errorData = await response.json().catch(() => null);
        warning(`서버 데이터 생성기 상태 확인에 실패했습니다. (${response.status}${errorData?.message ? `: ${errorData.message}` : ''})`);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        error('서버 데이터 생성기 상태 확인이 시간 초과되었습니다.');
      } else if (err.code === 'ENOTFOUND' || err.message?.includes('fetch')) {
        error('네트워크 연결을 확인해주세요.');
      } else {
        error(`서버 데이터 생성기 연결에 실패했습니다: ${err.message || '알 수 없는 오류'}`);
      }
      console.error('🔍 Generator Check Error:', err);
    }
  };

  // 서버 모니터링 상태 확인
  const handleMonitorCheck = async () => {
    try {
      info('서버 모니터링 시스템을 확인하고 있습니다...');
      
      // 🛡️ API 호출 시간 제한 설정
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 제한
      
      const response = await fetch('/api/health', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        success(`서버 모니터링 시스템이 정상 동작중입니다. ${data?.uptime ? `(업타임: ${data.uptime})` : ''}`);
      } else if (response.status === 404) {
        warning('서버 모니터링 엔드포인트를 찾을 수 없습니다.');
      } else {
        const errorData = await response.json().catch(() => null);
        warning(`서버 모니터링 상태 확인에 실패했습니다. (${response.status}${errorData?.message ? `: ${errorData.message}` : ''})`);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        error('서버 모니터링 상태 확인이 시간 초과되었습니다.');
      } else if (err.code === 'ENOTFOUND' || err.message?.includes('fetch')) {
        error('네트워크 연결을 확인해주세요.');
      } else {
        error(`서버 모니터링 시스템 연결에 실패했습니다: ${err.message || '알 수 없는 오류'}`);
      }
      console.error('🔍 Monitor Check Error:', err);
    }
  };

  // 메트릭 생성 설정 처리
  const handleMetricsConfig = async () => {
    try {
      success('메트릭 생성 설정을 확인합니다...');
      
      // 메트릭 설정 API 호출
      const response = await fetch('/api/admin/metrics-config');
      const config = await response.json();
      
      info(`현재 메트릭 설정: 간격 ${config.interval || 5}초, 패턴 ${config.realistic ? '현실적' : '기본'}`);
    } catch (err: any) {
      error('메트릭 설정 확인 실패');
    }
  };

  // 시나리오 관리 처리
  const handleScenarioManager = async () => {
    try {
      success('시나리오 관리자를 실행합니다...');
      
      // 시나리오 목록 조회
      const response = await fetch('/api/admin/scenarios');
      const scenarios = await response.json();
      
      info(`현재 시나리오: ${scenarios.active || 0}개 활성, ${scenarios.total || 0}개 총`);
    } catch (err: any) {
      error('시나리오 관리 실패');
    }
  };

  // 알림 임계값 설정 처리
  const handleThresholdConfig = async () => {
    try {
      success('알림 임계값 설정을 확인합니다...');
      
      // 임계값 설정 조회
      const response = await fetch('/api/admin/thresholds');
      const thresholds = await response.json();
      
      info(`현재 임계값: CPU ${thresholds.cpu || 80}%, 메모리 ${thresholds.memory || 85}%, 디스크 ${thresholds.disk || 90}%`);
    } catch (err: any) {
      error('임계값 설정 확인 실패');
    }
  };

  // 대시보드 커스터마이징 처리
  const handleDashboardCustomize = async () => {
    try {
      success('대시보드 설정을 확인합니다...');
      
      // 대시보드 설정 조회
      const response = await fetch('/api/admin/dashboard-config');
      const config = await response.json();
      
      info(`현재 대시보드: ${config.layout || 'grid'} 레이아웃, ${config.widgets || 0}개 위젯`);
    } catch (err: any) {
      error('대시보드 설정 확인 실패');
    }
  };

  // 알림 설정 처리
  const handleNotificationConfig = async () => {
    try {
      success('알림 설정을 확인합니다...');
      
      // 알림 설정 조회
      const response = await fetch('/api/admin/notification-config');
      const config = await response.json();
      
      info(`알림 설정: ${config.slack ? '슬랙 ' : ''}${config.email ? '이메일 ' : ''}${config.webhook ? '웹훅 ' : ''}활성화됨`);
    } catch (err: any) {
      error('알림 설정 확인 실패');
    }
  };

  // 테마 설정 처리
  const handleThemeConfig = async () => {
    try {
      success('테마 설정을 변경합니다...');
      
      // 현재 테마 토글 (다크 ↔ 라이트)
      const currentTheme = localStorage.getItem('theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      
      success(`테마가 ${newTheme === 'dark' ? '다크' : '라이트'} 모드로 변경되었습니다!`);
    } catch (err: any) {
      error('테마 설정 변경 실패');
    }
  };

  // 백업 설정 처리
  const handleBackupConfig = async () => {
    try {
      success('백업 설정을 확인합니다...');
      
      // 백업 상태 조회
      const response = await fetch('/api/admin/backup-status');
      const status = await response.json();
      
      info(`백업 상태: 마지막 백업 ${status.lastBackup || '없음'}, 자동 백업 ${status.autoBackup ? '활성' : '비활성'}`);
    } catch (err: any) {
      error('백업 설정 확인 실패');
    }
  };

  if (!isOpen) return null;

  // Portal을 사용하여 모달을 body에 직접 렌더링
  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="w-full max-w-2xl bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden relative"
        style={{ zIndex: 100000 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 id="settings-modal-title" className="text-xl font-bold text-white">시스템 설정</h2>
                <p className="text-gray-400">AI 모드, 데이터 생성기, 모니터링 제어</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="설정 창 닫기"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-700/50">
          {[
            { id: 'ai', label: 'AI 모드', icon: Bot },
            { id: 'generator', label: '데이터 생성기', icon: Database },
            { id: 'monitor', label: '모니터링', icon: Monitor },
            { id: 'general', label: '일반 설정', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tab-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 p-4 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* AI 모드 탭 */}
          {activeTab === 'ai' && (
            <div id="tab-panel-ai" role="tabpanel" aria-labelledby="tab-ai" className="space-y-6">
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  aiAgent.isEnabled
                    ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                    : 'bg-gray-600'
                }`}>
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  AI 에이전트 모드
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {aiAgent.isEnabled 
                    ? 'AI 에이전트가 활성화되어 고급 분석 기능을 사용할 수 있습니다.' 
                    : 'AI 에이전트를 활성화하여 지능형 서버 분석 기능을 사용하세요.'
                  }
                </p>
              </div>

              {!aiAgent.isEnabled ? (
                // AI 활성화 폼
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={aiPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiPassword(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAIAuthentication();
                        }
                      }}
                      placeholder="AI 에이전트 인증 비밀번호"
                      disabled={isLocked || isAuthenticating}
                      className="w-full p-3 pr-12 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
                      disabled={isLocked || isAuthenticating}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {attempts > 0 && !isLocked && (
                    <p className="text-orange-400 text-sm">
                      인증 실패: {attempts}/5 시도
                    </p>
                  )}

                  {isLocked && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                      <p className="text-red-300 text-sm">
                        5번의 실패로 인해 계정이 잠겼습니다. 잠시 후 다시 시도하세요.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleAIAuthentication}
                    disabled={isLocked || isAuthenticating || !isSystemStarted}
                    className="w-full p-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    {isAuthenticating ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>인증 중...</span>
                      </div>
                    ) : (
                      '🤖 AI 에이전트 활성화'
                    )}
                  </button>

                  {!isSystemStarted && (
                    <p className="text-yellow-400 text-sm text-center">
                      시스템을 먼저 시작해주세요.
                    </p>
                  )}
                </div>
              ) : (
                // AI 비활성화 버튼
                <div className="space-y-4">
                  <div className="p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">AI 에이전트 활성화됨</span>
                    </div>
                    <p className="text-purple-200 text-sm">
                      지능형 서버 분석, 예측 모니터링, 고도화된 알림 시스템을 사용할 수 있습니다.
                    </p>
                  </div>

                  <button
                    onClick={handleAIDisable}
                    className="w-full p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg font-medium hover:bg-red-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    AI 에이전트 비활성화
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 데이터 생성기 탭 */}
          {activeTab === 'generator' && (
            <div id="tab-panel-generator" role="tabpanel" aria-labelledby="tab-generator" className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  서버 데이터 생성기
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  실시간 메트릭 시뮬레이션 및 테스트 데이터를 생성합니다.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleGeneratorCheck}
                  className="w-full p-4 bg-cyan-500/20 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <h4 className="text-white font-medium mb-2">데이터 생성기 상태 확인</h4>
                  <p className="text-cyan-200 text-sm text-left">
                    현재 서버 데이터 생성기의 동작 상태를 확인합니다.
                  </p>
                </button>

                <button
                  onClick={handleMetricsConfig}
                  className="w-full p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <h4 className="text-white font-medium mb-2">메트릭 생성 설정</h4>
                  <p className="text-blue-200 text-sm text-left">
                    CPU, 메모리, 네트워크 등의 메트릭 생성 패턴을 설정합니다.
                  </p>
                </button>

                <button
                  onClick={handleScenarioManager}
                  className="w-full p-4 bg-green-500/20 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <h4 className="text-white font-medium mb-2">시나리오 관리</h4>
                  <p className="text-green-200 text-sm text-left">
                    부하 테스트, 장애 시뮬레이션 등의 시나리오를 관리합니다.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* 모니터링 탭 */}
          {activeTab === 'monitor' && (
            <div id="tab-panel-monitor" role="tabpanel" aria-labelledby="tab-monitor" className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                  <Monitor className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  서버 모니터링
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  실시간 서버 상태 모니터링 및 알림 시스템을 관리합니다.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleMonitorCheck}
                  className="w-full p-4 bg-green-500/20 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <h4 className="text-white font-medium mb-2">모니터링 시스템 상태</h4>
                  <p className="text-green-200 text-sm text-left">
                    현재 서버 모니터링 시스템의 동작 상태를 확인합니다.
                  </p>
                </button>

                <button
                  onClick={handleThresholdConfig}
                  className="w-full p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <h4 className="text-white font-medium mb-2">알림 임계값 설정</h4>
                  <p className="text-yellow-200 text-sm text-left">
                    CPU, 메모리, 디스크 사용률 등의 알림 임계값을 설정합니다.
                  </p>
                </button>

                <button
                  onClick={handleDashboardCustomize}
                  className="w-full p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <h4 className="text-white font-medium mb-2">대시보드 설정</h4>
                  <p className="text-purple-200 text-sm text-left">
                    모니터링 대시보드의 레이아웃과 위젯을 커스터마이징합니다.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* 일반 설정 탭 */}
          {activeTab === 'general' && (
            <div id="tab-panel-general" role="tabpanel" aria-labelledby="tab-general" className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center mb-4">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  일반 설정
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  시스템 환경 설정 및 기타 옵션을 관리합니다.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleNotificationConfig}
                  className="w-full p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <h4 className="text-white font-medium mb-2">알림 설정</h4>
                  <p className="text-orange-200 text-sm text-left">
                    시스템 알림 및 경고 메시지 설정을 관리합니다.
                  </p>
                </button>

                <button
                  onClick={handleThemeConfig}
                  className="w-full p-4 bg-indigo-500/20 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <h4 className="text-white font-medium mb-2">테마 설정</h4>
                  <p className="text-indigo-200 text-sm text-left">
                    다크/라이트 모드 및 색상 테마를 설정합니다.
                  </p>
                </button>

                <button
                  onClick={handleBackupConfig}
                  className="w-full p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <h4 className="text-white font-medium mb-2">백업 설정</h4>
                  <p className="text-purple-200 text-sm text-left">
                    데이터 백업 주기 및 복원 설정을 관리합니다.
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default function UnifiedProfileComponent({ 
  userName = "사용자", 
  userAvatar
}: UnifiedProfileComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  
  const {
    isSystemStarted,
    aiAgent,
    isLocked,
    startSystem,
    stopSystem,
    disableAIAgent,
    logout
  } = useUnifiedAdminStore();

  const { success, info } = useToast();

  // 드롭다운 위치 계산
  const calculateDropdownPosition = () => {
    if (!profileButtonRef.current) return;
    
    const buttonRect = profileButtonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 기본 위치: 버튼 아래, 오른쪽 정렬
    let top = buttonRect.bottom + 8;
    let right = viewportWidth - buttonRect.right;
    
    // 드롭다운이 화면 아래로 넘어가는 경우 위쪽에 표시
    const dropdownHeight = 400; // 예상 드롭다운 높이
    if (top + dropdownHeight > viewportHeight) {
      top = buttonRect.top - dropdownHeight - 8;
    }
    
    // 모바일에서는 중앙 정렬
    if (viewportWidth < 640) {
      right = (viewportWidth - 320) / 2; // 드롭다운 너비 320px 기준
      if (right < 16) right = 16; // 최소 여백
    }
    
    setDropdownPosition({ top, right });
  };

  // 외부 클릭 감지 (강화된 버전)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;
      
      // 프로필 버튼 클릭은 제외
      if (profileButtonRef.current?.contains(target)) {
        return;
      }
      
      // 드롭다운 외부 클릭 시 닫기
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    // 여러 이벤트 리스너로 강화
    const events = ['mousedown', 'touchstart'];
    events.forEach(eventType => {
      document.addEventListener(eventType, handleClickOutside, true);
    });

    return () => {
      events.forEach(eventType => {
        document.removeEventListener(eventType, handleClickOutside, true);
      });
    };
  }, [isOpen]);

  // ESC 키로 드롭다운 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape, true);
    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [isOpen]);

  // 스크롤 시 드롭다운 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  // 윈도우 리사이즈 시 위치 재계산
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      calculateDropdownPosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // 설정 패널이 열릴 때 드롭다운 자동 닫기
  useEffect(() => {
    if (showSettingsPanel) {
      setIsOpen(false);
    }
  }, [showSettingsPanel]);

  // 드롭다운 열기/닫기 핸들러
  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isOpen) {
      calculateDropdownPosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSystemToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSystemStarted) {
      stopSystem();
    } else {
      startSystem();
    }
    setIsOpen(false);
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSettingsPanel(true);
    setIsOpen(false);
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logout();
    info('로그아웃되었습니다.');
    setIsOpen(false);
  };

  const handleAIDisable = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    disableAIAgent();
    info('AI 에이전트가 비활성화되었습니다.');
    setIsOpen(false);
  };

  const getModeDisplayText = () => {
    return aiAgent.isEnabled ? 'AI 에이전트 모드' : '기본 모니터링 모드';
  };

  const getModeStatusColor = () => {
    return aiAgent.isEnabled ? 'text-purple-400' : 'text-cyan-400';
  };

  const getSystemStatusColor = () => {
    if (isLocked) return 'text-red-400';
    if (!isSystemStarted) return 'text-gray-400';
    return aiAgent.isEnabled ? 'text-purple-400' : 'text-cyan-400';
  };

  // 드롭다운 컴포넌트 (Portal로 렌더링)
  const DropdownPortal = () => {
    if (typeof window === 'undefined') return null;
    
    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 오버레이 (모바일용) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] sm:hidden"
              onClick={() => setIsOpen(false)}
            />
            
            {/* 드롭다운 메뉴 */}
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 rounded-xl shadow-2xl z-[9999] min-w-[280px] max-w-[320px]"
              style={{
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`,
                maxHeight: 'calc(100vh - 100px)',
                overflowY: 'auto'
              }}
              role="menu"
              aria-orientation="vertical"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isLocked
                      ? 'bg-gradient-to-br from-red-500 to-orange-600'
                      : aiAgent.isEnabled
                      ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                      : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                  }`}>
                    {userAvatar ? (
                      <Image 
                        src={userAvatar} 
                        alt="Avatar" 
                        width={40} 
                        height={40} 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-white font-medium">{userName}</div>
                    <div className={`text-sm ${getModeStatusColor()}`}>
                      {getModeDisplayText()}
                    </div>
                  </div>
                </div>

                {/* 시스템 상태 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">시스템 상태</span>
                    <span className={`text-sm font-medium ${getSystemStatusColor()}`}>
                      {isLocked ? '🔒 잠김' : isSystemStarted ? '🟢 실행 중' : '🔴 중지됨'}
                    </span>
                  </div>

                  {/* 시스템 토글 버튼 */}
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSystemToggle}
                    disabled={isLocked}
                    className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500"
                    role="menuitem"
                  >
                    <div className={`p-2 rounded-lg ${
                      isSystemStarted ? 'bg-red-500/20' : 'bg-green-500/20'
                    }`}>
                      {isSystemStarted ? (
                        <StopCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <Power className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {isSystemStarted ? '시스템 종료' : '시스템 시작'}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {isSystemStarted ? '모든 기능을 중지합니다' : '모니터링을 시작합니다'}
                      </div>
                    </div>
                  </motion.button>

                  {/* AI 에이전트 상태 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        aiAgent.isEnabled 
                          ? 'bg-purple-500/20' 
                          : 'bg-gray-500/20'
                      }`}>
                        <Bot className={`w-4 h-4 ${
                          aiAgent.isEnabled ? 'text-purple-400' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">AI 에이전트</div>
                        <div className={`text-xs ${
                          aiAgent.isEnabled ? 'text-purple-400' : 'text-gray-400'
                        }`}>
                          {aiAgent.isEnabled ? '활성화됨' : '비활성화됨'}
                        </div>
                      </div>
                    </div>
                    {aiAgent.isEnabled && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAIDisable}
                        className="px-3 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        비활성화
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>

              {/* 메뉴 아이템들 */}
              <div className="p-2">
                {/* AI 엔진 관리 페이지 버튼 - AI 모드 활성화 시에만 표시 */}
                {aiAgent.isEnabled && aiAgent.isAuthenticated && (
                  <Link href="/admin/ai-agent">
                    <motion.button
                      whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsOpen(false)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                      role="menuitem"
                    >
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Shield className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium">🧠 AI 엔진 관리 페이지</div>
                        <div className="text-gray-400 text-xs">AI 로그, 컨텍스트, A/B 테스트 관리</div>
                      </div>
                    </motion.button>
                  </Link>
                )}

                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSettingsClick}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                  role="menuitem"
                >
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Settings className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">통합 설정</div>
                    <div className="text-gray-400 text-xs">AI 모드, 데이터 생성기, 모니터링 제어</div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  role="menuitem"
                >
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <LogOut className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">로그아웃</div>
                    <div className="text-gray-400 text-xs">현재 세션을 종료합니다</div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <>
      <div className="relative">
        {/* 프로필 버튼 */}
        <motion.button
          ref={profileButtonRef}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleToggleDropdown}
          className={`flex items-center gap-3 p-2 rounded-xl backdrop-blur-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${
            isLocked
              ? 'bg-red-500/20 border-red-500/50 shadow-red-500/20 shadow-lg focus:ring-red-500'
              : aiAgent.isEnabled
              ? 'bg-purple-500/20 border-purple-500/50 shadow-purple-500/20 shadow-lg focus:ring-purple-500'
              : 'bg-white/10 border-white/20 hover:bg-white/20 focus:ring-white/50'
          }`}
          aria-label="프로필 메뉴 열기"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {/* 아바타 */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isLocked
              ? 'bg-gradient-to-br from-red-500 to-orange-600'
              : aiAgent.isEnabled
              ? 'bg-gradient-to-br from-purple-500 to-pink-600'
              : 'bg-gradient-to-br from-cyan-500 to-blue-600'
          }`}>
            {userAvatar ? (
              <Image 
                src={userAvatar} 
                alt="Avatar" 
                width={32} 
                height={32} 
                className="w-full h-full rounded-full object-cover" 
              />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          
          {/* 사용자 정보 */}
          <div className="text-left hidden sm:block">
            <div className="text-white text-sm font-medium">{userName}</div>
            <div className={`text-xs ${getModeStatusColor()}`}>
              {getModeDisplayText()}
            </div>
          </div>
          
          {/* 상태 인디케이터 */}
          <div className="flex items-center gap-1">
            {/* AI 에이전트 상태 */}
            {aiAgent.isEnabled && aiAgent.state === 'processing' && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
            
            {/* 잠금 상태 */}
            {isLocked && (
              <AlertTriangle className="w-3 h-3 text-red-400" />
            )}
            
            {/* 드롭다운 아이콘 */}
            <ChevronDown className={`w-3 h-3 text-white/70 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} />
          </div>
        </motion.button>
      </div>

      {/* 드롭다운 메뉴 (Portal로 렌더링) */}
      <DropdownPortal />

      {/* 통합 설정 패널 */}
      <AnimatePresence>
        {showSettingsPanel && (
          <UnifiedSettingsPanel
            isOpen={showSettingsPanel}
            onClose={() => setShowSettingsPanel(false)}
            buttonRef={profileButtonRef}
          />
        )}
      </AnimatePresence>
    </>
  );
} 