/**
 * 🎨 안전한 CSS 기반 타이핑 효과 컴포넌트
 *
 * - 순수 CSS 애니메이션으로 최대한 안전
 * - JavaScript 의존성 최소화
 * - 서버사이드 렌더링 완전 호환
 * - 성능 최적화
 */

'use client';

import React, { useEffect, useState } from 'react';

interface SafeCSSTypingEffectProps {
  text: string;
  className?: string;
  speed?: number; // 타이핑 속도 (초 단위)
  showCursor?: boolean;
  onComplete?: () => void;
}

const SafeCSSTypingEffect: React.FC<SafeCSSTypingEffectProps> = ({
  text,
  className = '',
  speed = 3,
  showCursor = true,
  onComplete,
}) => {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // 타이핑 완료 콜백
    const timer = setTimeout(() => {
      setIsComplete(true);
      onComplete?.();
    }, speed * 1000);

    return () => clearTimeout(timer);
  }, [speed, onComplete]);

  return (
    <div className={`safe-typing-container ${className}`}>
      <span
        className='safe-typing-text'
        style={
          {
            '--typing-speed': `${speed}s`,
            '--text-length': text.length,
          } as React.CSSProperties
        }
      >
        {text}
      </span>

      {showCursor && (
        <span
          className={`safe-typing-cursor ${isComplete ? 'complete' : ''}`}
        />
      )}

      <style jsx>{`
        .safe-typing-container {
          display: inline-block;
          position: relative;
        }

        .safe-typing-text {
          overflow: hidden;
          border-right: 2px solid;
          white-space: nowrap;
          animation: typing var(--typing-speed) steps(var(--text-length), end);
          width: 0;
          animation-fill-mode: forwards;
          display: inline-block;
        }

        .safe-typing-cursor {
          display: inline-block;
          width: 2px;
          height: 1.2em;
          background-color: currentColor;
          margin-left: 2px;
          animation: blink 1s infinite;
          vertical-align: text-bottom;
        }

        .safe-typing-cursor.complete {
          animation: blink 1s infinite;
        }

        @keyframes typing {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }

        /* 다크모드 지원 */
        @media (prefers-color-scheme: dark) {
          .safe-typing-cursor {
            background-color: #10b981;
          }
        }

        /* 접근성: 애니메이션 비활성화 설정 시 */
        @media (prefers-reduced-motion: reduce) {
          .safe-typing-text {
            animation: none;
            width: 100%;
          }

          .safe-typing-cursor {
            animation: none;
            opacity: 1;
          }
        }

        /* 반응형 지원 */
        @media (max-width: 768px) {
          .safe-typing-text {
            font-size: 0.9em;
          }
        }
      `}</style>
    </div>
  );
};

export default SafeCSSTypingEffect;
