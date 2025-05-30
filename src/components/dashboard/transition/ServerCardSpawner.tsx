/**
 * 🎬 ServerCardSpawner Component v1.0
 * 
 * 서버 카드 순차적 생성 애니메이션
 * - 실제 부팅 순서 반영
 * - 서버 타입별 그룹화
 * - 배경에서 부드러운 등장
 */

import React, { useState, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server } from '../../../types/server';

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
  { type: 'WEB', priority: 1, icon: '🌐', message: '웹 서버 시작...', color: 'text-green-400' },
  { type: 'DATABASE', priority: 2, icon: '🗄️', message: '데이터베이스 연결...', color: 'text-blue-400' },
  { type: 'API', priority: 3, icon: '🔌', message: 'API 게이트웨이 구동...', color: 'text-purple-400' },
  { type: 'CACHE', priority: 4, icon: '⚡', message: '캐시 서버 활성화...', color: 'text-yellow-400' },
  { type: 'KUBERNETES', priority: 5, icon: '☸️', message: '쿠버네티스 클러스터...', color: 'text-cyan-400' },
  { type: 'MONITORING', priority: 6, icon: '📈', message: '모니터링 도구...', color: 'text-pink-400' }
];

const ServerCardSpawner: React.FC<ServerCardSpawnerProps> = memo(({
  servers,
  onServerSpawned,
  onAllServersSpawned,
  isActive,
  spawnDelay = 300
}) => {
  const [spawnedServers, setSpawnedServers] = useState<Set<string>>(new Set());
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentServerInGroup, setCurrentServerInGroup] = useState(0);
  const [isSpawning, setIsSpawning] = useState(false);

  // 서버를 타입별로 그룹화하고 우선순위 정렬
  const groupedServers = React.useMemo(() => {
    const groups: ServerGroup[] = [];
    
    SERVER_SPAWN_ORDER.forEach(order => {
      const typeServers = servers.filter(server => {
        // Server 타입에 맞게 필드 확인
        const serverName = server.name?.toLowerCase() || '';
        const serverLocation = server.location?.toLowerCase() || '';
        
        return (
          serverName.includes(order.type.toLowerCase()) ||
          serverLocation.includes(order.type.toLowerCase()) ||
          (order.type === 'WEB' && (serverName.includes('web') || serverName.includes('nginx') || serverName.includes('apache'))) ||
          (order.type === 'DATABASE' && (serverName.includes('db') || serverName.includes('mysql') || serverName.includes('postgres') || serverName.includes('mongo'))) ||
          (order.type === 'API' && (serverName.includes('api') || serverName.includes('gateway'))) ||
          (order.type === 'CACHE' && (serverName.includes('cache') || serverName.includes('redis') || serverName.includes('memcached'))) ||
          (order.type === 'KUBERNETES' && (serverName.includes('k8s') || serverName.includes('kubernetes') || serverName.includes('master') || serverName.includes('worker'))) ||
          (order.type === 'MONITORING' && (serverName.includes('monitoring') || serverName.includes('prometheus') || serverName.includes('grafana')))
        );
      });
      
      if (typeServers.length > 0) {
        groups.push({
          type: order.type,
          servers: typeServers,
          priority: order.priority,
          icon: order.icon,
          message: order.message,
          color: order.color
        });
      }
    });

    // 분류되지 않은 서버들을 기타 그룹으로 추가
    const categorizedServerIds = new Set(
      groups.flatMap(group => group.servers.map(s => s.id))
    );
    const uncategorizedServers = servers.filter(s => !categorizedServerIds.has(s.id));
    
    if (uncategorizedServers.length > 0) {
      groups.push({
        type: 'OTHER',
        servers: uncategorizedServers,
        priority: 99,
        icon: '⚙️',
        message: '기타 서비스...',
        color: 'text-gray-400'
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
    
    if (currentServerInGroup >= currentGroup.servers.length) {
      // 현재 그룹 완료, 다음 그룹으로
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentServerInGroup(0);
      return;
    }

    const serverToSpawn = currentGroup.servers[currentServerInGroup];
    
    // 서버 스폰 처리
    setSpawnedServers(prev => new Set([...prev, serverToSpawn.id]));
    onServerSpawned?.(serverToSpawn, spawnedServers.size);
    
    // 다음 서버로
    setCurrentServerInGroup(prev => prev + 1);
  }, [currentGroupIndex, currentServerInGroup, groupedServers, onServerSpawned, onAllServersSpawned, spawnedServers.size]);

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
  }, [isSpawning, spawnNextServer, spawnDelay, currentGroupIndex, currentServerInGroup]);

  const currentGroup = groupedServers[currentGroupIndex];
  const totalServers = servers.length;
  const spawnedCount = spawnedServers.size;
  const progress = totalServers > 0 ? (spawnedCount / totalServers) * 100 : 0;

  return (
    <div className="fixed bottom-6 left-6 z-40 max-w-sm">
      <AnimatePresence>
        {isSpawning && currentGroup && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.4, type: "spring" }}
            className="bg-black/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl"
          >
            {/* 헤더 */}
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                className="text-3xl"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1.5, repeat: Infinity }
                }}
              >
                {currentGroup.icon}
              </motion.div>
              <div>
                <div className="text-white font-semibold">서버 인프라 구동</div>
                <div className="text-gray-300 text-sm">
                  {spawnedCount}/{totalServers} 서버 활성화
                </div>
              </div>
            </div>

            {/* 현재 진행 중인 그룹 */}
            <motion.div
              key={currentGroup.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4"
            >
              <div className={`${currentGroup.color} font-medium mb-2`}>
                {currentGroup.message}
              </div>
              
              {/* 현재 그룹 내 서버들 */}
              <div className="space-y-1">
                {currentGroup.servers.slice(0, currentServerInGroup + 1).map((server, index) => (
                  <motion.div
                    key={server.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <motion.div
                      className="w-2 h-2 bg-green-400 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-gray-300">{server.name}</span>
                    {spawnedServers.has(server.id) && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-green-400 text-xs"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 전체 진행률 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">전체 진행률</span>
                <span className="text-white font-medium">{Math.round(progress)}%</span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              </div>
            </div>

            {/* 다음 예정 그룹 미리보기 */}
            {currentGroupIndex < groupedServers.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                className="mt-4 pt-3 border-t border-gray-600"
              >
                <div className="text-xs text-gray-400 mb-1">다음 단계</div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{groupedServers[currentGroupIndex + 1]?.icon}</span>
                  <span>{groupedServers[currentGroupIndex + 1]?.message}</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 스폰된 서버 카운터 (항상 표시) */}
      {spawnedCount > 0 && !isSpawning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-600/90 backdrop-blur-md rounded-xl p-3 border border-green-400/30"
        >
          <div className="flex items-center gap-2 text-white">
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              ✨
            </motion.span>
            <span className="font-medium">
              {spawnedCount}개 서버 활성화 완료
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
});

ServerCardSpawner.displayName = 'ServerCardSpawner';

export default ServerCardSpawner; 