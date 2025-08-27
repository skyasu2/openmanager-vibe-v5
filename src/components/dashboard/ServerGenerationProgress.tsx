import { type FC } from 'react';
/**
 * 🚀 Server Generation Progress Component
 *
 * 순차 서버 생성 진행률 및 상태 표시
 * - 현실적인 서버 배포 과정 시뮬레이션
 * - 부드러운 애니메이션과 진행률 표시
 * - 사용자 몰입도 향상을 위한 UX
 */

// framer-motion 제거 - CSS 애니메이션 사용
import {
  BarChart3,
  Box,
  Cloud,
  Code,
  Cpu,
  Database,
  FileText,
  GitBranch,
  Layers,
  Mail,
  Network,
  Search,
  Server as ServerIcon,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';
// React import C81cAc70 - Next.js 15 C790B3d9 JSX Transform C0acC6a9
import type { Server } from '@/types/server';

interface ServerGenerationProgressProps {
  currentCount: number;
  totalServers: number;
  progress: number;
  isGenerating: boolean;
  isComplete: boolean;
  nextServerType: string | null;
  currentMessage: string;
  error: string | null;
  lastGeneratedServer: Partial<Server> | null;
}

const ServerGenerationProgress: FC<ServerGenerationProgressProps> = ({
  currentCount,
  totalServers,
  progress,
  isGenerating,
  isComplete,
  nextServerType,
  currentMessage,
  error,
  lastGeneratedServer,
}) => {
  // 🎯 실제 기업 환경 기반 서버 타입별 아이콘 매핑
  const getServerIcon = (serverType: string) => {
    const type = serverType?.toLowerCase() || '';

    // 🌐 웹서버
    if (type === 'nginx' || type === 'apache' || type === 'iis')
      return <ServerIcon className="h-4 w-4" />;

    // 🚀 애플리케이션 서버
    if (type === 'nodejs') return <GitBranch className="h-4 w-4" />;
    if (type === 'springboot') return <Settings className="h-4 w-4" />;
    if (type === 'django' || type === 'php')
      return <Code className="h-4 w-4" />;
    if (type === 'dotnet') return <Box className="h-4 w-4" />;

    // 🗄️ 데이터베이스
    if (
      type === 'mysql' ||
      type === 'postgresql' ||
      type === 'oracle' ||
      type === 'mssql'
    )
      return <Database className="h-4 w-4" />;
    if (type === 'mongodb') return <FileText className="h-4 w-4" />;

    // ⚙️ 인프라 서비스
    if (type === 'redis') return <Zap className="h-4 w-4" />;
    if (type === 'rabbitmq' || type === 'kafka')
      return <Network className="h-4 w-4" />;
    if (type === 'elasticsearch') return <Search className="h-4 w-4" />;
    if (type === 'jenkins') return <Cpu className="h-4 w-4" />;
    if (type === 'prometheus') return <BarChart3 className="h-4 w-4" />;

    // 🔄 하위 호환성 (기존 타입)
    if (type.includes('web')) return <ServerIcon className="h-4 w-4" />;
    if (type.includes('database')) return <Database className="h-4 w-4" />;
    if (type.includes('kubernetes')) return <Layers className="h-4 w-4" />;
    if (type.includes('api')) return <GitBranch className="h-4 w-4" />;
    if (type.includes('analytics')) return <BarChart3 className="h-4 w-4" />;
    if (type.includes('monitoring')) return <BarChart3 className="h-4 w-4" />;
    if (type.includes('security')) return <Shield className="h-4 w-4" />;
    if (type.includes('mail')) return <Mail className="h-4 w-4" />;
    if (type.includes('ci/cd')) return <GitBranch className="h-4 w-4" />;

    return <Cloud className="h-4 w-4" />;
  };

  // 🎨 실제 기업 환경 기반 서버 타입별 색상 매핑
  const getServerColor = (serverType: string) => {
    const type = serverType?.toLowerCase() || '';

    // 🌐 웹서버 - 파란색 계열
    if (type === 'nginx' || type === 'apache' || type === 'iis')
      return 'text-blue-400';

    // 🚀 애플리케이션 서버 - 초록색 계열
    if (type === 'nodejs') return 'text-green-400';
    if (type === 'springboot') return 'text-emerald-400';
    if (type === 'django') return 'text-teal-400';
    if (type === 'dotnet') return 'text-blue-600';
    if (type === 'php') return 'text-indigo-400';

    // 🗄️ 데이터베이스 - 보라색 계열
    if (type === 'mysql') return 'text-orange-400';
    if (type === 'postgresql') return 'text-blue-700';
    if (type === 'mongodb') return 'text-green-600';
    if (type === 'oracle') return 'text-red-500';
    if (type === 'mssql') return 'text-purple-400';

    // ⚙️ 인프라 서비스 - 다양한 색상
    if (type === 'redis') return 'text-red-400';
    if (type === 'rabbitmq') return 'text-orange-400';
    if (type === 'kafka') return 'text-gray-600';
    if (type === 'elasticsearch') return 'text-yellow-400';
    if (type === 'jenkins') return 'text-blue-500';
    if (type === 'prometheus') return 'text-orange-500';

    // 🔄 하위 호환성 (기존 타입)
    if (type.includes('web')) return 'text-blue-400';
    if (type.includes('database')) return 'text-purple-400';
    if (type.includes('kubernetes')) return 'text-cyan-400';
    if (type.includes('api')) return 'text-green-400';
    if (type.includes('analytics')) return 'text-orange-400';
    if (type.includes('monitoring')) return 'text-yellow-400';
    if (type.includes('security')) return 'text-red-400';
    if (type.includes('mail')) return 'text-pink-400';
    if (type.includes('ci/cd')) return 'text-indigo-400';

    return 'text-gray-400';
  };

  return (
    <div
      className="mb-6 rounded-lg border border-gray-700 bg-gray-900/50 p-6 backdrop-blur-sm"
    >
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                isComplete
                  ? 'border-green-500 bg-green-500/20'
                  : error
                    ? 'border-red-500 bg-red-500/20'
                    : 'border-blue-500 bg-blue-500/20'
              }`}
            >
              {isComplete ? (
                <div
                  className="text-green-400"
                >
                  ✓
                </div>
              ) : error ? (
                <div className="text-red-400">✗</div>
              ) : (
                <Cloud className="h-4 w-4 text-blue-400" />
              )}
            </div>

            {isGenerating && (
              <div
                className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-spin"
              />
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">
              인프라 배포 진행률
            </h3>
            <p className="text-sm text-gray-400">
              {currentCount}/{totalServers} 서버 배포됨
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-white">{progress}%</div>
          <div className="text-xs text-gray-400">완료율</div>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="mb-4">
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-700">
          <div
            style={{ width: `${progress}%` }}
            className="relative h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-1000 ease-out"
          >
            <div
              className={`absolute inset-0 rounded-full bg-white/20 ${isGenerating ? "animate-pulse" : ""}`}
            />
          </div>
        </div>

        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>시작</span>
          <span>
            {currentCount > 0 && currentCount < totalServers
              ? `${currentCount}개 배포됨`
              : ''}
          </span>
          <span>완료</span>
        </div>
      </div>

      {/* 현재 상태 메시지 */}
      <div
        key={currentMessage}
        className="mb-4 flex items-center space-x-3"
      >
        <div
          className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${
            isComplete
              ? 'border border-green-500/30 bg-green-500/20'
              : error
                ? 'border border-red-500/30 bg-red-500/20'
                : 'border border-blue-500/30 bg-blue-500/20'
          }`}
        >
          {nextServerType && getServerIcon(nextServerType)}
          <span
            className={`text-sm font-medium ${
              isComplete
                ? 'text-green-400'
                : error
                  ? 'text-red-400'
                  : 'text-blue-400'
            }`}
          >
            {currentMessage}
          </span>
        </div>

        {isGenerating && nextServerType && (
          <div
            className="flex items-center space-x-2 text-sm text-gray-400"
          >
            <span>다음:</span>
            <div
              className={`flex items-center space-x-1 ${getServerColor(nextServerType)}`}
            >
              {getServerIcon(nextServerType)}
              <span>{nextServerType}</span>
            </div>
          </div>
        )}
      </div>

      {/* 마지막 생성된 서버 정보 */}
      <Fragment>
        {lastGeneratedServer && (
          <div
            className="mb-4 rounded-lg border border-gray-600 bg-gray-800/50 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`h-8 w-8 rounded-lg border ${getServerColor(lastGeneratedServer.type || '')} border-current/30 bg-current/10 flex items-center justify-center`}
                >
                  {getServerIcon(lastGeneratedServer.type || '')}
                </div>

                <div>
                  <h4 className="font-medium text-white">
                    {lastGeneratedServer.hostname}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {lastGeneratedServer.name} • {lastGeneratedServer.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <div className="text-green-400">✓ 배포 완료</div>
                <div className="text-gray-400">
                  {lastGeneratedServer.provider?.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        )}
      </Fragment>

      {/* 에러 메시지 */}
      <Fragment>
        {error && (
          <div
            className="rounded-lg border border-red-500/30 bg-red-500/20 p-3 text-sm text-red-400"
          >
            <div className="flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}
      </Fragment>

      {/* 완료 메시지 */}
      <Fragment>
        {isComplete && (
          <div
            className="py-4 text-center"
          >
            <div
              className="mb-2 text-4xl"
            >
              🎉
            </div>
            <h4 className="mb-1 font-medium text-green-400">
              인프라 배포 완료!
            </h4>
            <p className="text-sm text-gray-400">
              총 {totalServers}개 서버가 성공적으로 배포되었습니다
            </p>
          </div>
        )}
      </Fragment>
    </div>
  );
};

export default ServerGenerationProgress;
