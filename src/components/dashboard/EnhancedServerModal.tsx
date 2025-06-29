/**
 * 🚀 Enhanced Server Detail Modal v3.0
 *
 * 완전히 고도화된 서버 상세 모달:
 * - 실시간 3D 게이지 및 차트
 * - 다중 탭 인터페이스
 * - 실시간 로그 스트림
 * - 프로세스 모니터링
 * - 네트워크 토폴로지
 * - AI 기반 인사이트
 */

import { calculateOptimalCollectionInterval } from '@/config/serverConfig';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Cpu,
  FileText,
  Network,
  Pause,
  Play,
  Server,
  X,
} from 'lucide-react';
import { ServerModal3DGauge } from '../shared/UnifiedCircularGauge';
import { ServerModalChart } from './components/ServerModalChart';
import { useServerModalData } from './hooks/ServerModalDataManager';
import {
  EnhancedServerModalProps,
  TabDefinition,
} from './types/ServerModalTypes';

export default function EnhancedServerModal({
  server,
  onClose,
}: EnhancedServerModalProps) {
  // 🎯 분리된 데이터 관리 hook 사용
  const {
    selectedTab,
    setSelectedTab,
    isRealtime,
    setIsRealtime,
    timeRange,
    setTimeRange,
    realtimeData,
    safeServer,
  } = useServerModalData({ server, isRealtime: true });

  // 탭 설정
  const tabs: TabDefinition[] = [
    { id: 'overview', label: '개요', icon: Activity },
    { id: 'metrics', label: '메트릭', icon: BarChart3 },
    { id: 'processes', label: '프로세스', icon: Cpu },
    { id: 'logs', label: '로그', icon: FileText },
    { id: 'network', label: '네트워크', icon: Network },
  ];

  // 🛡️ 에러 처리: 서버 데이터가 없는 경우
  if (!safeServer) {
    console.warn('⚠️ [EnhancedServerModal] 서버 데이터가 없습니다.');
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className='bg-white rounded-xl p-6 max-w-md w-full text-center'
            onClick={e => e.stopPropagation()}
          >
            <div className='text-red-500 text-4xl mb-4'>⚠️</div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              서버 데이터 오류
            </h3>
            <p className='text-gray-600 mb-4'>
              서버 정보를 불러올 수 없습니다.
            </p>
            <button
              onClick={onClose}
              className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
            >
              닫기
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4'
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className='bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden ring-1 ring-black/5'
          onClick={e => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <div className='p-3 bg-white/20 rounded-lg'>
                  <Server className='w-6 h-6' />
                </div>
                <div>
                  <h2 className='text-2xl font-bold flex items-center gap-3'>
                    <span>{safeServer.name}</span>
                    {safeServer.health?.score !== undefined && (
                      <span className='text-sm font-semibold bg-white/20 px-2 py-0.5 rounded-md'>
                        {Math.round(safeServer.health.score)}/100
                      </span>
                    )}
                  </h2>
                  <p className='text-blue-100 flex items-center gap-2'>
                    {safeServer.type} • {safeServer.location}
                    {safeServer.alertsSummary?.total ? (
                      <span className='ml-2 inline-flex items-center gap-1 bg-red-500/20 text-red-100 px-2 py-0.5 rounded-full text-xs'>
                        <AlertTriangle className='w-3 h-3' />
                        {safeServer.alertsSummary.total}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsRealtime(!isRealtime)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                    isRealtime
                      ? 'bg-green-500 shadow-lg'
                      : 'bg-white/30 backdrop-blur-sm hover:bg-white/40'
                  }`}
                >
                  {isRealtime ? (
                    <Play className='w-4 h-4' />
                  ) : (
                    <Pause className='w-4 h-4' />
                  )}
                  {isRealtime
                    ? `실시간 (${Math.round(calculateOptimalCollectionInterval() / 1000)}초)`
                    : '정지됨'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className='p-2 bg-white/30 backdrop-blur-sm rounded-lg hover:bg-white/40 transition-all duration-200'
                >
                  <X className='w-5 h-5' />
                </motion.button>
              </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className='flex gap-2 mt-6'>
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                      selectedTab === tab.id
                        ? 'bg-white text-blue-600 shadow-lg ring-1 ring-blue-200'
                        : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                    }`}
                  >
                    <Icon className='w-4 h-4' />
                    {tab.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className='flex-1 p-6 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={selectedTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {selectedTab === 'overview' && (
                  <div className='space-y-6'>
                    {/* 3D 게이지들 - 통합 컴포넌트 사용 */}
                    <div>
                      <h3 className='text-xl font-bold text-gray-900 mb-4'>
                        실시간 리소스 모니터링
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-8 bg-white rounded-xl p-6 shadow-md border border-gray-200'>
                        <ServerModal3DGauge
                          value={safeServer.cpu}
                          label='CPU'
                          type='cpu'
                          size={140}
                        />
                        <ServerModal3DGauge
                          value={safeServer.memory}
                          label='메모리'
                          type='memory'
                          size={140}
                        />
                        <ServerModal3DGauge
                          value={safeServer.disk}
                          label='디스크'
                          type='disk'
                          size={140}
                        />
                      </div>
                    </div>

                    {/* 시스템 정보 */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='bg-white rounded-xl p-6 shadow-md border border-gray-200'>
                        <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                          시스템 정보
                        </h4>
                        <div className='space-y-3'>
                          <div className='flex justify-between items-center'>
                            <span className='text-gray-600'>운영체제</span>
                            <span className='font-medium'>
                              {safeServer.os || 'Ubuntu 22.04'}
                            </span>
                          </div>
                          <div className='flex justify-between items-center'>
                            <span className='text-gray-600'>IP 주소</span>
                            <span className='font-mono text-sm'>
                              {safeServer.ip || '192.168.1.100'}
                            </span>
                          </div>
                          <div className='flex justify-between items-center'>
                            <span className='text-gray-600'>업타임</span>
                            <span className='font-medium'>
                              {safeServer.uptime}
                            </span>
                          </div>
                          <div className='flex justify-between items-center'>
                            <span className='text-gray-600'>
                              마지막 업데이트
                            </span>
                            <span className='text-sm text-gray-500'>
                              방금 전
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className='bg-white rounded-xl p-6 shadow-md border border-gray-200'>
                        <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                          서비스 상태
                        </h4>
                        <div className='space-y-3'>
                          {safeServer.services &&
                          safeServer.services.length > 0 ? (
                            safeServer.services.map((service, index) => (
                              <div
                                key={index}
                                className='flex items-center justify-between'
                              >
                                <div className='flex items-center gap-3'>
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      service.status === 'running'
                                        ? 'bg-green-500'
                                        : service.status === 'stopped'
                                          ? 'bg-red-500'
                                          : 'bg-amber-500'
                                    }`}
                                  />
                                  <span className='font-medium'>
                                    {service.name}
                                  </span>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    service.status === 'running'
                                      ? 'bg-green-100 text-green-700'
                                      : service.status === 'stopped'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-amber-100 text-amber-700'
                                  }`}
                                >
                                  {service.status === 'running'
                                    ? '실행중'
                                    : service.status === 'stopped'
                                      ? '중지됨'
                                      : '대기중'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className='text-gray-500 text-center py-4'>
                              서비스 정보가 없습니다
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === 'metrics' && (
                  <div className='space-y-6'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-xl font-bold text-gray-900'>
                        실시간 메트릭
                      </h3>
                      <button
                        onClick={() => setIsRealtime(!isRealtime)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          isRealtime
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {isRealtime ? '일시정지' : '시작'}
                      </button>
                    </div>

                    <div className='grid grid-cols-2 gap-6'>
                      <ServerModalChart
                        data={realtimeData.cpu}
                        color='#ef4444'
                        label='CPU 사용률'
                      />
                      <ServerModalChart
                        data={realtimeData.memory}
                        color='#3b82f6'
                        label='메모리 사용률'
                      />
                      <ServerModalChart
                        data={realtimeData.disk}
                        color='#8b5cf6'
                        label='디스크 사용률'
                      />
                      <ServerModalChart
                        data={realtimeData.network.map(n =>
                          typeof n === 'number' ? n : (n.in + n.out) / 2
                        )}
                        color='#22c55e'
                        label='네트워크 사용률'
                      />
                    </div>
                  </div>
                )}

                {selectedTab === 'processes' && (
                  <div className='space-y-6'>
                    <h3 className='text-xl font-bold text-gray-900'>
                      실행 중인 프로세스
                    </h3>
                    <div className='bg-white rounded-xl shadow-sm overflow-hidden'>
                      <table className='w-full'>
                        <thead className='bg-gray-50'>
                          <tr>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              프로세스
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              PID
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              CPU
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                              메모리
                            </th>
                          </tr>
                        </thead>
                        <tbody className='bg-white divide-y divide-gray-200'>
                          {realtimeData.processes.map((process, idx) => (
                            <motion.tr
                              key={idx}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.1 }}
                            >
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <div className='font-medium text-gray-900'>
                                  {process.name}
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                {process.pid}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <div className='text-sm font-medium text-gray-900'>
                                  {process.cpu.toFixed(1)}%
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <div className='text-sm font-medium text-gray-900'>
                                  {process.memory.toFixed(1)}%
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedTab === 'logs' && (
                  <div className='space-y-6'>
                    <h3 className='text-xl font-bold text-gray-900'>
                      실시간 로그
                    </h3>
                    <div className='bg-gray-900 rounded-xl p-4 h-96 overflow-y-auto font-mono text-sm'>
                      {realtimeData.logs.map((log, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`mb-2 ${
                            log.level === 'error'
                              ? 'text-red-400'
                              : log.level === 'warn'
                                ? 'text-yellow-400'
                                : 'text-green-400'
                          }`}
                        >
                          <span className='text-gray-500'>
                            {(() => {
                              try {
                                const date = new Date(log.timestamp);
                                return isNaN(date.getTime())
                                  ? new Date().toLocaleTimeString()
                                  : date.toLocaleTimeString();
                              } catch (error) {
                                return new Date().toLocaleTimeString();
                              }
                            })()}
                          </span>
                          <span className='ml-2 text-blue-400'>
                            [{log.source}]
                          </span>
                          <span className='ml-2 font-bold'>
                            {log.level.toUpperCase()}
                          </span>
                          <span className='ml-2'>{log.message}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTab === 'network' && (
                  <div className='space-y-6'>
                    <h3 className='text-xl font-bold text-gray-900'>
                      네트워크 모니터링
                    </h3>

                    {/* 네트워크 상태 카드 */}
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                      <div className='bg-white rounded-xl p-6 shadow-md border border-gray-200'>
                        <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                          네트워크 상태
                        </h4>
                        <div className='flex items-center gap-3'>
                          <div
                            className={`w-4 h-4 rounded-full ${
                              safeServer.networkStatus === 'excellent'
                                ? 'bg-green-500'
                                : safeServer.networkStatus === 'good'
                                  ? 'bg-blue-500'
                                  : safeServer.networkStatus === 'poor'
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                            }`}
                          />
                          <span className='font-medium capitalize'>
                            {safeServer.networkStatus === 'excellent'
                              ? '우수'
                              : safeServer.networkStatus === 'good'
                                ? '양호'
                                : safeServer.networkStatus === 'poor'
                                  ? '보통'
                                  : '오프라인'}
                          </span>
                        </div>
                        <div className='mt-4'>
                          <div className='text-sm text-gray-600'>
                            네트워크 속도
                          </div>
                          <div className='text-lg font-bold'>
                            {safeServer.specs?.network_speed || '1 Gbps'}
                          </div>
                        </div>
                      </div>

                      <div className='bg-white rounded-xl p-6 shadow-md border border-gray-200'>
                        <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                          현재 트래픽
                        </h4>
                        <div className='space-y-3'>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>인바운드</span>
                            <span className='font-medium text-green-600'>
                              {realtimeData.network[
                                realtimeData.network.length - 1
                              ]?.in.toFixed(1) || '0'}{' '}
                              MB/s
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>아웃바운드</span>
                            <span className='font-medium text-blue-600'>
                              {realtimeData.network[
                                realtimeData.network.length - 1
                              ]?.out.toFixed(1) || '0'}{' '}
                              MB/s
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className='bg-white rounded-xl p-6 shadow-md border border-gray-200'>
                        <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                          지연시간
                        </h4>
                        <div className='text-3xl font-bold text-purple-600'>
                          {realtimeData.latency[
                            realtimeData.latency.length - 1
                          ]?.toFixed(1) || '0'}{' '}
                          ms
                        </div>
                        <div className='text-sm text-gray-600 mt-2'>
                          평균 응답시간
                        </div>
                      </div>
                    </div>

                    {/* 네트워크 트래픽 차트 */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='bg-white rounded-lg p-4 shadow-sm border'>
                        <h4 className='text-sm font-medium text-gray-700 mb-2'>
                          네트워크 트래픽
                        </h4>
                        <div className='relative h-32'>
                          <svg
                            className='w-full h-full'
                            viewBox='0 0 100 100'
                            preserveAspectRatio='none'
                          >
                            <defs>
                              <linearGradient
                                id='network-in-gradient'
                                x1='0%'
                                y1='0%'
                                x2='0%'
                                y2='100%'
                              >
                                <stop
                                  offset='0%'
                                  stopColor='#22c55e'
                                  stopOpacity='0.3'
                                />
                                <stop
                                  offset='100%'
                                  stopColor='#22c55e'
                                  stopOpacity='0.05'
                                />
                              </linearGradient>
                              <linearGradient
                                id='network-out-gradient'
                                x1='0%'
                                y1='0%'
                                x2='0%'
                                y2='100%'
                              >
                                <stop
                                  offset='0%'
                                  stopColor='#3b82f6'
                                  stopOpacity='0.3'
                                />
                                <stop
                                  offset='100%'
                                  stopColor='#3b82f6'
                                  stopOpacity='0.05'
                                />
                              </linearGradient>
                            </defs>

                            {/* 격자 */}
                            {[20, 40, 60, 80].map(y => (
                              <line
                                key={y}
                                x1='0'
                                y1={y}
                                x2='100'
                                y2={y}
                                stroke='#f3f4f6'
                                strokeWidth='0.5'
                              />
                            ))}

                            {/* 인바운드 트래픽 */}
                            <polyline
                              fill='none'
                              stroke='#22c55e'
                              strokeWidth='2'
                              points={realtimeData.network
                                .map((data, index) => {
                                  const x =
                                    (index /
                                      Math.max(
                                        realtimeData.network.length - 1,
                                        1
                                      )) *
                                    100;
                                  const y =
                                    100 -
                                    Math.max(
                                      0,
                                      Math.min(100, (data.in / 600) * 100)
                                    );
                                  return `${x},${y}`;
                                })
                                .join(' ')}
                              vectorEffect='non-scaling-stroke'
                            />

                            {/* 아웃바운드 트래픽 */}
                            <polyline
                              fill='none'
                              stroke='#3b82f6'
                              strokeWidth='2'
                              points={realtimeData.network
                                .map((data, index) => {
                                  const x =
                                    (index /
                                      Math.max(
                                        realtimeData.network.length - 1,
                                        1
                                      )) *
                                    100;
                                  const y =
                                    100 -
                                    Math.max(
                                      0,
                                      Math.min(100, (data.out / 400) * 100)
                                    );
                                  return `${x},${y}`;
                                })
                                .join(' ')}
                              vectorEffect='non-scaling-stroke'
                            />
                          </svg>

                          {/* 범례 */}
                          <div className='absolute top-2 right-2 flex gap-4 text-xs'>
                            <div className='flex items-center gap-1'>
                              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                              <span>인바운드</span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                              <span>아웃바운드</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <ServerModalChart
                        data={realtimeData.latency}
                        color='#8b5cf6'
                        label='네트워크 지연시간 (ms)'
                      />
                    </div>

                    {/* 네트워크 연결 정보 */}
                    <div className='bg-white rounded-xl p-6 shadow-md border border-gray-200'>
                      <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                        연결 정보
                      </h4>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='space-y-3'>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>IP 주소</span>
                            <span className='font-medium'>{safeServer.ip}</span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>호스트명</span>
                            <span className='font-medium'>
                              {safeServer.hostname}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>위치</span>
                            <span className='font-medium'>
                              {safeServer.location}
                            </span>
                          </div>
                        </div>
                        <div className='space-y-3'>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>프로바이더</span>
                            <span className='font-medium'>
                              {safeServer.provider}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>환경</span>
                            <span className='font-medium'>
                              {safeServer.environment}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>서버 타입</span>
                            <span className='font-medium'>
                              {safeServer.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
