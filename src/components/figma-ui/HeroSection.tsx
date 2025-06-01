'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Play, 
  Shield, 
  Zap, 
  BarChart3,
  Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  primaryCTA?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
  secondaryCTA?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
  features?: string[];
  backgroundGradient?: string;
  showStats?: boolean;
  stats?: {
    servers: number;
    uptime: string;
    response: string;
  };
}

export default function HeroSection({
  title = "차세대 서버 모니터링 플랫폼",
  subtitle = "OpenManager v5",
  description = "실시간 AI 분석과 예측적 모니터링으로 서버 인프라를 완벽하게 관리하세요. 단 몇 분만에 설정 완료.",
  primaryCTA = {
    label: "무료로 시작하기",
    href: "/dashboard",
  },
  secondaryCTA = {
    label: "데모 보기",
    href: "/demo",
  },
  features = [
    "실시간 AI 모니터링",
    "예측적 장애 감지",
    "자동 스케일링",
    "통합 대시보드"
  ],
  backgroundGradient = "from-blue-50 via-purple-50 to-pink-50",
  showStats = true,
  stats = {
    servers: 10000,
    uptime: "99.9%",
    response: "< 100ms"
  }
}: HeroSectionProps) {
  
  return (
    <section className={`relative min-h-screen bg-gradient-to-br ${backgroundGradient} overflow-hidden`}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-3xl"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/50 shadow-lg"
            >
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">{subtitle}</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
            >
              {title.split(' ').map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  className={index % 2 === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600' : ''}
                >
                  {word} 
                </motion.span>
              ))}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl"
            >
              {description}
            </motion.p>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="grid grid-cols-2 gap-4"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{feature}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={primaryCTA.onClick}
              >
                {primaryCTA.label}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-gray-200 hover:border-gray-300 bg-white/80 backdrop-blur-sm px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={secondaryCTA.onClick}
              >
                <Play className="w-5 h-5 mr-2" />
                {secondaryCTA.label}
              </Button>
            </motion.div>

            {/* Stats */}
            {showStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.8 }}
                className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200/50"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.servers.toLocaleString()}+</div>
                  <div className="text-sm text-gray-600">관리 서버</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.uptime}</div>
                  <div className="text-sm text-gray-600">가동률</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.response}</div>
                  <div className="text-sm text-gray-600">응답 시간</div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="relative"
          >
            {/* Main Dashboard Preview */}
            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 p-6 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              {/* Mock Dashboard Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Server className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">OpenManager Dashboard</div>
                  <div className="text-xs text-gray-500">실시간 모니터링</div>
                </div>
              </div>

              {/* Mock Chart Area */}
              <div className="space-y-4">
                <div className="h-32 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-12 h-12 text-blue-500/50" />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg flex items-center justify-center"
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-pink-400 to-red-500 rounded-full shadow-lg"
            ></motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 