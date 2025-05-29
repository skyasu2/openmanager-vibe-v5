'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';
import ServerDashboard from './ServerDashboard';
import { SystemControlPanel } from '../system/SystemControlPanel';
import ServerGenerationProgress from './ServerGenerationProgress';
import AnimatedServerCard from './AnimatedServerCard';
import ServerDetailModal from './ServerDetailModal';

interface DashboardContentProps {
  showSequentialGeneration: boolean;
  servers: any[];
  status: any;
  actions: any;
  selectedServer: any;
  onServerClick: (server: any) => void;
  onServerModalClose: () => void;
  onStatsUpdate: (stats: any) => void;
  onShowSequentialChange: (show: boolean) => void;
  mainContentVariants: any;
  isAgentOpen: boolean;
}

const DashboardContent = memo(function DashboardContent({
  showSequentialGeneration,
  servers,
  status,
  actions,
  selectedServer,
  onServerClick,
  onServerModalClose,
  onStatsUpdate,
  onShowSequentialChange,
  mainContentVariants,
  isAgentOpen
}: DashboardContentProps) {
  return (
    <motion.main 
      className="relative"
      variants={mainContentVariants}
      animate={isAgentOpen ? 'pushed' : 'normal'}
    >
      {/* 순차 서버 생성 프로그레스 */}
      {showSequentialGeneration && (
        <div className="p-6">
          <ServerGenerationProgress
            currentCount={status.currentCount}
            totalServers={status.totalServers}
            progress={status.progress}
            isGenerating={status.isGenerating}
            isComplete={status.isComplete}
            nextServerType={status.nextServerType}
            currentMessage={status.currentMessage}
            error={status.error}
            lastGeneratedServer={status.lastGeneratedServer}
          />
          
          {/* 서버 카드 그리드 - 순차 등장 애니메이션 */}
          {servers.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  배포된 서버 ({servers.length}/20)
                </h2>
                
                <div className="flex items-center space-x-4">
                  {!status.isComplete && (
                    <button
                      onClick={actions.stop}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      배포 중지
                    </button>
                  )}
                  
                  <button
                    onClick={actions.reset}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    리셋
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {servers.map((server, index) => (
                  <AnimatedServerCard
                    key={server.id}
                    server={server}
                    index={index}
                    delay={0}
                    onClick={onServerClick}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* 완료 시 대시보드로 전환 버튼 */}
          {status.isComplete && (
            <div className="text-center mt-8">
              <button
                onClick={() => onShowSequentialChange(false)}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                📊 대시보드로 이동하기
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* 기존 서버 대시보드 */}
      {!showSequentialGeneration && (
        <div className="space-y-6">
          {/* 통합 시스템 제어 패널 */}
          <div className="p-6">
            <SystemControlPanel />
          </div>
          
          {/* 서버 대시보드 */}
          <ServerDashboard onStatsUpdate={onStatsUpdate} />
        </div>
      )}
      
      {/* 서버 상세 모달 */}
      <ServerDetailModal
        server={selectedServer}
        onClose={onServerModalClose}
      />
    </motion.main>
  );
});

export default DashboardContent; 