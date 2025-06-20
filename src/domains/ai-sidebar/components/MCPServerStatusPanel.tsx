/**
 * 🎨 MCP Server Status Panel - 반응형 접근성 적용
 *
 * ✅ 모바일/노트북/데스크톱 대응
 * ✅ 시맨틱 HTML 적용 (section, status 역할)
 * ✅ 키보드 네비게이션 지원
 */

'use client';

import React from 'react';
import { XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { useMCPStatus } from '@/hooks/api/useMCPQuery';

export const MCPServerStatusPanel: React.FC = () => {
  const { data: mcpStatus, isLoading, error } = useMCPStatus();

  // 로딩 상태
  if (isLoading) {
    return (
      <section
        className='flex items-center gap-2 text-gray-600 p-3 rounded-lg bg-gray-50'
        role='status'
        aria-live='polite'
        aria-label='MCP 서버 상태 확인 중'
      >
        <div
          className='w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin'
          aria-hidden='true'
        />
        <span className='text-sm'>MCP 서버 상태 확인 중...</span>
      </section>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <section
        className='p-3 bg-red-50 rounded-lg border border-red-200'
        role='alert'
        aria-label='MCP 서버 연결 오류'
      >
        <div className='flex items-center gap-2 text-red-800 font-medium text-sm mb-1'>
          <XCircle className='w-4 h-4 flex-shrink-0' aria-hidden='true' />
          <h3>MCP 서버 연결 오류</h3>
        </div>
        <p className='text-red-700 text-xs'>
          서버 상태를 확인할 수 없습니다. 네트워크 연결을 확인해주세요.
        </p>
      </section>
    );
  }

  // 서버 데이터 추출
  const renderServer = mcpStatus?.mcp?.servers?.render;
  const localServers = mcpStatus?.mcp?.servers?.local || {};
  const totalServers = mcpStatus?.mcp?.stats?.totalServers || 0;
  const activeServers = Object.values(localServers).filter(
    server =>
      server &&
      typeof server === 'object' &&
      'status' in server &&
      server.status === 'connected'
  ).length;

  // 전체 상태 계산
  const overallStatus =
    renderServer?.status === 'connected' && activeServers > 0
      ? 'healthy'
      : renderServer?.status === 'connected'
        ? 'warning'
        : 'error';

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: '정상',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: '주의',
        };
      default:
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: '오류',
        };
    }
  };

  const statusConfig = getStatusConfig(overallStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <section
      className={`p-3 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor}`}
      role='status'
      aria-label={`MCP 서버 상태: ${statusConfig.label}`}
    >
      {/* 상태 헤더 - 반응형 */}
      <div className='flex items-center gap-2 mb-2'>
        <StatusIcon
          className={`w-4 h-4 sm:w-5 sm:h-5 ${statusConfig.color} flex-shrink-0`}
          aria-hidden='true'
        />
        <h3
          className={`font-medium text-sm sm:text-base ${statusConfig.color}`}
        >
          MCP 서버 상태: {statusConfig.label}
        </h3>
      </div>

      {/* 상세 정보 - 반응형 텍스트 */}
      <div className='space-y-1 text-xs sm:text-sm text-gray-600'>
        <div className='flex justify-between items-center'>
          <span>전체 서버:</span>
          <span className='font-medium'>{totalServers}개</span>
        </div>
        <div className='flex justify-between items-center'>
          <span>활성 서버:</span>
          <span
            className={`font-medium ${activeServers > 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {activeServers}개
          </span>
        </div>
        {renderServer && (
          <div className='flex justify-between items-center'>
            <span>Render 서버:</span>
            <span
              className={`font-medium text-xs px-2 py-1 rounded ${
                renderServer.status === 'connected'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {renderServer.status === 'connected' ? '연결됨' : '연결 안됨'}
            </span>
          </div>
        )}
      </div>

      {/* 상태 설명 */}
      <p className='text-xs text-gray-500 mt-2 leading-relaxed'>
        {overallStatus === 'healthy' && 'MCP 서버가 정상적으로 작동 중입니다.'}
        {overallStatus === 'warning' && '일부 서버에 문제가 있을 수 있습니다.'}
        {overallStatus === 'error' &&
          '서버 연결에 문제가 있습니다. 관리자에게 문의하세요.'}
      </p>
    </section>
  );
};
