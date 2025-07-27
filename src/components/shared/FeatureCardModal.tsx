'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import React, { useEffect } from 'react';

interface FeatureCardModalProps {
  selectedCard: any;
  onClose: () => void;
  renderTextWithAIGradient: (text: string) => React.ReactNode;
  modalRef: React.RefObject<HTMLDivElement>;
  variant?: 'home' | 'landing';
}

export default function FeatureCardModal({
  selectedCard,
  onClose,
  renderTextWithAIGradient,
  modalRef,
  variant = 'home',
}: FeatureCardModalProps) {
  // 모달은 항상 다크 테마로 고정

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!selectedCard) return null;

  const { title, icon: Icon, gradient, detailedContent } = selectedCard;

  // 중요도 등급 시스템 (과거 구현 참조)
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
    implementation: string; // 무엇으로 무엇을 구현했는지 명시
    version?: string;
    status: 'active' | 'ready' | 'planned';
    icon: string;
    tags: string[];
  }

  // AI 어시스턴트 기능 중심 기술 스택 데이터
  const getTechCards = (cardId: string): TechItem[] => {
    const techCardsMap: { [key: string]: TechItem[] } = {
      'mcp-ai-engine': [
        {
          name: 'Model Context Protocol',
          category: 'ai',
          importance: 'critical',
          description:
            'AI 어시스턴트가 파일시스템, GitHub, 데이터베이스에 직접 접근',
          implementation:
            'MCP Server로 Claude가 직접 서버 관리 및 코드 분석 수행',
          version: '1.0',
          status: 'active',
          icon: '🔗',
          tags: ['AI통신', '자체개발', '핵심인프라'],
        },
        {
          name: 'Claude Sonnet 4.0',
          category: 'ai',
          importance: 'critical',
          description: 'Anthropic의 최신 AI 모델로 자연어 대화 및 코드 분석',
          implementation: 'API 키로 실시간 AI 어시스턴트 기능 구현',
          status: 'active',
          icon: '🤖',
          tags: ['AI모델', '외부API', '핵심기능'],
        },
        {
          name: 'Google Gemini 2.0',
          category: 'ai',
          importance: 'high',
          description: '폴백 AI 시스템으로 Claude 장애 시 대체 서비스',
          implementation: 'Google AI Studio API로 이중화 시스템 구축',
          status: 'active',
          icon: '🔄',
          tags: ['폴백AI', '외부API', '안정성'],
        },
        {
          name: 'Supabase pgVector',
          category: 'database',
          importance: 'high',
          description: '문서 벡터 검색으로 관련 정보를 AI가 찾아서 답변',
          implementation: 'PostgreSQL pgVector 확장으로 임베딩 검색 구현',
          status: 'active',
          icon: '🔍',
          tags: ['벡터검색', '외부서비스', 'RAG'],
        },
        {
          name: 'Korean NLP Engine',
          category: 'language',
          importance: 'medium',
          description: '한국어 자연어 처리로 사용자 질문을 정확히 이해',
          implementation: 'hangul-js + korean-utils로 형태소 분석 및 문맥 파악',
          status: 'active',
          icon: '🇰🇷',
          tags: ['한국어', '오픈소스', 'NLP'],
        },
      ],
      'fullstack-ecosystem': [
        {
          name: 'Vercel',
          category: 'deployment',
          importance: 'critical',
          description: '프론트엔드 자동 배포 플랫폼',
          implementation: 'GitHub 연동으로 코드 Push 시 자동 빌드 및 배포',
          status: 'active',
          icon: '▲',
          tags: ['배포', '외부서비스', 'CI/CD'],
        },
        {
          name: 'Supabase PostgreSQL',
          category: 'database',
          importance: 'critical',
          description: '메인 데이터베이스로 모든 데이터 저장 및 관리',
          implementation: 'PostgreSQL + RLS로 보안 강화된 백엔드 구현',
          status: 'active',
          icon: '🐘',
          tags: ['데이터베이스', '외부서비스', 'PostgreSQL'],
        },
        {
          name: 'Upstash Redis',
          category: 'database',
          importance: 'high',
          description: '고속 캐시 시스템으로 API 응답 속도 향상',
          implementation: 'REST API로 세션, 토큰, 임시 데이터 캐싱 구현',
          status: 'active',
          icon: '⚡',
          tags: ['캐시', '외부서비스', 'Redis'],
        },
        {
          name: 'Google Cloud Platform',
          category: 'deployment',
          importance: 'high',
          description: 'MCP 서버 호스팅으로 24/7 AI 서비스 운영',
          implementation: 'Compute Engine VM에서 MCP 서버 및 AI 엔진 운영',
          status: 'active',
          icon: '☁️',
          tags: ['클라우드', '외부서비스', '인프라'],
        },
        {
          name: 'GitHub Actions',
          category: 'deployment',
          importance: 'medium',
          description: 'CI/CD 파이프라인으로 자동 테스트 및 배포',
          implementation: 'Workflow 파일로 테스트→빌드→배포 자동화',
          status: 'active',
          icon: '🔄',
          tags: ['CI/CD', '자동화', '외부서비스'],
        },
      ],
      'tech-stack': [
        {
          name: 'Next.js 15',
          category: 'framework',
          importance: 'critical',
          description: 'React 기반 풀스택 프레임워크',
          implementation:
            'App Router + Server Components로 최신 웹앱 아키텍처 구현',
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
          implementation:
            'strict 모드로 컴파일 타임 오류 방지 및 개발 생산성 향상',
          version: '5.0+',
          status: 'active',
          icon: '🔷',
          tags: ['언어', '오픈소스', '타입안전'],
        },
        {
          name: 'Tailwind CSS',
          category: 'ui',
          importance: 'high',
          description: 'Utility-first CSS 프레임워크',
          implementation: 'JIT 컴파일러로 빠른 스타일링 및 다크모드 구현',
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
          implementation: '60fps 부드러운 페이지 전환 및 인터랙티브 애니메이션',
          status: 'active',
          icon: '🎬',
          tags: ['애니메이션', '오픈소스', 'React'],
        },
        {
          name: 'Zustand',
          category: 'framework',
          importance: 'medium',
          description: '경량 상태 관리 라이브러리',
          implementation: 'TypeScript 기반 글로벌 상태 관리 및 지속성 구현',
          status: 'active',
          icon: '🔄',
          tags: ['상태관리', '오픈소스', 'React'],
        },
      ],
      'cursor-ai': [
        {
          name: 'Claude Code',
          category: 'ai',
          importance: 'critical',
          description: 'Anthropic의 AI 페어 프로그래밍 도구',
          implementation:
            'MCP 프로토콜로 파일시스템, GitHub, 서버에 직접 접근하는 AI',
          status: 'active',
          icon: '🤖',
          tags: ['AI', '외부도구', '페어프로그래밍'],
        },
        {
          name: 'Cursor IDE',
          category: 'custom',
          importance: 'high',
          description: 'AI 통합 코드 에디터',
          implementation:
            'Claude Sonnet 3.5 + 컨텍스트 인식으로 실시간 코드 생성',
          status: 'active',
          icon: '💻',
          tags: ['IDE', '외부도구', 'AI'],
        },
        {
          name: 'Gemini CLI',
          category: 'ai',
          importance: 'medium',
          description: '터미널 기반 구글 AI 도구',
          implementation: 'WSL 환경에서 명령줄로 AI 협업 및 병렬 분석',
          status: 'active',
          icon: '✨',
          tags: ['AI', '외부도구', '협업'],
        },
        {
          name: 'Custom MCP Server',
          category: 'custom',
          importance: 'high',
          description: '자체 개발 Model Context Protocol 서버',
          implementation:
            'Node.js로 AI가 서버 리소스에 직접 접근할 수 있는 브릿지 구현',
          status: 'active',
          icon: '🔧',
          tags: ['자체개발', 'MCP', '인프라'],
        },
        {
          name: 'Git + GitHub',
          category: 'custom',
          importance: 'critical',
          description: '버전 관리 및 협업 플랫폼',
          implementation: 'Git 워크플로우 + GitHub API로 이슈/PR 자동 관리',
          status: 'active',
          icon: '📝',
          tags: ['버전관리', '외부서비스', '협업'],
        },
      ],
    };
    return techCardsMap[cardId] || [];
  };

  // 중요도별 색상 및 스타일 (과거 구현 참조)
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

  // 기술 카드 컴포넌트 (과거 구현 참조)
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
            <span className='text-2xl'>{tech.icon}</span>
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

        <p className='text-gray-300 text-xs mb-2 leading-relaxed'>
          {tech.description}
        </p>

        <div className='mb-3 p-2 bg-gray-800/50 rounded text-xs text-gray-400'>
          <strong className='text-gray-300'>구현:</strong> {tech.implementation}
        </div>

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

  const techCards = getTechCards(selectedCard.id);

  // 중요도별 기술 분류
  const criticalTech = techCards.filter(tech => tech.importance === 'critical');
  const highTech = techCards.filter(tech => tech.importance === 'high');
  const mediumTech = techCards.filter(tech => tech.importance === 'medium');
  const lowTech = techCards.filter(tech => tech.importance === 'low');

  const mainContent = (
    <div className='p-6 text-white'>
      {/* 헤더 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center mb-8'
      >
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          <Icon className='w-8 h-8 text-white' />
        </div>
        <h3 className='text-2xl font-bold mb-3'>
          {renderTextWithAIGradient(title)}
        </h3>
        <p className='text-gray-300 max-w-2xl mx-auto text-sm'>
          {detailedContent.overview}
        </p>
      </motion.div>

      {/* 중요도별 기술 스택 섹션 */}
      <div className='space-y-8'>
        {/* 필수 기술 (Critical) */}
        {criticalTech.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='space-y-4'
          >
            <h4 className='text-lg font-semibold text-red-300 flex items-center gap-2'>
              <div className='w-3 h-3 bg-red-400 rounded-full'></div>
              필수 기술 (Critical)
              <span className='text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full'>
                {criticalTech.length}개
              </span>
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {criticalTech.map((tech, index) => (
                <TechCard key={tech.name} tech={tech} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {/* 중요 기술 (High) */}
        {highTech.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='space-y-4'
          >
            <h4 className='text-lg font-semibold text-orange-300 flex items-center gap-2'>
              <div className='w-3 h-3 bg-orange-400 rounded-full'></div>
              중요 기술 (High)
              <span className='text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full'>
                {highTech.length}개
              </span>
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {highTech.map((tech, index) => (
                <TechCard key={tech.name} tech={tech} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {/* 보통 기술 (Medium) */}
        {mediumTech.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='space-y-4'
          >
            <h4 className='text-lg font-semibold text-blue-300 flex items-center gap-2'>
              <div className='w-3 h-3 bg-blue-400 rounded-full'></div>
              보통 기술 (Medium)
              <span className='text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full'>
                {mediumTech.length}개
              </span>
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {mediumTech.map((tech, index) => (
                <TechCard key={tech.name} tech={tech} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {/* 낮은 우선순위 기술 (Low) */}
        {lowTech.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='space-y-4'
          >
            <h4 className='text-lg font-semibold text-gray-300 flex items-center gap-2'>
              <div className='w-3 h-3 bg-gray-400 rounded-full'></div>
              보조 기술 (Low)
              <span className='text-xs bg-gray-500/20 text-gray-300 px-2 py-1 rounded-full'>
                {lowTech.length}개
              </span>
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {lowTech.map((tech, index) => (
                <TechCard key={tech.name} tech={tech} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4'
        onClick={onClose}
        data-modal-version='v2.0-unified-scroll'
      >
        {/* 개선된 배경 블러 효과 */}
        <div className='absolute inset-0 bg-black/85 backdrop-blur-sm' />

        {/* 개선된 모달 컨텐츠 */}
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className='relative w-full max-w-3xl max-h-[85vh] bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl border border-gray-600/50 shadow-2xl overflow-hidden'
          onClick={e => e.stopPropagation()}
          data-modal-content='unified-scroll-v2'
        >
          <div
            className={`absolute top-0 left-0 right-0 h-48 bg-gradient-to-b ${gradient} opacity-20 blur-3xl`}
          ></div>
          <div className='relative z-10 flex flex-col h-full'>
            <header className='flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center'>
                  <Icon
                    className='w-5 h-5'
                    style={{
                      color: variant === 'home' ? 'white' : 'currentColor',
                    }}
                  />
                </div>
                <h2 className='text-lg font-semibold text-white'>{title}</h2>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className='p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors'
                aria-label='Close modal'
              >
                <X size={20} />
              </motion.button>
            </header>
            <div
              className='overflow-y-auto scroll-smooth'
              style={{ maxHeight: 'calc(85vh - 80px)' }}
            >
              {mainContent}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
