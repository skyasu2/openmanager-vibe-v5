'use client';

/**
 * 🤖 AI Workspace Controller
 * Orchestrates the "Chat", "History", and "Tools" views.
 * adapts layout based on 'mode' (Sidebar vs Fullscreen)
 */

import {
  Activity,
  ArrowLeftFromLine,
  Clock,
  Layout,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Settings,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAIChatStore } from '@/stores/ai-chat-store';
import AIChatInterface from './AIChatInterface';
import { HistoryView, ToolsView } from './AIViews';

interface AIWorkspaceProps {
  mode: 'sidebar' | 'fullscreen';
  onClose?: () => void;
}

export default function AIWorkspace({ mode, onClose }: AIWorkspaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'tools'>(
    'chat'
  );
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  const handleFunctionClick = (
    type: 'chat' | 'report' | 'prediction' | 'advanced'
  ) => {
    setActiveTab('chat'); // All functions currently use the chat interface
    const store = useAIChatStore.getState();

    switch (type) {
      case 'chat':
        // Just switch to chat, keep context or clear if needed?
        // For now, just focus chat
        break;
      case 'report':
        store.setInputValue(
          'Please analyze the current server logs and metrics to generate a comprehensive failure root cause report. Identify any critical anomalies.'
        );
        break;
      case 'prediction':
        store.setInputValue(
          'Based on the historical data and current trends, predict any potential system anomalies or load spikes for the next 24 hours.'
        );
        break;
      case 'advanced':
        // For advanced, maybe we switch to Tools view or just show prompts?
        // User requested "Advanced Functions" icon. Let's map it to Tools view for now, or a specific prompt.
        // "AI Advanced Functions" -> Let's go to Tools tab actually, as it lists them.
        setActiveTab('tools');
        return;
    }
  };

  // 📱 SIDEBAR LAYOUT (Mobile/Compact)
  if (mode === 'sidebar') {
    return (
      <div className="flex h-full bg-[#1e1e1e]">
        {/* Main Content Area (Left) */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'chat' && (
            <AIChatInterface mode="sidebar" onClose={onClose} />
          )}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'tools' && (
            <ToolsView
              onRunTool={(prompt) => {
                setActiveTab('chat');
                useAIChatStore.getState().setInputValue(prompt);
              }}
            />
          )}
        </div>

        {/* Right Navigation Bar (Sidebar Mode Only) */}
        <div className="flex w-[60px] flex-col items-center gap-4 border-l border-gray-800 bg-[#252526] py-4">
          {/* Chat / Query */}
          <button
            onClick={() => handleFunctionClick('chat')}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
              activeTab === 'chat'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            title="Natural Language Query"
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          {/* Failure Report */}
          <button
            onClick={() => handleFunctionClick('report')}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition-all hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20"
            title="Automated Failure Report"
          >
            <Activity className="h-5 w-5" />
          </button>

          {/* Anomaly Prediction */}
          <button
            onClick={() => handleFunctionClick('prediction')}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-400 transition-all hover:bg-green-500 hover:text-white hover:shadow-lg hover:shadow-green-500/20"
            title="Anomaly Prediction"
          >
            <Layout className="h-5 w-5" />
          </button>

          {/* Advanced Functions */}
          <button
            onClick={() => handleFunctionClick('advanced')}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
              activeTab === 'tools'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white hover:shadow-lg hover:shadow-purple-500/20'
            }`}
            title="Advanced AI Functions"
          >
            <Settings className="h-5 w-5" />
          </button>

          <div className="my-2 h-px w-8 bg-gray-700" />

          {/* History (Keeping generic access) */}
          <button
            onClick={() => setActiveTab('history')}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
            title="History"
          >
            <Clock className="h-5 w-5" />
          </button>
        </div>
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

        {/* Menu Items - Aligned with Right Sidebar Icons */}
        <div className="flex-1 space-y-1 overflow-y-auto px-2">
          <div className="mb-2 px-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            Features
          </div>

          {/* Chat */}
          <button
            onClick={() => handleFunctionClick('chat')}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              activeTab === 'chat'
                ? 'bg-[#2a2a2d] text-blue-400 border-l-2 border-blue-500'
                : 'text-gray-400 hover:bg-[#2a2a2d] hover:text-gray-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Natural Language Query</span>
          </button>

          {/* Failure Report */}
          <button
            onClick={() => handleFunctionClick('report')}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-[#2a2a2d] hover:text-red-400"
          >
            <Activity className="h-4 w-4" />
            <span>Failure Report</span>
          </button>

          {/* Prediction */}
          <button
            onClick={() => handleFunctionClick('prediction')}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-[#2a2a2d] hover:text-green-400"
          >
            <Layout className="h-4 w-4" />
            <span>Anomaly Prediction</span>
          </button>

          {/* Advanced */}
          <button
            onClick={() => handleFunctionClick('advanced')}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              activeTab === 'tools'
                ? 'bg-[#2a2a2d] text-purple-400 border-l-2 border-purple-500'
                : 'text-gray-400 hover:bg-[#2a2a2d] hover:text-gray-200'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Advanced Functions</span>
          </button>

          <div className="my-2 border-t border-gray-800" />
          <button
            onClick={() => setActiveTab('history')}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              activeTab === 'history'
                ? 'bg-[#2a2a2d] text-white'
                : 'text-gray-400 hover:bg-[#2a2a2d] hover:text-gray-200'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>History</span>
          </button>
        </div>

        <div className="border-t border-gray-800 p-4">
          <button className="flex w-full items-center gap-3 text-sm text-gray-400 hover:text-gray-200">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* CENTER & RIGHT (Main Content) */}
      <div className="flex flex-1 overflow-hidden">
        {/* CENTER CONTENT */}
        <div className="flex flex-1 flex-col relative min-w-0">
          {/* Context Header (Desktop Only) */}
          <div className="flex h-14 items-center justify-between border-b border-gray-800 bg-[#1e1e1e] px-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span className="font-medium text-gray-200">
                OpenManager Vibe
              </span>
              <span>/</span>
              <span>AI Workspace</span>
              <span>/</span>
              <span className="text-white capitalize">{activeTab}</span>
            </div>
            {activeTab === 'chat' && (
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

          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && (
              <AIChatInterface mode="fullscreen" embedded />
            )}
            {activeTab === 'history' && (
              <div className="p-8">
                <HistoryView />
              </div>
            )}
            {activeTab === 'tools' && (
              <div className="p-8">
                <ToolsView
                  onRunTool={(prompt) => {
                    setActiveTab('chat');
                    useAIChatStore.getState().setInputValue(prompt);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR (Desktop Only, Chat Mode) */}
        {activeTab === 'chat' && isRightPanelOpen && (
          <div className="w-[320px] border-l border-gray-800 bg-[#18181b] flex flex-col">
            <div className="flex h-14 items-center border-b border-gray-800 px-4">
              <h3 className="font-semibold text-sm text-gray-200 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" />
                System Context
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Server Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Live Status
                </h4>
                <div className="rounded-lg border border-gray-800 bg-[#252526] p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">Total Servers</span>
                    <span className="text-sm font-bold text-white">42</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Critical</span>
                    <span className="text-sm font-bold text-red-400">3</span>
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
