import React, { useEffect, useState } from 'react';
import { useAIAgent } from '@/modules/ai-agent/infrastructure/AIAgentProvider';
import { HybridEngineStatus } from '@/services/ai/hybrid-failover-engine';

export function AIEngineControl() {
  const { setEngineMode, getEngineStatus } = useAIAgent();
  const [status, setStatus] = useState<HybridEngineStatus | null>(null);

  useEffect(() => {
    const updateStatus = () => setStatus(getEngineStatus());
    updateStatus();
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, [getEngineStatus]);

  return (
    <div className='bg-white rounded-lg shadow p-6'>
      <h3 className='text-lg font-semibold mb-4'>🤖 AI 엔진 제어</h3>

      <div className='grid grid-cols-3 gap-4 mb-6'>
        <div className='text-center'>
          <div
            className={`w-3 h-3 rounded-full mx-auto mb-2 ${
              status?.currentMode === 'mcp' ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
          <span className='text-sm'>MCP 모드</span>
        </div>
        <div className='text-center'>
          <div
            className={`w-3 h-3 rounded-full mx-auto mb-2 ${
              status?.currentMode === 'rag' ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
          <span className='text-sm'>RAG 모드</span>
        </div>
        <div className='text-center'>
          <div
            className={`w-3 h-3 rounded-full mx-auto mb-2 ${
              status?.mcpHealth?.healthy ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className='text-sm'>MCP 건강성</span>
        </div>
      </div>

      <div className='flex space-x-2'>
        <button
          onClick={() => setEngineMode('auto')}
          className='flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
        >
          🔄 자동 모드
        </button>
        <button
          onClick={() => setEngineMode('rag')}
          className='flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600'
        >
          🧠 RAG 모드
        </button>
        <button
          onClick={() => setEngineMode('mcp')}
          className='flex-1 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600'
        >
          🌐 MCP 모드
        </button>
      </div>

      {status && (
        <div className='mt-4 text-sm text-gray-600'>
          <div>마지막 처리 시간: {status.lastProcessingTime}ms</div>
          <div>성공률: {((status.successRate || 0) * 100).toFixed(1)}%</div>
          <div>총 쿼리 수: {status.totalQueries}</div>
        </div>
      )}
    </div>
  );
}

export default AIEngineControl;
