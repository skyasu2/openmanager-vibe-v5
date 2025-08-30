'use client';

import React, { useEffect } from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
import { X } from 'lucide-react';
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

export default function FeatureCardModal({
  selectedCard,
  onClose,
  renderTextWithAIGradient,
  modalRef,
  variant = 'home',
}: FeatureCardModalProps) {
  // 모달은 항상 다크 테마로 고정
  // 바이브 코딩 카드 전용 히스토리 뷰 상태
  const [isHistoryView, setIsHistoryView] = React.useState(false);

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
  }, [onClose]); // onClose 함수 의존성 복구

  if (!selectedCard) return null;

  const { title, icon: Icon, gradient, detailedContent } = selectedCard;

  // 중요도별 스타일 가져오기
  const getImportanceStyle = (importance: ImportanceLevel): ImportanceStyle => {
    return IMPORTANCE_STYLES[importance];
  };

  // 카테고리별 스타일 가져오기
  const getCategoryStyle = (category: TechCategory): CategoryStyle => {
    return CATEGORY_STYLES[category];
  };

  // 기술 카드 컴포넌트 (과거 구현 참조)
  const TechCard = ({ tech, index }: { tech: TechItem; index: number }) => {
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
          {tech.tags.map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="rounded bg-gray-700/50 px-2 py-1 text-xs text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // 바이브 코딩 카드는 현재/3단계 히스토리 구분, 다른 카드는 기존 방식
  const techCards = React.useMemo(() => {
    const data = TECH_STACKS_DATA[selectedCard.id];
    if (!data) return [];
    
    // 바이브 코딩 카드인 경우 현재/히스토리 구분
    if (selectedCard.id === 'cursor-ai' && 'current' in data) {
      const vibeData = data as VibeCodeData;
      if (isHistoryView) {
        // 히스토리 뷰: 3단계 모두 합쳐서 반환 (단계별 구분은 렌더링에서 처리)
        return [
          ...vibeData.history.stage1,
          ...vibeData.history.stage2, 
          ...vibeData.history.stage3
        ];
      }
      return vibeData.current;
    }
    
    // 다른 카드들은 기존 방식
    return Array.isArray(data) ? data : [];
  }, [selectedCard.id, isHistoryView]);

  // 바이브 코딩 히스토리 3단계 데이터 (히스토리 뷰에서만 사용)
  const vibeHistoryStages = React.useMemo(() => {
    if (selectedCard.id !== 'cursor-ai' || !isHistoryView) return null;
    
    const data = TECH_STACKS_DATA[selectedCard.id];
    if (!data || !('current' in data)) return null;
    
    const vibeData = data as VibeCodeData;
    return vibeData.history;
  }, [selectedCard.id, isHistoryView]);

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
          {selectedCard.id === 'cursor-ai' && (
            <span className="ml-2 text-lg font-medium text-amber-400">
              {isHistoryView ? '• 발전 히스토리' : '• 현재 도구'}
            </span>
          )}
        </h3>
        <p className="mx-auto max-w-2xl text-sm text-gray-300">
          {selectedCard.id === 'cursor-ai' && isHistoryView 
            ? '바이브 코딩의 3단계 발전 과정을 시간 순서대로 보여줍니다. 초기(ChatGPT 개별 페이지) → 중기(Cursor + Vercel + Supabase) → 후기(Claude Code + WSL + 멀티 AI CLI)로 진화한 개발 도구들의 역사를 확인할 수 있습니다.'
            : detailedContent.overview
          }
        </p>
      </div>

      {/* 바이브 코딩 히스토리 3단계 섹션 또는 중요도별 기술 스택 섹션 */}
      {selectedCard.id === 'cursor-ai' && isHistoryView && vibeHistoryStages ? (
        <div className="space-y-10">
          {/* 1단계: 초기 */}
          <div className="space-y-4">
            <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xl font-bold text-emerald-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">1</div>
                초기 단계 (2025.05~06)
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-300">
                  {vibeHistoryStages.stage1.length}개 도구
                </span>
              </h4>
              <p className="text-sm text-emerald-200/80">
                ChatGPT로 개별 페이지 생성 → GitHub 수동 업로드 → Netlify 배포 → 데모용 목업 수준
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {vibeHistoryStages.stage1.map((tech, index) => (
                <TechCard key={tech.name} tech={tech} index={index} />
              ))}
            </div>
          </div>

          {/* 2단계: 중기 */}
          <div className="space-y-4">
            <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xl font-bold text-amber-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-300">2</div>
                중기 단계 (2025.06~07)
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm text-amber-300">
                  {vibeHistoryStages.stage2.length}개 도구
                </span>
              </h4>
              <p className="text-sm text-amber-200/80">
                Cursor 도입 → GitHub 연동 → Vercel 배포 → Supabase CRUD 웹앱 완성
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {vibeHistoryStages.stage2.map((tech, index) => (
                <TechCard key={tech.name} tech={tech} index={index} />
              ))}
            </div>
          </div>

          {/* 3단계: 후기 */}
          <div className="space-y-4">
            <div className="mb-6 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xl font-bold text-purple-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-300">3</div>
                후기 단계 (2025.07~현재)
                <span className="rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-300">
                  {vibeHistoryStages.stage3.length}개 도구
                </span>
              </h4>
              <p className="text-sm text-purple-200/80">
                Claude Code 전환 → WSL 최적화 → 멀티 AI CLI 협업 → GCP Functions 활용
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {vibeHistoryStages.stage3.map((tech, index) => (
                <TechCard key={tech.name} tech={tech} index={index} />
              ))}
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

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
        data-modal-version="v2.0-unified-scroll"
      >
        {/* 개선된 배경 블러 효과 */}
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

        {/* 개선된 모달 컨텐츠 */}
        <div
          ref={modalRef}
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

              <div className="flex items-center gap-2">
                {/* 바이브 코딩 카드 전용 히스토리 전환 버튼 */}
                {selectedCard.id === 'cursor-ai' && (
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
              {mainContent}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
