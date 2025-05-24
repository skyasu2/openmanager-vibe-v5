import Link from "next/link";

export default function DashboardPage() {
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
        
        <Link 
          href="/" 
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
          <i className="fas fa-arrow-left"></i>
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
} 