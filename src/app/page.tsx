'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 정적 생성을 위한 메타데이터 export
export const dynamic = 'force-static';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 페이지 로딩 애니메이션
    const elements = document.querySelectorAll('.fade-in-up');
    elements.forEach((element: Element) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.opacity = '1';
      htmlElement.style.transform = 'translateY(0)';
    });
  }, []);

  const setAuthToken = () => {
    // 데모 페이지 접근 시 임시 토큰 생성
    const timestamp = Date.now();
    const authToken = btoa(`demo_access_${timestamp}`);
    localStorage.setItem('demo_auth_token', authToken);
    localStorage.setItem('demo_access_time', timestamp.toString());
  };

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

  return (
    <>
      <style jsx global>{`
        :root {
          --primary: #1a73e8;
          --secondary: #34a853;
          --accent: #ea4335;
          --warning: #fbbc04;
          --success: #0f9d58;
          --neutral: #5f6368;
          --text-white: #ffffff;
          --glass-bg: rgba(255, 255, 255, 0.1);
          --glass-border: rgba(255, 255, 255, 0.2);
          --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%);
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
          padding: 2rem;
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
          margin-bottom: 2rem;
          animation: float 6s ease-in-out infinite;
          z-index: 1;
        }

        .logo-container i {
          font-size: 5rem;
          color: var(--text-white);
          text-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
          filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
        }

        .main-title {
          font-size: 4rem;
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
          font-size: 1.5rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 3rem;
          max-width: 600px;
          line-height: 1.5;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 1;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          margin: 4rem 0;
          max-width: 800px;
          width: 100%;
          z-index: 1;
        }

        .stat-card {
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-xl);
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--text-white);
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin: 3rem 0;
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
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--primary), var(--secondary));
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-xl);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .feature-card:hover::before {
          transform: scaleX(1);
        }

        .feature-icon {
          font-size: 3rem;
          color: var(--text-white);
          margin-bottom: 1rem;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        }

        .feature-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-white);
          margin-bottom: 1rem;
        }

        .feature-description {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
        }

        .cta-section {
          margin: 4rem 0;
          z-index: 1;
        }

        .btn-container {
          display: flex;
          gap: 2rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          background: linear-gradient(45deg, var(--primary), var(--secondary));
          border: none;
          border-radius: 50px;
          text-decoration: none;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-lg);
          cursor: pointer;
        }

        .btn-primary:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: var(--shadow-xl);
        }

        .btn-secondary {
          background: linear-gradient(45deg, var(--accent), var(--warning));
        }

        .footer-info {
          margin-top: 4rem;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          z-index: 1;
        }

        .footer-info a {
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          margin: 0 0.5rem;
        }

        .footer-info a:hover {
          color: white;
        }

        @media (max-width: 768px) {
          .main-title {
            font-size: 2.5rem;
          }
          
          .subtitle {
            font-size: 1.2rem;
          }
          
          .btn-container {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>

      <div className="splash-container">
        {/* 로고 */}
        <div className="logo-container fade-in-up">
          <i className="fas fa-server"></i>
        </div>

        {/* 메인 타이틀 */}
        <h1 className="main-title fade-in-up">
          OpenManager <span className="highlight">Vibe V5</span>
        </h1>

        {/* 부제목 */}
        <p className="subtitle fade-in-up">
          AI 기반 서버 모니터링과 관리를 통합한 차세대 서버 관리 솔루션<br />
          실시간 모니터링, 지능형 분석, 자동화된 관리로 서버 운영을 혁신합니다
        </p>

        {/* 통계 섹션 */}
        <div className="stats-grid fade-in-up">
          <div className="stat-card">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">업타임 보장</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">24/7</div>
            <div className="stat-label">모니터링</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">1000+</div>
            <div className="stat-label">활성 서버</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">5초</div>
            <div className="stat-label">응답 시간</div>
          </div>
        </div>

        {/* 주요 기능 섹션 */}
        <div className="features-grid fade-in-up">
          <div className="feature-card fade-in-up">
            <div className="feature-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <h3 className="feature-title">실시간 모니터링</h3>
            <p className="feature-description">서버 상태와 성능을 실시간으로 모니터링하고 분석합니다</p>
          </div>
          
          <div className="feature-card fade-in-up">
            <div className="feature-icon">
              <i className="fas fa-brain"></i>
            </div>
            <h3 className="feature-title">AI 기반 분석</h3>
            <p className="feature-description">머신러닝을 활용한 지능형 이상 탐지 및 예측 분석</p>
          </div>
          
          <div className="feature-card fade-in-up">
            <div className="feature-icon">
              <i className="fas fa-bell"></i>
            </div>
            <h3 className="feature-title">스마트 알림</h3>
            <p className="feature-description">중요한 이벤트를 즉시 감지하고 다중 채널로 알림 전송</p>
          </div>
          
          <div className="feature-card fade-in-up">
            <div className="feature-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3 className="feature-title">보안 강화</h3>
            <p className="feature-description">고급 보안 모니터링과 취약점 스캔으로 시스템 보호</p>
          </div>
          
          <div className="feature-card fade-in-up">
            <div className="feature-icon">
              <i className="fas fa-cog"></i>
            </div>
            <h3 className="feature-title">자동화</h3>
            <p className="feature-description">반복적인 관리 작업을 자동화하여 운영 효율성 극대화</p>
          </div>
          
          <div className="feature-card fade-in-up">
            <div className="feature-icon">
              <i className="fas fa-cloud"></i>
            </div>
            <h3 className="feature-title">클라우드 통합</h3>
            <p className="feature-description">AWS, Azure, GCP 등 주요 클라우드 플랫폼과 완벽 통합</p>
          </div>
        </div>

        {/* CTA 버튼 섹션 */}
        <div className="cta-section fade-in-up">
          <div className="btn-container">
            <Link href="/demo" className="btn-primary" onClick={setAuthToken}>
              <i className="fas fa-play"></i>
              실시간 AI 데모 체험
            </Link>
            <button className="btn-primary btn-secondary" onClick={authorizeAndRedirect}>
              <i className="fas fa-arrow-right"></i>
              AI 대시보드 바로가기
            </button>
          </div>
        </div>

        {/* 추가 정보 섹션 */}
        <div className="features-grid fade-in-up" style={{ marginTop: '4rem' }}>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-rocket"></i>
            </div>
            <h3 className="feature-title">빠른 배포</h3>
            <p className="feature-description">
              5분 이내에 설치하고 즉시 모니터링을 시작할 수 있습니다
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-users"></i>
            </div>
            <h3 className="feature-title">팀 협업</h3>
            <p className="feature-description">
              역할 기반 접근 제어와 실시간 협업 도구를 제공합니다
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <i className="fas fa-mobile-alt"></i>
            </div>
            <h3 className="feature-title">모바일 지원</h3>
            <p className="feature-description">
              언제 어디서나 모바일 기기로 서버 상태를 확인하고 관리할 수 있습니다
            </p>
          </div>
        </div>

        {/* 푸터 정보 */}
        <div className="footer-info">
          <p>
            © 2024 OpenManager AI. 모든 권리 보유. |
            <a href="/docs">문서</a> |
            <a href="/support">지원</a>
          </p>
        </div>
      </div>
    </>
  );
}
