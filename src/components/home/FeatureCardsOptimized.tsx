/**
 * 🚀 번들 크기 최적화된 기능 카드 컴포넌트
 * 복잡한 애니메이션과 차트 라이브러리 제거
 */

'use client';

import { BarChart3, Bot, Shield, Zap, Globe, Clock } from '@/lib/bundle-optimization';

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  stats?: string;
}

const features: FeatureCard[] = [
  {
    id: 'monitoring',
    title: '실시간 모니터링',
    description: 'CPU, Memory, Disk, Network 실시간 추적',
    icon: BarChart3,
    color: 'blue',
    stats: '15초 간격',
  },
  {
    id: 'ai-analysis',
    title: 'AI 분석',
    description: '이상 징후 감지 및 성능 예측',
    icon: Bot,
    color: 'purple',
    stats: 'Google AI',
  },
  {
    id: 'security',
    title: '보안 관리',
    description: 'GitHub OAuth 기반 접근 제어',
    icon: Shield,
    color: 'green',
    stats: 'RLS 보안',
  },
  {
    id: 'performance',
    title: '고성능',
    description: '152ms 평균 응답시간, 99.95% 가동률',
    icon: Zap,
    color: 'yellow',
    stats: '152ms',
  },
  {
    id: 'global',
    title: '글로벌 배포',
    description: 'Vercel Edge Runtime 전세계 배포',
    icon: Globe,
    color: 'indigo',
    stats: 'Edge Runtime',
  },
  {
    id: 'realtime',
    title: '실시간 알림',
    description: '임계값 초과 시 즉시 알림',
    icon: Clock,
    color: 'red',
    stats: '즉시 알림',
  },
];

const colorClasses = {
  blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
  purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
  green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
  yellow: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
  indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
  red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
};

const FeatureCard = ({ feature }: { feature: FeatureCard }) => {
  const Icon = feature.icon;
  
  return (
    <div className="group relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-300"></div>
      <div className="relative bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[feature.color as keyof typeof colorClasses]} shadow-sm`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {feature.stats && (
            <div className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {feature.stats}
            </div>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
          {feature.title}
        </h3>
        
        <p className="text-gray-600 text-sm leading-relaxed">
          {feature.description}
        </p>

        {/* 간단한 호버 인디케이터 */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-lg"
             style={{ backgroundImage: `linear-gradient(to right, var(--${feature.color}-500), var(--${feature.color}-600))` }}>
        </div>
      </div>
    </div>
  );
};

export default function FeatureCardsOptimized() {
  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          핵심 기능
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          엔터프라이즈급 서버 모니터링 솔루션의 모든 기능을 무료로 제공합니다
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div
            key={feature.id}
            className="opacity-0 animate-fadeInUp"
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'forwards',
            }}
          >
            <FeatureCard feature={feature} />
          </div>
        ))}
      </div>

      {/* 경량 CSS 애니메이션 */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}