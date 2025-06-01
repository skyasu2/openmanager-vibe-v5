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
  customStack: string;
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
  customStack,
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

        {/* 기술 스택 - 오픈소스 */}
        <div className="flex items-center space-x-2 mb-3">
          <Cpu className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-blue-400 font-mono">{techStack}</span>
        </div>

        {/* 자체 개발 스택 */}
        <div className="flex items-center space-x-2 mb-6">
          <Zap className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400 font-mono">{customStack}</span>
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
      description: "자연어로 서버 상태를 질의하면 AI가 6개 도구를 조합하여 분석하는 지능형 시스템입니다.",
      currentFeatures: "MCP 프로토콜 기반 다중 도구 선택, 하이브리드 Python+TypeScript 엔진, 실시간 의도 분류",
      futureFeatures: "예측 분석 정확도 향상, 자동 최적화 제안, 컨텍스트 학습 시스템, 멀티모달 분석",
      techStack: "🔵 오픈소스: MCP SDK • Python 3.11 • FastAPI • NumPy/Pandas • Scikit-learn",
      customStack: "🟢 자체 개발: AI 하이브리드 엔진 • PythonWarmupService • 의도 분류 모델",
      action: "AI 에이전트 체험",
      href: "/admin/ai-agent",
      icon: <Brain className="w-8 h-8" />,
      gradient: "bg-gradient-to-r from-blue-500 to-purple-600",
      isSpecial: false
    },
    {
      title: "🧪 실시간 데이터 생성기",
      description: "Prometheus 표준으로 30개 가상 서버의 현실적 메트릭을 생성하는 507줄 최적화 엔진입니다.",
      currentFeatures: "베이스라인+델타 압축으로 65% 데이터 절약, 24시간 주기 패턴 시뮬레이션, Prometheus 호환",
      futureFeatures: "실제 서버 데이터 연동, 장애 시나리오 자동 생성, 부하 테스트 통합, 멀티클러스터 지원",
      techStack: "🔵 오픈소스: Node.js 20+ • IORedis • Upstash for Redis • WebSocket • Prometheus Client",
      customStack: "🟢 자체 개발: OptimizedDataGenerator (507줄) • TimerManager • MemoryOptimizer • SmartCache",
      action: "데이터 생성기 확인",
      href: "/dashboard",
      icon: <Database className="w-8 h-8" />,
      gradient: "bg-gradient-to-r from-green-500 to-teal-600",
      isSpecial: false
    },
    {
      title: "🌐 모던 웹 인프라",
      description: "Next.js 15 + React 19 기반으로 86개 페이지를 빌드하고 Vercel에 자동 배포되는 시스템입니다.",
      currentFeatures: "TypeScript 100% 적용, 자동 빌드/배포, 실시간 모니터링 대시보드, React Query 캐싱",
      futureFeatures: "마이크로서비스 전환, 컨테이너 오케스트레이션, 성능 최적화 자동화, 엣지 컴퓨팅",
      techStack: "🔵 오픈소스: Next.js 15 • React 19 • TypeScript 5.x • TailwindCSS • Supabase PostgreSQL",
      customStack: "🟢 자체 개발: UnifiedMetricsManager (774줄) • PrometheusDataHub • 실시간 UI 컴포넌트",
      action: "인프라 확인",
      href: "/dashboard/realtime",
      icon: <Cpu className="w-8 h-8" />,
      gradient: "bg-gradient-to-r from-purple-500 to-pink-600",
      isSpecial: false
    },
    {
      title: "⚡ Vibe Coding 워크플로우",
      description: "Cursor AI + Claude로 협업하여 '코드를 치지 않고도' 기능을 완성하는 혁신적 개발 방법론입니다.",
      currentFeatures: "Cursor Composer 멀티파일 편집, AI 페어 프로그래밍, 자동 문서화, 실시간 코드 생성",
      futureFeatures: "AI 코드 리뷰 자동화, 테스트 케이스 자동 생성, 성능 병목 자동 탐지, 보안 취약점 분석",
      techStack: "🔵 오픈소스: Cursor AI • Claude 3.5 Sonnet • GitHub Actions • Playwright • ESLint",
      customStack: "🟢 자체 개발: Vibe Coding 방법론 • AI 기반 아키텍처 패턴 • 자동 최적화 전략",
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
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">실제 구현된</span>{' '}
            <span className="text-fuchsia-400">핵심</span>{' '}
            <span className="text-white">기능</span>
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

          {/* 기술 스택 분류 표시 */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-white mb-2">통합 기술 스택 아키텍처</h4>
              <p className="text-sm text-gray-400">오픈소스와 자체 개발 기술 분류</p>
            </div>
            
            {/* 오픈소스 기술 스택 */}
            <div className="mb-8">
              <h5 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                🔵 오픈소스 기술 스택
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4">
                  <h6 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI/ML 프레임워크
                  </h6>
                  <div className="flex flex-wrap gap-2">
                    {["MCP SDK", "Python 3.11", "FastAPI", "NumPy/Pandas", "Scikit-learn"].map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-lg p-4">
                  <h6 className="text-green-300 font-medium mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    백엔드 런타임
                  </h6>
                  <div className="flex flex-wrap gap-2">
                    {["Node.js 20+", "IORedis", "Upstash for Redis", "WebSocket", "Prometheus Client"].map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4">
                  <h6 className="text-purple-300 font-medium mb-2 flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    프론트엔드 및 데이터베이스
                  </h6>
                  <div className="flex flex-wrap gap-2">
                    {["Next.js 15", "React 19", "TypeScript 5.x", "TailwindCSS", "Supabase PostgreSQL"].map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4">
                  <h6 className="text-yellow-300 font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    개발 도구 & 상태 관리
                  </h6>
                  <div className="flex flex-wrap gap-2">
                    {["Cursor AI", "Claude 3.5", "GitHub Actions", "Playwright", "Zustand"].map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 자체 개발 기술 스택 */}
            <div>
              <h5 className="text-green-300 font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                🟢 자체 개발 기술 스택
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg p-4">
                  <h6 className="text-emerald-300 font-medium mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI 핵심 엔진
                  </h6>
                  <div className="flex flex-wrap gap-2">
                    {["AI 하이브리드 엔진", "PythonWarmupService", "의도 분류 모델"].map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4">
                  <h6 className="text-cyan-300 font-medium mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    데이터 처리 엔진
                  </h6>
                  <div className="flex flex-wrap gap-2">
                    {["OptimizedDataGenerator", "TimerManager", "MemoryOptimizer", "SmartCache"].map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-lg p-4">
                  <h6 className="text-violet-300 font-medium mb-2 flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    시스템 관리
                  </h6>
                  <div className="flex flex-wrap gap-2">
                    {["UnifiedMetricsManager", "PrometheusDataHub", "실시간 UI 컴포넌트"].map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-4">
                  <h6 className="text-amber-300 font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    방법론 & 아키텍처
                  </h6>
                  <div className="flex flex-wrap gap-2">
                    {["Vibe Coding 방법론", "AI 아키텍처 패턴", "자동 최적화 전략"].map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 기술 스택 비교 */}
            <div className="mt-6 bg-gradient-to-r from-gray-800/20 to-gray-700/20 rounded-lg p-4">
              <h6 className="text-gray-300 font-medium mb-3 flex items-center gap-2">
                <Server className="w-4 h-4" />
                📊 기술 스택 구성 비율
              </h6>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-blue-400 text-2xl font-bold mb-1">20+</div>
                  <div className="text-sm text-blue-300">오픈소스 기술</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 text-2xl font-bold mb-1">12+</div>
                  <div className="text-sm text-green-300">자체 개발 모듈</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 