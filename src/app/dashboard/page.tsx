'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 클라이언트 사이드에서 인증 확인
    const checkAuthorization = () => {
      try {
        // 세션 스토리지에서 인증 확인
        const sessionAuth = sessionStorage.getItem('dashboard_authorized');
        const sessionTimestamp = sessionStorage.getItem('auth_timestamp');
        
        // 로컬 스토리지에서 인증 확인
        const localAuth = localStorage.getItem('authorized_from_index');
        const localToken = localStorage.getItem('dashboard_auth_token');
        const localTimestamp = localStorage.getItem('dashboard_access_time');
        
        // URL 파라미터에서 인증 확인
        const urlParams = new URLSearchParams(window.location.search);
        const authParam = urlParams.get('auth');
        const urlTimestamp = urlParams.get('t');
        
        // 인증 조건 확인
        if (sessionAuth === 'true' && sessionTimestamp) {
          const timeDiff = Date.now() - parseInt(sessionTimestamp);
          if (timeDiff <= 5 * 60 * 1000) { // 5분 이내
            setIsAuthorized(true);
            setIsLoading(false);
            return;
          }
        }
        
        if (localAuth === 'true' && localToken && localTimestamp) {
          const timeDiff = Date.now() - parseInt(localTimestamp);
          if (timeDiff <= 5 * 60 * 1000) { // 5분 이내
            setIsAuthorized(true);
            setIsLoading(false);
            return;
          }
        }
        
        if (authParam === 'authorized' && urlTimestamp) {
          const timeDiff = Date.now() - parseInt(urlTimestamp);
          if (timeDiff <= 5 * 60 * 1000) { // 5분 이내
            setIsAuthorized(true);
            setIsLoading(false);
            return;
          }
        }
        
        // 인증 실패 시 index.html로 리다이렉션
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 1000);
        
      } catch (error) {
        console.error('Authorization check failed:', error);
        window.location.href = '/index.html';
      }
      
      setIsLoading(false);
    };

    checkAuthorization();
  }, []);

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ fontSize: '1.2rem' }}>인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우
  if (!isAuthorized) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-lock" style={{ fontSize: '4rem', marginBottom: '1rem' }}></i>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>접근 권한이 없습니다</h2>
                     <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>             메인 페이지에서 &quot;AI 대시보드 바로가기&quot; 버튼을 통해 접근해주세요.           </p>           <Link              href="/index.html"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(45deg, #1a73e8, #34a853)',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '600',
              padding: '0.8rem 2rem',
              border: 'none',
              borderRadius: '50px',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
                     >             <i className="fas fa-home"></i>             메인 페이지로 이동           </Link>
        </div>
      </div>
    );
  }

  // 인증된 경우 기존 대시보드 표시
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
      color: 'white'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '600px'
      }}>
        <i className="fas fa-tools" style={{fontSize: '4rem', marginBottom: '1rem'}}></i>
        <h1 style={{fontSize: '2.5rem', marginBottom: '1rem'}}>대시보드 준비중</h1>
        <p style={{fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9}}>
          OpenManager AI 대시보드가 곧 준비됩니다!
          <br />
          현재 개발 중인 기능들을 확인해보세요.
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          margin: '2rem 0'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1rem',
            borderRadius: '8px'
          }}>
            <i className="fas fa-chart-bar" style={{fontSize: '2rem', marginBottom: '0.5rem'}}></i>
            <div>실시간 모니터링</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1rem',
            borderRadius: '8px'
          }}>
            <i className="fas fa-brain" style={{fontSize: '2rem', marginBottom: '0.5rem'}}></i>
            <div>AI 분석</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1rem',
            borderRadius: '8px'
          }}>
            <i className="fas fa-bell" style={{fontSize: '2rem', marginBottom: '0.5rem'}}></i>
            <div>알림 시스템</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link 
            href="/demo" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(45deg, #1a73e8, #34a853)',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '600',
              padding: '0.8rem 2rem',
              border: 'none',
              borderRadius: '50px',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <i className="fas fa-play"></i>
            AI 데모 체험
          </Link>
          
                    <Link             href="/index.html"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '600',
              padding: '0.8rem 2rem',
              border: 'none',
              borderRadius: '50px',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
                     >             <i className="fas fa-arrow-left"></i>             홈으로 돌아가기           </Link>
        </div>
      </div>

      {/* 스피너 애니메이션 스타일 */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 