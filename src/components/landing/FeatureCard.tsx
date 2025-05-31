'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Brain, 
  Server, 
  PlayCircle, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Zap
} from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  currentFeatures: string;
  futureFeatures: string;
  techStack: string;
  action: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
  isSpecial?: boolean;
  index: number;
}

interface SparkleEffectProps {
  count?: number;
}

// 바이브 코딩 카드 전용 반짝임 효과
function SparkleEffect({ count = 8 }: SparkleEffectProps) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-yellow-300 rounded-full"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function FeatureCard({
  title,
  description,
  currentFeatures,
  futureFeatures,
  techStack,
  action,
  href,
  icon,
  gradient,
  isSpecial = false,
  index
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -10, scale: 1.02 }}
      className={`
        relative group p-6 rounded-2xl backdrop-blur-lg border transition-all duration-500
        ${isSpecial 
          ? 'bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 border-yellow-500/30 hover:border-yellow-400/50' 
          : 'bg-white/5 border-white/10 hover:border-white/20'
        }
        ${isSpecial ? 'shadow-yellow-500/25 shadow-2xl' : 'shadow-xl hover:shadow-2xl'}
        overflow-hidden cursor-pointer
      `}
    >
      {/* 특별 효과 (바이브 코딩 카드만) */}
      {isSpecial && <SparkleEffect />}
      
      {/* 호버 시 배경 그라데이션 */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${gradient}`} />
      
      {/* 아이콘 영역 */}
      <div className="relative z-10 mb-6">
        <div className={`
          inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg
          ${isSpecial ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : gradient}
          ${isSpecial ? 'text-black' : 'text-white'}
          group-hover:scale-110 transition-transform duration-300
        `}>
          {icon}
        </div>
        
        {/* 특별 배지 */}
        {isSpecial && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold px-2 py-1 rounded-full"
          >
            ✨ 신기능
          </motion.div>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
          {title}
        </h3>
        
        <p className="text-gray-300 mb-6 leading-relaxed">
          {description}
        </p>

        {/* 구현 상태 */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-green-400 text-sm font-medium">현재 구현:</span>
              <p className="text-gray-300 text-sm mt-1">{currentFeatures}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-blue-400 text-sm font-medium">향후 계획:</span>
              <p className="text-gray-300 text-sm mt-1">{futureFeatures}</p>
            </div>
          </div>
        </div>

        {/* 기술 스택 */}
        <div className="flex items-center space-x-2 mb-6">
          <Cpu className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400 font-mono">{techStack}</span>
        </div>

        {/* 액션 버튼 */}
        <Link href={href} className="block">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              group/btn w-full py-3 px-4 rounded-xl font-medium transition-all duration-300
              flex items-center justify-center space-x-2
              ${isSpecial 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400' 
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20 hover:border-white/30'
              }
            `}
          >
            <span>{action}</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </motion.button>
        </Link>
      </div>

      {/* 배경 글로우 효과 */}
      <div className={`
        absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10
        ${isSpecial ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10' : 'bg-gradient-to-r from-blue-500/5 to-purple-500/5'}
        blur-xl transform scale-110
      `} />
    </motion.div>
  );
}

// 기능 카드 그리드 컴포넌트
export default function FeatureCards() {
  const features = [
    {
      title: "🧠 MCP AI 에이전트",
      description: "Model Context Protocol 기반 다중 도구 AI 분석 시스템. 6개 전문 도구와 Python ML Bridge를 활용한 서버 상태 분석을 제공합니다.",
      currentFeatures: "MCP 오케스트레이터, Python ML Bridge + TypeScript 폴백, SSE 실시간 스트리밍",
      futureFeatures: "컨텍스트 학습 고도화, 분석 도구 확장, 예측 모델 정확도 향상",
      techStack: "@xenova/transformers, FastAPI, React Query, Server-Sent Events",
      action: "AI 에이전트 체험",
      href: "/admin/ai-agent",
      icon: <Brain className="w-8 h-8" />,
      gradient: "bg-gradient-to-r from-blue-500 to-purple-600",
      isSpecial: false
    },
    {
      title: "🧪 지능형 데이터 생성기",
      description: "Prometheus 표준 기반 현실적 서버 메트릭 생성 시스템. 507줄 최적화 엔진으로 65% 데이터 압축과 현실적 패턴을 구현합니다.",
      currentFeatures: "507줄 최적화 엔진, 베이스라인+델타 압축, 24시간 주기 패턴, 30개 가상 서버",
      futureFeatures: "실제 서버 연동, 패턴 학습 시스템, 장애 시나리오 시뮬레이션",
      techStack: "OptimizedDataGenerator.ts, Prometheus, Upstash for Redis, Mathematical algorithms",
      action: "데이터 생성기 확인",
      href: "/dashboard",
      icon: <Database className="w-8 h-8" />,
      gradient: "bg-gradient-to-r from-green-500 to-teal-600",
      isSpecial: false
    },
    {
      title: "🌐 실제 기술 생태계",
      description: "프로젝트에서 실제로 사용한 모든 기술과 도구들. Next.js 15 + React 19, AI 개발 도구, 클라우드 인프라를 포함한 완전한 기술 스택입니다.",
      currentFeatures: "Next.js 15.3.2, TypeScript 100%, Cursor AI, Vercel 배포, GitHub Actions CI/CD",
      futureFeatures: "마이크로서비스 아키텍처, 컨테이너화, 모니터링 시스템 확장",
      techStack: "Next.js, TypeScript, TailwindCSS, Framer Motion, Vercel, Render",
      action: "기술 스택 확인",
      href: "/dashboard/realtime",
      icon: <Cpu className="w-8 h-8" />,
      gradient: "bg-gradient-to-r from-purple-500 to-pink-600",
      isSpecial: false
    },
    {
      title: "⚡ AI 협업 개발 과정",
      description: "실제 사용한 AI 도구와 개발 방법론. Cursor AI, Claude, GitHub Copilot을 활용한 현실적인 개발 워크플로우를 경험해보세요.",
      currentFeatures: "Cursor Composer 멀티파일 편집, 타이머 시스템 최적화 (23개→4개), 자동 배포",
      futureFeatures: "AI 코드 리뷰 시스템, 자동 테스트 생성, 성능 최적화 자동화",
      techStack: "Cursor AI, Claude 3.5 Sonnet, GitHub Copilot, Chrome DevTools",
      action: "🛠️ 개발 과정 보기",
      href: "/vibe-coding",
      icon: <Sparkles className="w-8 h-8" />,
      gradient: "bg-gradient-to-r from-yellow-500 to-orange-500",
      isSpecial: true
    }
  ];

  return (
    <section id="features" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 섹션 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            실제 구현된 핵심 기능
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            발표 가능한 실제 성과와 측정 가능한 개선사항들을 확인해보세요
          </p>
        </motion.div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              index={index}
            />
          ))}
        </div>

        {/* 실제 성과 통계 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">실제 달성한 성과</h3>
            <p className="text-gray-400">측정 가능한 개선사항과 구현 성과</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: <Zap className="w-8 h-8" />, value: "507줄", label: "데이터 생성 엔진" },
              { icon: <Server className="w-8 h-8" />, value: "65%", label: "데이터 압축률" },
              { icon: <Brain className="w-8 h-8" />, value: "86개", label: "빌드된 페이지" },
              { icon: <Database className="w-8 h-8" />, value: "100%", label: "TypeScript 적용" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-blue-400 mb-2 flex justify-center">
                  {stat.icon}
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* 기술 스택 표시 */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-white mb-2">실제 사용한 기술 스택</h4>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Next.js 15.3.2", "React 19", "TypeScript", "TailwindCSS", 
                "Framer Motion", "Cursor AI", "Claude 3.5", "Vercel", 
                "Python FastAPI", "Upstash for Redis", "Prometheus"
              ].map((tech, index) => (
                <motion.span
                  key={tech}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium"
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 