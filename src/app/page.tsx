'use client';

import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    // 즉시 index.html로 리다이렉션
    window.location.href = '/index.html';
  }, []);

  // 리다이렉션 중 표시할 로딩 페이지
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
        <p style={{ fontSize: '1.2rem' }}>페이지를 불러오는 중...</p>
      </div>
      
      {/* 스피너 애니메이션 */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
