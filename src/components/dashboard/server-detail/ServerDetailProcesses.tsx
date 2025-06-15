'use client';

import React from 'react';

export function ServerDetailProcesses() {
  return (
    <div className='space-y-6'>
      <h3 className='text-lg font-semibold text-gray-900'>
        실행 중인 프로세스
      </h3>

      <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  PID
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  프로세스명
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  CPU %
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  메모리 %
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  상태
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {Array.from({ length: 8 }, (_, i) => (
                <tr key={i} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {1000 + Math.floor(Math.random() * 9000)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {
                      [
                        'nginx',
                        'nodejs',
                        'postgresql',
                        'redis-server',
                        'systemd',
                        'chrome',
                        'docker',
                        'ssh',
                      ][i]
                    }
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {(Math.random() * 15).toFixed(1)}%
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {(Math.random() * 25).toFixed(1)}%
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'>
                      실행 중
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
