/**
 * 🎬 ServerCardSpawner Component v1.0
 *
 * 서버 카드 순차적 생성 애니메이션
 * - 실제 부팅 순서 반영
 * - 서버 타입별 그룹화
 * - 배경에서 부드러운 등장
 */

import { Fragment, useState, useEffect, memo, useCallback, useMemo, type FC } from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
import type { Server } from '../../../types/server';

interface ServerCardSpawnerProps {
  servers: Server[];
  onServerSpawned?: (server: Server, index: number) => void;
  onAllServersSpawned?: () => void;
  isActive: boolean;
  spawnDelay?: number;
}

interface ServerGroup {
  type: string;
  servers: Server[];
  priority: number;
  icon: string;
  message: string;
  color: string;
}

const SERVER_SPAWN_ORDER = [
  {
    type: 'WEB',
    priority: 1,
    icon: '🌐',
    message: '웹 서버 시작...',
    color: 'text-green-400',
  },
  {
    type: 'DATABASE',
    priority: 2,
    icon: '🗄️',
    message: '데이터베이스 연결...',
    color: 'text-blue-400',
  },
  {
    type: 'API',
    priority: 3,
    icon: '🔌',
    message: 'API 게이트웨이 구동...',
    color: 'text-purple-400',
  },
  {
    type: 'CACHE',
    priority: 4,
    icon: '⚡',
    message: '캐시 서버 활성화...',
    color: 'text-yellow-400',
  },
  {
    type: 'KUBERNETES',
    priority: 5,
    icon: '☸️',
    message: '쿠버네티스 클러스터...',
    color: 'text-cyan-400',
  },
  {
    type: 'MONITORING',
    priority: 6,
    icon: '📈',
    message: '모니터링 도구...',
    color: 'text-pink-400',
  },
];

const ServerCardSpawner: FC<ServerCardSpawnerProps> = memo(
  ({
    servers,
    onServerSpawned,
    onAllServersSpawned,
    isActive,
    spawnDelay = 300,
  }) => {
    const [spawnedServers, setSpawnedServers] = useState<Set<string>>(
      new Set()
    );
    const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
    const [currentServerInGroup, setCurrentServerInGroup] = useState(0);
    const [isSpawning, setIsSpawning] = useState(false);

    // 서버를 타입별로 그룹화하고 우선순위 정렬 (방어 코드 추가)
    const groupedServers = useMemo(() => {
      // 🛡️ servers 배열 방어 코드 - undefined 방지
      if (!servers || !Array.isArray(servers) || servers.length === 0) {
        console.warn('⚠️ ServerCardSpawner: servers가 비어있거나 유효하지 않음:', servers);
        return [];
      }

      const groups: ServerGroup[] = [];

      SERVER_SPAWN_ORDER.forEach((order) => {
        const typeServers = servers.filter((server) => {
          // Server 타입에 맞게 필드 확인
          const serverName = server.name?.toLowerCase() || '';
          const serverLocation = server.location?.toLowerCase() || '';

          return (
            serverName.includes(order.type.toLowerCase()) ||
            serverLocation.includes(order.type.toLowerCase()) ||
            (order.type === 'WEB' &&
              (serverName.includes('web') ||
                serverName.includes('nginx') ||
                serverName.includes('apache'))) ||
            (order.type === 'DATABASE' &&
              (serverName.includes('db') ||
                serverName.includes('mysql') ||
                serverName.includes('postgres') ||
                serverName.includes('mongo'))) ||
            (order.type === 'API' &&
              (serverName.includes('api') || serverName.includes('gateway'))) ||
            (order.type === 'CACHE' &&
              (serverName.includes('cache') ||
                serverName.includes('redis') ||
                serverName.includes('memcached'))) ||
            (order.type === 'KUBERNETES' &&
              (serverName.includes('k8s') ||
                serverName.includes('kubernetes') ||
                serverName.includes('master') ||
                serverName.includes('worker'))) ||
            (order.type === 'MONITORING' &&
              (serverName.includes('monitoring') ||
                serverName.includes('prometheus') ||
                serverName.includes('grafana')))
          );
        });

        if (typeServers.length > 0) {
          groups.push({
            type: order.type,
            servers: typeServers,
            priority: order.priority,
            icon: order.icon,
            message: order.message,
            color: order.color,
          });
        }
      });

      // 분류되지 않은 서버들을 기타 그룹으로 추가
      const categorizedServerIds = new Set(
        groups.flatMap((group) => group.servers.map((s) => s.id))
      );
      // 🛡️ servers 재검증 - useMemo 내에서 servers가 변경될 수도 있음
      const uncategorizedServers = servers && Array.isArray(servers) ? servers.filter(
        (s) => !categorizedServerIds.has(s.id)
      ) : [];

      if (uncategorizedServers.length > 0) {
        groups.push({
          type: 'OTHER',
          servers: uncategorizedServers,
          priority: 99,
          icon: '⚙️',
          message: '기타 서비스...',
          color: 'text-gray-400',
        });
      }

      return groups.sort((a, b) => a.priority - b.priority);
    }, [servers]);

    // 서버 스폰 로직
    const spawnNextServer = useCallback(() => {
      if (currentGroupIndex >= groupedServers.length) {
        // 모든 서버 스폰 완료
        setIsSpawning(false);
        onAllServersSpawned?.();
        return;
      }

      const currentGroup = groupedServers[currentGroupIndex];
      if (!currentGroup || !currentGroup.servers || !Array.isArray(currentGroup.servers)) {
        // 🛡️ currentGroup.servers 방어 코드 추가
        console.warn('⚠️ ServerCardSpawner: currentGroup 또는 servers 배열이 유효하지 않음:', currentGroup);
        return;
      }

      if (currentServerInGroup >= currentGroup.servers.length) {
        // 현재 그룹 완료, 다음 그룹으로
        setCurrentGroupIndex((prev) => prev + 1);
        setCurrentServerInGroup(0);
        return;
      }

      const serverToSpawn = currentGroup.servers[currentServerInGroup];
      if (!serverToSpawn) {
        return;
      }

      // 서버 스폰 처리
      setSpawnedServers((prev) => new Set([...prev, serverToSpawn.id]));
      onServerSpawned?.(serverToSpawn, spawnedServers.size);

      // 다음 서버로
      setCurrentServerInGroup((prev) => prev + 1);
    }, [
      currentGroupIndex,
      currentServerInGroup,
      groupedServers,
      onServerSpawned,
      onAllServersSpawned,
      spawnedServers.size,
    ]);

    // 스폰 시작
    useEffect(() => {
      if (!isActive || isSpawning || groupedServers.length === 0) return;

      setIsSpawning(true);
      setCurrentGroupIndex(0);
      setCurrentServerInGroup(0);
      setSpawnedServers(new Set());
    }, [isActive, groupedServers.length, isSpawning]);

    // 스폰 타이머
    useEffect(() => {
      if (!isSpawning) return;

      const timer = setTimeout(() => {
        spawnNextServer();
      }, spawnDelay);

      return () => clearTimeout(timer);
    }, [
      isSpawning,
      spawnNextServer,
      spawnDelay,
      currentGroupIndex,
      currentServerInGroup,
    ]);

    const currentGroup = groupedServers[currentGroupIndex];
    const totalServers = servers?.length || 0;
    const spawnedCount = spawnedServers.size;
    const progress = totalServers > 0 ? (spawnedCount / totalServers) * 100 : 0;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999996,
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* 배경 효과 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.2,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '25%',
              left: '25%',
              width: '384px',
              height: '384px',
              background: '#4ade80',
              borderRadius: '50%',
              filter: 'blur(48px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '25%',
              right: '25%',
              width: '320px',
              height: '320px',
              background: '#a855f7',
              borderRadius: '50%',
              filter: 'blur(48px)',
            }}
          />
        </div>

        {/* 중앙 상태 표시 */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
            maxWidth: '448px',
            margin: '0 auto',
            padding: '2rem',
          }}
        >
          <div
            style={{
              width: '96px',
              height: '96px',
              background:
                'linear-gradient(135deg, #4ade80 0%, #3b82f6 50%, #a855f7 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <span
              style={{
                fontSize: '2.5rem',
                color: 'white',
              }}
            >
              🌐
            </span>
          </div>

          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '1rem',
            }}
          >
            서버 인프라 구동 중
          </h2>

          <p
            style={{
              fontSize: '1.125rem',
              color: '#bbf7d0',
              marginBottom: '2rem',
            }}
            key={currentGroup?.message}
          >
            {currentGroup?.message ?? '서버를 초기화하고 있습니다...'}
          </p>

          {/* 전체 진행률 */}
          <div
            style={{
              width: '100%',
              maxWidth: '384px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <span
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.875rem',
                }}
              >
                전체 진행률
              </span>
              <span
                style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                }}
              >
                {Math.round(progress)}%
              </span>
            </div>

            <div
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '9999px',
                height: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: '9999px',
                  background:
                    progress < 30
                      ? 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)'
                      : progress < 70
                        ? 'linear-gradient(90deg, #f59e0b 0%, #3b82f6 100%)'
                        : 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)',
                  position: 'relative',
                  width: `${progress}%`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                    width: '100%',
                  }}
                />
              </div>
            </div>
          </div>

          {/* 현재 스포닝 타입 표시 */}
          <Fragment>
            {currentGroup && (
              <div
                key={currentGroup.type}
                style={{
                  marginTop: '2rem',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <div
                  style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '1rem',
                  }}
                >
                  현재 생성 중: {currentGroup.type}
                </div>
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.875rem',
                    marginTop: '0.25rem',
                  }}
                >
                  {currentGroup.servers.length}개 서버 초기화
                </div>
              </div>
            )}
          </Fragment>
        </div>

        {/* 🚨 강제 표시 확인 메시지 */}
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            padding: '1rem',
            background: 'rgba(34, 197, 94, 0.9)',
            borderRadius: '8px',
            border: '2px solid #10b981',
            color: 'white',
            zIndex: 999999,
            fontSize: '0.875rem',
          }}
        >
          🌐 ServerCardSpawner 강제 렌더링 활성화
        </div>
      </div>
    );
  });
ServerCardSpawner.displayName = 'ServerCardSpawner';

export default ServerCardSpawner;
