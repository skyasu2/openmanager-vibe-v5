'use client';

/**
 * 🚀 반응형 서버 리스트 (15개 전체 보기 전용)
 * CSS Grid 기반 반응형 레이아웃 + 더보기 버튼
 * 브라우저 크기에 맞게 자동 배치, 첫 줄만 표시하고 나머지는 펼치기
 */

import debounce from 'lodash-es/debounce';
import { useEffect, useState } from 'react';
import ImprovedServerCard from '@/components/dashboard/ImprovedServerCard';
import { ServerCardErrorBoundary } from '@/components/development/ComponentErrorBoundary';
import type { Server } from '@/types/server';

interface VirtualizedServerListProps {
  servers: Server[];
  handleServerSelect: (server: Server) => void;
}

export default function VirtualizedServerList({
  servers,
  handleServerSelect,
}: VirtualizedServerListProps) {
  const [expanded, setExpanded] = useState(false);
  const [cardsPerRow, setCardsPerRow] = useState(4);

  useEffect(() => {
    const calculateCardsPerRow = () => {
      const containerWidth = window.innerWidth - 64; // 좌우 패딩 제외
      const cardWidth = 380; // 카드 최소 너비
      const gap = 16; // 카드 간격
      const cards = Math.floor((containerWidth + gap) / (cardWidth + gap));
      setCardsPerRow(Math.max(1, cards)); // 최소 1개
    };

    // 초기 계산
    calculateCardsPerRow();

    // 150ms debounce로 성능 최적화 (Gemini 교차검증 지적 반영)
    const debouncedCalculate = debounce(calculateCardsPerRow, 150);
    window.addEventListener('resize', debouncedCalculate);

    return () => {
      window.removeEventListener('resize', debouncedCalculate);
      debouncedCalculate.cancel(); // 메모리 누수 방지
    };
  }, []);

  // 첫 줄만 표시할 서버 개수
  const visibleCount = expanded ? servers.length : cardsPerRow;
  const remainingCount = servers.length - cardsPerRow;

  const renderServer = (server: Server, index: number) => {
    const serverId = server.id || `server-${index}`;

    return (
      <ServerCardErrorBoundary key={`boundary-${serverId}`} serverId={serverId}>
        <ImprovedServerCard
          key={serverId}
          server={server}
          variant="compact"
          showRealTimeUpdates={true}
          index={index}
          onClick={handleServerSelect}
        />
      </ServerCardErrorBoundary>
    );
  };

  return (
    <div className="w-full">
      {/* 정보 배너 */}
      <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
        <div className="flex items-center gap-2">
          <div className="text-purple-600">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-purple-900">
              📊 반응형 그리드 ({servers.length}개 서버)
            </p>
            <p className="text-xs text-purple-700">
              브라우저 크기에 맞게 자동 배치 • 현재 {cardsPerRow}개/줄
            </p>
          </div>
        </div>
      </div>

      {/* 반응형 그리드 */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(380px, 1fr))`,
        }}
      >
        {servers
          .slice(0, visibleCount)
          .map((server, index) => renderServer(server, index))}
      </div>

      {/* 더보기 버튼 */}
      {remainingCount > 0 && !expanded && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setExpanded(true)}
            className="rounded-lg border-2 border-purple-300 bg-white px-6 py-3 font-medium text-purple-700 transition-all hover:bg-purple-50 hover:border-purple-400"
          >
            <span className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              더보기 ({remainingCount}개 더 보기)
            </span>
          </button>
        </div>
      )}

      {/* 접기 버튼 */}
      {expanded && remainingCount > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setExpanded(false)}
            className="rounded-lg border-2 border-purple-300 bg-white px-6 py-3 font-medium text-purple-700 transition-all hover:bg-purple-50 hover:border-purple-400"
          >
            <span className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
              접기
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
