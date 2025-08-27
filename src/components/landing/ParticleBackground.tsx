'use client';

// React import 제거 - Next.js 15 자동 JSX Transform 사용
// framer-motion 제거 - CSS 애니메이션 사용

export default function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 움직이는 그라데이션 배경 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500 blur-3xl animate-pulse" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 rounded-full bg-cyan-400 blur-2xl animate-pulse" />
      </div>

      {/* 글로우 효과 */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/60" />

      {/* 네트워크 느낌의 선들 */}
      <svg
        className="absolute inset-0 h-full w-full opacity-20"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* 정적 선들 */}
        <line x1="10%" y1="20%" x2="90%" y2="80%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-pulse" />
        <line x1="20%" y1="10%" x2="80%" y2="90%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-pulse" />
        <line x1="30%" y1="70%" x2="70%" y2="30%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-pulse" />
      </svg>
    </div>
  );
}
