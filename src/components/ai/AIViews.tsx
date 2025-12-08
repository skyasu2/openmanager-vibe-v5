'use client';

import { Activity, Clock, Layout, Settings, Terminal } from 'lucide-react';

export function HistoryView() {
  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <Clock className="h-5 w-5 text-blue-500" />
        Chat History
      </h2>
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="group cursor-pointer rounded-xl border border-gray-800 bg-[#252526] p-4 transition-colors hover:border-gray-700"
          >
            <div className="mb-2 flex items-start justify-between">
              <h3 className="font-semibold text-gray-200 transition-colors group-hover:text-blue-400">
                Server CPU Spike Analysis
              </h3>
              <span className="text-xs text-gray-500">2h ago</span>
            </div>
            <p className="line-clamp-2 text-xs text-gray-400">
              Analyzed the root cause of the CPU spike on server-alpha-01. Found a memory leak...
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ToolsView({ onRunTool }: { onRunTool?: (prompt: string) => void }) {
  const handleToolClick = (toolName: string, prompt: string) => {
    if (onRunTool) {
      onRunTool(prompt);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <Terminal className="h-5 w-5 text-purple-500" />
        AI Tools & Functions
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {/* Automated Failure Report */}
        <button 
          onClick={() => handleToolClick('Failure Report', 'Please analyze the current server logs and metrics to generate a comprehensive failure root cause report. Identify any critical anomalies.')}
          className="w-full text-left cursor-pointer rounded-xl border border-gray-800 bg-[#252526] p-4 transition-colors hover:bg-[#2a2a2d] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className="mb-1 font-semibold text-gray-200">Automated Failure Report</h3>
          <p className="text-xs text-gray-400">
            Analyze logs and metrics to generate a comprehensive failure root cause report.
          </p>
        </button>

        {/* Anomaly Prediction */}
        <button 
          onClick={() => handleToolClick('Anomaly Prediction', 'Based on the historical data and current trends, predict any potential system anomalies or load spikes for the next 24 hours.')}
          className="w-full text-left cursor-pointer rounded-xl border border-gray-800 bg-[#252526] p-4 transition-colors hover:bg-[#2a2a2d] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Layout className="h-6 w-6" />
          </div>
          <h3 className="mb-1 font-semibold text-gray-200">Anomaly Prediction</h3>
          <p className="text-xs text-gray-400">
            Forecast future system anomalies and load spikes using historical data.
          </p>
        </button>

        {/* Advanced Functions */}
        <button 
          onClick={() => handleToolClick('Advanced Functions', 'List all available advanced diagnostic tools and optimization scripts I can run on the infrastructure.')}
          className="w-full text-left cursor-pointer rounded-xl border border-gray-800 bg-[#252526] p-4 transition-colors hover:bg-[#2a2a2d] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
            <Settings className="h-6 w-6" />
          </div>
          <h3 className="mb-1 font-semibold text-gray-200">Advanced AI Functions</h3>
          <p className="text-xs text-gray-400">
            Access deep diagnostic tools, system optimization, and automated remediation.
          </p>
        </button>
      </div>
    </div>
  );
}
