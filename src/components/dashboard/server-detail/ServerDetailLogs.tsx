'use client';

import React from 'react';

export function ServerDetailLogs() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>시스템 로그</h3>
        <button className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm'>
          <i className='fas fa-download mr-2'></i>
          로그 다운로드
        </button>
      </div>

      <div className='bg-gray-900 rounded-xl p-4 text-green-400 font-mono text-sm max-h-96 overflow-y-auto'>
        <div className='space-y-1'>
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className='flex'>
              <span className='text-gray-500 w-24 flex-shrink-0'>
                {new Date(Date.now() - i * 60000).toLocaleTimeString()}
              </span>
              <span className='ml-2'>
                {
                  [
                    '[INFO] System status: healthy',
                    '[DEBUG] Memory usage: 67.2%',
                    '[INFO] New connection from 192.168.1.100',
                    '[WARN] High CPU usage detected: 89%',
                    '[INFO] Service nginx restarted successfully',
                    '[ERROR] Database connection timeout',
                    '[INFO] Backup completed successfully',
                    '[DEBUG] Cache cleared: 1.2GB freed',
                  ][i % 8]
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
