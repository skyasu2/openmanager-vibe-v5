/**
 * 🎯 AI 엔진 패널
 *
 * AI 엔진 상태 관리 및 설정
 */

// framer-motion 제거 - CSS 애니메이션 사용
import { Brain, Power, RefreshCw, Settings } from 'lucide-react';
import type { AIEngineDetail } from '../../hooks/useAIEngineStatus';
import { STATUS_COLORS } from '../../UnifiedAdminDashboard.types';

interface AIEnginePanelProps {
  engines: AIEngineDetail[];
  selectedEngine: string | null;
  onSelectEngine: (engineId: string | null) => void;
  onToggleEngine: (engineId: string) => void;
  onUpdateConfig: (
    engineId: string,
    config: Partial<AIEngineDetail['config']>
  ) => void;
  onRestartEngine: (engineId: string) => void;
}

export default function AIEnginePanel({
  engines,
  selectedEngine,
  onSelectEngine,
  onToggleEngine,
  onUpdateConfig,
  onRestartEngine,
}: AIEnginePanelProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* 엔진 리스트 */}
      <div className="lg:col-span-1">
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold">AI 엔진 목록</h3>
          <div className="space-y-3">
            {engines.map((engine) => (
              <div
                key={engine.id}
                className={`cursor-pointer rounded-lg p-4 transition-all ${
                  selectedEngine === engine.id
                    ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600'
                }`}
                onClick={() => onSelectEngine(engine.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain
                      className="h-5 w-5"
                      style={{
                        color:
                          engine.status === 'active'
                            ? STATUS_COLORS.active
                            : STATUS_COLORS.inactive,
                      }}
                    />
                    <div>
                      <p className="font-medium">{engine.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {engine.type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleEngine(engine.id);
                    }}
                    className={`rounded-lg p-2 transition-colors ${
                      engine.config.enabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 엔진 상세 정보 */}
      <div className="lg:col-span-2">
        {selectedEngine ? (() => {
          const engine = engines.find((e) => e.id === selectedEngine);
          return engine ? (
            <EngineDetails
              engine={engine}
              onUpdateConfig={(config) => onUpdateConfig(selectedEngine, config)}
              onRestart={() => onRestartEngine(selectedEngine)}
            />
          ) : (
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="text-center text-gray-500 dark:text-gray-400">
                선택된 엔진 정보를 찾을 수 없습니다
              </div>
            </div>
          );
        })() : (
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <div className="text-center text-gray-500 dark:text-gray-400">
              엔진을 선택하여 상세 정보를 확인하세요
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 엔진 상세 정보 컴포넌트
// ============================================================================

interface EngineDetailsProps {
  engine: AIEngineDetail;
  onUpdateConfig: (config: Partial<AIEngineDetail['config']>) => void;
  onRestart: () => void;
}

function EngineDetails({
  engine,
  onUpdateConfig: _onUpdateConfig,
  onRestart,
}: EngineDetailsProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{engine.name} 상세 정보</h3>
        <div className="flex gap-2">
          <button
            onClick={onRestart}
            className="flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700 transition-colors hover:bg-blue-200"
          >
            <RefreshCw className="h-4 w-4" />
            재시작
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-200">
            <Settings className="h-4 w-4" />
            설정
          </button>
        </div>
      </div>

      {/* 메트릭 */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">총 요청</p>
          <p className="text-xl font-semibold">
            {engine.metrics.totalRequests}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">성공률</p>
          <p className="text-xl font-semibold">{engine.metrics.successRate}%</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">응답 시간</p>
          <p className="text-xl font-semibold">
            {engine.metrics.avgResponseTime}ms
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">에러</p>
          <p className="text-xl font-semibold">{engine.metrics.errorCount}</p>
        </div>
      </div>

      {/* 헬스 상태 */}
      <div className="space-y-3">
        <h4 className="font-medium">시스템 상태</h4>
        <div className="space-y-2">
          <HealthBar label="CPU" value={engine.health.cpu} />
          <HealthBar label="메모리" value={engine.health.memory} />
          <HealthBar
            label="지연시간"
            value={engine.health.latency}
            max={1000}
            unit="ms"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 헬스 바 컴포넌트
// ============================================================================

interface HealthBarProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
}

function HealthBar({ label, value, max = 100, unit = '%' }: HealthBarProps) {
  const percentage = (value / max) * 100;
  const color =
    percentage < 50
      ? 'bg-green-500'
      : percentage < 80
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium">
          {value}
          {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
