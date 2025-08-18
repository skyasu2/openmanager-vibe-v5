/**
 * 📊 데이터 생성기 설정 탭 컴포넌트
 *
 * 서버 데이터 생성기 관련 설정을 관리하는 탭
 */

'use client';

import { motion } from 'framer-motion';
import { Database } from 'lucide-react';

interface GeneratorConfig {
  serverCount: number;
  architecture: string;
}

interface GeneratorSettingsTabProps {
  generatorConfig: GeneratorConfig | null;
  isGeneratorLoading: boolean;
  onGeneratorCheck: () => Promise<void>;
  onServerCountChange: (count: number) => Promise<void>;
  onArchitectureChange: (arch: string) => Promise<void>;
}

export function GeneratorSettingsTab({
  generatorConfig,
  isGeneratorLoading,
  onGeneratorCheck,
  onServerCountChange,
  onArchitectureChange,
}: GeneratorSettingsTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/10 p-4">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Database className="h-5 w-5 text-blue-400" />
          데이터 생성기 상태
        </h3>

        {/* 실시간 상태 표시 */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-gray-800/50 p-3 text-center">
              <div className="mx-auto mb-2 h-3 w-3 rounded-full bg-green-400" />
              <p className="mb-1 text-xs text-gray-400">서버 개수</p>
              <p className="text-lg font-medium text-white">
                {generatorConfig?.serverCount || 6}개
              </p>
            </div>
            <div className="rounded-lg bg-gray-800/50 p-3 text-center">
              <div className="mx-auto mb-2 h-3 w-3 rounded-full bg-blue-400" />
              <p className="mb-1 text-xs text-gray-400">아키텍처</p>
              <p className="text-sm font-medium text-white">
                {generatorConfig?.architecture || 'Microservices'}
              </p>
            </div>
            <div className="rounded-lg bg-gray-800/50 p-3 text-center">
              <div className="mx-auto mb-2 h-3 w-3 rounded-full bg-purple-400" />
              <p className="mb-1 text-xs text-gray-400">생성 모드</p>
              <p className="text-sm font-medium text-white">실시간</p>
            </div>
          </div>

          {/* 빠른 액션 버튼들 */}
          <div className="grid grid-cols-1 gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onServerCountChange(8)}
              className="rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-3 text-sm font-medium text-green-300 transition-colors hover:bg-green-500/30"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold">💻 기본 모드 (8서버)</span>
                <span className="text-xs text-green-200">
                  Vercel Free 환경 - 8개 서버로 가벼운 테스트 및 개발
                </span>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onServerCountChange(20)}
              className="rounded-lg border border-blue-500/30 bg-blue-500/20 px-3 py-3 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/30"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold">🚀 프로 모드 (20서버)</span>
                <span className="text-xs text-blue-200">
                  Vercel Pro 환경 - 20개 서버로 실전 운영 환경 시뮬레이션
                </span>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onServerCountChange(30)}
              className="rounded-lg border border-purple-500/30 bg-purple-500/20 px-3 py-3 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-500/30"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold">⚡ 로컬 모드 (30서버)</span>
                <span className="text-xs text-purple-200">
                  로컬 개발 환경 - 30개 서버로 최대 성능 테스트
                </span>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGeneratorCheck}
              className="rounded-lg border border-purple-500/30 bg-purple-500/20 px-3 py-3 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-500/30"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold">📊 상태 확인</span>
                <span className="text-xs text-purple-200">
                  데이터 생성기의 현재 상태와 성능 지표를 확인합니다
                </span>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
