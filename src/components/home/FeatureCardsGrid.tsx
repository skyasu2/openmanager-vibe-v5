'use client';

// framer-motion 제거 - CSS 애니메이션 사용
import {
  memo,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { logger } from '@/lib/logging';
import { FEATURE_CARDS_DATA } from '../../data/feature-cards.data';
import { useUnifiedAdminStore } from '../../stores/useUnifiedAdminStore';
import type { FeatureCard } from '../../types/feature-card.types';
import { renderAIGradientWithAnimation } from '../../utils/text-rendering';
import FeatureCardModal from '../shared/FeatureCardModal';

// 개별 카드 컴포넌트를 메모이제이션
const FeatureCardItem = memo(
  ({
    card,
    onCardClick,
    isAIDisabled,
  }: {
    card: FeatureCard;
    onCardClick: (cardId: string) => void;
    isAIDisabled: boolean;
  }) => {
    // 카드 타입별 스타일 헬퍼
    const getCardStyles = useCallback((card: FeatureCard) => {
      return {
        title: 'text-white/95 group-hover:text-white',
        description: 'text-white/80 group-hover:text-white/90 font-medium',
        hoverRing: card.isAICard
          ? 'group-hover:ring-pink-400/50 group-hover:shadow-lg group-hover:shadow-pink-500/25'
          : card.isVibeCard
            ? 'group-hover:ring-yellow-400/50'
            : card.isSpecial
              ? 'group-hover:ring-amber-400/50 group-hover:shadow-lg group-hover:shadow-amber-500/25'
              : 'group-hover:ring-white/30',
        iconColor: 'text-white',
      };
    }, []);

    // 아이콘 CSS 애니메이션 클래스 설정
    const getIconAnimationClass = useCallback((card: FeatureCard) => {
      if (card.isAICard) {
        return 'animate-ai-icon';
      }
      if (card.isVibeCard) {
        return 'animate-vibe-icon';
      }
      return 'animate-icon-hover';
    }, []);

    const cardStyles = useMemo(
      () => getCardStyles(card),
      [card, getCardStyles]
    );
    const iconAnimationClass = useMemo(
      () => getIconAnimationClass(card),
      [card, getIconAnimationClass]
    );

    return (
      <button
        type="button"
        key={card.id}
        aria-label={`${card.title} 상세 정보 보기`}
        className={`w-full text-left group relative cursor-pointer ${
          card.isVibeCard
            ? 'transform-gpu hover:shadow-2xl hover:shadow-yellow-500/30'
            : ''
        }`}
        onClick={() => onCardClick(card.id)}
        onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCardClick(card.id);
          }
        }}
      >
        <div
          className={`relative h-full rounded-2xl border border-white/25 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 ease-out hover:bg-white/20 ${
            card.isSpecial
              ? 'border-amber-500/30 bg-linear-to-br from-amber-500/10 to-orange-500/10'
              : ''
          } group-hover:scale-[1.02] group-hover:transform group-hover:shadow-2xl`}
        >
          {/* 그라데이션 배경 */}
          <div
            className={`absolute inset-0 bg-linear-to-br ${card.gradient} rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
          />

          {/* AI 카드 특별 이색 그라데이션 애니메이션 */}
          {card.isAICard && (
            <div className="absolute inset-0 rounded-2xl opacity-90 bg-ai-card-gradient" />
          )}

          {/* Vibe Coding 카드 특별 디자인 */}
          {card.isVibeCard && (
            <>
              {/* 장식 요소 */}
              <div className="animate-pulse absolute right-2 top-2 h-6 w-6 rounded-full bg-yellow-400/30"></div>
              <div className="animate-pulse absolute bottom-2 left-2 h-4 w-4 rounded-full bg-yellow-400/20"></div>

              {/* 개선된 배경 그라데이션 */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute inset-0 opacity-90 bg-vibe-card-gradient" />
              </div>

              {/* 텍스트 가독성을 위한 오버레이 */}
              <div className="absolute inset-0 rounded-2xl bg-black/15"></div>
            </>
          )}

          {/* 일반 카드들의 아이콘 (바이브 코딩 포함) */}
          <div
            className={`h-12 w-12 ${
              card.isVibeCard
                ? 'bg-linear-to-br from-yellow-400 to-amber-500'
                : `bg-linear-to-br ${card.gradient}`
            } relative z-10 mb-3 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${
              card.isAICard ? 'shadow-lg shadow-pink-500/25' : ''
            }`}
          >
            <card.icon
              className={`h-6 w-6 ${cardStyles.iconColor} ${iconAnimationClass}`}
            />
          </div>

          {/* 모든 카드들의 통일된 컨텐츠 */}
          <div className="relative z-10">
            <h3
              className={`mb-2 text-lg font-semibold leading-snug transition-colors ${cardStyles.title}`}
            >
              {renderAIGradientWithAnimation(card.title)}
            </h3>
            <p
              className={`text-sm leading-relaxed transition-colors ${cardStyles.description}`}
            >
              {renderAIGradientWithAnimation(card.description)}
            </p>

            {/* AI 어시스턴트 필요 표시 */}
            {card.requiresAI && isAIDisabled && (
              <div className="mt-2 rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-1 text-center text-xs text-orange-300">
                AI 어시스턴트 모드 필요
              </div>
            )}
          </div>

          {/* 호버 효과 */}
          <div
            className={`absolute inset-0 rounded-2xl ring-2 ring-transparent transition-all duration-300 ${cardStyles.hoverRing}`}
          />
        </div>
      </button>
    );
  }
);

FeatureCardItem.displayName = 'FeatureCardItem';

export default function FeatureCardsGrid() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const aiAgentEnabled = useUnifiedAdminStore(
    (state) => state.aiAgent.isEnabled
  );

  // 모달 외부 클릭 시 닫기 처리 - React Error #310 무한 루프 해결
  useEffect(() => {
    if (!selectedCard) return; // selectedCard가 없으면 이벤트 추가 안함

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setSelectedCard(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedCard(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [selectedCard]); // selectedCard 의존성 유지하지만 조건부 실행으로 무한 루프 방지

  // ✅ 핵심 수정: aiAgent.isEnabled primitive 값으로 의존성 변경 (React Error #310 근본 해결)
  const handleCardClick = useCallback(
    (cardId: string) => {
      logger.info('🎯 [FeatureCard] 카드 클릭됨:', cardId);
      const card = FEATURE_CARDS_DATA.find((c) => c.id === cardId);
      logger.info('🎯 [FeatureCard] 찾은 카드:', card?.title);

      // 모달을 항상 렌더링하고, AI 제한은 모달 내부에서 처리
      setSelectedCard(cardId);
      logger.info('🎯 [FeatureCard] selectedCard 설정됨:', cardId);

      // AI 필요한 기능에 대한 로그는 유지 (디버깅용)
      if (card?.requiresAI && !aiAgentEnabled) {
        logger.warn(
          '🚧 이 기능은 AI 엔진 모드에서만 사용 가능합니다. 모달에서 AI 활성화 안내가 표시됩니다.'
        );
      }
    },
    [aiAgentEnabled] // primitive 값 의존성으로 React Error #310 완전 해결
  );

  const closeModal = useCallback(() => {
    setSelectedCard(null);
  }, []);

  const selectedCardData = useMemo(
    () => FEATURE_CARDS_DATA.find((card) => card.id === selectedCard) || null,
    [selectedCard]
  );

  return (
    <>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
        {FEATURE_CARDS_DATA.map((card) => (
          <FeatureCardItem
            key={card.id}
            card={card}
            onCardClick={handleCardClick}
            isAIDisabled={!aiAgentEnabled}
          />
        ))}
      </div>

      {/* Feature Card Modal - 조건부 렌더링으로 Hook 순서 일관성 보장 */}
      {selectedCard && (
        <FeatureCardModal
          selectedCard={selectedCardData}
          onClose={closeModal}
          renderTextWithAIGradient={renderAIGradientWithAnimation}
          modalRef={modalRef as RefObject<HTMLDivElement>}
          variant="home"
          isVisible={true}
        />
      )}
    </>
  );
}
