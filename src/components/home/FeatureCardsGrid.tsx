'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Activity, Layers, X, Sparkles, Cpu, Database, Code, Zap } from 'lucide-react';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useToast } from '@/components/ui/ToastNotification';
import TechStackDisplay from '@/components/ui/TechStackDisplay';
import { analyzeTechStack } from '@/utils/TechStackAnalyzer';

// 카드 데이터
const cardData = [
  {
    id: 'mcp-ai-engine',
    title: 'MCP 기반 AI 엔진',
    description: '자연어로 서버 상태를 질의하면, MCP 프로토콜을 통해 AI 엔진이 다중 도구를 선택하고 분석 결과를 생성합니다.',
    icon: Bot,
    gradient: 'from-blue-500 via-pink-500 to-cyan-400',
    detailedContent: {
      overview: 'MCP(Model Context Protocol) 표준을 활용한 차세대 AI 분석 엔진으로, 자연어 질의를 통해 복잡한 서버 분석을 수행합니다.',
      features: [
        'OpenAI·Claude·Gemini 모델을 자동 선택해 분석합니다',
        'MCP Orchestrator가 statistical_analysis와 anomaly_detection을 조합합니다',
        'Python(Scikit-learn)과 Transformers.js 기반 AI 엔진을 연동합니다',
        'Supabase(Postgres)와 Upstash Redis 데이터를 실시간으로 참조합니다'
      ],
      technologies: [
        '@modelcontextprotocol/server-filesystem, @modelcontextprotocol/sdk',
        '@ai-sdk/openai, @ai-sdk/google, @ai-sdk/anthropic',
        '@supabase/supabase-js, redis',
        '@xenova/transformers, scikit-learn'
      ]
    },
    requiresAI: true,
    isAICard: true
  },
  {
    id: 'data-generator',
    title: '서버 데이터 생성기',
    description: 'Prometheus 스타일의 서버 메트릭 데이터를 자동 생성하여 AI 에이전트의 테스트 및 학습에 활용되는 시뮬레이터입니다.',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: '실제 운영 환경을 시뮬레이션하는 고성능 데이터 생성기로, AI 학습과 테스트를 위한 다양한 시나리오를 제공합니다.',
      features: [
        'prom-client로 Prometheus 호환 메트릭을 실시간 생성합니다',
        'TimerManager 최적화로 CPU 사용량을 최소화합니다',
        'Upstash Redis 캐싱과 delta-compression 모듈로 65% 압축률을 달성합니다',
        'Express 라우터 /api/data-generator 엔드포인트로 외부 시스템과 연동됩니다'
      ],
      technologies: [
        '@faker-js/faker, prom-client',
        'TimerManager, recharts',
        'express, upstash-redis',
        'delta-compression'
      ]
    },
    requiresAI: false
  },
  {
    id: 'tech-stack',
    title: '최신 프론트/백엔드 기술',
    description: 'OpenManager는 최신 기술 스택으로 구현되어 있으며, 높은 성능과 확장성을 자랑합니다.',
    icon: Code,
    gradient: 'from-purple-500 to-indigo-600',
    detailedContent: {
      overview: '모던 웹 개발의 베스트 프랙티스를 적용한 확장 가능하고 유지보수하기 쉬운 아키텍처를 제공합니다.',
      features: [
        'Next.js 15과 React 19 기반 최신 프론트엔드',
        'Zustand와 TanStack Query로 상태와 캐시를 관리합니다',
        'Vercel과 GitHub Actions를 활용한 자동 배포 파이프라인',
        'Supabase(Postgres)와 Upstash Redis로 백엔드를 구성합니다'
      ],
      technologies: [
        'Next.js, Tailwind, React Query, Zustand',
        'Supabase, Upstash for Redis, Vercel',
        'lucide-react, shadcn/ui, clsx',
        'framer-motion'
      ]
    },
    requiresAI: false
  },
  {
    id: 'vibe-coding',
    title: '✨ Vibe Coding',
    description: 'GPT/Claude + Cursor AI로 협업하여 구현된 MCP 기반 차세대 AI 에이전트 개발 워크플로우입니다.',
    icon: Sparkles,
    gradient: 'from-amber-400 via-orange-500 to-yellow-600',
    detailedContent: {
      overview: '인간과 AI가 협업하는 혁신적인 개발 방식으로, "코드를 치지 않고도" 완성도 높은 기능을 구현하는 차세대 워크플로우입니다.',
      features: [
        'Cursor AI와 Claude 협업으로 코드를 최소화합니다',
        'MCP 설정부터 테스트 자동화까지 프롬프트로 제어합니다',
        'GitHub Copilot과 auto-doc-generator로 문서를 자동 생성합니다',
        '4단계 Vibe Coding 프로세스로 86개 페이지를 자동 제작합니다'
      ],
      technologies: [
        'Cursor AI, Claude',
        '@modelcontextprotocol/sdk',
        'auto-doc-generator.js, testing-mcp-server.js',
        'Vibe Coding 기반 프롬프트 템플릿 시스템'
      ]
    },
    requiresAI: false,
    isSpecial: true,
    isVibeCard: true
  }
];

export default function FeatureCardsGrid() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showDevModal, setShowDevModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const { aiAgent } = useUnifiedAdminStore();
  const { warning } = useToast();

  // 모달 외부 클릭 시 닫기 처리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setSelectedCard(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedCard(null);
      }
    };

    if (selectedCard) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [selectedCard]);

  const handleCardClick = (cardId: string) => {
    const card = cardData.find(c => c.id === cardId);
    
    if (card?.requiresAI && !aiAgent.isEnabled) {
      // AI 에이전트가 필요한 기능에 일반 사용자가 접근할 때
      warning('🚧 이 기능은 AI 에이전트 모드에서만 사용 가능합니다. 홈 화면에서 AI 모드를 활성화해주세요.', {
        duration: 5000,
        action: {
          label: '활성화하기',
          onClick: () => window.location.href = '/'
        }
      });
      return;
    }
    
    setSelectedCard(cardId);
  };

  const closeModal = () => {
    setSelectedCard(null);
  };

  const selectedCardData = cardData.find(card => card.id === selectedCard);
  
  // 선택된 카드의 기술 스택 분석
  const analyzedTechStack = selectedCardData 
    ? analyzeTechStack(selectedCardData.detailedContent.technologies)
    : [];

  // AI 단어에 그라데이션 애니메이션 적용하는 함수
  const renderTextWithAIGradient = (text: string) => {
    if (!text.includes('AI')) return text;
    
    return text.split(/(AI)/g).map((part, index) => {
      if (part === 'AI') {
        return (
          <motion.span
            key={index}
            className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-bold"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundSize: '200% 200%'
            }}
          >
            {part}
          </motion.span>
        );
      }
      return part;
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {cardData.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="group cursor-pointer relative"
            onClick={() => handleCardClick(card.id)}
          >
            <div className={`relative p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300 h-full ${
              card.isSpecial ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30' : ''
            }`}>
              {/* 그라데이션 배경 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
              
              {/* AI 카드 특별 이색 그라데이션 애니메이션 */}
              {card.isAICard && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-pink-500/30 to-cyan-400/30 rounded-2xl"
                  animate={{
                    background: [
                      'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(236,72,153,0.3) 50%, rgba(34,197,94,0.3) 100%)',
                      'linear-gradient(135deg, rgba(236,72,153,0.3) 0%, rgba(34,197,94,0.3) 50%, rgba(59,130,246,0.3) 100%)',
                      'linear-gradient(135deg, rgba(34,197,94,0.3) 0%, rgba(59,130,246,0.3) 50%, rgba(236,72,153,0.3) 100%)',
                      'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(236,72,153,0.3) 50%, rgba(34,197,94,0.3) 100%)'
                    ]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              
              {/* 바이브 코딩 카드 골드 그라데이션 애니메이션 */}
              {card.isVibeCard && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{
                    background: [
                      'linear-gradient(135deg, rgba(251,191,36,0.3) 0%, rgba(249,115,22,0.3) 50%, rgba(234,179,8,0.3) 100%)',
                      'linear-gradient(135deg, rgba(234,179,8,0.3) 0%, rgba(251,191,36,0.3) 50%, rgba(249,115,22,0.3) 100%)',
                      'linear-gradient(135deg, rgba(249,115,22,0.3) 0%, rgba(234,179,8,0.3) 50%, rgba(251,191,36,0.3) 100%)',
                      'linear-gradient(135deg, rgba(251,191,36,0.3) 0%, rgba(249,115,22,0.3) 50%, rgba(234,179,8,0.3) 100%)'
                    ],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              
              {/* 아이콘 */}
              <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 relative z-10 ${
                card.isSpecial ? 'shadow-lg shadow-amber-500/25' : ''
              } ${
                card.isAICard ? 'shadow-lg shadow-pink-500/25' : ''
              }`}>
                {card.isAICard ? (
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <card.icon className="w-5 h-5 text-white" />
                  </motion.div>
                ) : card.isVibeCard ? (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <card.icon className="w-5 h-5 text-white" />
                  </motion.div>
                ) : (
                  <card.icon className="w-5 h-5 text-white" />
                )}
              </div>
              
              {/* 컨텐츠 */}
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-white transition-colors">
                  {renderTextWithAIGradient(card.title)}
                </h3>
                <p className="text-white/70 text-xs leading-relaxed group-hover:text-white/90 transition-colors">
                  {renderTextWithAIGradient(card.description)}
                </p>
                
                {/* AI 에이전트 필요 표시 */}
                {card.requiresAI && !aiAgent.isEnabled && (
                  <div className="mt-2 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-300 text-xs text-center">
                    AI 에이전트 모드 필요
                  </div>
                )}
              </div>
              
              {/* 호버 효과 */}
              <div className={`absolute inset-0 ring-2 ring-transparent transition-all duration-300 rounded-2xl ${
                card.isAICard 
                  ? 'group-hover:ring-pink-400/50 group-hover:shadow-lg group-hover:shadow-pink-500/25'
                  : card.isSpecial 
                  ? 'group-hover:ring-amber-400/50 group-hover:shadow-lg group-hover:shadow-amber-500/25' 
                  : 'group-hover:ring-white/30'
              }`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* 개선된 상세 모달 */}
      <AnimatePresence>
        {selectedCard && selectedCardData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl ${
                selectedCardData.isSpecial ? 'border-amber-500/50 bg-gradient-to-br from-gray-900/95 to-amber-900/20' : ''
              } ${
                selectedCardData.isAICard ? 'border-pink-500/50 bg-gradient-to-br from-gray-900/95 to-pink-900/20' : ''
              }`}
            >
              {/* 헤더 */}
              <div className="p-4 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${selectedCardData.gradient} rounded-lg flex items-center justify-center ${
                      selectedCardData.isSpecial ? 'shadow-lg shadow-amber-500/25' : ''
                    } ${
                      selectedCardData.isAICard ? 'shadow-lg shadow-pink-500/25' : ''
                    }`}>
                      {selectedCardData.isAICard ? (
                        <motion.div
                          animate={{
                            rotate: [0, 360],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{
                            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                          }}
                        >
                          <selectedCardData.icon className="w-5 h-5 text-white" />
                        </motion.div>
                      ) : selectedCardData.isVibeCard ? (
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <selectedCardData.icon className="w-5 h-5 text-white" />
                        </motion.div>
                      ) : (
                        <selectedCardData.icon className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {renderTextWithAIGradient(selectedCardData.title)}
                      </h2>
                      <p className="text-xs text-gray-400">
                        {renderTextWithAIGradient(selectedCardData.description)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* 상세 내용 */}
              <div className="p-4 space-y-4">
                {/* 개요 */}
                <div>
                  <h3 className="text-white font-medium mb-2 text-base">📖 개요</h3>
                  <p className="text-gray-300 leading-relaxed text-sm">
                    {renderTextWithAIGradient(selectedCardData.detailedContent.overview)}
                  </p>
                </div>

                {/* 주요 기능 */}
                <div>
                  <h3 className="text-white font-medium mb-3 text-base">⚡ 주요 기능</h3>
                  <ul className="space-y-2">
                    {selectedCardData.detailedContent.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs">
                        <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${
                          selectedCardData.isAICard 
                            ? 'bg-pink-400' 
                            : selectedCardData.isSpecial 
                            ? 'bg-amber-400' 
                            : 'bg-green-400'
                        }`} />
                        <span className="text-gray-300 leading-relaxed">
                          {renderTextWithAIGradient(feature)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 기술 스택 분석 */}
                <div>
                  <TechStackDisplay 
                    categories={analyzedTechStack}
                    showHeader={true}
                    compact={true}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 개발 중 모달 */}
      <AnimatePresence>
        {showDevModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 bg-orange-500/90 text-white rounded-lg shadow-lg"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bot className="w-4 h-4" />
              <span>
                {renderTextWithAIGradient('AI 에이전트 모드를 활성화해주세요')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 