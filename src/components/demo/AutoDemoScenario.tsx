'use client';

import { useEffect, useRef } from 'react';
import { useDemoStore } from '../../stores/demoStore';

interface DemoScenario {  id: string;  delay: number;  type: 'user' | 'ai';  content: string;  actions?: {    highlightServers?: string[];    showServerDetail?: string;    updateMetrics?: { serverId: string; metrics: { cpu?: number; memory?: number; disk?: number; network?: number } }[];    showChart?: boolean;    actionButtons?: string[];  };}

const demoScenarios: DemoScenario[] = [
  {
    id: 'scenario-1',
    delay: 3000,
    type: 'ai',
    content: '데모를 시작하겠습니다! 😊\n\n현재 19개 서버를 모니터링하고 있으며, 그 중 1개가 심각한 상태, 3개가 경고 상태입니다.',
    actions: {}
  },
  {
    id: 'scenario-2',
    delay: 5000,
    type: 'user',
    content: '현재 시스템 전체 상태는 어때?',
    actions: {}
  },
  {
    id: 'scenario-3',
    delay: 2000,
    type: 'ai',
    content: '전체 시스템 분석 결과입니다:\n\n• 총 19개 서버 운영중\n• 정상: 15개 (79%)\n• 경고: 3개 (16%)\n• 심각: 1개 (5%)\n\n활성 알림 4개가 있습니다.',
    actions: {
      showChart: true
    }
  },
  {
    id: 'scenario-4',
    delay: 4000,
    type: 'user',
    content: 'CPU 사용률이 가장 높은 서버는?',
    actions: {}
  },
  {
    id: 'scenario-5',
    delay: 2500,
    type: 'ai',
    content: 'CPU 사용률이 가장 높은 서버는 **api-useast-001** 입니다.\n\n• CPU: 89%\n• Memory: 76%\n• 상태: 심각\n\n해당 서버를 하이라이트하겠습니다.',
    actions: {
      highlightServers: ['server-001']
    }
  },
  {
    id: 'scenario-6',
    delay: 4000,
    type: 'user',
    content: 'api-useast-001 서버 상세 정보 보여줘',
    actions: {}
  },
  {
    id: 'scenario-7',
    delay: 2000,
    type: 'ai',
    content: '**api-useast-001** 서버 상세 분석 결과:\n\n🔍 **문제점 분석:**\n• CPU 과부하 (89%)\n• 메모리 사용량 높음 (76%)\n• 응답 시간 지연 감지\n\n💡 **추천 조치:**\n• 프로세스 재시작\n• 스케일링 고려\n• 로그 확인 필요',
    actions: {
      showServerDetail: 'server-001',
      actionButtons: ['프로세스 재시작', '스케일링 실행', '로그 확인']
    }
  },
  {
    id: 'scenario-8',
    delay: 5000,
    type: 'ai',
    content: '실시간 메트릭이 업데이트되고 있습니다... 📊\n\n새로운 서버 상태 변화를 감지했습니다.',
    actions: {
      updateMetrics: [
        { serverId: 'server-002', metrics: { cpu: 85 } },
        { serverId: 'server-003', metrics: { memory: 82 } }
      ]
    }
  },
  {
    id: 'scenario-9',
    delay: 3000,
    type: 'user',
    content: '경고 상태인 서버들 분석해줘',
    actions: {}
  },
  {
    id: 'scenario-10',
    delay: 2500,
    type: 'ai',
    content: '경고 상태 서버 분석 완료! ⚠️\n\n**경고 서버 목록:**\n• database-uswest-002 (CPU: 78%)\n• web-eucentral-003 (Memory: 84%)\n• cache-aptokyo-004 (Disk: 88%)\n\n모든 경고 서버를 하이라이트합니다.',
    actions: {
      highlightServers: ['server-002', 'server-003', 'server-004']
    }
  }
];

export default function AutoDemoScenario() {
  const {
    isAutoDemo,
    currentScenarioIndex,
    addMessage,
    highlightServers,
    clearHighlights,
    selectServer,
    updateServerMetrics,
    setTyping,
    nextScenario,
    servers
  } = useDemoStore();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAutoDemo || currentScenarioIndex >= demoScenarios.length) return;

    const currentScenario = demoScenarios[currentScenarioIndex];
    
    timeoutRef.current = setTimeout(() => {
      // 타이핑 시작
      if (currentScenario.type === 'ai') {
        setTyping(true);
        
        // 실제 메시지 추가 (타이핑 시뮬레이션)
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false);
          addMessage({
            type: currentScenario.type,
            content: currentScenario.content,
            hasChart: currentScenario.actions?.showChart,
            actionButtons: currentScenario.actions?.actionButtons
          });

          // 액션 실행
          if (currentScenario.actions) {
            executeActions(currentScenario.actions);
          }

          nextScenario();
        }, currentScenario.type === 'ai' ? 2000 : 500); // AI 메시지는 더 긴 타이핑 시간
      } else {
        // 사용자 메시지는 즉시 추가
        addMessage({
          type: currentScenario.type,
          content: currentScenario.content
        });

        if (currentScenario.actions) {
          executeActions(currentScenario.actions);
        }

        nextScenario();
      }
    }, currentScenario.delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [isAutoDemo, currentScenarioIndex, addMessage, setTyping, nextScenario]);

  const executeActions = (actions: DemoScenario['actions']) => {
    if (!actions) return;

    // 서버 하이라이트
    if (actions.highlightServers) {
      clearHighlights();
      setTimeout(() => {
        highlightServers(actions.highlightServers!);
      }, 100);
    }

    // 서버 상세 정보 표시
    if (actions.showServerDetail) {
      const server = servers.find(s => s.id === actions.showServerDetail);
      if (server) {
        selectServer(server);
      }
    }

    // 메트릭 업데이트
    if (actions.updateMetrics) {
      actions.updateMetrics.forEach(({ serverId, metrics }) => {
        updateServerMetrics(serverId, metrics);
      });
    }
  };

  // 자동 데모 시작 (컴포넌트 마운트 후 3초 뒤)
  useEffect(() => {
    const startTimeout = setTimeout(() => {
      useDemoStore.getState().setAutoDemo(true);
    }, 3000);

    return () => clearTimeout(startTimeout);
  }, []);

    // 자동 하이라이트 해제 (10초 후)  useEffect(() => {    const highlightTimeout = setTimeout(() => {      clearHighlights();    }, 10000);    return () => clearTimeout(highlightTimeout);  }, [clearHighlights]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다
} 