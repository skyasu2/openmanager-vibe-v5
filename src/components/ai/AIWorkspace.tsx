'use client';

/**
 * 🤖 AI Workspace Controller
 * Orchestrates the AI Assistant views using shared components.
 * Adapts layout based on 'mode' (Sidebar vs Fullscreen).
 *
 * v2.0.0 - 리팩토링 완료:
 * - 상태 동기화: useAIChatSync 훅 통합
 * - 실제 데이터: serverDataStore 연동 (하드코딩 제거)
 * - 테마 통일: Dark mode 일관성 적용
 */

import {
  Activity,
  AlertTriangle,
  ArrowLeftFromLine,
  CheckCircle,
  Layout,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Server,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useServerDataStore } from '@/components/providers/StoreProvider';
import { AIFunctionPages } from '@/domains/ai-sidebar/components/AIFunctionPages';
import { useAIChatSync } from '@/hooks/useAIChatSync';
import { useAIChatStore } from '@/stores/ai-chat-store';
import AIAssistantIconPanel, {
  type AIAssistantFunction,
} from './AIAssistantIconPanel';
import AIChatInterface from './AIChatInterface';
import AIContentArea from './AIContentArea';

interface AIWorkspaceProps {
  mode: 'sidebar' | 'fullscreen';
  onClose?: () => void;
}

export default function AIWorkspace({ mode, onClose }: AIWorkspaceProps) {
  const router = useRouter();
  const [selectedFunction, setSelectedFunction] =
    useState<AIAssistantFunction>('chat');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // 🔄 상태 동기화 훅 - 사이드바 ↔ 풀스크린 메시지 동기화
  const { initializeSync, sidebarMessageCount, fullscreenMessageCount } =
    useAIChatSync({
      direction: 'bidirectional',
      autoSync: true,
    });

  // 📊 실제 서버 데이터 가져오기 (하드코딩 제거)
  const systemStatus = useServerDataStore((state) => state.getSystemStatus());

  // 🔄 풀스크린 진입 시 초기 동기화
  useEffect(() => {
    if (mode === 'fullscreen') {
      initializeSync();
    }
  }, [mode, initializeSync]);

  // 📱 SIDEBAR LAYOUT (Mobile/Compact)
  if (mode === 'sidebar') {
    return (
      <div className="flex h-full flex-col bg-[#1e1e1e]">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <span className="font-semibold text-gray-200">AI Assistant</span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeftFromLine className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          {selectedFunction === 'chat' ? (
            <AIChatInterface mode="sidebar" onClose={onClose} />
          ) : (
            <AIFunctionPages
              selectedFunction={selectedFunction}
              onFunctionChange={setSelectedFunction}
            />
          )}
        </div>
        {/* 하단 네비게이션 - 채팅 모드일 때만 표시 */}
        {selectedFunction === 'chat' && (
          <div className="shrink-0 border-t border-gray-800 bg-[#252526] p-2">
            <AIAssistantIconPanel
              selectedFunction={selectedFunction}
              onFunctionChange={setSelectedFunction}
              isMobile
            />
          </div>
        )}
      </div>
    );
  }

  // 🖥️ FULLSCREEN LAYOUT (Desktop/3-Pane)
  return (
    <div className="flex h-full w-full overflow-hidden bg-[#1e1e1e] text-gray-200">
      {/* LEFT SIDEBAR (Navigation) */}
      <div className="flex w-[260px] flex-col border-r border-gray-800 bg-[#18181b]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            AI Assistant
          </span>
          <button
            onClick={() => router.back()}
            className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
            title="뒤로 가기"
          >
            <ArrowLeftFromLine className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 pb-4">
          <button
            onClick={() => useAIChatStore.getState().resetChat()}
            className="flex w-full items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Feature Navigation using IconPanel logic but styled for Left Sidebar */}
        <div className="flex-1 px-2">
          <div className="mb-2 px-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            Features
          </div>
          {/* We reuse AIAssistantIconPanel but we need it to look like a list? 
                AIAssistantIconPanel is designed as a vertical strip of icons. 
                If we want a full list (Icon + Text), we might need to interpret the ICONS array manually here 
                OR accept that the Fullscreen Left Sidebar is just the Icon Panel? 
                
                The user wants "Sidebar-like navigation (Icon Panel)". 
                So using the actual IconPanel component is the most "consistent" way.
                However, a 260px wide sidebar with just 60px wide icons looks empty.
                
                Let's stick to the previous implementation's 'List Item' look but mapped to the NEW functions.
                We can import AI_ASSISTANT_ICONS from AIAssistantIconPanel to generate this list.
            */}
          <div className="space-y-1">
            {/* We need to import AI_ASSISTANT_ICONS. It's exported from the component file. */}
            {/* Since we can't easily iterate imported constants in 'replace_file_content' without extra steps, 
                    I'll implement a clean mapping here using the component itself if possible, 
                    OR (better) use the component in a 'wide' mode if it supported it. 
                    
                    For now, I will hardcode the loop using the known structure to ensure pixel-perfect list look, 
                    utilizing the shared state.
                */}
          </div>

          {/* Actually, let's just use AIAssistantIconPanel directly. 
                 It is the "Icon Panel" after all. Even in fullscreen, 
                 an icon strip is a valid design choice (like VS Code activity bar).
             */}
          <div className="mt-2">
            <AIAssistantIconPanel
              selectedFunction={selectedFunction}
              onFunctionChange={setSelectedFunction}
              className="w-full !bg-transparent !border-none !p-0 items-start"
            />
            {/* Note: AIAssistantIconPanel has fixed styles. Overriding might be messy.
                   But ensuring consistency is key.
                   Let's wrap it nicely.
               */}
          </div>
        </div>
      </div>

      {/* CENTER & RIGHT (Main Content) */}
      <div className="flex flex-1 overflow-hidden">
        {/* CENTER CONTENT */}
        <div className="flex flex-1 flex-col relative min-w-0">
          {/* Context Header */}
          <div className="flex h-14 items-center justify-between border-b border-gray-800 bg-[#1e1e1e] px-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span className="font-medium text-gray-200">
                OpenManager Vibe
              </span>
              <span>/</span>
              <span>AI Workspace</span>
              <span>/</span>
              <span className="text-white capitalize">{selectedFunction}</span>
            </div>
            {selectedFunction === 'chat' && (
              <button
                onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
                title="Toggle Context Panel"
              >
                {isRightPanelOpen ? (
                  <PanelRightClose className="h-5 w-5" />
                ) : (
                  <PanelRightOpen className="h-5 w-5" />
                )}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-hidden relative">
            {selectedFunction === 'chat' ? (
              <AIChatInterface mode="fullscreen" embedded />
            ) : (
              <div className="h-full p-0">
                <AIContentArea selectedFunction={selectedFunction} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR (Desktop Only, Chat Mode) - 실제 데이터 연동 */}
        {selectedFunction === 'chat' && isRightPanelOpen && (
          <div className="w-[320px] border-l border-gray-800 bg-[#18181b] flex flex-col">
            <div className="flex h-14 items-center border-b border-gray-800 px-4">
              <h3 className="font-semibold text-sm text-gray-200 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" />
                System Context
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Server Summary - 실제 데이터 */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Live Status
                </h4>
                <div className="rounded-lg border border-gray-800 bg-[#252526] p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300 flex items-center gap-2">
                      <Server className="h-3.5 w-3.5 text-blue-400" />
                      Total Servers
                    </span>
                    <span className="text-sm font-bold text-white">
                      {systemStatus.totalServers}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300 flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                      Healthy
                    </span>
                    <span className="text-sm font-bold text-green-400">
                      {systemStatus.healthyServers}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300 flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                      Warning
                    </span>
                    <span className="text-sm font-bold text-yellow-400">
                      {systemStatus.warningServers}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300 flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                      Critical
                    </span>
                    <span className="text-sm font-bold text-red-400">
                      {systemStatus.criticalServers}
                    </span>
                  </div>
                </div>
                {systemStatus.isLoading && (
                  <p className="text-xs text-gray-500 text-center">
                    Loading server data...
                  </p>
                )}
              </div>

              {/* Chat Sync Status */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chat Sync
                </h4>
                <div className="rounded-lg border border-gray-800 bg-[#252526] p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">
                      Sidebar Messages
                    </span>
                    <span className="text-sm font-medium text-gray-200">
                      {sidebarMessageCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">
                      Fullscreen Messages
                    </span>
                    <span className="text-sm font-medium text-gray-200">
                      {fullscreenMessageCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Tools */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Tools
                </h4>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 rounded-md bg-[#252526] p-2 text-sm text-gray-300 border border-gray-800">
                    <Layout className="h-4 w-4 text-purple-400" />
                    <span>Log Analyzer</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-[#252526] p-2 text-sm text-gray-300 border border-gray-800">
                    <Activity className="h-4 w-4 text-green-400" />
                    <span>Metrics Monitor</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
