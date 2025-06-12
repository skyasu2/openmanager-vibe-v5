/**
 * 🎨 CSS 기반 타이핑 효과 컴포넌트
 *
 * - 순수 CSS 애니메이션으로 안전한 타이핑 효과
 * - 답변 지워짐 방지
 * - 서버사이드 렌더링 호환
 * - 성능 최적화
 */

'use client';

import { useState, useEffect } from 'react';

interface CSSTypingEffectProps {
  text: string;
  className?: string;
  speed?: number; // 타이핑 속도 (ms)
  showCursor?: boolean;
  onComplete?: () => void;
}

const CSSTypingEffect: React.FC<CSSTypingEffectProps> = ({
  text,
  className = '',
  speed = 50,
  showCursor = true,
  onComplete,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setMounted(true);

    // 타이핑 완료 타이머
    const duration = text.length * speed;
    const timer = setTimeout(() => {
      setIsTyping(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [text, speed, onComplete]);

  // SSR 호환성을 위한 fallback
  if (!mounted) {
    return <div className={className}>{text}</div>;
  }

  const typingDuration = (text.length * speed) / 1000; // 초 단위

  return (
    <div className={`typing-container ${className}`}>
      <span
        className='typing-text'
        style={
          {
            '--typing-duration': `${typingDuration}s`,
            '--text-length': text.length,
          } as React.CSSProperties
        }
      >
        {text}
      </span>

      {showCursor && (
        <span
          className={`typing-cursor ${!isTyping ? 'typing-complete' : ''}`}
        />
      )}

      <style jsx>{`
        .typing-container {
          position: relative;
          display: inline-block;
          overflow: hidden;
        }

        .typing-text {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          border-right: 2px solid transparent;
          animation: typing var(--typing-duration)
            steps(var(--text-length), end);
          max-width: 0;
          animation-fill-mode: forwards;
        }

        .typing-cursor {
          display: inline-block;
          width: 2px;
          height: 1.2em;
          background-color: currentColor;
          margin-left: 2px;
          animation: blink 1s infinite;
          vertical-align: text-bottom;
        }

        .typing-cursor.typing-complete {
          animation: blink 1s infinite;
        }

        @keyframes typing {
          from {
            max-width: 0;
          }
          to {
            max-width: 100%;
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
          .typing-cursor {
            background-color: #10b981;
          }
        }

        /* 접근성: 애니메이션 비활성화 설정 시 */
        @media (prefers-reduced-motion: reduce) {
          .typing-text {
            animation: none;
            max-width: 100%;
          }

          .typing-cursor {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default CSSTypingEffect;
