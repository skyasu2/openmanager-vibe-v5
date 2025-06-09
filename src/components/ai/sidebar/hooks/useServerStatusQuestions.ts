import { useState, useEffect } from 'react';

interface QuestionCard {
  id: string;
  keyword: string;
  question: string;
  priority: 'high' | 'medium' | 'low';
  category: 'status' | 'performance' | 'alert' | 'optimization';
}

interface ServerStatusData {
  totalServers: number;
  activeServers: number;
  criticalAlerts: number;
  avgCpuUsage: number;
  avgMemoryUsage: number;
  networkIssues: number;
}

export function useServerStatusQuestions() {
  const [questions, setQuestions] = useState<QuestionCard[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatusData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // 서버 상태 데이터 가져오기 (Mock 데이터)
  const fetchServerStatus = async (): Promise<ServerStatusData> => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          totalServers: 10,
          activeServers: Math.floor(Math.random() * 2) + 8, // 8-9개
          criticalAlerts: Math.floor(Math.random() * 3), // 0-2개
          avgCpuUsage: Math.floor(Math.random() * 60) + 20, // 20-80%
          avgMemoryUsage: Math.floor(Math.random() * 50) + 30, // 30-80%
          networkIssues: Math.floor(Math.random() * 2), // 0-1개
        });
      }, 500);
    });
  };

  // 서버 상태에 따른 동적 질문 생성
  const generateQuestions = (status: ServerStatusData): QuestionCard[] => {
    const questions: QuestionCard[] = [];

    // 1. 서버 상태 기반 질문
    if (status.activeServers < status.totalServers) {
      questions.push({
        id: 'inactive-servers',
        keyword: '서버 중단',
        question: `${status.totalServers - status.activeServers}대의 서버가 비활성 상태입니다. 문제를 확인해주세요`,
        priority: 'high',
        category: 'alert',
      });
    } else {
      questions.push({
        id: 'all-active',
        keyword: '전체 상태',
        question: '모든 서버가 정상 운영중입니다. 전체 상태를 확인해주세요',
        priority: 'low',
        category: 'status',
      });
    }

    // 2. CPU 사용률 기반 질문
    if (status.avgCpuUsage > 70) {
      questions.push({
        id: 'high-cpu',
        keyword: 'CPU 경고',
        question: `CPU 사용률이 ${status.avgCpuUsage}%로 높습니다. 최적화 방안을 제안해주세요`,
        priority: 'high',
        category: 'performance',
      });
    } else if (status.avgCpuUsage > 50) {
      questions.push({
        id: 'moderate-cpu',
        keyword: 'CPU 분석',
        question: `CPU 사용률 ${status.avgCpuUsage}%에 대한 성능 분석을 해주세요`,
        priority: 'medium',
        category: 'performance',
      });
    } else {
      questions.push({
        id: 'cpu-normal',
        keyword: 'CPU 정상',
        question: `CPU 사용률이 ${status.avgCpuUsage}%로 안정적입니다. 예측 분석을 해주세요`,
        priority: 'low',
        category: 'optimization',
      });
    }

    // 3. 메모리 사용률 기반 질문
    if (status.avgMemoryUsage > 75) {
      questions.push({
        id: 'high-memory',
        keyword: '메모리 부족',
        question: `메모리 사용률이 ${status.avgMemoryUsage}%입니다. 정리 작업이 필요합니다`,
        priority: 'high',
        category: 'alert',
      });
    } else {
      questions.push({
        id: 'memory-status',
        keyword: '메모리 현황',
        question: `메모리 사용률 ${status.avgMemoryUsage}%의 상세 분석을 요청합니다`,
        priority: 'medium',
        category: 'performance',
      });
    }

    // 4. 알림 기반 질문
    if (status.criticalAlerts > 0) {
      questions.push({
        id: 'critical-alerts',
        keyword: '긴급 알림',
        question: `${status.criticalAlerts}개의 중요 알림이 있습니다. 우선순위 처리 방법을 알려주세요`,
        priority: 'high',
        category: 'alert',
      });
    } else {
      questions.push({
        id: 'no-alerts',
        keyword: '안정 운영',
        question: '현재 중요 알림이 없습니다. 시스템 최적화 제안을 해주세요',
        priority: 'low',
        category: 'optimization',
      });
    }

    // 우선순위 기반 정렬 및 최대 4개 제한
    return questions
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 4);
  };

  // 질문 새로고침 함수
  const refreshQuestions = async () => {
    setIsLoading(true);
    try {
      const status = await fetchServerStatus();
      setServerStatus(status);
      const newQuestions = generateQuestions(status);
      setQuestions(newQuestions);
    } catch (error) {
      console.error('Failed to refresh questions:', error);
      // 오류 시 기본 질문 사용
      setQuestions([
        {
          id: 'default-1',
          keyword: '서버 상태',
          question: '현재 서버들의 전체 상태는 어떤가요?',
          priority: 'medium',
          category: 'status',
        },
        {
          id: 'default-2',
          keyword: '성능 분석',
          question: '성능에 문제가 있는 서버를 찾아주세요',
          priority: 'medium',
          category: 'performance',
        },
        {
          id: 'default-3',
          keyword: '예측 분석',
          question: '향후 리소스 사용량을 예측해주세요',
          priority: 'medium',
          category: 'optimization',
        },
        {
          id: 'default-4',
          keyword: '최적화',
          question: '시스템 최적화 방안을 제안해주세요',
          priority: 'low',
          category: 'optimization',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드 및 주기적 업데이트
  useEffect(() => {
    refreshQuestions();

    // 30초마다 업데이트
    const interval = setInterval(refreshQuestions, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    questions,
    serverStatus,
    refreshQuestions,
    isLoading,
  };
}
