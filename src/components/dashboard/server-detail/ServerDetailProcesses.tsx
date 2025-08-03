'use client';

import type { ProcessInfo } from '@/types/ai-assistant-input-schema'; // 실제 데이터 타입 임포트
import { useEffect, useState } from 'react';

interface ServerDetailProcessesProps {
  serverId?: string | null;
}

export function ServerDetailProcesses({
  serverId,
}: ServerDetailProcessesProps) {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serverId) return;

    const fetchProcesses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/servers/${serverId}/processes`);
        if (!response.ok) {
          throw new Error('프로세스 데이터를 가져오는 데 실패했습니다.');
        }
        const data = await response.json();
        setProcesses(data.processes || []);
      } catch (err: Error | unknown) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    // 최초 데이터 로드
    fetchProcesses();

    // 120초마다 데이터 갱신
    // 🎯 데이터 생성기와 동기화: 30초 간격
    const intervalId = setInterval(fetchProcesses, 30000);

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(intervalId);
  }, [serverId]);

  if (isLoading) {
    return (
      <div className="p-8 text-center">프로세스 목록을 불러오는 중...</div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">오류: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        실행 중인 프로세스
      </h3>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  PID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  프로세스명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  CPU %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  메모리 %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {processes.length > 0 ? (
                processes.map((process) => (
                  <tr key={process.pid} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {process.pid}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {process.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {process.cpuUsage.toFixed(2)}%
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {(process.memoryUsage / (1024 * 1024)).toFixed(2)} MB
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                        {process.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    실행 중인 프로세스가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
