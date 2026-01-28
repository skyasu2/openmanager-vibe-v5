import type { FC } from 'react';
/**
 * ⚙️ Enhanced Server Modal Services Tab (v2.0 간소화)
 *
 * 서버 서비스 목록 탭:
 * - 실제 서비스 데이터 표시 (name, status, port)
 * - 서비스 상태별 색상 구분
 * - 포트 정보 표시
 *
 * ✅ v2.0 변경사항:
 * - "프로세스" → "서비스"로 명칭 변경
 * - 가짜 PID/CPU/Memory 추정값 제거
 * - 실제 서비스 데이터만 표시
 *
 * @refactored 2026-01-03 - 추정값 제거 및 서비스 목록으로 변경
 */
import type { ServerService, ServiceStatus } from './EnhancedServerModal.types';

/**
 * Processes (Services) Tab Props
 */
interface ProcessesTabProps {
  /** 서버 서비스 목록 (실제 데이터) */
  services: ServerService[];
}

/**
 * 🎨 서비스 상태별 스타일 정보
 */
const getServiceStatusStyle = (status: ServiceStatus) => {
  switch (status) {
    case 'running':
      return {
        dot: 'bg-green-500',
        badge: 'bg-green-100 text-green-700',
        label: '실행 중',
      };
    case 'stopped':
      return {
        dot: 'bg-gray-400',
        badge: 'bg-gray-100 text-gray-600',
        label: '중지됨',
      };
    case 'warning':
      return {
        dot: 'bg-yellow-500',
        badge: 'bg-yellow-100 text-yellow-700',
        label: '경고',
      };
    case 'failed':
    case 'error':
      return {
        dot: 'bg-red-500',
        badge: 'bg-red-100 text-red-700',
        label: '오류',
      };
    case 'starting':
      return {
        dot: 'bg-blue-500 animate-pulse',
        badge: 'bg-blue-100 text-blue-700',
        label: '시작 중',
      };
    case 'stopping':
      return {
        dot: 'bg-orange-500 animate-pulse',
        badge: 'bg-orange-100 text-orange-700',
        label: '중지 중',
      };
    default:
      return {
        dot: 'bg-gray-400',
        badge: 'bg-gray-100 text-gray-500',
        label: '알수없음',
      };
  }
};

/**
 * ⚙️ Services Tab Component (v2.0)
 *
 * 서버에서 실행 중인 서비스들을 표시하는 탭
 * - 서비스명, 상태, 포트 표시
 * - 상태 기반 색상 구분
 */
export const ProcessesTab: FC<ProcessesTabProps> = ({ services }) => {
  // 서비스 통계
  const runningCount = services.filter((s) => s.status === 'running').length;
  const warningCount = services.filter(
    (s) =>
      s.status === 'warning' || s.status === 'error' || s.status === 'failed'
  ).length;

  return (
    <div className="space-y-6">
      <div>
        {/* 헤더 섹션 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="bg-linear-to-r from-gray-700 to-gray-900 bg-clip-text text-2xl font-bold text-transparent">
              ⚙️ 서비스 목록
            </h3>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              실제 데이터
            </span>
          </div>

          {/* 서비스 개수 표시 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm text-gray-600">
                실행: {runningCount}
              </span>
            </div>
            {warningCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">
                  문제: {warningCount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 서비스 카드 그리드 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.length > 0 ? (
            services.map((service, idx) => {
              const statusStyle = getServiceStatusStyle(service.status);

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* 서비스명 및 상태 */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${statusStyle.dot}`}
                      />
                      <span className="font-semibold text-gray-800">
                        {service.name}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.badge}`}
                    >
                      {statusStyle.label}
                    </span>
                  </div>

                  {/* 포트 정보 */}
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <span className="text-sm text-gray-600">포트</span>
                    <span className="font-mono text-sm font-semibold text-gray-800">
                      :{service.port}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            /* 서비스 없음 상태 */
            <div className="col-span-full py-12 text-center">
              <div className="mb-4 text-6xl">⚙️</div>
              <div className="mb-2 text-lg font-medium text-gray-500">
                등록된 서비스가 없습니다
              </div>
              <div className="text-sm text-gray-400">
                서버에 서비스가 구성되지 않았습니다
              </div>
            </div>
          )}
        </div>

        {/* 서비스 요약 통계 */}
        {services.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* 총 서비스 수 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    총 서비스
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {services.length}
                  </div>
                </div>
                <div className="rounded-lg bg-blue-100 p-2">
                  <span className="text-2xl">⚙️</span>
                </div>
              </div>
            </div>

            {/* 실행 중인 서비스 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    실행 중
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {runningCount}
                  </div>
                </div>
                <div className="rounded-lg bg-green-100 p-2">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>

            {/* 문제 있는 서비스 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    문제 발생
                  </div>
                  <div
                    className={`text-2xl font-bold ${warningCount > 0 ? 'text-red-600' : 'text-gray-400'}`}
                  >
                    {warningCount}
                  </div>
                </div>
                <div className="rounded-lg bg-red-100 p-2">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
