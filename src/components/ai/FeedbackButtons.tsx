'use client';

import { useState } from 'react';
import type { UserFeedback } from '@/types/ai-learning';
import { InteractionLogger } from '@/services/ai-agent/logging/InteractionLogger';

interface FeedbackButtonsProps {
  responseId: string;
  onFeedback?: (feedback: UserFeedback) => void;
  className?: string;
}

export default function FeedbackButtons({
  responseId,
  onFeedback,
  className = '',
}: FeedbackButtonsProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<
    'helpful' | 'not_helpful' | 'incorrect' | null
  >(null);
  const [showDetailForm, setShowDetailForm] = useState(false);
  const [detailedReason, setDetailedReason] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedbackClick = async (
    feedback: 'helpful' | 'not_helpful' | 'incorrect'
  ) => {
    setSelectedFeedback(feedback);

    if (feedback === 'helpful') {
      // 긍정적 피드백은 바로 제출
      void submitFeedback(feedback);
    } else {
      // 부정적 피드백은 상세 정보 요청
      setShowDetailForm(true);
    }
  };

  const submitFeedback = async (
    feedback: 'helpful' | 'not_helpful' | 'incorrect',
    skipDetails = false
  ) => {
    setIsSubmitting(true);

    try {
      const feedbackData: UserFeedback = {
        interactionId: responseId,
        feedback,
        detailedReason: skipDetails ? undefined : detailedReason,
        additionalComments: skipDetails ? undefined : additionalComments,
        timestamp: new Date(),
      };

      const logger = InteractionLogger.getInstance();
      logger.logFeedback(feedbackData);

      if (onFeedback) {
        // onFeedback이 Promise를 반환할 수도 있고 아닐 수도 있음
        const result = onFeedback(feedbackData);
        if (result instanceof Promise) {
          await result;
        }
      }

      setShowDetailForm(false);

      // 성공 메시지 표시
      console.log('✅ 피드백이 성공적으로 제출되었습니다.');
    } catch (error) {
      console.error('❌ 피드백 제출 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetailSubmit = () => {
    if (selectedFeedback && selectedFeedback !== 'helpful') {
      void submitFeedback(selectedFeedback);
    }
  };

  const handleSkipDetails = () => {
    if (selectedFeedback && selectedFeedback !== 'helpful') {
      void submitFeedback(selectedFeedback, true);
    }
  };

  if (selectedFeedback && !showDetailForm) {
    return (
      <div
        className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}
      >
        <span className="text-green-600">✓</span>
        <span>피드백이 제출되었습니다. 감사합니다!</span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 기본 피드백 버튼들 */}
      {!showDetailForm && (
        <div className="flex items-center gap-2">
          <span className="mr-2 text-sm text-gray-600">
            이 답변이 도움이 되었나요?
          </span>

          <button
            onClick={() => {
              void handleFeedbackClick('helpful');
            }}
            disabled={isSubmitting}
            className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm text-green-700 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>👍</span>
            <span>도움됨</span>
          </button>

          <button
            onClick={() => {
              void handleFeedbackClick('not_helpful');
            }}
            disabled={isSubmitting}
            className="flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm text-orange-700 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>👎</span>
            <span>도움안됨</span>
          </button>

          <button
            onClick={() => {
              void handleFeedbackClick('incorrect');
            }}
            disabled={isSubmitting}
            className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>❌</span>
            <span>틀림</span>
          </button>
        </div>
      )}

      {/* 상세 피드백 폼 */}
      {showDetailForm && (
        <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span>📝</span>
            <span>더 나은 서비스를 위해 상세한 피드백을 부탁드립니다</span>
          </div>

          <div>
            <label
              htmlFor="detailed-reason-select"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              왜 도움이 되지 않았나요?
            </label>
            <select
              id="detailed-reason-select"
              value={detailedReason}
              onChange={(e) => setDetailedReason(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">선택해주세요</option>
              <option value="incorrect_information">정보가 틀렸습니다</option>
              <option value="incomplete_answer">답변이 불완전합니다</option>
              <option value="not_relevant">질문과 관련이 없습니다</option>
              <option value="too_technical">너무 기술적입니다</option>
              <option value="too_simple">너무 간단합니다</option>
              <option value="unclear_explanation">설명이 불분명합니다</option>
              <option value="missing_context">컨텍스트가 부족합니다</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="additional-comments-textarea"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              추가 의견 (선택사항)
            </label>
            <textarea
              id="additional-comments-textarea"
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              placeholder="어떤 점을 개선하면 좋을지 알려주세요..."
              rows={3}
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleDetailSubmit}
              disabled={isSubmitting || !detailedReason}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? '제출 중...' : '피드백 제출'}
            </button>

            <button
              onClick={handleSkipDetails}
              disabled={isSubmitting}
              className="rounded-md bg-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              건너뛰기
            </button>

            <button
              onClick={() => {
                setShowDetailForm(false);
                setSelectedFeedback(null);
                setDetailedReason('');
                setAdditionalComments('');
              }}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-gray-500 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
