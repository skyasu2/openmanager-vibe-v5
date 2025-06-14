/**
 * 🚨 System Alerts Page
 *
 * AI 에이전트 사이드바의 실시간 시스템 알림 페이지
 * - Critical/Warning/Resolved 알림 분류
 * - 실시간 알림 업데이트
 * - 알림 상세 정보 및 액션
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  Server,
  Cpu,
  HardDrive,
  Activity,
  X,
  Eye,
  ExternalLink,
} from 'lucide-react';

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'resolved';
  title: string;
  message: string;
  server: string;
  timestamp: Date;
  category: 'cpu' | 'memory' | 'disk' | 'network' | 'service';
  value?: number;
  threshold?: number;
}

interface SystemAlertsPageProps {
  className?: string;
}

export default function SystemAlertsPage({
  className = '',
}: SystemAlertsPageProps) {
  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      type: 'critical',
      title: 'High CPU Usage',
      message: 'DB-01: High CPU 95%',
      server: 'DB-01',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      category: 'cpu',
      value: 95,
      threshold: 80,
    },
    {
      id: '2',
      type: 'warning',
      title: 'Memory Warning',
      message: 'WEB-03: Memory 85%',
      server: 'WEB-03',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      category: 'memory',
      value: 85,
      threshold: 80,
    },
    {
      id: '3',
      type: 'resolved',
      title: 'Disk Space Resolved',
      message: 'API-02: Disk space',
      server: 'API-02',
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      category: 'disk',
      value: 65,
      threshold: 70,
    },
  ]);

  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null);

  // 실시간 알림 업데이트 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      // 랜덤 알림 생성
      if (Math.random() > 0.7) {
        const servers = ['WEB-01', 'DB-02', 'API-03', 'LB-01', 'CACHE-01'];
        const categories: SystemAlert['category'][] = [
          'cpu',
          'memory',
          'disk',
          'network',
          'service',
        ];
        const types: SystemAlert['type'][] = ['critical', 'warning'];

        const newAlert: SystemAlert = {
          id: Date.now().toString(),
          type: types[Math.floor(Math.random() * types.length)],
          title: `${categories[Math.floor(Math.random() * categories.length)].toUpperCase()} Alert`,
          message: `${servers[Math.floor(Math.random() * servers.length)]}: Resource usage high`,
          server: servers[Math.floor(Math.random() * servers.length)],
          timestamp: new Date(),
          category: categories[Math.floor(Math.random() * categories.length)],
          value: Math.floor(Math.random() * 30) + 70,
          threshold: 80,
        };

        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className='w-4 h-4 text-red-500' />;
      case 'warning':
        return <AlertCircle className='w-4 h-4 text-yellow-500' />;
      case 'resolved':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
    }
  };

  const getCategoryIcon = (category: SystemAlert['category']) => {
    switch (category) {
      case 'cpu':
        return <Cpu className='w-3 h-3' />;
      case 'memory':
        return <Activity className='w-3 h-3' />;
      case 'disk':
        return <HardDrive className='w-3 h-3' />;
      case 'network':
        return <Server className='w-3 h-3' />;
      case 'service':
        return <AlertCircle className='w-3 h-3' />;
    }
  };

  const getAlertColor = (type: SystemAlert['type']) => {
    switch (type) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'resolved':
        return 'border-green-200 bg-green-50';
    }
  };

  const getTypeLabel = (type: SystemAlert['type']) => {
    switch (type) {
      case 'critical':
        return '🔴 CRITICAL';
      case 'warning':
        return '🟡 WARNING';
      case 'resolved':
        return '🟢 RESOLVED';
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const diff = Date.now() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  const handleAlertClick = (alert: SystemAlert) => {
    setSelectedAlert(alert);
  };

  const handleCloseDetail = () => {
    setSelectedAlert(null);
  };

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;
  const resolvedCount = alerts.filter(a => a.type === 'resolved').length;

  return (
    <div className={`h-full flex flex-col p-4 bg-gray-50 ${className}`}>
      {/* 헤더 */}
      <div className='mb-6'>
        <h2 className='text-xl font-bold text-gray-800 flex items-center gap-2'>
          <div className='w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center'>
            <AlertTriangle className='w-4 h-4 text-white' />
          </div>
          실시간 시스템 알림
        </h2>
        <p className='text-sm text-gray-600 mt-1'>
          총 {alerts.length}개 알림 • 업데이트:{' '}
          {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* 알림 통계 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4'
      >
        <h3 className='text-lg font-semibold text-gray-700 mb-3'>
          🚨 실시간 알림
        </h3>
        <div className='grid grid-cols-3 gap-3'>
          <div className='text-center p-2 bg-red-50 rounded-lg border border-red-200'>
            <div className='text-lg font-bold text-red-600'>
              {criticalCount}
            </div>
            <div className='text-xs text-red-500'>CRITICAL</div>
          </div>
          <div className='text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200'>
            <div className='text-lg font-bold text-yellow-600'>
              {warningCount}
            </div>
            <div className='text-xs text-yellow-500'>WARNING</div>
          </div>
          <div className='text-center p-2 bg-green-50 rounded-lg border border-green-200'>
            <div className='text-lg font-bold text-green-600'>
              {resolvedCount}
            </div>
            <div className='text-xs text-green-500'>RESOLVED</div>
          </div>
        </div>
      </motion.div>

      {/* 알림 목록 */}
      <div className='flex-1 space-y-2 overflow-y-auto'>
        <AnimatePresence>
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${getAlertColor(alert.type)}`}
              onClick={() => handleAlertClick(alert)}
            >
              <div className='flex items-start justify-between mb-2'>
                <div className='flex items-center gap-2'>
                  {getAlertIcon(alert.type)}
                  <span className='text-xs font-bold'>
                    {getTypeLabel(alert.type)}
                  </span>
                </div>
                <div className='flex items-center gap-1 text-gray-500'>
                  <Clock className='w-3 h-3' />
                  <span className='text-xs'>{getTimeAgo(alert.timestamp)}</span>
                </div>
              </div>

              <div className='flex items-center gap-2 mb-1'>
                {getCategoryIcon(alert.category)}
                <span className='text-sm font-semibold text-gray-800'>
                  {alert.message}
                </span>
              </div>

              {alert.value && alert.threshold && (
                <div className='flex items-center justify-between text-xs text-gray-600'>
                  <span>현재: {alert.value}%</span>
                  <span>임계값: {alert.threshold}%</span>
                </div>
              )}

              <div className='flex items-center justify-between mt-2'>
                <span className='text-xs text-gray-500'>
                  서버: {alert.server}
                </span>
                <div className='flex items-center gap-1'>
                  <Eye className='w-3 h-3 text-gray-400' />
                  <span className='text-xs text-gray-400'>상세보기</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 알림 상세 모달 */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
            onClick={handleCloseDetail}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className='bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl'
              onClick={e => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                  {getAlertIcon(selectedAlert.type)}
                  <h3 className='text-lg font-bold text-gray-800'>알림 상세</h3>
                </div>
                <button
                  onClick={handleCloseDetail}
                  className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                >
                  <X className='w-4 h-4 text-gray-500' />
                </button>
              </div>

              {/* 알림 내용 */}
              <div className='space-y-3'>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    상태
                  </label>
                  <div className='text-lg font-bold'>
                    {getTypeLabel(selectedAlert.type)}
                  </div>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    메시지
                  </label>
                  <div className='text-gray-800'>{selectedAlert.message}</div>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      서버
                    </label>
                    <div className='text-gray-800'>{selectedAlert.server}</div>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      카테고리
                    </label>
                    <div className='flex items-center gap-1 text-gray-800'>
                      {getCategoryIcon(selectedAlert.category)}
                      <span className='capitalize'>
                        {selectedAlert.category}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedAlert.value && selectedAlert.threshold && (
                  <div className='p-3 bg-gray-50 rounded-lg'>
                    <div className='flex justify-between text-sm'>
                      <span>현재 사용률:</span>
                      <span className='font-bold'>{selectedAlert.value}%</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span>임계값:</span>
                      <span className='font-bold'>
                        {selectedAlert.threshold}%
                      </span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
                      <div
                        className={`h-2 rounded-full ${
                          selectedAlert.value > selectedAlert.threshold
                            ? 'bg-red-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(selectedAlert.value, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    발생 시간
                  </label>
                  <div className='text-gray-800'>
                    {selectedAlert.timestamp.toLocaleDateString()}{' '}
                    {selectedAlert.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className='flex gap-2 mt-6'>
                <button
                  className='flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2'
                  onClick={handleCloseDetail}
                >
                  <ExternalLink className='w-4 h-4' />
                  서버 대시보드
                </button>
                <button
                  className='px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors'
                  onClick={handleCloseDetail}
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
