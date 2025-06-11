'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  Star,
  Zap,
  Shield,
  TrendingUp,
  Database,
  Code,
  Cpu,
  Network,
  Globe,
  Settings,
  Monitor,
  Cloud,
  Brain,
  ArrowRight,
  ExternalLink,
  Rocket,
  Award,
  Target,
  Layers,
  Package,
  Wrench,
  Palette,
  Terminal,
} from 'lucide-react';

interface FeatureCardModalProps {
  selectedCard: any;
  onClose: () => void;
  renderTextWithAIGradient: (text: string) => React.ReactNode;
  modalRef: React.RefObject<HTMLDivElement>;
  variant?: 'home' | 'landing';
  isDarkMode?: boolean;
}

// 기술 분류 및 중요도 등급 시스템
type TechCategory =
  | 'framework'
  | 'language'
  | 'database'
  | 'ai'
  | 'opensource'
  | 'custom'
  | 'deployment'
  | 'ui';
type ImportanceLevel = 'critical' | 'high' | 'medium' | 'low';

interface TechItem {
  name: string;
  category: TechCategory;
  importance: ImportanceLevel;
  description: string;
  version?: string;
  status: 'active' | 'ready' | 'planned';
  icon: string;
  tags: string[];
}

// 현재 사용 기술 스택 (실제 구현 기준)
const getCurrentTechStack = (cardId: string): TechItem[] => {
  const techStacks: { [key: string]: TechItem[] } = {
    'mcp-ai-engine': [
      {
        name: 'Model Context Protocol',
        category: 'ai',
        importance: 'critical',
        description: 'Cursor IDE와 직접 연동되는 AI 통신 프로토콜',
        version: '1.0',
        status: 'active',
        icon: '🧠',
        tags: ['AI', '자체개발', '프로토콜'],
      },
      {
        name: 'Claude Sonnet 3.5',
        category: 'ai',
        importance: 'critical',
        description: 'Anthropic의 최신 AI 모델',
        status: 'active',
        icon: '🤖',
        tags: ['AI', '외부API', '언어모델'],
      },
      {
        name: 'Google AI Studio',
        category: 'ai',
        importance: 'high',
        description: 'Gemini 모델 기반 폴백 시스템',
        status: 'active',
        icon: '🔄',
        tags: ['AI', '외부API', '폴백'],
      },
      {
        name: 'RAG Engine',
        category: 'ai',
        importance: 'high',
        description: '문서 기반 검색 증강 생성',
        status: 'active',
        icon: '📚',
        tags: ['AI', '자체개발', '검색'],
      },
      {
        name: 'Korean NLP Utils',
        category: 'language',
        importance: 'medium',
        description: '한국어 자연어 처리 라이브러리',
        status: 'active',
        icon: '🇰🇷',
        tags: ['언어', '오픈소스', 'NLP'],
      },
    ],
    'fullstack-ecosystem': [
      {
        name: 'Next.js',
        category: 'framework',
        importance: 'critical',
        description: 'React 기반 풀스택 프레임워크',
        version: '15.3.3',
        status: 'active',
        icon: '⚛️',
        tags: ['프레임워크', '오픈소스', 'React'],
      },
      {
        name: 'TypeScript',
        category: 'language',
        importance: 'critical',
        description: '타입 안전성을 보장하는 JavaScript 확장',
        version: '5.0+',
        status: 'active',
        icon: '🔷',
        tags: ['언어', '오픈소스', '타입안전'],
      },
      {
        name: 'Supabase',
        category: 'database',
        importance: 'critical',
        description: 'PostgreSQL 기반 백엔드 서비스',
        status: 'active',
        icon: '🗄️',
        tags: ['데이터베이스', '외부서비스', 'PostgreSQL'],
      },
      {
        name: 'Upstash Redis',
        category: 'database',
        importance: 'high',
        description: '서버리스 Redis 캐싱 시스템',
        status: 'active',
        icon: '⚡',
        tags: ['캐시', '외부서비스', 'Redis'],
      },
      {
        name: 'Vercel',
        category: 'deployment',
        importance: 'high',
        description: '자동 배포 및 호스팅 플랫폼',
        status: 'active',
        icon: '🚀',
        tags: ['배포', '외부서비스', 'CI/CD'],
      },
    ],
    'tech-stack': [
      {
        name: 'TailwindCSS',
        category: 'ui',
        importance: 'high',
        description: 'Utility-first CSS 프레임워크',
        version: '3.4+',
        status: 'active',
        icon: '🎨',
        tags: ['UI', '오픈소스', 'CSS'],
      },
      {
        name: 'Framer Motion',
        category: 'ui',
        importance: 'medium',
        description: 'React 애니메이션 라이브러리',
        status: 'active',
        icon: '🎬',
        tags: ['애니메이션', '오픈소스', 'React'],
      },
      {
        name: 'Lucide React',
        category: 'ui',
        importance: 'medium',
        description: '아이콘 라이브러리',
        status: 'active',
        icon: '🎯',
        tags: ['아이콘', '오픈소스', 'UI'],
      },
      {
        name: 'Zustand',
        category: 'framework',
        importance: 'medium',
        description: '상태 관리 라이브러리',
        status: 'active',
        icon: '🔄',
        tags: ['상태관리', '오픈소스', 'React'],
      },
      {
        name: 'ESLint + Prettier',
        category: 'custom',
        importance: 'medium',
        description: '코드 품질 및 포맷팅 도구',
        status: 'active',
        icon: '🔧',
        tags: ['개발도구', '오픈소스', '품질관리'],
      },
    ],
    'vibe-coding': [
      {
        name: 'Cursor IDE',
        category: 'custom',
        importance: 'critical',
        description: 'AI 페어 프로그래밍 IDE',
        status: 'active',
        icon: '💻',
        tags: ['IDE', '외부도구', 'AI'],
      },
      {
        name: 'Git + GitHub',
        category: 'custom',
        importance: 'critical',
        description: '버전 관리 및 협업 플랫폼',
        status: 'active',
        icon: '📝',
        tags: ['버전관리', '외부서비스', '협업'],
      },
      {
        name: 'Husky + Lint-staged',
        category: 'custom',
        importance: 'high',
        description: 'Git 훅 기반 자동화 도구',
        status: 'active',
        icon: '🐕',
        tags: ['자동화', '오픈소스', 'Git'],
      },
      {
        name: 'Custom MCP Server',
        category: 'custom',
        importance: 'high',
        description: '자체 개발 MCP 서버 구현',
        status: 'active',
        icon: '🛠️',
        tags: ['자체개발', 'MCP', '서버'],
      },
      {
        name: 'OpenManager Engine',
        category: 'custom',
        importance: 'high',
        description: '서버 모니터링 자체 엔진',
        status: 'active',
        icon: '📊',
        tags: ['자체개발', '모니터링', '엔진'],
      },
    ],
  };

  return techStacks[cardId] || [];
};

// 중요도별 색상 및 스타일
const getImportanceStyle = (importance: ImportanceLevel) => {
  const styles = {
    critical: {
      bg: 'bg-red-500/20 border-red-500/40',
      text: 'text-red-300',
      badge: 'bg-red-500/30 text-red-200',
      label: '필수',
    },
    high: {
      bg: 'bg-orange-500/20 border-orange-500/40',
      text: 'text-orange-300',
      badge: 'bg-orange-500/30 text-orange-200',
      label: '중요',
    },
    medium: {
      bg: 'bg-blue-500/20 border-blue-500/40',
      text: 'text-blue-300',
      badge: 'bg-blue-500/30 text-blue-200',
      label: '보통',
    },
    low: {
      bg: 'bg-gray-500/20 border-gray-500/40',
      text: 'text-gray-300',
      badge: 'bg-gray-500/30 text-gray-200',
      label: '낮음',
    },
  };
  return styles[importance];
};

// 카테고리별 색상
const getCategoryStyle = (category: TechCategory) => {
  const styles = {
    framework: { color: 'text-purple-400', bg: 'bg-purple-500/10' },
    language: { color: 'text-green-400', bg: 'bg-green-500/10' },
    database: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
    ai: { color: 'text-pink-400', bg: 'bg-pink-500/10' },
    opensource: { color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    custom: { color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    deployment: { color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    ui: { color: 'text-teal-400', bg: 'bg-teal-500/10' },
  };
  return styles[category];
};

// 기술 카드 컴포넌트
const TechCard = ({ tech, index }: { tech: TechItem; index: number }) => {
  const importanceStyle = getImportanceStyle(tech.importance);
  const categoryStyle = getCategoryStyle(tech.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`p-4 rounded-lg border ${importanceStyle.bg} hover:scale-105 transition-all duration-300`}
    >
      <div className='flex items-start justify-between mb-3'>
        <div className='flex items-center gap-3'>
          <span className='text-2xl'>{renderIcon(tech.icon)}</span>
          <div>
            <h4 className='font-semibold text-white text-sm'>{tech.name}</h4>
            {tech.version && (
              <span className='text-xs text-gray-400'>v{tech.version}</span>
            )}
          </div>
        </div>
        <div className='flex flex-col gap-1'>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${importanceStyle.badge}`}
          >
            {importanceStyle.label}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs ${categoryStyle.bg} ${categoryStyle.color}`}
          >
            {tech.category}
          </span>
        </div>
      </div>

      <p className='text-gray-300 text-xs mb-3 leading-relaxed'>
        {tech.description}
      </p>

      <div className='flex flex-wrap gap-1'>
        {tech.tags.map((tag, tagIndex) => (
          <span
            key={tagIndex}
            className='px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs'
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

// icon 안전 렌더링 헬퍼
const renderIcon = (icon: any) => {
  if (!icon) return null;
  // 문자열(이모지) 그대로 출력
  if (typeof icon === 'string') return icon;
  // 이미 ReactElement 이면 그대로
  if (React.isValidElement(icon)) return icon;
  // 함수형 컴포넌트(예: Lucide 아이콘)면 JSX로 렌더
  if (typeof icon === 'function') {
    const IconComp = icon;
    return <IconComp className='w-5 h-5' />;
  }
  // 기타 객체는 문자열화
  return JSON.stringify(icon);
};

export default function FeatureCardModal({
  selectedCard,
  onClose,
  renderTextWithAIGradient,
  modalRef,
  variant = 'home',
  isDarkMode = true,
}: FeatureCardModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tech'>('overview');
  const techStack = getCurrentTechStack(selectedCard?.id || '');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!selectedCard) return null;

  // 중요도별 기술 분류
  const criticalTech = techStack.filter(tech => tech.importance === 'critical');
  const highTech = techStack.filter(tech => tech.importance === 'high');
  const mediumTech = techStack.filter(tech => tech.importance === 'medium');
  const lowTech = techStack.filter(tech => tech.importance === 'low');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 flex items-center justify-center p-4'
        onClick={onClose}
      >
        {/* 불투명한 배경 */}
        <div className='absolute inset-0 bg-black/80' />

        {/* 모달 컨텐츠 */}
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className='relative w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden'
          onClick={e => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className='flex items-center justify-between p-6 border-b border-gray-700'>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                <span className='text-2xl'>
                  {renderIcon(selectedCard.icon)}
                </span>
              </div>
              <div>
                <h2 className='text-xl font-bold text-white'>
                  {renderTextWithAIGradient(selectedCard.title)}
                </h2>
                <p className='text-gray-400 text-sm'>
                  {selectedCard.description}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className='p-2 hover:bg-gray-800 rounded-lg transition-colors'
            >
              <X className='w-5 h-5 text-gray-400' />
            </button>
          </div>

          {/* 탭 네비게이션 */}
          <div className='flex border-b border-gray-700'>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium transition-colors ${activeTab === 'overview' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
            >
              개요
            </button>
            <button
              onClick={() => setActiveTab('tech')}
              className={`px-6 py-3 font-medium transition-colors ${activeTab === 'tech' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
            >
              기술 스택 ({techStack.length})
            </button>
          </div>

          {/* 컨텐츠 */}
          <div className='p-6 overflow-y-auto max-h-[60vh]'>
            {activeTab === 'overview' && (
              <div className='space-y-6'>
                <div>
                  <h3 className='text-lg font-semibold text-white mb-3'>
                    {selectedCard.title} 상세 정보
                  </h3>
                  <p className='text-gray-300 leading-relaxed'>
                    {selectedCard.longDescription || selectedCard.description}
                  </p>
                </div>

                <div>
                  <h4 className='text-md font-semibold text-white mb-3'>
                    주요 특징
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    {selectedCard.features &&
                    selectedCard.features.length > 0 ? (
                      selectedCard.features.map(
                        (feature: string, index: number) => (
                          <div key={index} className='flex items-center gap-2'>
                            <CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0' />
                            <span className='text-gray-300 text-sm'>
                              {feature}
                            </span>
                          </div>
                        )
                      )
                    ) : (
                      <div className='flex items-center gap-2'>
                        <CheckCircle className='w-4 h-4 text-green-400' />
                        <span className='text-gray-300 text-sm'>
                          실제 구현된 기능 기반
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tech' && (
              <div className='space-y-6'>
                {/* 필수 기술 */}
                {criticalTech.length > 0 && (
                  <div>
                    <h3 className='text-lg font-semibold text-red-300 mb-4 flex items-center gap-2'>
                      <Star className='w-5 h-5' />
                      필수 기술 ({criticalTech.length})
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {criticalTech.map((tech, index) => (
                        <TechCard key={tech.name} tech={tech} index={index} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 중요 기술 */}
                {highTech.length > 0 && (
                  <div>
                    <h3 className='text-lg font-semibold text-orange-300 mb-4 flex items-center gap-2'>
                      <Zap className='w-5 h-5' />
                      중요 기술 ({highTech.length})
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {highTech.map((tech, index) => (
                        <TechCard key={tech.name} tech={tech} index={index} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 보통 기술 */}
                {mediumTech.length > 0 && (
                  <div>
                    <h3 className='text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2'>
                      <Package className='w-5 h-5' />
                      보통 기술 ({mediumTech.length})
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {mediumTech.map((tech, index) => (
                        <TechCard key={tech.name} tech={tech} index={index} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 낮은 우선순위 기술 */}
                {lowTech.length > 0 && (
                  <div>
                    <h3 className='text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2'>
                      <Layers className='w-5 h-5' />
                      기타 기술 ({lowTech.length})
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {lowTech.map((tech, index) => (
                        <TechCard key={tech.name} tech={tech} index={index} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
