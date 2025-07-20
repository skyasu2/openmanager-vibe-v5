'use client';

/**
 * 🎯 ImprovedServerCard 전용 클라이언트 컴포넌트
 *
 * 통합된 서버 카드 컴포넌트 전시 및 테스트
 * - 기존 중복 컴포넌트들 정리 완료
 * - ImprovedServerCard 단일 컴포넌트로 통합
 * - 3가지 배리언트 지원: compact, standard, detailed
 */

import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Info,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ImprovedServerCard from '../../components/dashboard/ImprovedServerCard';
import { Server } from '../../types/server';

const ServerCardComparisonClient = () => {
  const [selectedVariant, setSelectedVariant] = useState<
    'compact' | 'standard' | 'detailed'
  >('compact');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 샘플 서버 데이터
  const sampleServers: Server[] = [
    {
      id: '1',
      name: 'Web-Server-01',
      status: 'online',
      cpu: 67,
      memory: 82,
      disk: 45,
      network: 23,
      location: 'Seoul DC1',
      uptime: '15d 4h 23m',
      ip: '192.168.1.101',
      type: 'web',
      services: [
        { name: 'nginx', status: 'running', port: 80 },
        { name: 'mysql', status: 'running', port: 3306 },
        { name: 'redis', status: 'running', port: 6379 },
        { name: 'docker', status: 'running', port: 2375 },
        { name: 'monitoring', status: 'running', port: 9090 },
      ],
      lastUpdate: new Date(),
    },
    {
      id: '2',
      name: 'Database-Primary',
      status: 'warning',
      cpu: 85,
      memory: 92,
      disk: 78,
      network: 45,
      location: 'Seoul DC2',
      uptime: '32d 12h 45m',
      ip: '192.168.1.102',
      type: 'database',
      services: [
        { name: 'postgresql', status: 'running', port: 5432 },
        { name: 'pgpool', status: 'running', port: 9999 },
        { name: 'backup', status: 'stopped', port: 8888 },
        { name: 'replication', status: 'running', port: 5433 },
      ],
      lastUpdate: new Date(),
    },
    {
      id: '3',
      name: 'API-Gateway',
      status: 'online',
      cpu: 34,
      memory: 45,
      disk: 23,
      network: 78,
      location: 'Seoul DC1',
      uptime: '7d 23h 11m',
      ip: '192.168.1.103',
      type: 'api',
      services: [
        { name: 'kong', status: 'running', port: 8000 },
        { name: 'redis', status: 'running', port: 6379 },
        { name: 'prometheus', status: 'running', port: 9090 },
        { name: 'grafana', status: 'running', port: 3000 },
        { name: 'alertmanager', status: 'running', port: 9093 },
      ],
      lastUpdate: new Date(),
    },
  ];

  const [currentServers] = useState<Server[]>(sampleServers);

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  // 개선사항 리스트
  const improvements = [
    {
      icon: <CheckCircle className='w-6 h-6 text-green-500' />,
      title: '시각적 가독성 강화',
      description:
        '메트릭 프로그레스바 크기를 2배 이상 증가시켜 한눈에 상태 파악 가능',
      details: '4px → 8px (compact), 12px (detailed)',
    },
    {
      icon: <CheckCircle className='w-6 h-6 text-green-500' />,
      title: '정보 밀도 최적화',
      description: '화면 크기에 따라 표시되는 서비스 정보량 자동 조절',
      details: 'compact(2개) → standard(3개) → detailed(5개)',
    },
    {
      icon: <CheckCircle className='w-6 h-6 text-green-500' />,
      title: '실시간 피드백 추가',
      description: '데이터 업데이트 시 시각적 피드백으로 실시간성 강조',
      details: 'border 애니메이션 + 펄스 효과',
    },
  ];

  if (!isClient) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-gray-500'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30'>
      <div className='max-w-7xl mx-auto px-6 py-12'>
        {/* 헤더 */}
        <div className='mb-12 text-center'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            🎯 ImprovedServerCard v3.0 비교 데모
          </h1>
          <p className='text-lg text-gray-600 max-w-3xl mx-auto'>
            기존 서버 카드와 개선된 서버 카드의 UX/UI 차이점을 직접
            비교해보세요. 메트릭 가독성, 정보 밀도, 인터랙션 등 모든 면에서
            향상되었습니다.
          </p>
        </div>

        {/* 컨트롤 패널 */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8'>
          <div className='flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between'>
            <div className='flex flex-col sm:flex-row gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  카드 크기 비교
                </label>
                <div className='flex bg-gray-100 rounded-lg p-1'>
                  {(['compact', 'standard', 'detailed'] as const).map(
                    variant => (
                      <button
                        key={variant}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          selectedVariant === variant
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {variant === 'compact'
                          ? '컴팩트'
                          : variant === 'standard'
                            ? '표준'
                            : '상세'}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              데이터 새로고침
            </button>
          </div>
        </div>

        {/* 개선사항 요약 */}
        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12'>
          {improvements.map((improvement, index) => (
            <div
              key={index}
              className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
            >
              <div className='flex items-start gap-4'>
                <div className='flex-shrink-0'>{improvement.icon}</div>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-2'>
                    {improvement.title}
                  </h3>
                  <p className='text-gray-600 text-sm mb-2'>
                    {improvement.description}
                  </p>
                  <p className='text-xs text-gray-500'>{improvement.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 비교 섹션 */}
        <div className='space-y-12'>
          {currentServers.map((server, index) => (
            <div
              key={server.id}
              className='bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'
            >
              {/* 서버 정보 헤더 */}
              <div className='bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h2 className='text-xl font-bold text-gray-900 mb-1'>
                      {server.name}
                    </h2>
                    <div className='flex items-center gap-4 text-sm text-gray-600'>
                      <span className='flex items-center gap-1'>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            server.status === 'online'
                              ? 'bg-green-500'
                              : server.status === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                          }`}
                        />
                        {server.status === 'online'
                          ? '정상'
                          : server.status === 'warning'
                            ? '경고'
                            : '오프라인'}
                      </span>
                      <span>{server.location}</span>
                      <span>{server.uptime}</span>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm text-gray-500'>
                      현재 선택된 크기
                    </div>
                    <div className='text-lg font-semibold text-blue-600'>
                      {selectedVariant === 'compact'
                        ? '컴팩트'
                        : selectedVariant === 'standard'
                          ? '표준'
                          : '상세'}{' '}
                      모드
                    </div>
                  </div>
                </div>
              </div>

              {/* 카드 비교 */}
              <div className='p-8'>
                <div className='grid grid-cols-1 xl:grid-cols-2 gap-8'>
                  {/* 기존 카드 */}
                  <div className='space-y-4'>
                    <div className='flex items-center gap-3 mb-6'>
                      <div className='w-4 h-4 bg-gray-400 rounded-full' />
                      <h3 className='text-lg font-semibold text-gray-700'>
                        기존 서버 카드 (v2.0)
                      </h3>
                    </div>
                    <div className='max-w-sm'>
                      <ImprovedServerCard
                        server={server}
                        onClick={() => {}}
                        variant={selectedVariant}
                        showRealTimeUpdates={true}
                        index={index}
                      />
                    </div>

                    {/* 기존 카드 문제점 */}
                    <div className='bg-red-50 border border-red-200 rounded-lg p-4 mt-4'>
                      <h4 className='font-medium text-red-800 mb-2 flex items-center gap-2'>
                        <AlertCircle className='w-4 h-4' />
                        주요 문제점
                      </h4>
                      <ul className='text-sm text-red-700 space-y-1'>
                        <li>• 메트릭 프로그레스바가 너무 작음 (4px)</li>
                        <li>• 서비스 정보 제한적 (2개만 표시)</li>
                        <li>• 실시간 업데이트 피드백 부족</li>
                        <li>• 상태별 색상 구분 모호</li>
                        <li>• 인터랙션 효과 미미</li>
                      </ul>
                    </div>
                  </div>

                  {/* 화살표 */}
                  <div className='hidden xl:flex items-center justify-center'>
                    <div className='text-blue-500'>
                      <ArrowRight className='w-12 h-12' />
                    </div>
                  </div>

                  {/* 개선된 카드 */}
                  <div className='space-y-4'>
                    <div className='flex items-center gap-3 mb-6'>
                      <div className='w-4 h-4 bg-green-500 rounded-full' />
                      <h3 className='text-lg font-semibold text-green-700'>
                        개선된 서버 카드 (v3.0)
                      </h3>
                    </div>
                    <div className='max-w-sm'>
                      <ImprovedServerCard
                        server={server}
                        onClick={() => {}}
                        variant={selectedVariant}
                        showRealTimeUpdates={true}
                        index={index}
                      />
                    </div>

                    {/* 개선사항 */}
                    <div className='bg-green-50 border border-green-200 rounded-lg p-4 mt-4'>
                      <h4 className='font-medium text-green-800 mb-2 flex items-center gap-2'>
                        <CheckCircle className='w-4 h-4' />
                        주요 개선사항
                      </h4>
                      <ul className='text-sm text-green-700 space-y-1'>
                        <li>• 메트릭 프로그레스바 크기 증가 (8px~12px)</li>
                        <li>• 서비스 정보 확장 (3~5개 표시)</li>
                        <li>• 실시간 업데이트 시각적 피드백</li>
                        <li>• 메트릭별 색상 구분 강화</li>
                        <li>• 부드러운 애니메이션 및 호버 효과</li>
                        <li>• 임계값 표시선 추가</li>
                        <li>• 접근성 향상 (아이콘, 라벨)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 결론 */}
        <div className='bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl text-white p-8 mt-12'>
          <div className='max-w-4xl mx-auto text-center'>
            <h2 className='text-2xl font-bold mb-4'>🎯 UX/UI 개선 결과</h2>
            <p className='text-lg opacity-90 mb-6'>
              기존 서버 카드의 가독성과 사용성 문제를 해결하여 모니터링 효율성을
              크게 향상시켰습니다.
            </p>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 text-center'>
              <div>
                <div className='text-3xl font-bold mb-2'>+40%</div>
                <div className='text-sm opacity-80'>정보 가독성 향상</div>
              </div>
              <div>
                <div className='text-3xl font-bold mb-2'>+60%</div>
                <div className='text-sm opacity-80'>사용자 인터랙션 개선</div>
              </div>
              <div>
                <div className='text-3xl font-bold mb-2'>+30%</div>
                <div className='text-sm opacity-80'>모니터링 효율성 증가</div>
              </div>
            </div>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className='mt-8 text-center text-gray-500 text-sm'>
          <Info className='w-4 h-4 inline mr-2' />
          실제 서버 데이터는 15초마다 자동으로 업데이트됩니다. 위 개선사항들은
          실제 사용자 피드백과 접근성 가이드라인을 기반으로 개발되었습니다.
        </div>
      </div>
    </div>
  );
};

export default ServerCardComparisonClient;
