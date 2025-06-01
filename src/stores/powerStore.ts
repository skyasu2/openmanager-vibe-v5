/**
 * Power Management Store
 * 
 * 🔋 시스템 절전 모드 및 전력 관리
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PowerMode = 'sleep' | 'active' | 'monitoring' | 'emergency';

export interface PowerState {
  mode: PowerMode;
  lastActivity: Date;
  sessionStartTime: Date | null;
  autoReports: AutoReport[];
  systemAlerts: SystemAlert[];
  isDataCollecting: boolean;
  energySavingLevel: 'low' | 'medium' | 'high';
}

export interface AutoReport {
  id: string;
  type: 'daily' | 'warning' | 'critical' | 'performance';
  title: string;
  summary: string;
  details: string;
  createdAt: Date;
  severity: 'info' | 'warning' | 'critical';
  recommendations: string[];
}

export interface SystemAlert {
  id: string;
  type: 'server_down' | 'high_cpu' | 'memory_leak' | 'disk_full' | 'network_issue';
  serverId: string;
  serverName: string;
  message: string;
  severity: 'warning' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
  autoResolved: boolean;
}

interface PowerStore extends PowerState {
  // Actions
  activateSystem: () => void;
  enterSleepMode: () => void;
  updateActivity: () => void;
  addAutoReport: (report: Omit<AutoReport, 'id' | 'createdAt'>) => void;
  addSystemAlert: (alert: Omit<SystemAlert, 'id' | 'timestamp' | 'acknowledged' | 'autoResolved'>) => void;
  acknowledgeAlert: (alertId: string) => void;
  clearOldReports: () => void;
  setEnergyLevel: (level: 'low' | 'medium' | 'high') => void;
  
  // Getters
  getActiveAlerts: () => SystemAlert[];
  getCriticalAlerts: () => SystemAlert[];
  getRecentReports: () => AutoReport[];
  getSystemStatus: () => {
    totalAlerts: number;
    criticalAlerts: number;
    recentReports: number;
    uptime: number;
  };
}

export const usePowerStore = create<PowerStore>()(
  persist(
    (set, get) => ({
      // Initial State
      mode: 'sleep',
      lastActivity: new Date(),
      sessionStartTime: null,
      autoReports: [],
      systemAlerts: [],
      isDataCollecting: false,
      energySavingLevel: 'medium',

      // Actions
      activateSystem: () => {
        set({
          mode: 'active',
          sessionStartTime: new Date(),
          lastActivity: new Date(),
          isDataCollecting: true
        });
        
        // 시스템 활성화시 환영 리포트 생성
        const welcomeReport: Omit<AutoReport, 'id' | 'createdAt'> = {
          type: 'daily',
          title: '시스템 활성화 완료',
          summary: 'OpenManager AI 시스템이 성공적으로 활성화되었습니다.',
          details: `
🚀 **시스템 상태**
- 모니터링 모드: 활성화
- AI 에이전트: 준비 완료
- 데이터 수집: 시작됨
- 절전 모드: 해제

📊 **준비된 기능**
- 실시간 서버 모니터링
- 자동 경고 감지
- AI 기반 문제 분석
- 성능 최적화 제안

⚡ **에너지 효율성**
- 현재 절전 레벨: ${get().energySavingLevel}
- 예상 배터리 수명: 8시간
- 백그라운드 최적화: 활성화
          `,
          severity: 'info',
          recommendations: [
            '정기적인 시스템 상태 확인',
            '중요 알림 설정 검토',
            '성능 임계값 조정 고려'
          ]
        };
        
        get().addAutoReport(welcomeReport);
      },

      enterSleepMode: () => {
        const currentState = get();
        
        // 절전 모드 진입 전 최종 리포트 생성
        if (currentState.sessionStartTime) {
          const sessionDuration = Date.now() - currentState.sessionStartTime.getTime();
          const hours = Math.floor(sessionDuration / (1000 * 60 * 60));
          const minutes = Math.floor((sessionDuration % (1000 * 60 * 60)) / (1000 * 60));
          
          const sleepReport: Omit<AutoReport, 'id' | 'createdAt'> = {
            type: 'daily',
            title: '세션 종료 및 절전 모드 진입',
            summary: `${hours}시간 ${minutes}분간의 모니터링 세션이 완료되었습니다.`,
            details: `
💤 **세션 요약**
- 활성 시간: ${hours}시간 ${minutes}분
- 처리된 알림: ${currentState.systemAlerts.length}개
- 생성된 리포트: ${currentState.autoReports.length}개
- 마지막 활동: ${new Date().toLocaleString()}

🔋 **절전 모드 설정**
- 백그라운드 모니터링: 최소화
- 데이터 수집: 일시 중단
- AI 에이전트: 대기 모드
- 시스템 리소스: 최적화

📈 **다음 활성화시 준비사항**
- 누적된 데이터 분석
- 시스템 상태 체크
- 성능 트렌드 업데이트
            `,
            severity: 'info',
            recommendations: [
              '다음 세션에서 누적 데이터 검토',
              '시스템 성능 트렌드 분석',
              '알림 설정 최적화 고려'
            ]
          };
          
          currentState.addAutoReport(sleepReport);
        }
        
        set({
          mode: 'sleep',
          sessionStartTime: null,
          isDataCollecting: false,
          lastActivity: new Date()
        });
      },

      updateActivity: () => {
        try {
          // 🚨 컴포넌트 언마운트 후 상태 업데이트 방지
          const current = get();
          if (!current) {
            console.warn('⚠️ [PowerStore] updateActivity: 스토어 상태가 없음 - 업데이트 중단');
            return;
          }

          // 🔒 React 안전 모드: 배치 업데이트로 처리
          Promise.resolve().then(() => {
            try {
              const latestState = get();
              if (latestState) {
                set({ lastActivity: new Date() });
              }
            } catch (batchError) {
              console.warn('⚠️ [PowerStore] 배치 업데이트 실패 (무시):', batchError);
            }
          });
        } catch (error) {
          console.error('❌ [PowerStore] updateActivity 실패:', error);
          // 에러 발생 시에도 안전하게 계속 진행
        }
      },

      addAutoReport: (report) => {
        const newReport: AutoReport = {
          ...report,
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date()
        };
        
        set((state) => ({
          autoReports: [newReport, ...state.autoReports].slice(0, 50) // 최대 50개 보관
        }));
      },

      addSystemAlert: (alert) => {
        const newAlert: SystemAlert = {
          ...alert,
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          acknowledged: false,
          autoResolved: false
        };
        
        set((state) => ({
          systemAlerts: [newAlert, ...state.systemAlerts].slice(0, 100) // 최대 100개 보관
        }));
        
        // 심각한 알림의 경우 자동 리포트 생성
        if (alert.severity === 'critical') {
          const criticalReport: Omit<AutoReport, 'id' | 'createdAt'> = {
            type: 'critical',
            title: `긴급: ${alert.serverName} 서버 문제 감지`,
            summary: `${alert.serverName} 서버에서 심각한 문제가 감지되었습니다.`,
            details: `
🚨 **긴급 알림**
- 서버: ${alert.serverName} (${alert.serverId})
- 문제 유형: ${alert.type}
- 심각도: ${alert.severity}
- 감지 시간: ${new Date().toLocaleString()}

📋 **문제 상세**
${alert.message}

⚡ **즉시 조치 필요**
- 서버 상태 확인
- 로그 분석 수행
- 필요시 재시작 고려
- 사용자 영향도 평가

🔧 **자동 대응 시도**
- 헬스체크 재실행
- 리소스 사용량 분석
- 네트워크 연결 확인
            `,
            severity: 'critical',
            recommendations: [
              '즉시 서버 상태 점검',
              '로그 파일 상세 분석',
              '백업 서버 활성화 고려',
              '사용자 공지 준비'
            ]
          };
          
          get().addAutoReport(criticalReport);
        }
      },

      acknowledgeAlert: (alertId) => {
        set((state) => ({
          systemAlerts: state.systemAlerts.map(alert =>
            alert.id === alertId ? { ...alert, acknowledged: true } : alert
          )
        }));
      },

      clearOldReports: () => {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        set((state) => ({
          autoReports: state.autoReports.filter(report => report.createdAt > oneDayAgo),
          systemAlerts: state.systemAlerts.filter(alert => alert.timestamp > oneDayAgo)
        }));
      },

      setEnergyLevel: (level) => {
        set({ energySavingLevel: level });
      },

      // Getters
      getActiveAlerts: () => {
        return get().systemAlerts.filter(alert => !alert.acknowledged && !alert.autoResolved);
      },

      getCriticalAlerts: () => {
        return get().systemAlerts.filter(alert => 
          alert.severity === 'critical' && !alert.acknowledged && !alert.autoResolved
        );
      },

      getRecentReports: () => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return get().autoReports.filter(report => report.createdAt > oneHourAgo);
      },

      getSystemStatus: () => {
        const state = get();
        const activeAlerts = state.getActiveAlerts();
        const criticalAlerts = state.getCriticalAlerts();
        const recentReports = state.getRecentReports();
        
        const uptime = state.sessionStartTime 
          ? Date.now() - state.sessionStartTime.getTime()
          : 0;
        
        return {
          totalAlerts: activeAlerts.length,
          criticalAlerts: criticalAlerts.length,
          recentReports: recentReports.length,
          uptime: Math.floor(uptime / 1000) // 초 단위
        };
      }
    }),
    {
      name: 'power-store',
      partialize: (state) => ({
        mode: state.mode,
        energySavingLevel: state.energySavingLevel,
        autoReports: state.autoReports.slice(0, 10), // 최근 10개만 저장
        systemAlerts: state.systemAlerts.slice(0, 20)  // 최근 20개만 저장
      })
    }
  )
); 