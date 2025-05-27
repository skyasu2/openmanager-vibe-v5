'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSystemControl } from '../hooks/useSystemControl';
import ProfileDropdown from '../components/ProfileDropdown';

// 동적 렌더링 강제 (HTML 파일 생성 방지)
export const dynamic = 'force-dynamic';

interface FeatureDetail {
  title: string;
  description: string;
  benefits: string[];
  image: string;
  icon: string;
}

const features: FeatureDetail[] = [
  {
    title: "자연어 AI 에이전트",
    description: "지능형 AI 엔진 기반으로 자연어 질의를 실시간 분석하여 서버 상태를 즉시 응답합니다.",
    benefits: [
      "패턴 매칭 기반 의도 분류",
      "LLM 비용 없는 경량화 AI 추론",
      "도메인 특화 서버 모니터링 AI",
      "실시간 메트릭 연동"
    ],
    image: "💬",
    icon: "fas fa-comments"
  },
  {
    title: "지능형 분석 시스템",
    description: "근본원인 분석기, 예측 알림, 솔루션 추천 엔진으로 서버 문제를 사전에 예방하고 해결합니다.",
    benefits: [
      "AI 근본원인 분석기",
      "예측 알림 시스템",
      "솔루션 추천 엔진",
      "연관 관계 분석 및 자동 해결책"
    ],
    image: "🔍",
    icon: "fas fa-search-plus"
  },
  {
    title: "자동 보고서 생성",
    description: "AI가 서버 데이터를 분석하여 상세한 보고서를 자동 생성하고 맞춤형 권장사항을 제공합니다.",
    benefits: [
      "AI 기반 자동 분석 보고서",
      "시간대별/서버별 맞춤형 리포트",
      "PDF/HTML 다중 포맷 지원",
      "베스트 프랙티스 권장사항"
    ],
    image: "📋",
    icon: "fas fa-file-alt"
  }
];

export default function HomePage() {
  const router = useRouter();
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetail | null>(null);
  const [showVibeCoding, setShowVibeCoding] = useState(false);
  const [showMainFeature, setShowMainFeature] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 개선된 시스템 제어
  const {
    state,
    isSystemActive,
    isSystemPaused,
    formattedTime,
    aiAgent,
    startFullSystem,
    stopFullSystem,
    resumeFullSystem,
    isUserSession,
    pauseReason
  } = useSystemControl();

  // 데이터 생성기 상태 관리
  const [dataGeneratorStatus, setDataGeneratorStatus] = useState<{
    isGenerating: boolean;
    remainingTime: number;
    currentPattern: 'normal' | 'high-load' | 'maintenance' | null;
    patterns: string[];
  }>({
    isGenerating: false,
    remainingTime: 0,
    currentPattern: null,
    patterns: []
  });

  // 데이터 생성기 상태 업데이트 함수를 useCallback으로 최적화
  const updateGeneratorStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/data-generator');
      if (response.ok) {
        const data = await response.json();
        setDataGeneratorStatus(data.data.generation);
      }
    } catch (error) {
      console.error('Failed to fetch generator status:', error);
    }
  }, []);

  useEffect(() => {
    // 페이지 로딩 애니메이션
    const elements = document.querySelectorAll('.fade-in-up');
    elements.forEach((element: Element) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.opacity = '1';
      htmlElement.style.transform = 'translateY(0)';
    });
    
    // 초기 데이터 생성기 상태 로드
    updateGeneratorStatus();
    
    // 활성 모드일 때 주기적으로 상태 업데이트
    let statusInterval: NodeJS.Timeout;
    if (isSystemActive || dataGeneratorStatus.isGenerating) {
      statusInterval = setInterval(() => {
        updateGeneratorStatus();
      }, 1000); // 1초마다 업데이트
    }
    
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [isSystemActive, dataGeneratorStatus.isGenerating, updateGeneratorStatus]);

  // 🚀 사용자 세션 시작 함수 (개선됨)
  const handleStartFullSystem = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('🚀 사용자 세션 시작...');
    
    try {
      const result = await startFullSystem();
      
      if (result.success) {
        if (result.errors.length > 0) {
          alert(`✅ ${result.message}\n\n경고 사항:\n${result.errors.join('\n')}\n\n대시보드에서 실시간 데이터와 AI 에이전트를 사용할 수 있습니다.`);
        } else {
          alert(`✅ ${result.message}\n\n이제 대시보드에서 실시간 데이터와 AI 에이전트를 사용할 수 있습니다.`);
        }
      } else {
        const errorDetails = result.errors.length > 0 
          ? `\n\n오류 상세:\n${result.errors.join('\n')}` 
          : '';
        alert(`⚠️ ${result.message}${errorDetails}\n\n일부 기능이 제한될 수 있습니다.`);
      }
      
      // 데이터 생성기 상태 자동 초기화 및 업데이트
      setDataGeneratorStatus({
        isGenerating: true,
        remainingTime: 60 * 60 * 1000, // 사용자 세션은 60분
        currentPattern: 'normal',
        patterns: ['normal', 'high-load', 'maintenance']
      });
      
    } catch (error) {
      console.error('❌ 시스템 시작 실패:', error);
      alert('❌ 시스템 시작에 실패했습니다. 개발자 도구 콘솔을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🛑 시스템 중지 함수 (개선됨)
  const handleStopFullSystem = async () => {
    if (isLoading) return;
    
    const sessionType = isUserSession ? '사용자 세션' : 'AI 세션';
    
    if (!confirm(`${sessionType}을 중지하시겠습니까?\n\n• 모든 서버 모니터링이 중단됩니다\n• AI 에이전트가 비활성화됩니다`)) {
      return;
    }
    
    setIsLoading(true);
    console.log('🛑 시스템 중지...');
    
    try {
      const result = await stopFullSystem();
      
      if (result.success) {
        if (result.errors.length > 0) {
          alert(`🔴 ${result.message}\n\n경고 사항:\n${result.errors.join('\n')}`);
        } else {
          alert(`🔴 ${result.message}`);
        }
      } else {
        alert(`❌ ${result.message}\n\n오류 내용:\n${result.errors.join('\n')}`);
      }
      
      // 데이터 생성기 상태 초기화
      setDataGeneratorStatus({
        isGenerating: false,
        remainingTime: 0,
        currentPattern: null,
        patterns: []
      });
      
    } catch (error) {
      console.error('❌ 시스템 중지 실패:', error);
      alert('❌ 시스템 중지에 실패했습니다. 개발자 도구 콘솔을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // ▶️ 시스템 재개 함수
  const handleResumeSystem = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('▶️ 시스템 재개...');
    
    try {
      const result = await resumeFullSystem();
      
      if (result.success) {
        alert(`▶️ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
      
    } catch (error) {
      console.error('❌ 시스템 재개 실패:', error);
      alert('❌ 시스템 재개에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 대시보드로 이동
  const handleGoToDashboard = () => {
    console.log('🏠 대시보드로 이동');
    router.push('/dashboard');
  };

  const openFeatureModal = (feature: FeatureDetail) => {
    setSelectedFeature(feature);
  };

  const closeFeatureModal = () => {
    setSelectedFeature(null);
  };

  const openVibeCodingModal = () => {
    setShowVibeCoding(true);
  };

  const closeVibeCodingModal = () => {
    setShowVibeCoding(false);
  };

  const openMainFeatureModal = () => {
    setShowMainFeature(true);
  };

  const closeMainFeatureModal = () => {
    setShowMainFeature(false);
  };

  return (
    <>
      <style jsx global>{`
        :root {
          --primary: #ec4899;
          --secondary: #a855f7;
          --accent: #8b5cf6;
          --success: #22c55e;
          --info: #0ea5e9;
          --text-white: #ffffff;
          --glass-bg: rgba(255, 255, 255, 0.1);
          --glass-border: rgba(255, 255, 255, 0.2);
          --bg-gradient: linear-gradient(135deg, #4a5568 0%, #553c5e 20%, #2d3748 40%, #4c1d95 70%, #3182ce 100%);
          --pink-purple-gradient: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
          --pink-purple-bright: linear-gradient(135deg, #f472b6 0%, #c084fc 100%);
          --gold-gradient: linear-gradient(45deg, #fbbf24 0%, #f59e0b 25%, #d97706 50%, #b45309 75%, #92400e 100%);
          --bright-gold: linear-gradient(45deg, #fef3c7 0%, #fbbf24 25%, #f59e0b 50%, #d97706 75%, #b45309 100%);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          --shadow-pink: 0 10px 25px rgba(236, 72, 153, 0.3);
          --shadow-pink-hover: 0 15px 35px rgba(236, 72, 153, 0.4);
          --shadow-gold: 0 10px 25px rgba(251, 191, 36, 0.3);
          --shadow-gold-hover: 0 15px 35px rgba(251, 191, 36, 0.4);
          --purple-accent: rgba(168, 85, 247, 0.3);
          --purple-accent-hover: rgba(168, 85, 247, 0.4);
          --purple-glow: rgba(168, 85, 247, 0.1);
          --purple-glow-hover: rgba(168, 85, 247, 0.15);
        }

        .splash-container {
          min-height: 100vh;
          height: auto;
          background: var(--bg-gradient);
          background-size: 400% 400%;
          animation: gradientShift 20s ease infinite;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          text-align: center;
          padding: 6rem 1rem 2rem 1rem;
          position: relative;
          overflow-x: hidden;
          overflow-y: auto;
        }

        .splash-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 50px 50px, 100px 100px, 75px 75px;
          animation: float 25s ease-in-out infinite;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }

        .fade-in-up {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease;
        }

        .main-title {
          font-size: 2.8rem;
          font-weight: 700;
          color: var(--text-white);
          margin-bottom: 0.8rem;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          line-height: 1.2;
          z-index: 1;
        }

        .highlight {
          background: var(--pink-purple-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: none;
          font-weight: 800;
        }

        .subtitle {
          font-size: 1.1rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 1.5rem;
          max-width: 500px;
          line-height: 1.6;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 1;
        }

        .cta-section {
          margin: 1rem 0;
          z-index: 1;
        }

        .cta-guide {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 1rem;
          font-weight: 500;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
          60% { transform: translateY(-3px); }
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: var(--pink-purple-gradient);
          color: var(--text-white);
          font-size: 1.1rem;
          font-weight: 700;
          padding: 1rem 2rem;
          border: none;
          border-radius: 50px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-pink);
          z-index: 1;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          min-width: 220px;
          height: 56px;
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-pink-hover);
          background: var(--pink-purple-bright);
        }

        .btn-primary i {
          font-size: 1.1rem;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(45deg, #ef4444, #dc2626);
          color: var(--text-white);
          font-size: 1.1rem;
          font-weight: 700;
          padding: 1rem 2rem;
          border: none;
          border-radius: 50px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
          z-index: 1;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          min-width: 220px;
          height: 56px;
        }

        .btn-secondary:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(239, 68, 68, 0.4);
          background: linear-gradient(45deg, #f87171, #ef4444);
        }

        .btn-secondary i {
          font-size: 1.1rem;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }

        .button-container {
          display: flex;
          gap: 1rem;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }

        .button-container .btn-secondary {
          min-width: 180px;
        }

        .finger-pointer {
          position: absolute;
          top: 50%;
          left: -80px;
          transform: translateY(-50%);
          font-size: 2rem;
          animation: pointAnimation 2s ease-in-out infinite;
          z-index: 10;
        }

        @keyframes pointAnimation {
          0%, 100% { 
            transform: translateY(-50%) translateX(0px);
            opacity: 0.8;
          }
          50% { 
            transform: translateY(-50%) translateX(10px);
            opacity: 1;
          }
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin: 0.8rem 0;
          max-width: 1000px;
          width: 100%;
          z-index: 1;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(15px);
          border: 1px solid var(--purple-accent);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          cursor: pointer;
          text-align: center;
          min-height: 220px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-shadow: 
            0 6px 24px rgba(0, 0, 0, 0.1),
            0 0 15px var(--purple-glow);
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 15px 40px rgba(0, 0, 0, 0.2),
            0 0 30px var(--purple-glow-hover);
          background: rgba(255, 255, 255, 0.15);
          border-color: var(--purple-accent-hover);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1.5rem;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .feature-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 0.8rem;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }

        .feature-description {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.5;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .modal-content {
          background: rgba(42, 108, 176, 0.95);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 25px;
          padding: 1.5rem;
          max-width: 500px;
          width: 100%;
          max-height: 85vh;
          overflow: hidden;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.3);
          font-size: 1.8rem;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.9);
          padding: 0.6rem;
          border-radius: 50%;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          font-weight: bold;
          line-height: 1;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.25);
          color: rgba(255, 255, 255, 1);
          transform: scale(1.1);
          border-color: rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .modal-close:active {
          transform: scale(0.95);
          background: rgba(255, 255, 255, 0.3);
        }

        .modal-header {
          text-align: center;
          margin-bottom: 1rem;
        }

        .modal-emoji {
          font-size: 3rem;
          margin-bottom: 0.5rem;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .modal-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 0.5rem;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }

        .modal-description {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.4;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .modal-benefits {
          margin-top: 1rem;
        }

        .modal-benefits h4 {
          font-size: 1.2rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 0.8rem;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          color: var(--text-white);
          font-size: 1.2rem;
          font-weight: 700;
          padding: 1rem 2.5rem;
          border: none;
          border-radius: 50px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 25px rgba(107, 114, 128, 0.3);
          z-index: 1;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .btn-secondary:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(107, 114, 128, 0.4);
          background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
        }

        .button-group {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }

        .system-status {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: center;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-weight: 600;
          color: var(--text-white);
          font-size: 1.1rem;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse 2s infinite;
        }

        .status-dot.active {
          background: #22c55e;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
        }

        .status-dot.ai-monitoring {
          background: #f59e0b;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
          animation: pulse-slow 3s infinite;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-stats {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .status-stats span {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
        }

        .status-stats .critical {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.5; }
        }

        .data-generator-status {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 15px;
          padding: 1.2rem;
          margin: 1rem 0;
          text-align: center;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
          box-shadow: 0 8px 32px rgba(168, 85, 247, 0.1);
        }

        .generator-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          margin-bottom: 0.8rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .generator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          animation: pulse 2s ease-in-out infinite;
        }

        .generator-dot.generating {
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
        }

        .generator-stats {
          display: flex;
          justify-content: space-around;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .generator-controls {
          display: flex;
          gap: 0.8rem;
          justify-content: center;
          margin-top: 1rem;
          flex-wrap: wrap;
        }

        .btn-generator {
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }

        .btn-generator:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
        }

        .btn-generator:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-generator.stop {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
        }

        .btn-generator.stop:hover {
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
        }

        .btn-generator.init {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
        }

        .btn-generator.init:hover {
          box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
        }

        /* 패턴 컨트롤 */
        .pattern-controls {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .pattern-selector {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pattern-label {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 8px;
        }

        .pattern-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .pattern-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pattern-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          transform: translateY(-1px);
        }

        .pattern-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: rgba(255, 255, 255, 0.3);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .pattern-btn i {
          font-size: 11px;
        }

        .benefits-list {
          list-style: none;
          padding: 0;
        }

        .benefits-list li {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 0;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .benefits-list li:last-child {
          border-bottom: none;
        }

        .benefit-icon {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.1rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .vibe-coding-section {
          margin: 0.8rem 0;
          text-align: center;
          z-index: 1;
        }

        .vibe-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--gold-gradient);
          color: #1a1a1a;
          font-size: 1rem;
          font-weight: 700;
          padding: 0.8rem 1.5rem;
          border-radius: 25px;
          box-shadow: var(--shadow-gold);
          margin-bottom: 1rem;
          animation: pulse 2s ease-in-out infinite;
          cursor: pointer;
          transition: all 0.3s ease;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .vibe-badge:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-gold-hover);
          background: var(--bright-gold);
        }

        .vibe-badge i {
          font-size: 1.1rem;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .vibe-description {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .vibe-description strong {
          color: var(--text-white);
          font-weight: 600;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }

        .footer-info {
          margin-top: 0.8rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          text-align: center;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          z-index: 1;
        }

        .footer-info a {
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          margin: 0 0.5rem;
          transition: color 0.3s ease;
        }

        .footer-info a:hover {
          color: var(--text-white);
        }

        .vibe-modal {
          max-width: 550px;
          max-height: 85vh;
          overflow: hidden;
        }

        .vibe-stats {
          display: flex;
          justify-content: space-around;
          margin-top: 1rem;
          padding: 1rem;
          background: var(--pink-purple-gradient);
          border-radius: 15px;
          color: white;
        }

        .stat-item {
          text-align: center;
          flex: 1;
        }

        .stat-number {
          display: block;
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 0.3rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .stat-label {
          font-size: 0.8rem;
          opacity: 0.9;
          font-weight: 500;
        }

        .benefits-section {
          margin: 1rem 0 0.8rem 0;
          z-index: 1;
        }

        .benefits-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid var(--purple-accent);
          border-radius: 20px;
          padding: 1.8rem;
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
          box-shadow: 
            0 15px 30px rgba(0, 0, 0, 0.15),
            0 0 20px var(--purple-glow);
          transition: all 0.4s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .benefits-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(168, 85, 247, 0.1));
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }

        .benefits-card:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.25),
            0 0 40px var(--purple-glow-hover);
          background: rgba(255, 255, 255, 0.15);
          border-color: var(--purple-accent-hover);
        }

        .benefits-card:hover::before {
          opacity: 1;
        }

        .benefits-icon {
          font-size: 3.5rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 1.5rem;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        }

        .benefits-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 1.5rem;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .benefits-text {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.8;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
          font-weight: 500;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .benefits-text strong {
          color: rgba(255, 255, 255, 1);
          font-weight: 700;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
          opacity: 1;
        }

        .ai-highlight {
          background: var(--pink-purple-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
          text-shadow: none;
          filter: drop-shadow(0 1px 3px rgba(236, 72, 153, 0.3));
        }

        /* 반응형 디자인 */
        @media (max-width: 480px) {
          .splash-container {
            padding: 0.5rem;
          }

          .pattern-buttons {
            flex-direction: column;
            gap: 6px;
          }

          .pattern-btn {
            font-size: 11px;
            padding: 6px 10px;
          }
          
          .main-title {
            font-size: 2rem;
            margin-bottom: 0.8rem;
          }
          
          .subtitle {
            font-size: 1rem;
            max-width: 300px;
            margin-bottom: 1.5rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
            max-width: 320px;
          }

          .feature-card {
            padding: 1.2rem;
            min-height: 200px;
          }

          .feature-icon {
            font-size: 2rem;
            margin-bottom: 0.8rem;
          }
          
          .feature-title {
            font-size: 1.1rem;
            margin-bottom: 0.6rem;
          }
          
          .feature-description {
            font-size: 0.9rem;
          }

          .btn-primary {
            font-size: 1rem;
            padding: 0.8rem 2rem;
          }

          .modal-content {
            margin: 0.5rem;
            padding: 1.2rem;
            max-height: 90vh;
          }
          
          .modal-title {
            font-size: 1.3rem;
          }
          
          .modal-description {
            font-size: 0.9rem;
          }
          
          .benefits-list li {
            font-size: 0.8rem;
            padding: 0.4rem 0;
          }

          .benefits-card {
            padding: 1.5rem;
            margin: 0 0.5rem;
          }
          
          .benefits-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
          }
          
          .benefits-title {
            font-size: 1.3rem;
            margin-bottom: 1rem;
          }
          
          .benefits-text {
            font-size: 0.95rem;
            line-height: 1.6;
          }

          .vibe-badge {
            font-size: 0.9rem;
            padding: 0.7rem 1.2rem;
          }
          
          .vibe-description {
            font-size: 0.95rem;
            max-width: 500px;
          }
          
          .cta-guide {
            font-size: 1rem;
          }

          .stat-number {
            font-size: 1.2rem;
          }
          
          .stat-label {
            font-size: 0.7rem;
          }
        }

        @media (max-width: 768px) {
          .splash-container {
            padding: 5rem 1rem 2rem 1rem;
          }
          
          .main-title {
            font-size: 2.2rem;
            margin-bottom: 0.8rem;
          }
          
          .subtitle {
            font-size: 1rem;
            max-width: 350px;
            margin-bottom: 1.2rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
            max-width: 350px;
          }

          .feature-card {
            padding: 1.2rem;
            min-height: 180px;
          }

          .feature-icon {
            font-size: 2rem;
            margin-bottom: 0.8rem;
          }

          .modal-content {
            margin: 1rem;
            padding: 1.5rem;
            max-height: 85vh;
          }
          
          .benefits-card {
            padding: 1.5rem;
            margin: 0 1rem;
          }
          
          .benefits-icon {
            font-size: 2.5rem;
          }
          
          .benefits-title {
            font-size: 1.3rem;
          }
          
          .benefits-text {
            font-size: 1rem;
          }

          .btn-primary, .btn-secondary {
            font-size: 1rem;
            padding: 0.9rem 1.5rem;
            min-width: 200px;
            height: 52px;
          }

          .button-container {
            flex-direction: column;
            gap: 0.8rem;
          }

          .finger-pointer {
            font-size: 1.8rem;
            top: 50%;
            left: -60px;
          }

          .vibe-description {
            font-size: 0.95rem;
            max-width: 400px;
          }

          /* 헤더 로고 모바일 최적화 */
          header {
            padding: 1rem !important;
          }
          
          header .flex.items-center.gap-3 div:first-child {
            width: 2rem !important;
            height: 2rem !important;
          }
          
          header .flex.items-center.gap-3 div:first-child i {
            font-size: 0.8rem !important;
          }
          
          header h2 {
            font-size: 1rem !important;
          }
          
          header p {
            font-size: 0.6rem !important;
          }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
            max-width: 800px;
          }
          
          .feature-card:last-child {
            grid-column: 1 / -1;
            max-width: 350px;
            margin: 0 auto;
          }
          
          .benefits-card {
            padding: 2.2rem;
            max-width: 600px;
          }
        }

        @media (min-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* 터치 디바이스 최적화 */
        @media (hover: none) and (pointer: coarse) {
          .feature-card:hover,
          .benefits-card:hover,
          .btn-primary:hover,
          .vibe-badge:hover {
            transform: none;
          }
          
          .feature-card:active,
          .benefits-card:active {
            transform: translateY(-2px);
          }
          
          .btn-primary:active,
          .vibe-badge:active {
            transform: translateY(-1px);
          }

          .modal-close {
            width: 48px;
            height: 48px;
            font-size: 2rem;
            padding: 0.7rem;
            background: rgba(255, 255, 255, 0.2);
            border: 3px solid rgba(255, 255, 255, 0.4);
          }

          .modal-close:hover {
            transform: none;
          }

          .modal-close:active {
            transform: scale(0.9);
            background: rgba(255, 255, 255, 0.35);
          }
        }

        /* 가로 모드 스마트폰 최적화 */
        @media screen and (max-height: 500px) and (orientation: landscape) {
          .splash-container {
            padding: 0.5rem;
            justify-content: flex-start;
            padding-top: 4rem;
          }
          
          .main-title {
            font-size: 2rem;
            margin-bottom: 0.5rem;
          }
          
          .subtitle {
            font-size: 0.9rem;
            margin-bottom: 1rem;
          }
          
          .benefits-section {
            margin: 1rem 0 0.5rem 0;
          }
          
          .benefits-card {
            padding: 1.5rem;
          }
          
          .benefits-title {
            font-size: 1.3rem;
            margin-bottom: 1rem;
          }
          
          .features-grid {
            display: none;
          }
          
          .vibe-coding-section {
            margin: 0.5rem 0;
          }
          
          .footer-info {
            margin-top: 0.5rem;
            font-size: 0.7rem;
          }
        }
      `}</style>

      <div className="splash-container">
        {/* 헤더 */}
        <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-10">
          <div className="flex items-center justify-between">
            {/* 로고 */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-server text-white text-sm sm:text-lg"></i>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">OpenManager</h2>
                <p className="text-xs text-white/70">AI 서버 모니터링</p>
              </div>
            </Link>
            
            {/* 프로필 드롭다운 */}
            <ProfileDropdown userName="관리자" />
          </div>
        </header>

        <h1 className="main-title fade-in-up">
          OpenManager <span className="highlight">AI</span>
        </h1>

        {/* 메인 AI 에이전트 카드 */}
        <div className="benefits-section fade-in-up">
          <div className="benefits-card" onClick={openMainFeatureModal}>
            <div className="benefits-icon">
              <i className="fas fa-brain"></i>
            </div>
            <h3 className="benefits-title">지능형 AI 에이전트</h3>
            <p className="benefits-text">
              <strong>지능형 AI 에이전트로 서버 관리를 혁신합니다</strong><br />
              <strong className="hidden sm:inline">자연어 질의, 지능형 분석, 예측 알림으로</strong>
              <strong className="sm:hidden">자연어 질의와 지능형 분석으로</strong><br />
              <strong>IT 운영을 완전히 자동화합니다</strong>
            </p>
          </div>
        </div>

        {/* 간소화된 시스템 제어 */}
        <div className="cta-section fade-in-up">
          {!isSystemActive ? (
            <div className="text-center space-y-4">
              {/* 시스템 종료 상태 안내 */}
              <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-200 font-semibold">시스템 종료됨</span>
                </div>
                <p className="text-red-100 text-sm">
                  모든 서비스가 중지되었습니다.<br />
                  <strong>아래 버튼을 눌러 시스템을 다시 시작하세요.</strong>
                </p>
              </div>
              
              <div className="relative">
                <div className="finger-pointer">👉</div>
                <button 
                  className="btn-primary"
                  onClick={handleStartFullSystem}
                  disabled={isLoading}
                >
                  <i className={isLoading ? "fas fa-spinner fa-spin" : "fas fa-power-off"}></i>
                  <span>{isLoading ? '시작 중...' : '🚀 시스템 시작'}</span>
                </button>
              </div>
              
              <p className="text-white/80 text-sm">
                <strong>통합 시스템 시작:</strong> 서버 시딩 → 시뮬레이션 → 데이터 생성 → AI 에이전트<br />
                모든 서비스가 자동으로 순차 시작됩니다 (60분간 활성화)
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              {/* 시스템 활성화 상태 표시 */}
              <div className="mb-4 p-3 bg-green-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-200 font-semibold">시스템 실행 중</span>
                </div>
                <div className="text-green-100 text-sm">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <span>⏰ 남은 시간: <strong>{formattedTime}</strong></span>
                  </div>
                  <p>시스템 전체 활성화: 서버 모니터링 + AI 에이전트 + 데이터 생성</p>
                </div>
              </div>
              
              {/* 대시보드 이동 버튼 (시작 버튼 자리) */}
              <div className="mb-4">
                <button 
                  className="btn-primary"
                  onClick={handleGoToDashboard}
                >
                  <i className="fas fa-tachometer-alt"></i>
                  <span>📊 대시보드 들어가기</span>
                </button>
              </div>
              
              {/* 시스템 중지 버튼 */}
              <div className="text-center">
                <button 
                  className="btn-secondary"
                  onClick={handleStopFullSystem}
                  disabled={isLoading}
                >
                  <i className={isLoading ? "fas fa-spinner fa-spin" : "fas fa-stop"}></i>
                  <span>{isLoading ? '중지 중...' : '⏹️ 시스템 중지'}</span>
                </button>
              </div>
              
              <p className="text-white/60 text-xs mt-2">
                60분 후 자동 종료됩니다. 다시 시작하려면 위의 중지 버튼을 누른 후 시작 버튼을 눌러주세요.
              </p>
            </div>
          )}
        </div>

        {/* AI 에이전트 핵심 기능 카드 */}
        <div className="features-grid fade-in-up">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="feature-card"
              onClick={() => openFeatureModal(feature)}
            >
              <div className="feature-icon">
                <i className={feature.icon}></i>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Vibe Coding 기술 강조 */}
        <div className="vibe-coding-section fade-in-up">
          <div className="vibe-badge" onClick={openVibeCodingModal}>
            <i className="fas fa-code"></i>
            <span>Vibe Coding</span>
          </div>
          <p className="vibe-description">
            <span className="hidden sm:inline">GPT/Claude + Cursor AI 협업으로 개발된 차세대 AI 에이전트 시스템</span>
            <span className="sm:hidden">GPT/Claude + Cursor AI 협업 개발</span>
            <br />
            <strong>경량화 AI (No LLM Cost)</strong> • <strong>도메인 특화</strong> • <strong className="hidden sm:inline">확장 가능</strong><strong className="sm:hidden">확장성</strong>
          </p>
        </div>

        {/* 푸터 */}
        <div className="footer-info fade-in-up">
          <p>
            <span className="hidden sm:inline">Copyright(c) 저작자. All rights reserved.</span>
            <span className="sm:hidden">Copyright(c) 저작자</span>
          </p>
        </div>
      </div>

      {/* 기능 상세 모달 */}
      {selectedFeature && (
        <div className="modal-overlay" onClick={closeFeatureModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeFeatureModal();
              }}
              onTouchStart={(e) => e.stopPropagation()}
              aria-label="모달 닫기"
            >
              ×
            </button>
            
            <div className="modal-header">
              <div className="modal-emoji">{selectedFeature.image}</div>
              <h2 className="modal-title">{selectedFeature.title}</h2>
              <p className="modal-description">{selectedFeature.description}</p>
            </div>

            <div className="modal-benefits">
              <h4>✨ 주요 기능 및 이점</h4>
              <ul className="benefits-list">
                {selectedFeature.benefits.map((benefit, index) => (
                  <li key={index}>
                    <i className="fas fa-check-circle benefit-icon"></i>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Vibe Coding 상세 모달 */}
      {showVibeCoding && (
        <div className="modal-overlay" onClick={closeVibeCodingModal}>
          <div className="modal-content vibe-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeVibeCodingModal();
              }}
              onTouchStart={(e) => e.stopPropagation()}
              aria-label="모달 닫기"
            >
              ×
            </button>
            
            <div className="modal-header">
              <div className="modal-emoji">🚀</div>
              <h2 className="modal-title">Vibe Coding 개발 방식</h2>
              <p className="modal-description">AI 협업을 통한 차세대 개발 방법론</p>
            </div>

            <div className="modal-benefits">
              <h4>🚀 핵심 특징</h4>
              <ul className="benefits-list">
                <li>
                  <i className="fas fa-brain benefit-icon"></i>
                  <span><strong>GPT/Claude 브레인스토밍</strong> - 아이디어 구체화 후 정확한 프롬프트 작성</span>
                </li>
                <li>
                  <i className="fas fa-code benefit-icon"></i>
                  <span><strong>Cursor AI 개발</strong> - 완성된 프롬프트로 실시간 코드 구현</span>
                </li>
                <li>
                  <i className="fas fa-upload benefit-icon"></i>
                  <span><strong>GitHub 자동 배포</strong> - 개발 완료 즉시 자동으로 라이브 반영</span>
                </li>
              </ul>

              <div className="vibe-stats">
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">AI 생성 코드</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">실시간</span>
                  <span className="stat-label">자동 배포</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">AI 프롬프트</span>
                  <span className="stat-label">정확도 향상</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메인 AI 에이전트 상세 모달 */}
      {showMainFeature && (
        <div className="modal-overlay" onClick={closeMainFeatureModal}>
          <div className="modal-content vibe-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeMainFeatureModal();
              }}
              onTouchStart={(e) => e.stopPropagation()}
              aria-label="모달 닫기"
            >
              ×
            </button>
            
            <div className="modal-header">
              <div className="modal-emoji">🧠</div>
              <h2 className="modal-title">지능형 AI 에이전트</h2>
              <p className="modal-description">LLM 없이도 지능형 응답하는 차세대 서버 관리 솔루션</p>
            </div>

            <div className="modal-benefits">
              <h4>⚡ 핵심 기능</h4>
              <ul className="benefits-list">
                <li>
                  <i className="fas fa-microchip benefit-icon"></i>
                  <span><strong>경량 AI 추론</strong> - LLM 비용 없는 실시간 AI 추론</span>
                </li>
                <li>
                  <i className="fas fa-comments benefit-icon"></i>
                  <span><strong>자연어 인터페이스</strong> - 일상 대화로 서버 관리</span>
                </li>
                <li>
                  <i className="fas fa-search-plus benefit-icon"></i>
                  <span><strong>지능형 분석</strong> - 근본원인 분석 및 예측 알림</span>
                </li>
                <li>
                  <i className="fas fa-user-cog benefit-icon"></i>
                  <span><strong>스마트한 두 번째 엔지니어</strong> - 지능형 보조 인력 효과</span>
                </li>
              </ul>

              <div className="vibe-stats">
                <div className="stat-item">
                  <span className="stat-number">LLM 비용</span>
                  <span className="stat-label">0원</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">실시간</span>
                  <span className="stat-label">AI 추론</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">완전 자동화</span>
                  <span className="stat-label">IT 운영</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
