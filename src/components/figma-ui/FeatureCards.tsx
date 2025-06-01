'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Shield, 
  Zap, 
  BarChart3,
  Clock,
  TrendingUp,
  AlertTriangle,
  Settings,
  Database,
  Cloud,
  Lock,
  Activity
} from 'lucide-react';

export interface FeatureCardData {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  benefits: string[];
  gradient: string;
  accentColor: string;
}

export interface FeatureCardsProps {
  title?: string;
  subtitle?: string;
  description?: string;
  cards?: FeatureCardData[];
  layout?: 'grid' | 'carousel';
  showBenefits?: boolean;
  backgroundStyle?: 'light' | 'dark' | 'gradient';
}

const defaultCards: FeatureCardData[] = [
  {
    id: 'ai-monitoring',
    icon: Brain,
    title: 'AI 기반 실시간 모니터링',
    description: '머신러닝 알고리즘으로 서버 상태를 실시간 분석하고 이상 징후를 자동으로 감지합니다.',
    benefits: [
      '99.9% 정확도의 이상 감지',
      '실시간 성능 분석',
      '자동 알림 시스템'
    ],
    gradient: 'from-blue-500 to-purple-600',
    accentColor: 'blue'
  },
  {
    id: 'predictive-analysis',
    icon: TrendingUp,
    title: '예측적 장애 분석',
    description: '과거 데이터와 패턴 분석을 통해 잠재적 장애를 미리 예측하고 대응 방안을 제시합니다.',
    benefits: [
      '장애 예측 정확도 95%',
      '평균 복구 시간 80% 단축',
      '자동 스케일링 제안'
    ],
    gradient: 'from-green-500 to-emerald-600',
    accentColor: 'green'
  },
  {
    id: 'security-shield',
    icon: Shield,
    title: '통합 보안 모니터링',
    description: '다층 보안 분석으로 서버와 네트워크의 보안 위협을 실시간으로 탐지하고 차단합니다.',
    benefits: [
      '실시간 위협 탐지',
      '자동 보안 패치',
      '컴플라이언스 관리'
    ],
    gradient: 'from-orange-500 to-red-600',
    accentColor: 'orange'
  },
  {
    id: 'performance-optimization',
    icon: Zap,
    title: '성능 최적화 엔진',
    description: '서버 리소스 사용량을 최적화하고 비용 효율적인 인프라 운영을 위한 인사이트를 제공합니다.',
    benefits: [
      '리소스 사용률 40% 개선',
      '운영 비용 30% 절감',
      '자동 최적화 제안'
    ],
    gradient: 'from-purple-500 to-pink-600',
    accentColor: 'purple'
  }
];

export default function FeatureCards({
  title = "핵심 기능",
  subtitle = "OpenManager v5의 강력한 기능들",
  description = "AI 기반 서버 모니터링의 새로운 표준을 경험하세요",
  cards = defaultCards,
  layout = 'grid',
  showBenefits = true,
  backgroundStyle = 'light'
}: FeatureCardsProps) {

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const getBackgroundClasses = () => {
    switch (backgroundStyle) {
      case 'dark':
        return 'bg-gray-900 text-white';
      case 'gradient':
        return 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50';
      default:
        return 'bg-white';
    }
  };

  const getAccentColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
      green: 'border-green-200 bg-green-50 hover:bg-green-100',
      orange: 'border-orange-200 bg-orange-50 hover:bg-orange-100',
      purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <section className={`py-20 ${getBackgroundClasses()}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4"
          >
            <Settings className="w-4 h-4" />
            {subtitle}
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            {title}
          </h2>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            {description}
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className={`grid gap-8 ${
            layout === 'grid' 
              ? 'md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {cards.map((card, index) => {
            const IconComponent = card.icon;
            
            return (
              <motion.div
                key={card.id}
                variants={cardVariants}
                whileHover={{ 
                  y: -8, 
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
                className={`group relative bg-white rounded-2xl border-2 ${getAccentColorClasses(card.accentColor)} shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden`}
              >
                {/* Gradient Background */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`}></div>
                
                <div className="p-8">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5, type: "spring" }}
                    className={`w-16 h-16 bg-gradient-to-r ${card.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent className="w-8 h-8 text-white" />
                  </motion.div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                      {card.title}
                    </h3>
                    
                    <p className="text-gray-600 leading-relaxed">
                      {card.description}
                    </p>

                    {/* Benefits */}
                    {showBenefits && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        whileInView={{ opacity: 1, height: 'auto' }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                        className="space-y-2 pt-4 border-t border-gray-100"
                      >
                        {card.benefits.map((benefit, benefitIndex) => (
                          <motion.div
                            key={benefitIndex}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ 
                              delay: 0.6 + index * 0.1 + benefitIndex * 0.1, 
                              duration: 0.3 
                            }}
                            className="flex items-center gap-2 text-sm text-gray-700"
                          >
                            <div className={`w-2 h-2 bg-gradient-to-r ${card.gradient} rounded-full`}></div>
                            {benefit}
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Hover Effect */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <Activity className="w-4 h-4 text-gray-600" />
                  </motion.div>
                </div>

                {/* Background Decoration */}
                <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-r ${card.gradient} rounded-full opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 mb-6">
            모든 기능을 하나의 통합 플랫폼에서 경험하세요
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Database className="w-5 h-5" />
            무료 체험 시작하기
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
} 