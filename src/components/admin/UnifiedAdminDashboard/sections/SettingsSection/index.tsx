/**
 * 🎯 설정 섹션
 *
 * 대시보드 설정 관리
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Bell, Database } from 'lucide-react';

export default function SettingsSection() {
  const [settings, setSettings] = useState({
    autoRefreshInterval: 10000,
    notificationEnabled: true,
    alertThreshold: {
      cpu: 80,
      memory: 85,
      disk: 90,
    },
    dataRetention: 30,
    debugMode: false,
  });

  const handleSave = () => {
    // 설정 저장 로직
    console.log('설정 저장:', settings);
  };

  return (
    <div className='space-y-6'>
      {/* 일반 설정 */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
        <h3 className='text-lg font-semibold mb-6'>일반 설정</h3>

        <div className='space-y-4'>
          {/* 자동 새로고침 간격 */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              자동 새로고침 간격
            </label>
            <select
              value={settings.autoRefreshInterval}
              onChange={e =>
                setSettings({
                  ...settings,
                  autoRefreshInterval: Number(e.target.value),
                })
              }
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value={5000}>5초</option>
              <option value={10000}>10초</option>
              <option value={30000}>30초</option>
              <option value={60000}>1분</option>
            </select>
          </div>

          {/* 알림 활성화 */}
          <div className='flex items-center justify-between'>
            <div>
              <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                브라우저 알림
              </label>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                중요한 시스템 이벤트 알림 받기
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  notificationEnabled: !settings.notificationEnabled,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notificationEnabled
                  ? 'bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notificationEnabled
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 디버그 모드 */}
          <div className='flex items-center justify-between'>
            <div>
              <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                디버그 모드
              </label>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                상세한 로그 정보 표시
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({ ...settings, debugMode: !settings.debugMode })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.debugMode
                  ? 'bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.debugMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 알림 임계값 설정 */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
        <h3 className='text-lg font-semibold mb-6 flex items-center gap-2'>
          <Bell className='w-5 h-5' />
          알림 임계값
        </h3>

        <div className='space-y-4'>
          {Object.entries(settings.alertThreshold).map(([key, value]) => (
            <div key={key}>
              <div className='flex justify-between mb-2'>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 capitalize'>
                  {key === 'cpu'
                    ? 'CPU 사용률'
                    : key === 'memory'
                      ? '메모리 사용률'
                      : '디스크 사용률'}
                </label>
                <span className='text-sm font-medium'>{value}%</span>
              </div>
              <input
                type='range'
                min='50'
                max='95'
                value={value}
                onChange={e =>
                  setSettings({
                    ...settings,
                    alertThreshold: {
                      ...settings.alertThreshold,
                      [key]: Number(e.target.value),
                    },
                  })
                }
                className='w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer'
              />
            </div>
          ))}
        </div>
      </div>

      {/* 데이터 보관 설정 */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
        <h3 className='text-lg font-semibold mb-6 flex items-center gap-2'>
          <Database className='w-5 h-5' />
          데이터 보관
        </h3>

        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
            로그 보관 기간
          </label>
          <select
            value={settings.dataRetention}
            onChange={e =>
              setSettings({
                ...settings,
                dataRetention: Number(e.target.value),
              })
            }
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value={7}>7일</option>
            <option value={14}>14일</option>
            <option value={30}>30일</option>
            <option value={90}>90일</option>
          </select>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>
            이 기간이 지난 로그는 자동으로 삭제됩니다
          </p>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className='flex justify-end gap-3'>
        <button className='px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'>
          취소
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        >
          <Save className='w-4 h-4' />
          설정 저장
        </motion.button>
      </div>
    </div>
  );
}
