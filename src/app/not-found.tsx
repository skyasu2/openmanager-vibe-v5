'use client';

import Link from 'next/link';

// 동적 렌더링 강제 (HTML 파일 생성 방지)
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>
          404
        </div>
        
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          페이지를 찾을 수 없습니다
        </h1>
        
        <p style={{ 
          fontSize: '1.2rem', 
          marginBottom: '2rem', 
          opacity: 0.9,
          lineHeight: 1.6 
        }}>
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          <br />
          주소를 다시 확인해주세요.
        </p>

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center',
          flexWrap: 'wrap' 
        }}>
          <Link            href="/"
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
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          >            🏠 홈으로 이동          </Link>

          <button
            onClick={() => window.history.back()}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '600',
              padding: '0.8rem 2rem',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          >
            ⬅️ 이전 페이지
          </button>
        </div>

        <div style={{ 
          marginTop: '3rem',
          padding: '1.5rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          fontSize: '0.9rem',
          opacity: 0.8
        }}>
          <p style={{ margin: 0 }}>
            💡 <strong>도움말:</strong> 원하는 페이지를 찾으려면 홈페이지에서 시작하거나 
            브라우저의 뒤로가기 버튼을 사용해보세요.
          </p>
        </div>
      </div>
    </div>
  );
} 