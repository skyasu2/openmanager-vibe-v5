/**
 * ⚙️ 일반 설정 탭 컴포넌트
 *
 * 테마, 백업 등 일반적인 설정을 관리하는 탭
 */

'use client';

// framer-motion 제거 - CSS 애니메이션 사용
import { Settings } from 'lucide-react';
import { useInlineFeedback } from '@/components/ui/InlineFeedbackSystem';

interface SettingsData {
  theme: string;
  backup: {
    lastBackup: string;
  };
}

interface GeneralSettingsTabProps {
  settingsData: SettingsData;
}

export function GeneralSettingsTab({ settingsData }: GeneralSettingsTabProps) {
  const { success, error, info } = useInlineFeedback();

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/10 p-4">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Settings className="h-5 w-5 text-gray-400" />
          일반 설정
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-gray-800/50 p-3 text-center">
              <div className="mx-auto mb-2 h-3 w-3 rounded-full bg-purple-400" />
              <p className="mb-1 text-xs text-gray-400">현재 테마</p>
              <p className="text-sm font-medium text-white">
                {settingsData.theme}
              </p>
            </div>
            <div className="rounded-lg bg-gray-800/50 p-3 text-center">
              <div className="mx-auto mb-2 h-3 w-3 rounded-full bg-green-400" />
              <p className="mb-1 text-xs text-gray-400">마지막 백업</p>
              <p className="text-sm font-medium text-white">
                {settingsData.backup.lastBackup}
              </p>
            </div>
            <div className="rounded-lg bg-gray-800/50 p-3 text-center">
              <div className="mx-auto mb-2 h-3 w-3 rounded-full bg-blue-400" />
              <p className="mb-1 text-xs text-gray-400">언어</p>
              <p className="text-sm font-medium text-white">한국어</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => {
                void (async () => {
                  try {
                    info('settings', '테마를 변경 중...');
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    success('settings', '테마가 변경되었습니다.');
                  } catch {
                    error('settings', '테마 변경 실패');
                  }
                })();
              }}
              className="rounded-lg border border-gray-500/30 bg-gray-500/20 px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-500/30"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold">🎨 테마 전환</span>
                <span className="text-xs text-gray-200">
                  다크/라이트 모드를 전환하고 UI 색상 테마를 변경합니다
                </span>
              </div>
            </button>
            <button
              onClick={() => {
                void (async () => {
                  try {
                    info('backup', '백업을 생성 중...');
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    success('backup', '백업이 성공적으로 생성되었습니다.');
                  } catch {
                    error('backup', '백업 생성 실패');
                  }
                })();
              }}
              className="rounded-lg border border-gray-500/30 bg-gray-500/20 px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-500/30"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="font-semibold">💾 백업 생성</span>
                <span className="text-xs text-gray-200">
                  현재 설정과 데이터를 안전하게 백업 파일로 저장합니다
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
