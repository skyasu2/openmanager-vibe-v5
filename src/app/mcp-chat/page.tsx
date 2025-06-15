/**
 * 🤖 MCP 서버 모니터링 AI 채팅 테스트 페이지
 */

import MCPMonitoringChat from '@/components/ai/MCPMonitoringChat';

export default function MCPChatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 MCP 서버 모니터링 AI 어시스턴트
          </h1>
          <p className="text-gray-600">
            생각과정 애니메이션과 타이핑 효과가 있는 지능형 서버 모니터링 시스템
          </p>
        </div>
        
        <MCPMonitoringChat />
      </div>
    </div>
  );
} 