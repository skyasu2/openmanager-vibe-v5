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
          name: 'AI 사이드바 어시스턴트',
          category: 'ai',
          importance: 'critical',
          description:
            '대시보드에서 실시간으로 대화하는 AI 어시스턴트 사이드바',
          implementation: '우측 하단 플로팅 버튼으로 언제든지 AI와 대화 가능',
          version: 'v5.66.22',
          status: 'active',
          icon: '🤖',
          tags: ['실시간AI', '사이드바', '핵심기능'],
        },
        {
          name: 'LOCAL/GOOGLE 2-Mode',
          category: 'ai',
          importance: 'critical',
          description: 'LOCAL 모드(무료) + GOOGLE AI 모드(고급) 듀얼 시스템',
          implementation:
            'Supabase RAG 우선, Google Gemini 폴백으로 안정성 확보',
          version: 'v5.66.22',
          status: 'active',
          icon: '🎯',
          tags: ['AI모드', '무료우선', '핵심기능'],
        },
        {
          name: '한국어 자연어 처리',
          category: 'language',
          importance: 'high',
          description: '"CPU 높은 서버?" 같은 자연스러운 한국어 질문 이해',
          implementation: 'hangul-js + korean-utils로 형태소 분석 및 문맥 파악',
          status: 'active',
          icon: '🇰🇷',
          tags: ['한국어', 'NLP', '자연어'],
        },
        {
          name: '실시간 서버 분석',
          category: 'ai',
          importance: 'high',
          description: '서버 메트릭을 실시간으로 분석하여 지능형 답변 제공',
          implementation: '15초마다 갱신되는 메트릭 데이터 기반 분석',
          status: 'active',
          icon: '📊',
          tags: ['실시간분석', '메트릭', 'AI분석'],
        },
        {
          name: '이상 징후 감지',
          category: 'ai',
          importance: 'high',
          description: 'CPU/메모리 급증 등 이상 패턴을 AI가 자동 감지',
          implementation: '임계값 기반 알고리즘 + 패턴 학습으로 예방 알림',
          status: 'active',
          icon: '🚨',
          tags: ['이상감지', '예방알림', 'AI'],
        },
        {
          name: 'Supabase pgVector',
          category: 'database',
          importance: 'medium',
          description: '문서 벡터 검색으로 관련 정보를 AI가 찾아서 답변',
          implementation: 'PostgreSQL pgVector 확장으로 임베딩 검색 구현',
          status: 'active',
          icon: '🔍',
          tags: ['벡터검색', 'RAG', '지식베이스'],
        },
        {
          name: '지능형 쿼리 엔진',
          category: 'ai',
          importance: 'medium',
          description: '복잡한 질문을 이해하고 최적의 답변 생성',
          implementation:
            'SimplifiedQueryEngine으로 자연어 처리, 서버 메트릭 분석, 캐싱 최적화',
          status: 'active',
          icon: '🧠',
          tags: ['쿼리엔진', 'NLP', '지능형분석'],
        },
      ],
      'fullstack-ecosystem': [
        {
          name: 'Vercel Edge Runtime',
          category: 'deployment',
          importance: 'critical',
          description: '프론트엔드 자동 배포 플랫폼',
          implementation:
            'GitHub 연동으로 Push 시 자동 빌드, Edge Runtime으로 전 세계 분산 배포',
          status: 'active',
          icon: '▲',
          tags: ['배포', 'Edge Runtime', '무료티어'],
        },
        {
          name: 'Supabase PostgreSQL',
          category: 'database',
          importance: 'critical',
          description: '메인 데이터베이스로 모든 데이터 저장 및 관리',
          implementation:
            'PostgreSQL + pgVector (벡터 검색) + RLS (행 수준 보안)',
          status: 'active',
          icon: '🐘',
          tags: ['데이터베이스', 'pgVector', '500MB무료'],
        },
        {
          name: 'Upstash Redis',
          category: 'database',
          importance: 'high',
          description: '고속 캐시 시스템으로 API 응답 속도 향상',
          implementation:
            'MemoryOptimizedCache 클래스로 256MB 한계 내 최적화, LRU 정책',
          status: 'active',
          icon: '⚡',
          tags: ['캐시', '256MB무료', 'Redis'],
        },
        {
          name: 'GCP Functions (Python 3.11)',
          category: 'deployment',
          importance: 'high',
          description: '3개의 Python 서버리스 함수 배포 완료',
          implementation:
            'enhanced-korean-nlp (한국어 처리), ml-analytics-engine (ML 분석), unified-ai-processor (AI 통합)',
          version: 'Python 3.11',
          status: 'active',
          icon: '☁️',
          tags: ['클라우드', 'Python3.11', '배포완료'],
        },
        {
          name: 'Google AI Studio',
          category: 'ai',
          importance: 'high',
          description: 'Gemini 2.0 Flash 모델로 고급 AI 분석',
          implementation:
            '일 1,000회 무료 할당량, 분당 15회 제한으로 비용 최적화',
          status: 'active',
          icon: '🤖',
          tags: ['AI', '무료할당량', 'Gemini'],
        },
        {
          name: 'GitHub Actions',
          category: 'deployment',
          importance: 'medium',
          description: 'CI/CD 파이프라인으로 자동 테스트 및 배포',
          implementation: 'Workflow 파일로 테스트→빌드→배포 자동화',
          status: 'active',
          icon: '🔄',
          tags: ['CI/CD', '자동화', '월2000분무료'],
        },
      ],
      'tech-stack': [
        {
          name: 'Next.js 15',
          category: 'framework',
          importance: 'critical',
          description: 'React 기반 풀스택 프레임워크',
          implementation:
            'App Router + Edge Runtime으로 최적화된 서버 사이드 렌더링',
          version: '15.4.5',
          status: 'active',
          icon: '⚛️',
          tags: ['프레임워크', '오픈소스', 'React'],
        },
        {
          name: 'React 18',
          category: 'framework',
          importance: 'critical',
          description: 'UI 구축을 위한 JavaScript 라이브러리',
          implementation: 'Concurrent Features와 Suspense로 최적화된 렌더링',
          version: '18.3.1',
          status: 'active',
          icon: '⚛️',
          tags: ['UI라이브러리', '오픈소스', 'Meta'],
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
          tags: ['언어', '오픤소스', '타입안전'],
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
          name: 'Vitest',
          category: 'framework',
          importance: 'high',
          description: '고속 테스트 프레임워크',
          implementation:
            '40개 테스트 파일, 3단계 테스트 전략 (minimal 22ms → smart → full)',
          status: 'active',
          icon: '🧪',
          tags: ['테스트', '오픈소스', '고속'],
        },
        {
          name: 'Zustand',
          category: 'framework',
          importance: 'medium',
          description: '경량 상태 관리 라이브러리',
          implementation: 'TypeScript 기반 글로벌 상태 관리 및 지속성 구현',
          version: '5.0.5',
          status: 'active',
          icon: '🔄',
          tags: ['상태관리', '오픈소스', 'React'],
        },
        {
          name: '코드 품질 시스템',
          category: 'custom',
          importance: 'high',
          description: 'ESLint + TypeScript로 지속적 품질 개선',
          implementation: '린트 문제 15% 감소, TypeScript strict mode 적용',
          version: 'v5.66.22',
          status: 'active',
          icon: '✨',
          tags: ['품질개선', '안정성', '지속개선'],
        },
      ],
      'cursor-ai': [
        {
          name: 'ChatGPT',
          category: 'ai',
          importance: 'high',
          description: '초기 페이지 목업 생성 → 브레인스토밍 & 프롬프트 작성',
          implementation:
            '프로젝트 초기에는 페이지 단위 HTML/CSS 생성, 현재는 아이디어 구상과 프롬프트 설계에 활용',
          status: 'active',
          icon: '💬',
          tags: ['초기도구', '브레인스토밍', '프롬프트'],
        },
        {
          name: 'Cursor IDE → Claude Code',
          category: 'ai',
          importance: 'critical',
          description: 'Cursor AI로 시작 → Claude Code로 완전 전환',
          implementation:
            '초기: Cursor IDE + Claude Sonnet로 개발 시작, v5.65 이후: Claude Code + 11개 MCP 서버로 완전 전환하여 더 강력한 자동화 달성',
          version: 'v5.66.22',
          status: 'active',
          icon: '🔄',
          tags: ['개발전환', 'AI진화', '자동화강화'],
        },
        {
          name: 'Claude Code + 11 MCP (현재 핵심)',
          category: 'ai',
          importance: 'critical',
          description: '현재 주력 개발 도구 - 11개 MCP 서버로 완벽한 자동화',
          implementation:
            'MCP(Model Context Protocol)로 파일 시스템, GitHub, DB 등을 직접 조작! filesystem, memory, github, supabase, tavily-remote, playwright, time, context7, serena, shadcn-ui 등 11개 서버로 모든 개발 작업 자동화',
          version: 'v5.66.22',
          status: 'active',
          icon: '🤖',
          tags: ['현재핵심', 'MCP통합', '완전자동화', '11서버'],
        },
        {
          name: 'CLAUDE.md 가이드',
          category: 'custom',
          importance: 'high',
          description: '프로젝트 규칙과 표준을 문서화한 AI 개발 가이드',
          implementation:
            '코딩 규칙, 무료 티어 전략, MCP 서버 설정 가이드, 개발 환경 표준화',
          status: 'active',
          icon: '📋',
          tags: ['문서화', '표준화', 'AI가이드'],
        },
        {
          name: 'Gemini CLI',
          category: 'ai',
          importance: 'medium',
          description: 'WSL 터미널에서 1M 토큰으로 대규모 분석',
          implementation:
            '코드베이스 전체 분석, 대용량 로그 분석, Claude Code와 협업',
          status: 'active',
          icon: '✨',
          tags: ['Gemini', '대용량분석', '협업AI'],
        },
        {
          name: 'Git + GitHub 자동화',
          category: 'custom',
          importance: 'high',
          description: '버전 관리부터 PR까지 모든 Git 작업 자동화',
          implementation:
            'GitHub MCP 서버로 커밋, 푸시, PR 생성, 이슈 관리 자동화',
          status: 'active',
          icon: '📝',
          tags: ['Git자동화', 'CI/CD', 'GitHub'],
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
        className={`rounded-lg border p-4 ${importanceStyle.bg} transition-all duration-300 hover:scale-105`}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{tech.icon}</span>
            <div>
              <h4 className="text-sm font-semibold text-white">{tech.name}</h4>
              {tech.version && (
                <span className="text-xs text-gray-400">v{tech.version}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${importanceStyle.badge}`}
            >
              {importanceStyle.label}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-xs ${categoryStyle.bg} ${categoryStyle.color}`}
            >
              {tech.category}
            </span>
          </div>
        </div>

        <p className="mb-2 text-xs leading-relaxed text-gray-300">
          {tech.description}
        </p>

        <div className="mb-3 rounded bg-gray-800/50 p-2 text-xs text-gray-400">
          <strong className="text-gray-300">구현:</strong> {tech.implementation}
        </div>

        <div className="flex flex-wrap gap-1">
          {tech.tags.map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="rounded bg-gray-700/50 px-2 py-1 text-xs text-gray-300"
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
  const criticalTech = techCards.filter(
    (tech) => tech.importance === 'critical'
  );
  const highTech = techCards.filter((tech) => tech.importance === 'high');
  const mediumTech = techCards.filter((tech) => tech.importance === 'medium');
  const lowTech = techCards.filter((tech) => tech.importance === 'low');

  const mainContent = (
    <div className="p-6 text-white">
      {/* 헤더 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div
          className={`mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h3 className="mb-3 text-2xl font-bold">
          {renderTextWithAIGradient(title)}
        </h3>
        <p className="mx-auto max-w-2xl text-sm text-gray-300">
          {detailedContent.overview}
        </p>
      </motion.div>

      {/* 중요도별 기술 스택 섹션 */}
      <div className="space-y-8">
        {/* 필수 기술 (Critical) */}
        {criticalTech.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="flex items-center gap-2 text-lg font-semibold text-red-300">
              <div className="h-3 w-3 rounded-full bg-red-400"></div>
              필수 기술 (Critical)
              <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-300">
                {criticalTech.length}개
              </span>
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            className="space-y-4"
          >
            <h4 className="flex items-center gap-2 text-lg font-semibold text-orange-300">
              <div className="h-3 w-3 rounded-full bg-orange-400"></div>
              중요 기술 (High)
              <span className="rounded-full bg-orange-500/20 px-2 py-1 text-xs text-orange-300">
                {highTech.length}개
              </span>
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            className="space-y-4"
          >
            <h4 className="flex items-center gap-2 text-lg font-semibold text-blue-300">
              <div className="h-3 w-3 rounded-full bg-blue-400"></div>
              보통 기술 (Medium)
              <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                {mediumTech.length}개
              </span>
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            className="space-y-4"
          >
            <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-300">
              <div className="h-3 w-3 rounded-full bg-gray-400"></div>
              보조 기술 (Low)
              <span className="rounded-full bg-gray-500/20 px-2 py-1 text-xs text-gray-300">
                {lowTech.length}개
              </span>
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
        data-modal-version="v2.0-unified-scroll"
      >
        {/* 개선된 배경 블러 효과 */}
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

        {/* 개선된 모달 컨텐츠 */}
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-600/50 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          data-modal-content="unified-scroll-v2"
        >
          <div
            className={`absolute left-0 right-0 top-0 h-48 bg-gradient-to-b ${gradient} opacity-20 blur-3xl`}
          ></div>
          <div className="relative z-10 flex h-full flex-col">
            <header className="flex flex-shrink-0 items-center justify-between border-b border-gray-700/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800">
                  <Icon
                    className="h-5 w-5"
                    style={{
                      color: variant === 'home' ? 'white' : 'currentColor',
                    }}
                  />
                </div>
                <h2 className="text-lg font-semibold text-white">{title}</h2>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                aria-label="Close modal"
              >
                <X size={20} />
              </motion.button>
            </header>
            <div
              className="overflow-y-auto scroll-smooth"
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
