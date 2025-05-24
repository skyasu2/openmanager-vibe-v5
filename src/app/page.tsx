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
    title: "실시간 AI 모니터링",
    description: "AI 기반 실시간 서버 모니터링으로 문제를 예측하고 즉시 대응합니다.",
    benefits: [
      "99.9% 이상 장애 예측 정확도",
      "평균 5초 이내 이상 징후 감지",
      "자동 알림 및 대응 시스템",
      "24/7 무중단 모니터링"
    ],
    image: "📊",
    icon: "fas fa-chart-pulse"
  },
  {
    title: "지능형 자동화",
    description: "반복적인 운영 작업을 AI가 자동으로 처리하여 효율성을 극대화합니다.",
    benefits: [
      "70% 이상 운영 작업 자동화",
      "인적 오류 95% 감소",
      "자동 스케일링 및 최적화",
      "스마트 리소스 관리"
    ],
    image: "🤖",
    icon: "fas fa-robot"
  },
  {
    title: "통합 대시보드",
    description: "모든 서버와 클라우드 리소스를 하나의 직관적인 대시보드에서 관리합니다.",
    benefits: [
      "멀티 클라우드 통합 관리",
      "실시간 성능 시각화",
      "커스터마이징 가능한 위젯",
      "모바일 최적화 인터페이스"
    ],
    image: "📈",
    icon: "fas fa-tachometer-alt"
  },
  {
    title: "보안 강화",
    description: "AI 기반 보안 모니터링으로 위협을 사전에 차단하고 시스템을 보호합니다.",
    benefits: [
      "실시간 취약점 스캔",
      "이상 행동 패턴 감지",
      "자동 보안 업데이트",
      "컴플라이언스 자동 검증"
    ],
    image: "🛡️",
    icon: "fas fa-shield-halved"
  },
  {
    title: "성능 최적화",
    description: "AI가 분석한 데이터를 바탕으로 서버 성능을 지속적으로 최적화합니다.",
    benefits: [
      "자동 성능 튜닝",
      "리소스 사용량 최적화",
      "병목 지점 자동 식별",
      "예측적 확장 계획"
    ],
    image: "🚀",
    icon: "fas fa-rocket"
  },
  {
    title: "24/7 지원",
    description: "AI 어시스턴트와 전문가 팀이 24시간 연중무휴로 지원합니다.",
    benefits: [
      "즉시 응답하는 AI 챗봇",
      "전문가 원격 지원",
      "예방적 유지보수",
      "맞춤형 컨설팅 서비스"
    ],
    image: "💬",
    icon: "fas fa-headset"
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
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
          max-width: 900px;
          width: 100%;
          z-index: 1;
        }

        .feature-card {
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          cursor: pointer;
          text-align: center;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-xl);
          background: rgba(255, 255, 255, 0.15);
        }

        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
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
            gap: 1rem;
          }

          .feature-card {
            padding: 1rem;
          }

          .modal-content {
            margin: 1rem;
            padding: 1.5rem;
          }
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
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
          AI 기반 서버 모니터링과 관리의 혁신
          <br />
          실시간 분석으로 시스템을 보호하고
          <br />
          지능형 자동화로 운영을 최적화합니다
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
