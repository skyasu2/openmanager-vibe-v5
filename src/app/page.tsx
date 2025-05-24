'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    description: "MCP 엔진과 NPU 기반으로 자연어 질의를 실시간 분석하여 서버 상태를 즉시 응답합니다.",
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

  useEffect(() => {
    // 페이지 로딩 애니메이션
    const elements = document.querySelectorAll('.fade-in-up');
    elements.forEach((element: Element) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.opacity = '1';
      htmlElement.style.transform = 'translateY(0)';
    });
  }, []);

  const authorizeAndRedirect = () => {
    // 대시보드 접근 권한 부여
    const timestamp = Date.now();
    const authToken = btoa(`dashboard_access_${timestamp}`);
    
    // 로컬 스토리지에 인증 정보 저장
    localStorage.setItem('dashboard_auth_token', authToken);
    localStorage.setItem('dashboard_access_time', timestamp.toString());
    localStorage.setItem('authorized_from_index', 'true');
    
    // 세션 스토리지에도 저장 (브라우저 탭 단위)
    sessionStorage.setItem('dashboard_authorized', 'true');
    sessionStorage.setItem('auth_timestamp', timestamp.toString());
    
    // 대시보드로 리다이렉션
    router.push(`/dashboard?auth=authorized&t=${timestamp}`);
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
          --bg-gradient: linear-gradient(135deg, #4a5568 0%, #2d3748 25%, #1a202c 50%, #2b6cb0 75%, #3182ce 100%);
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
        }

        .splash-container {
          height: 100vh;
          background: var(--bg-gradient);
          background-size: 400% 400%;
          animation: gradientShift 20s ease infinite;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 1rem;
          position: relative;
          overflow: hidden;
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
          font-size: 3.5rem;
          font-weight: 700;
          color: var(--text-white);
          margin-bottom: 1rem;
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
          font-size: 1.3rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 2rem;
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
          gap: 0.5rem;
          background: var(--pink-purple-gradient);
          color: var(--text-white);
          font-size: 1.2rem;
          font-weight: 700;
          padding: 1rem 2.5rem;
          border: none;
          border-radius: 50px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-pink);
          z-index: 1;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
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

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin: 1rem 0;
          max-width: 1200px;
          width: 100%;
          z-index: 1;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 2rem;
          transition: all 0.3s ease;
          cursor: pointer;
          text-align: center;
          min-height: 280px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
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
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 1.5rem;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.8);
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 1);
          transform: scale(1.1);
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
          margin: 1rem 0;
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
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          text-align: center;
          font-size: 0.8rem;
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
          margin: 1.5rem 0 1rem 0;
          z-index: 1;
        }

        .benefits-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(236, 72, 153, 0.3);
          border-radius: 25px;
          padding: 2.5rem;
          text-align: center;
          max-width: 700px;
          margin: 0 auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
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
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.25);
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(236, 72, 153, 0.5);
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
            padding: 1rem;
          }
          
          .main-title {
            font-size: 2.5rem;
            margin-bottom: 1rem;
          }
          
          .subtitle {
            font-size: 1.1rem;
            max-width: 400px;
            margin-bottom: 1.8rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            max-width: 400px;
          }

          .feature-card {
            padding: 1.5rem;
            min-height: 240px;
          }

          .feature-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
          }

          .modal-content {
            margin: 1rem;
            padding: 1.5rem;
            max-height: 85vh;
          }
          
          .benefits-card {
            padding: 2rem;
            margin: 0 1rem;
          }
          
          .benefits-icon {
            font-size: 3rem;
          }
          
          .benefits-title {
            font-size: 1.5rem;
          }
          
          .benefits-text {
            font-size: 1.05rem;
          }

          .btn-primary {
            font-size: 1.1rem;
            padding: 0.9rem 2.2rem;
          }

          .vibe-description {
            font-size: 1rem;
            max-width: 550px;
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
        {/* 헤더 로고 */}
        <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-10">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-server text-white text-sm sm:text-lg"></i>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">OpenManager</h2>
              <p className="text-xs text-white/70">AI 서버 모니터링</p>
            </div>
          </Link>
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
            <h3 className="benefits-title">NPU와 MCP 엔진 기반 AI 에이전트</h3>
            <p className="benefits-text">
              <strong>NPU와 MCP 엔진 기반 AI 에이전트로 서버 관리를 혁신합니다</strong><br />
              <strong className="hidden sm:inline">자연어 질의, 지능형 분석, 예측 알림으로</strong>
              <strong className="sm:hidden">자연어 질의와 지능형 분석으로</strong><br />
              <strong>IT 운영을 완전히 자동화합니다</strong>
            </p>
          </div>
        </div>

        {/* 단일 CTA 버튼 */}
        <div className="cta-section fade-in-up">
          <p className="cta-guide">여기를 클릭하세요 👇</p>
          <button 
            className="btn-primary"
            onClick={authorizeAndRedirect}
          >
            <i className="fas fa-flask"></i>
            <span className="hidden sm:inline">AI 기능 체험하기</span>
            <span className="sm:hidden">AI 체험하기</span>
          </button>
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
            <span className="hidden sm:inline">© 2025 OpenManager AI. 모든 권리 보유.</span>
            <span className="sm:hidden">© 2025 OpenManager AI</span>
          </p>
        </div>
      </div>

      {/* 기능 상세 모달 */}
      {selectedFeature && (
        <div className="modal-overlay" onClick={closeFeatureModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeFeatureModal}>
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
            <button className="modal-close" onClick={closeVibeCodingModal}>
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
            <button className="modal-close" onClick={closeMainFeatureModal}>
              ×
            </button>
            
            <div className="modal-header">
              <div className="modal-emoji">🧠</div>
              <h2 className="modal-title">NPU & MCP 엔진 기반 AI 에이전트</h2>
              <p className="modal-description">LLM 없이도 지능형 응답하는 차세대 서버 관리 솔루션</p>
            </div>

            <div className="modal-benefits">
              <h4>⚡ 핵심 기능</h4>
              <ul className="benefits-list">
                <li>
                  <i className="fas fa-microchip benefit-icon"></i>
                  <span><strong>NPU 기반 경량 AI</strong> - LLM 비용 없는 실시간 AI 추론</span>
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
