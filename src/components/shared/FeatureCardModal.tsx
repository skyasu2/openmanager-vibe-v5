'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
// framer-motion 제거 - CSS 애니메이션 사용
import { X, Bot, Zap } from 'lucide-react';
import type {
  FeatureCardModalProps,
  TechItem,
  ImportanceLevel,
  TechCategory,
  ImportanceStyle,
  CategoryStyle,
} from '@/types/feature-card.types';
import {
  TECH_STACKS_DATA,
  IMPORTANCE_STYLES,
  CATEGORY_STYLES,
  type VibeCodeData,
} from '@/data/tech-stacks.data';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';

// 🛡️ Codex 제안: 타입 가드 함수 (프로덕션 안정성 강화)
const isValidCard = (card: unknown): card is NonNullable<FeatureCardModalProps['selectedCard']> => {
  return (
    typeof card === 'object' &&
    card !== null &&
    'id' in card &&
    'title' in card &&
    'icon' in card &&
    'gradient' in card
  );
};

// 🛡️ Codex 제안: XSS 방지를 위한 텍스트 검증
const sanitizeText = (text: string): string => {
  if (typeof text !== 'string') return '';
  return text.replace(/<script[^>]*>.*?<\/script>/gi, '').substring(0, 1000); // 길이 제한
};

export default function FeatureCardModal({
  selectedCard,
  onClose,
  renderTextWithAIGradient,
  modalRef,
  variant = 'home',
  isVisible,
}: FeatureCardModalProps) {
  // 모달은 항상 다크 테마로 고정
  // 바이브 코딩 카드 전용 히스토리 뷰 상태
  const [isHistoryView, setIsHistoryView] = React.useState(false);

  // AI 상태 확인 (AI 제한 처리용)
  const aiAgentEnabled = useUnifiedAdminStore(state => state.aiAgent.isEnabled);

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
  }, [onClose]); // ✅ onClose 의존성 복원 - stale closure 방지

  // 🎯 Gemini 제안: 타입 안전성 강화 + 의존성 최적화
  const cardData = React.useMemo(() => {
    // 🛡️ Codex 제안: 런타임 검증 추가
    if (!isValidCard(selectedCard)) {
      return {
        title: '',
        icon: Bot,
        gradient: 'from-blue-500 to-purple-600',
        detailedContent: { overview: '', features: [], technologies: [] },
        id: null,
        requiresAI: false
      };
    }

    return {
      title: sanitizeText(selectedCard.title),
      icon: selectedCard.icon || Bot,
      gradient: selectedCard.gradient || 'from-blue-500 to-purple-600',
      detailedContent: selectedCard.detailedContent || { overview: '', features: [], technologies: [] },
      id: selectedCard.id,
      requiresAI: selectedCard.requiresAI || false
    };
  }, [selectedCard?.id]); // 🎯 Gemini 제안: ID만 의존성으로 하여 불필요한 리렌더링 방지

  // 일관된 구조분해 할당 (Hook 순서에 영향 없음)
  const { title, icon: Icon, gradient, detailedContent, requiresAI } = cardData;

  // 중요도별 스타일 가져오기
  const getImportanceStyle = (importance: ImportanceLevel): ImportanceStyle => {
    return IMPORTANCE_STYLES[importance];
  };

  // 카테고리별 스타일 가져오기
  const getCategoryStyle = (category: TechCategory): CategoryStyle => {
    return CATEGORY_STYLES[category];
  };

  // 기술 카드 컴포넌트 (과거 구현 참조)
  const TechCard = React.memo(({ tech, index }: { tech: TechItem; index: number }) => {
    const importanceStyle = getImportanceStyle(tech.importance);
    const categoryStyle = getCategoryStyle(tech.category);

    return (
      <div
        className={`rounded-lg border p-4 ${importanceStyle.bg} transition-all duration-300 hover:scale-105`}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{tech.icon}</span>
            <div>
              <h4 className="text-sm font-semibold text-white">{sanitizeText(tech.name)}</h4>
              {tech.version && (
                <span className="text-xs text-gray-400">v{sanitizeText(tech.version)}</span>
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
          {sanitizeText(tech.description)}
        </p>

        <div className="mb-3 rounded bg-gray-800/50 p-2 text-xs text-gray-400">
          <strong className="text-gray-300">구현:</strong> {sanitizeText(tech.implementation)}
        </div>

        {/* 제품 타입 및 AI 엔진 타입 배지 */}
        <div className="mb-2 flex flex-wrap gap-2">
          {tech.type && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                tech.type === 'custom'
                  ? 'border border-blue-500/30 bg-blue-500/20 text-blue-300'
                  : tech.type === 'opensource'
                    ? 'border border-green-500/30 bg-green-500/20 text-green-300'
                    : 'border border-purple-500/30 bg-purple-500/20 text-purple-300'
              }`}
            >
              {tech.type === 'custom'
                ? '🏭 커스텀'
                : tech.type === 'opensource'
                  ? '🔓 오픈소스'
                  : '📦 상용'}
            </span>
          )}
          {tech.aiType && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                tech.aiType === 'google-api'
                  ? 'border border-green-500/30 bg-green-500/20 text-green-300'
                  : 'border border-yellow-500/30 bg-yellow-500/20 text-yellow-300'
              }`}
            >
              {tech.aiType === 'google-api' ? '🌐 Google AI' : '💻 로컬 AI'}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {tech.tags?.map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="rounded bg-gray-700/50 px-2 py-1 text-xs text-gray-300"
            >
              {sanitizeText(tag)}
            </span>
          )) || null}
        </div>
      </div>
    );
  });

  TechCard.displayName = 'TechCard';

  // 🎯 Qwen 제안: 메모리 효율성 개선 - 단일 순회로 모든 중요도별 분류 처리
  const categorizedTechData = React.useMemo(() => {
    const selectedCardId = cardData.id;
    
    // 항상 동일한 구조 반환 (배열 + 메타데이터)
    const result = {
      allCards: [] as TechItem[],
      hasData: false,
      isVibeCard: false,
      historyStages: null as any,
      categorized: {
        critical: [] as TechItem[],
        high: [] as TechItem[],
        medium: [] as TechItem[],
        low: [] as TechItem[]
      }
    };
    
    if (!selectedCardId) {
      return result; // 빈 구조체 반환
    }
    
    const data = TECH_STACKS_DATA[selectedCardId] || null;
    if (!data) {
      return result; // 빈 구조체 반환
    }
    
    // 바이브 코딩 카드 처리
    if (selectedCardId === 'cursor-ai' && 'current' in data) {
      const vibeData = data as VibeCodeData;
      result.isVibeCard = true;
      result.historyStages = vibeData.history || null;
      
      if (isHistoryView && vibeData.history) {
        // 🎯 Qwen 제안: O(n²) → O(n) 최적화 - concat 체인 사용
        result.allCards = ([] as TechItem[]).concat(
          vibeData.history.stage1 || [],
          vibeData.history.stage2 || [], 
          vibeData.history.stage3 || []
        );
      } else {
        result.allCards = vibeData.current || [];
      }
    } else {
      // 일반 카드 처리
      result.allCards = Array.isArray(data) ? data : [];
    }
    
    // 🎯 Qwen 제안: 단일 순회로 모든 중요도별 분류 처리 (O(n) 복잡도)
    result.allCards.forEach(tech => {
      const importance = tech.importance;
      if (result.categorized[importance]) {
        result.categorized[importance].push(tech);
      }
    });
    
    result.hasData = result.allCards.length > 0;
    return result;
  }, [cardData.id, isHistoryView]);

  // 기술 스택 배열 추출 (항상 배열)
  const techCards = categorizedTechData.allCards;
  const { critical: criticalTech, high: highTech, medium: mediumTech, low: lowTech } = categorizedTechData.categorized;

  // 바이브 히스토리 스테이지 추출
  const vibeHistoryStages = categorizedTechData.historyStages;


  // 🛡️ Codex 제안: 런타임 안전성 검증
  const renderModalSafely = () => {
    try {
      if (!cardData.id && isVisible) {
        return (
          <div className="p-6 text-center text-white">
            <p>모달을 불러올 수 없습니다.</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-600 rounded">
              닫기
            </button>
          </div>
        );
      }
      return mainContent;
    } catch (error) {
      console.error('Modal rendering error:', error);
      return (
        <div className="p-6 text-center text-white">
          <p>모달을 불러오는 중 오류가 발생했습니다.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-600 rounded">
            닫기
          </button>
        </div>
      );
    }
  };

  const mainContent = (
    <div className="p-6 text-white">
      {/* 헤더 섹션 */}
      <div
        className="mb-8 text-center"
      >
        <div
          className={`mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h3 className="mb-3 text-2xl font-bold">
          {renderTextWithAIGradient(title)}
          {/* 바이브 코딩 카드 전용 뷰 표시 */}
          {cardData.id === 'cursor-ai' && (
            <span className="ml-2 text-lg font-medium text-amber-400">
              {isHistoryView ? '• 발전 히스토리' : '• 현재 도구'}
            </span>
          )}
        </h3>
        <p className="mx-auto max-w-2xl text-sm text-gray-300">
          {cardData.id === 'cursor-ai' && isHistoryView 
            ? '바이브 코딩의 3단계 발전 과정을 시간 순서대로 보여줍니다. 초기(ChatGPT 개별 페이지) → 중기(Cursor + Vercel + Supabase) → 후기(Claude Code + WSL + 멀티 AI CLI)로 진화한 개발 도구들의 역사를 확인할 수 있습니다.'
            : sanitizeText(detailedContent.overview)
          }
        </p>
      </div>

      {/* AI 제한 경고 배너 */}
      {requiresAI && !aiAgentEnabled && (
        <div className="mb-8 rounded-xl border-2 border-orange-500/30 bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-orange-500/20 p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/30">
                <Bot className="h-5 w-5 text-orange-300" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="mb-2 font-semibold text-orange-300">
                🤖 AI 어시스턴트 모드 필요
              </h4>
              <p className="text-sm text-orange-200/90 leading-relaxed">
                이 기능을 사용하려면 AI 어시스턴트 모드를 활성화해야 합니다.
                메인 페이지로 돌아가서 AI 모드를 켜주세요.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-orange-300/80">
                <Zap className="h-4 w-4" />
                <span>AI 모드는 항상 무료로 사용할 수 있습니다</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 바이브 코딩 히스토리 3단계 섹션 또는 중요도별 기술 스택 섹션 */}
      {cardData.id === 'cursor-ai' && isHistoryView && vibeHistoryStages ? (
        <div className="space-y-10">
          {/* 1단계: 초기 */}
          <div className="space-y-4">
            <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xl font-bold text-emerald-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">1</div>
                초기 단계 (2025.05~06)
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-300">
                  {vibeHistoryStages.stage1?.length || 0}개 도구
                </span>
              </h4>
              <p className="text-sm text-emerald-200/80">
                ChatGPT로 개별 페이지 생성 → GitHub 수동 업로드 → Netlify 배포 → 데모용 목업 수준
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {vibeHistoryStages.stage1?.map((tech: TechItem, index: number) => (
                <TechCard key={tech.name} tech={tech} index={index} />
              )) || null}
            </div>
          </div>

          {/* 2단계: 중기 */}
          <div className="space-y-4">
            <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xl font-bold text-amber-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-300">2</div>
                중기 단계 (2025.06~07)
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm text-amber-300">
                  {vibeHistoryStages.stage2?.length || 0}개 도구
                </span>
              </h4>
              <p className="text-sm text-amber-200/80">
                Cursor 도입 → GitHub 연동 → Vercel 배포 → Supabase CRUD 웹앱 완성
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {vibeHistoryStages.stage2?.map((tech: TechItem, index: number) => (
                <TechCard key={tech.name} tech={tech} index={index} />
              )) || null}
            </div>
          </div>

          {/* 3단계: 후기 */}
          <div className="space-y-4">
            <div className="mb-6 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xl font-bold text-purple-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-300">3</div>
                후기 단계 (2025.07~현재)
                <span className="rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-300">
                  {vibeHistoryStages.stage3?.length || 0}개 도구
                </span>
              </h4>
              <p className="text-sm text-purple-200/80">
                Claude Code 전환 → WSL 최적화 → 멀티 AI CLI 협업 → GCP Functions 활용
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {vibeHistoryStages.stage3?.map((tech: TechItem, index: number) => (
                <TechCard key={tech.name} tech={tech} index={index} />
              )) || null}
            </div>
          </div>
        </div>
      ) : (
        // 기존 중요도별 분류 방식
        <div className="space-y-8">
          {/* 필수 기술 (Critical) */}
          {criticalTech.length > 0 && (
            <div className="space-y-4">
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
            </div>
          )}

          {/* 중요 기술 (High) */}
          {highTech.length > 0 && (
            <div className="space-y-4">
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
            </div>
          )}

          {/* 보통 기술 (Medium) */}
          {mediumTech.length > 0 && (
            <div className="space-y-4">
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
            </div>
          )}

          {/* 낮은 우선순위 기술 (Low) */}
          {lowTech.length > 0 && (
            <div className="space-y-4">
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
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ✅ Portal 기반 모달 렌더링 (AI 교차검증 기반 개선)
  // 클라이언트 사이드에서만 Portal 렌더링하고, isVisible과 selectedCard로 가시성 제어
  
  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-opacity duration-300 ${
        isVisible && selectedCard ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
      data-modal-version="v4.0-ai-cross-verified"
      aria-hidden={!isVisible || !selectedCard}
    >
      {/* 개선된 배경 블러 효과 */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      {/* 모달 컨텐츠 - Hook 안정화를 위해 항상 렌더링 */}
      <div
        ref={modalRef}
        className={`relative max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-600/50 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 shadow-2xl transform transition-transform duration-300 ${
          !cardData.id ? 'hidden' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
        data-modal-content="portal-unified-v4-ai-cross-verified"
        style={{
          transform: isVisible && cardData.id ? 'scale(1)' : 'scale(0.95)',
        }}
      >
        {/* Hook 안정화: 조건부 렌더링 제거, CSS로 가시성 제어 */}
        <>
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

                <div className="flex items-center gap-2">
                  {/* 바이브 코딩 카드 전용 히스토리 전환 버튼 */}
                  {cardData.id === 'cursor-ai' && (
                    <button
                      onClick={() => setIsHistoryView(!isHistoryView)}
                      className="rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:from-amber-500 hover:to-orange-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      aria-label={isHistoryView ? "현재 도구 보기" : "히스토리 보기"}
                    >
                      {isHistoryView ? '🔄 현재 도구' : '📚 발전 히스토리'}
                    </button>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>
              </header>
              <div
                className="overflow-y-auto scroll-smooth"
                style={{ maxHeight: 'calc(85vh - 80px)' }}
              >
                {renderModalSafely()}
              </div>
            </div>
        </>
      </div>
    </div>,
    document.body
  );
}