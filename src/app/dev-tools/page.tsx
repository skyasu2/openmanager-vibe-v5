'use client';

import AITestPanel from '@/components/dev-tools/AITestPanel';
import KeyManagerPanel from '@/components/dev-tools/KeyManagerPanel';
import MCPDeveloperPanel from '@/components/dev-tools/MCPDeveloperPanel';
import ServiceStatusPanel from '@/components/dev-tools/ServiceStatusPanel';
import { VercelAPITesterPanel } from '@/components/dev-tools/VercelAPITesterPanel';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function DevToolsPage() {
  const [autoRefresh, setAutoRefresh] = useState(false);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* 헤더 */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-100'>
              🛠️ 개발자 도구
            </h1>
            <p className='text-slate-600 dark:text-slate-400 mt-2'>
              OpenManager Vibe v5 - MCP 개발/테스트 & Cursor-Vercel 연동 도구
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className='flex items-center gap-2'
            >
              <RefreshCw
                className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`}
              />
              자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>

        {/* Vercel API 테스터 패널 (최상단에 배치) */}
        <VercelAPITesterPanel />

        {/* MCP 개발자 패널 */}
        <MCPDeveloperPanel />

        {/* 서비스 상태 패널 */}
        <ServiceStatusPanel autoRefresh={autoRefresh} />

        {/* 키 관리자 패널 */}
        <KeyManagerPanel />

        {/* AI 테스트 패널 */}
        <AITestPanel />
      </div>
    </div>
  );
}
