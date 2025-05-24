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
    title: "AI 에이전트 질의",
    description: "MCP 엔진 기반 자연어 질의응답으로 서버 상태를 쉽게 확인하세요.",
    benefits: [
      "자연어로 서버 상태 질문",
      "MCP 패턴 매칭 기반 응답",
      "사전 정의된 컨텍스트 문서 활용",
      "실시간 서버 메트릭 조회",
      "기본 문제 해결 가이드 제공"
    ],
    image: "🤖",
    icon: "fas fa-robot"
  },
  {
    title: "자동 장애보고서",
    description: "서버 이슈 발생 시 자동으로 상세 분석 보고서를 생성합니다.",
    benefits: [
      "장애 발생 시 자동 탐지",
      "시스템 로그 자동 수집 및 분석",
      "근본 원인 분석 템플릿 적용",
      "해결 방안 권장사항 제시",
      "PDF/HTML 형태 보고서 자동 생성"
    ],
    image: "📋",
    icon: "fas fa-clipboard-list"
  },
  {
    title: "통합 모니터링 대시보드",
    description: "실시간 서버 메트릭과 상태를 한눈에 파악할 수 있습니다.",
    benefits: [
      "실시간 CPU, 메모리, 디스크 사용률",
      "네트워크 트래픽 모니터링",
      "서비스 상태 및 응답시간 추적",
      "커스터마이징 가능한 위젯",
      "히스토리 데이터 시각화"
    ],
    image: "📊",
    icon: "fas fa-chart-line"
  }
];

export default function HomePage() {
  const router = useRouter();
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetail | null>(null);

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

  return (
    <>
      <style jsx global>{`
        :root {
          --primary: #10b981;
          --secondary: #06b6d4;
          --accent: #3b82f6;
          --success: #22c55e;
          --info: #0ea5e9;
          --text-white: #ffffff;
          --glass-bg: rgba(255, 255, 255, 0.1);
          --glass-border: rgba(255, 255, 255, 0.2);
          --bg-gradient: linear-gradient(135deg, #10b981 0%, #06b6d4 25%, #3b82f6 50%, #6366f1 75%, #8b5cf6 100%);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .splash-container {
          min-height: 100vh;
          background: var(--bg-gradient);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem 1rem;
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
          animation: float 20s ease-in-out infinite;
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

        .logo-container {
          margin-bottom: 1.5rem;
          animation: float 6s ease-in-out infinite;
          z-index: 1;
        }

        .logo-container i {
          font-size: 4rem;
          color: var(--text-white);
          text-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
          filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
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
          background: linear-gradient(45deg, #ffd700, #ff6b6b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: none;
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
          margin: 2rem 0;
          z-index: 1;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(45deg, var(--primary), var(--secondary));
          color: var(--text-white);
          font-size: 1.2rem;
          font-weight: 600;
          padding: 1rem 2.5rem;
          border: none;
          border-radius: 50px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-lg);
          z-index: 1;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-xl);
          background: linear-gradient(45deg, var(--secondary), var(--accent));
        }

        .btn-primary i {
          font-size: 1.1rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin: 2rem 0;
          max-width: 1200px;
          width: 100%;
          z-index: 1;
        }

        .feature-card {
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 2rem;
          transition: all 0.3s ease;
          cursor: pointer;
          text-align: center;
          min-height: 280px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-xl);
          background: rgba(255, 255, 255, 0.15);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1.5rem;
          color: var(--text-white);
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        }

        .feature-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: var(--text-white);
          margin-bottom: 0.8rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .feature-description {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
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
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 2rem;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .modal-close:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .modal-emoji {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .modal-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .modal-description {
          font-size: 1.1rem;
          color: #6b7280;
          line-height: 1.6;
        }

        .modal-benefits {
          margin-top: 1.5rem;
        }

        .modal-benefits h4 {
          font-size: 1.3rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .benefits-list {
          list-style: none;
          padding: 0;
        }

        .benefits-list li {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.8rem 0;
          font-size: 1rem;
          color: #374151;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .benefits-list li:last-child {
          border-bottom: none;
        }

        .benefit-icon {
          color: var(--primary);
          font-size: 1.1rem;
        }

        .footer-info {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          text-align: center;
          font-size: 0.9rem;
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

        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .main-title {
            font-size: 2.5rem;
          }
          
          .subtitle {
            font-size: 1.1rem;
            max-width: 400px;
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
        }

        @media (min-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <div className="splash-container">
        {/* 헤더 */}
        <div className="logo-container fade-in-up">
          <i className="fas fa-server"></i>
        </div>

        <h1 className="main-title fade-in-up">
          OpenManager <span className="highlight">Vibe V5</span>
        </h1>

        {/* 개선된 메인 설명 */}
        <p className="subtitle fade-in-up">
          MCP 기반 서버 모니터링과 관리를 위한
          <br />
          차세대 통합 솔루션
          <br />
          자연어 질의, 자동 보고서, 실시간 대시보드로
          <br />
          서버 운영을 단순화합니다
        </p>

        {/* 단일 CTA 버튼 */}
        <div className="cta-section fade-in-up">
          <button 
            className="btn-primary"
            onClick={authorizeAndRedirect}
          >
            <i className="fas fa-tachometer-alt"></i>
            AI 대시보드 바로가기
          </button>
        </div>

        {/* 6개 기능 카드 */}
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

        {/* 푸터 */}
        <div className="footer-info fade-in-up">
          <p>
            © 2024 OpenManager AI. 모든 권리 보유. |
            <a href="/docs">문서</a> |
            <a href="/support">지원</a> |
            <Link href="/demo">라이브 데모</Link>
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
    </>
  );
}
