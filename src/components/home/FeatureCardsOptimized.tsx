/**
 * 🚀 번들 크기 최적화된 기능 카드 컴포넌트
 * 복잡한 애니메이션과 차트 라이브러리 제거
 */

'use client';

import { type ComponentType } from 'react';
import {
  BarChart3,
  Bot,
  Clock,
  Globe,
  Shield,
  Zap,
} from '@/lib/bundle-optimization';

type FeatureCardData = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  stats?: string;
};

const features: FeatureCardData[] = [
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
  purple:
    'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
  green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
  yellow:
    'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
  indigo:
    'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
  red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
};

const FeatureCard = ({ feature }: { feature: FeatureCardData }) => {
  const Icon = feature.icon;

  return (
    <div className="group relative">
      <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 opacity-25 blur transition duration-300 group-hover:opacity-100"></div>
      <div className="relative rounded-lg bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="mb-4 flex items-start justify-between">
          <div
            className={`rounded-lg bg-gradient-to-r p-3 ${colorClasses[feature.color as keyof typeof colorClasses]} shadow-sm`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          {feature.stats && (
            <div className="rounded bg-gray-100 px-2 py-1 text-sm font-medium text-gray-500">
              {feature.stats}
            </div>
          )}
        </div>

        <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-gray-700">
          {feature.title}
        </h3>

        <p className="text-sm leading-relaxed text-gray-600">
          {feature.description}
        </p>

        {/* 간단한 호버 인디케이터 */}
        <div
          className="absolute bottom-0 left-0 h-1 w-full rounded-b-lg bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            backgroundImage: `linear-gradient(to right, var(--${feature.color}-500), var(--${feature.color}-600))`,
          }}
        ></div>
      </div>
    </div>
  );
};

export default function FeatureCardsOptimized() {
  return (
    <div className="py-12">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-3xl font-bold text-gray-900">핵심 기능</h2>
        <p className="mx-auto max-w-2xl text-gray-600">
          엔터프라이즈급 서버 모니터링 솔루션의 모든 기능을 무료로 제공합니다
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <div
            key={feature.id}
            className="animate-fadeInUp opacity-0"
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
