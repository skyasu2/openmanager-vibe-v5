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
  _isDarkMode?: boolean;
}

export default function FeatureCardModal({
  selectedCard,
  onClose,
  renderTextWithAIGradient,
  modalRef,
  variant = 'home',
  _isDarkMode = true,
}: FeatureCardModalProps) {
  // 사용하지 않는 상태 제거

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

  // 기술 설명 카드 데이터
  const getTechCards = (cardId: string) => {
    const techCardsMap: {
      [key: string]: Array<{
        name: string;
        description: string;
        category: string;
        icon: string;
      }>;
    } = {
      'mcp-ai-engine': [
        {
          name: 'Google AI',
          description: 'Gemini 언어모델 - 자연어를 이해하고 답변하는 AI',
          category: 'AI',
          icon: '🤖',
        },
        {
          name: 'Supabase',
          description: '실시간 데이터베이스 - 데이터를 저장하고 즉시 조회',
          category: 'DB',
          icon: '🐘',
        },
        {
          name: 'pgVector',
          description: '벡터 검색 - AI가 의미를 파악해서 관련 정보 찾기',
          category: 'AI',
          icon: '🔍',
        },
        {
          name: 'MCP Protocol',
          description: 'AI 도구 연결 - Claude와 다양한 서비스를 연결',
          category: '도구',
          icon: '🔗',
        },
      ],
      'fullstack-ecosystem': [
        {
          name: 'Vercel',
          description: '웹사이트 자동 배포 - 코드를 올리면 즉시 웹사이트로',
          category: '배포',
          icon: '▲',
        },
        {
          name: 'GitHub',
          description: '코드 저장소 - 개발 코드를 안전하게 보관하고 협업',
          category: '도구',
          icon: '🐙',
        },
        {
          name: 'GCP',
          description: '구글 클라우드 - 강력한 서버를 빌려서 24시간 운영',
          category: '클라우드',
          icon: '☁️',
        },
        {
          name: 'Redis',
          description: '고속 캐시 저장소 - 자주 쓰는 데이터를 빠르게 접근',
          category: 'DB',
          icon: '⚡',
        },
      ],
      'tech-stack': [
        {
          name: 'Next.js',
          description: 'React 웹 프레임워크 - 빠르고 현대적인 웹앱 제작',
          category: '프레임워크',
          icon: '⚛️',
        },
        {
          name: 'TypeScript',
          description: '타입 안전한 JavaScript - 오류를 미리 잡아주는 언어',
          category: '언어',
          icon: '🔷',
        },
        {
          name: 'Tailwind',
          description: 'CSS 프레임워크 - 빠르고 예쁜 디자인 작업',
          category: 'UI',
          icon: '🎨',
        },
        {
          name: 'Vitest',
          description: '테스트 도구 - 코드가 제대로 작동하는지 자동 검사',
          category: '테스트',
          icon: '🧪',
        },
      ],
      'cursor-ai': [
        {
          name: 'Claude Code',
          description: 'AI 코딩 도구 - 인공지능과 함께 프로그래밍',
          category: 'AI',
          icon: '🤖',
        },
        {
          name: 'Cursor AI',
          description: 'AI IDE - 코드 작성을 도와주는 똑똑한 에디터',
          category: '도구',
          icon: '💻',
        },
        {
          name: 'Gemini CLI',
          description: '구글 AI 명령줄 - 터미널에서 바로 AI 활용',
          category: 'AI',
          icon: '✨',
        },
        {
          name: 'MCP Server',
          description: 'AI 도구 서버 - 다양한 개발 도구들을 AI가 사용',
          category: '인프라',
          icon: '🔧',
        },
      ],
    };
    return techCardsMap[cardId] || [];
  };

  // 간소화된 컨텐츠 데이터
  const getSimplifiedContent = (cardId: string) => {
    const contentMap: {
      [key: string]: { highlights: string[]; achievements: string[] };
    } = {
      'mcp-ai-engine': {
        highlights: [
          '🇰🇷 한국어 질문 → 즉시 답변',
          '🆓 무료 모드 제공',
          '🚀 구글 AI 연동',
          '💾 학습하는 검색',
        ],
        achievements: [
          '0.1초 초고속 응답',
          '99% 에러 해결 완료',
          '83% MCP 도구 활용',
          'v5.65.3 안정화',
        ],
      },
      'fullstack-ecosystem': {
        highlights: [
          '▲ 자동 웹사이트 배포',
          '🐘 실시간 데이터베이스',
          '⚡ 고속 캐시 시스템',
          '☁️ 24시간 서버 운영',
        ],
        achievements: [
          '94개 페이지 완성',
          '100% 타입 안전성',
          '무료 서비스 최적화',
          '완전 자동화 배포',
        ],
      },
      'tech-stack': {
        highlights: [
          '⚛️ 최신 React 웹앱',
          '🔷 타입 안전한 코드',
          '🎨 빠른 디자인 작업',
          '🧪 자동 테스트 검증',
        ],
        achievements: [
          '482개 테스트 통과',
          '0개 타입 에러',
          '60FPS 부드러운 동작',
          'A급 코드 품질',
        ],
      },
      'cursor-ai': {
        highlights: [
          '📄 AI 코딩 진화 과정',
          '🤝 AI 협업 프로그래밍',
          '🔗 도구 완전 통합',
          '💡 지능형 개발 환경',
        ],
        achievements: [
          '20만줄 코딩 완성',
          '30분 개발+5분 검토',
          '완전 자동화 워크플로',
          'A급 협업 품질',
        ],
      },
    };
    return contentMap[cardId] || { highlights: [], achievements: [] };
  };

  const simplifiedContent = getSimplifiedContent(selectedCard.id);
  const techCards = getTechCards(selectedCard.id);

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

      {/* 3열 컨텐츠 그리드 */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* 핵심 기능 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className='space-y-4'
        >
          <h4 className='text-lg font-semibold text-blue-300 flex items-center gap-2'>
            <div className='w-2 h-2 bg-blue-400 rounded-full'></div>
            핵심 기능
          </h4>
          <div className='space-y-3'>
            {simplifiedContent.highlights.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className='flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors'
              >
                <span className='text-sm'>{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 사용 기술 (새로 추가) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='space-y-4'
        >
          <h4 className='text-lg font-semibold text-purple-300 flex items-center gap-2'>
            <div className='w-2 h-2 bg-purple-400 rounded-full'></div>
            사용 기술
          </h4>
          <div className='space-y-3'>
            {techCards.map((tech, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className='p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10'
              >
                <div className='flex items-start gap-3'>
                  <span className='text-lg'>{tech.icon}</span>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='font-medium text-white text-sm'>
                        {tech.name}
                      </span>
                      <span className='px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full'>
                        {tech.category}
                      </span>
                    </div>
                    <p className='text-xs text-gray-400 leading-relaxed'>
                      {tech.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 주요 성과 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className='space-y-4'
        >
          <h4 className='text-lg font-semibold text-green-300 flex items-center gap-2'>
            <div className='w-2 h-2 bg-green-400 rounded-full'></div>
            주요 성과
          </h4>
          <div className='space-y-3'>
            {simplifiedContent.achievements.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className='flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors'
              >
                <span className='text-sm'>{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
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
