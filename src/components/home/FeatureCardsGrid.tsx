'use client';

import FeatureCardModal from '@/components/shared/FeatureCardModal';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { motion } from 'framer-motion';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { FeatureCard, FeatureCardProps } from '@/types/feature-card.types';
import { FEATURE_CARDS_DATA, CARD_COMPLETION_RATES } from '@/data/feature-cards.data';

// AI 단어에 그라데이션 애니메이션 적용하는 함수 - 컴포넌트 외부로 이동
const renderTextWithAIGradient = (text: string) => {
  if (!text.includes('AI')) return text;

  return text.split(/(AI)/g).map((part, index) => {
    if (part === 'AI') {
      return (
        <motion.span
          key={index}
          className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-[length:200%_200%] bg-clip-text font-bold text-transparent"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {part}
        </motion.span>
      );
    }
    return part;
  });
};

// 개별 카드 컴포넌트를 메모이제이션
const FeatureCardItem = memo(
  ({
    card,
    index,
    onCardClick,
    isAIDisabled,
  }: {
    card: FeatureCard;
    index: number;
    onCardClick: (cardId: string) => void;
    isAIDisabled: boolean;
  }) => {
    // 완성도 가져오기
    const completionRate = CARD_COMPLETION_RATES[card.id] || CARD_COMPLETION_RATES.default;
    
    // 카드 타입별 스타일 헬퍼
    const getCardStyles = (card: FeatureCard) => {
      return {
        title: card.isVibeCard
          ? 'text-white/98 group-hover:text-yellow-100'
          : 'text-white/95 group-hover:text-white',
        description: card.isVibeCard
          ? 'text-white/96 group-hover:text-yellow-50 font-bold'
          : 'text-white/80 group-hover:text-white/90 font-medium',
        hoverRing: card.isAICard
          ? 'group-hover:ring-pink-400/50 group-hover:shadow-lg group-hover:shadow-pink-500/25'
          : card.isVibeCard
            ? 'group-hover:ring-yellow-400/50'
            : card.isSpecial
              ? 'group-hover:ring-amber-400/50 group-hover:shadow-lg group-hover:shadow-amber-500/25'
              : 'group-hover:ring-white/30',
        iconColor: card.isVibeCard ? 'text-amber-900' : 'text-white',
      };
    };

    // 아이콘 애니메이션 설정
    const getIconAnimation = (card: FeatureCard) => {
      if (card.isAICard) {
        return {
          _animate: {
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          },
          transition: {
            rotate: {
              duration: 8,
              repeat: Infinity,
              ease: 'linear' as const,
            },
            scale: {
              duration: 2,
              repeat: Infinity,
            },
          },
        };
      }
      if (card.isVibeCard) {
        return {
          _animate: {
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
          },
          transition: {
            duration: 2.5,
            repeat: Infinity,
          },
        };
      }
      return null;
    };

    const cardStyles = useMemo(() => getCardStyles(card), [card]);
    const iconAnimation = useMemo(() => getIconAnimation(card), [card]);

    return (
      <motion.div
        key={card.id}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{
          scale: card.isVibeCard ? 1.08 : 1.05,
          y: card.isVibeCard ? -8 : -5,
          rotateY: card.isVibeCard ? 5 : 0,
        }}
        className={`group relative cursor-pointer ${
          card.isVibeCard
            ? 'transform-gpu hover:shadow-2xl hover:shadow-yellow-500/30'
            : ''
        }`}
        onClick={() => onCardClick(card.id)}
      >
        <div
          className={`cubic-bezier(0.4, 0, 0.2, 1) relative h-full rounded-2xl border border-white/25 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 ${
            card.isSpecial
              ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10'
              : ''
          } group-hover:scale-[1.02] group-hover:transform group-hover:shadow-2xl`}
        >
          {/* 그라데이션 배경 */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${card.gradient} rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
          />

          {/* AI 카드 특별 이색 그라데이션 애니메이션 - landing 버전에서 재활용 */}
          {card.isAICard && (
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/30 via-pink-500/30 to-cyan-400/30"
              animate={{
                background: [
                  'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(236,72,153,0.3) 50%, rgba(34,197,94,0.3) 100%)',
                  'linear-gradient(135deg, rgba(236,72,153,0.3) 0%, rgba(34,197,94,0.3) 50%, rgba(59,130,246,0.3) 100%)',
                  'linear-gradient(135deg, rgba(34,197,94,0.3) 0%, rgba(59,130,246,0.3) 50%, rgba(236,72,153,0.3) 100%)',
                  'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(236,72,153,0.3) 50%, rgba(34,197,94,0.3) 100%)',
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Vibe Coding 카드 특별 디자인 */}
          {card.isVibeCard && (
            <>
              {/* 장식 요소 */}
              <div className="_animate-pulse absolute right-2 top-2 h-6 w-6 rounded-full bg-yellow-400/30"></div>
              <div className="_animate-pulse absolute bottom-2 left-2 h-4 w-4 rounded-full bg-yellow-400/20"></div>

              {/* 개선된 배경 그라데이션 - 애니메이션 효과 */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="_animate-gradient absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 bg-[length:200%_200%] opacity-90" />
              </div>

              {/* 텍스트 가독성을 위한 오버레이 */}
              <div className="absolute inset-0 rounded-2xl bg-black/15"></div>
            </>
          )}

          {/* 일반 카드들의 아이콘 (바이브 코딩 포함) */}
          <div
            className={`h-12 w-12 ${
              card.isVibeCard
                ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                : `bg-gradient-to-br ${card.gradient}`
            } relative z-10 mb-3 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${
              card.isAICard ? 'shadow-lg shadow-pink-500/25' : ''
            }`}
          >
            {iconAnimation ? (
              <motion.div {...iconAnimation}>
                <card.icon className={`h-6 w-6 ${cardStyles.iconColor}`} />
              </motion.div>
            ) : (
              <card.icon className="h-6 w-6 text-white" />
            )}
          </div>

          {/* 모든 카드들의 통일된 컨텐츠 */}
          <div className="relative z-10">
            <h3
              className={`mb-2 text-lg font-semibold leading-snug transition-colors ${cardStyles.title}`}
            >
              {renderTextWithAIGradient(card.title)}
            </h3>
            <p
              className={`text-xs leading-relaxed transition-colors ${cardStyles.description}`}
            >
              {renderTextWithAIGradient(card.description)}
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
      </motion.div>
    );
  }
);

FeatureCardItem.displayName = 'FeatureCardItem';

export default function FeatureCardsGrid() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const { aiAgent } = useUnifiedAdminStore();

  // 모달 외부 클릭 시 닫기 처리
  useEffect(() => {
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

  // handleCardClick을 useCallback으로 메모이제이션
  const handleCardClick = useMemo(
    () => (cardId: string) => {
      const card = FEATURE_CARDS_DATA.find((c) => c.id === cardId);

      if (card?.requiresAI && !aiAgent.isEnabled) {
        // AI 엔진이 필요한 기능에 일반 사용자가 접근할 때
        console.warn(
          '🚧 이 기능은 AI 엔진 모드에서만 사용 가능합니다. 홈 화면에서 AI 모드를 활성화해주세요.'
        );
        return;
      }

      setSelectedCard(cardId);
    },
    [aiAgent.isEnabled]
  );

  const closeModal = () => {
    setSelectedCard(null);
  };

  const selectedCardData = FEATURE_CARDS_DATA.find((card) => card.id === selectedCard) || null;

  return (
    <>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
        {FEATURE_CARDS_DATA.map((card, index) => (
          <FeatureCardItem
            key={card.id}
            card={card}
            index={index}
            onCardClick={handleCardClick}
            isAIDisabled={!aiAgent.isEnabled}
          />
        ))}
      </div>

      {/* Feature Card Modal */}
      <FeatureCardModal
        selectedCard={selectedCardData}
        onClose={closeModal}
        renderTextWithAIGradient={renderTextWithAIGradient}
        modalRef={modalRef as React.RefObject<HTMLDivElement>}
        variant="home"
      />
    </>
  );
}
