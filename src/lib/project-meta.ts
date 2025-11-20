/**
 * OpenManager Vibe v5 프로젝트 관련 메타데이터 및 유틸리티
 *
 * 이 파일은 프로젝트의 타임라인, 버전 관리, 진행 상태 등
 * 비즈니스 로직과 밀접하게 관련된 함수들을 포함합니다.
 * 순수 시간 처리 유틸리티는 `src/lib/time.ts`에 있습니다.
 */

const PROJECT_START = new Date('2025-05-20');

/**
 * 프로젝트 진행 기간 계산
 * @returns 프로젝트 시작부터 현재까지의 일수와 개월수
 */
export function getProjectDuration(): {
  months: number;
  days: number;
  totalDays: number;
} {
  const now = new Date();
  const start = PROJECT_START;

  const diffTime = Math.abs(now.getTime() - start.getTime());
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const months = Math.floor(totalDays / 30);

  return {
    months,
    days: totalDays % 30,
    totalDays,
  };
}

/**
 * 버전별 날짜 매핑 (실제 개발 기간 기준)
 * @param version 버전 문자열
 * @returns 해당 버전의 릴리스 날짜
 */
export function getVersionDate(version: string): string {
  const versionMap: Record<string, string> = {
    '1.0.0': '2025-05-20', // 프로젝트 시작
    '2.0.0': '2025-05-25', // TDD 리팩토링 시작
    '2.1.0': '2025-05-28', // Smart Fallback API 구현
    '2.5.0': '2025-06-01', // GCPRealDataService 리팩토링
    '3.0.0': '2025-06-05', // AI 엔진 모듈 분리
    '5.40.0': '2025-06-10', // 통합 AI 시스템 구축
    '5.40.1': '2025-06-15', // NTP 시간 동기화 구현
    '5.41.0': '2025-07-01', // 시간 모듈 통합 (현재)
  };

  return versionMap[version] || new Date().toLocaleDateString('sv-SE');
}

/**
 * 프로젝트 타임라인 생성
 * @returns 프로젝트 단계별 타임라인 배열
 */
export function getProjectTimeline(): Array<{
  phase: string;
  period: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
}> {
  return [
    {
      phase: 'Phase 1: TDD 기반 리팩토링',
      period: '2025.05.20 - 2025.05.25',
      description:
        'AIEngineManager, AIRoutingSystem, AIFallbackHandler 모듈 분리',
      status: 'completed',
    },
    {
      phase: 'Phase 2: 핵심 시스템 구축',
      period: '2025.05.25 - 2025.06.15',
      description:
        'AI 엔진 통합, NTP 동기화, 한국시간 표준화, 시간 모듈 통합',
      status: 'completed',
    },
    {
      phase: 'Phase 3: MCP 시스템 통합',
      period: '2025.06.15 - 2025.07.01',
      description:
        'MCPContextCollector 모듈 분리, Model Context Protocol 최적화',
      status: 'completed',
    },
    {
      phase: 'Phase 4: 마무리 작업',
      period: '2025.07.01 - 진행중',
      description: '최종 테스트, 문서 정리, 배포 준비',
      status: 'in-progress',
    },
    {
      phase: 'Phase 5: 프로덕션 출시',
      period: '2025.07 - 계획중',
      description: 'UI/UX 혁신, 버전 관리 시스템, Vibe Coding 완성',
      status: 'planned',
    },
  ];
}

/**
 * 개발 진행률 계산
 * @returns 프로젝트 진행률 정보
 */
export function getProjectProgress(): {
  completedPhases: number;
  totalPhases: number;
  progressPercentage: number;
  currentPhase: string;
} {
  const timeline = getProjectTimeline();
  const completed = timeline.filter(
    (phase) => phase.status === 'completed'
  ).length;
  const inProgress = timeline.filter(
    (phase) => phase.status === 'in-progress'
  );

  return {
    completedPhases: completed,
    totalPhases: timeline.length,
    progressPercentage: Math.round((completed / timeline.length) * 100),
    currentPhase: inProgress[0]?.phase || '계획 단계',
  };
}

/**
 * 프로젝트 날짜 검증 (2025년 7월 현재 기준) - 개선된 버전
 * @param dateString 확인할 날짜 문자열
 * @returns 유효한 프로젝트 날짜 여부
 */
export function isValidProjectDate(dateString: string): boolean {
  try {
    const targetDate = new Date(dateString);
    const now = new Date();

    // 프로젝트 시작일 이후, 현재 시간 이전
    return (
      targetDate >= PROJECT_START &&
      targetDate <= now &&
      !isNaN(targetDate.getTime())
    );
  } catch {
    return false;
  }
}

/**
 * 잘못된 미래 날짜 패턴 감지 - 통합 개선된 버전
 * @param content 확인할 내용
 * @returns 잘못된 날짜 패턴 배열
 */
export function detectWrongDates(content: string): string[] {
  const wrongPatterns = [
    // 2025년 잘못된 미래 월 (7월-12월)
    /2025-0[7-9]|2025-1[0-2]/g,
    /2025년 0[7-9]월|2025년 1[0-2]월/g,
    /20250[7-9]|202510|202511|202512/g,
    // 2025년 이전 잘못된 과거 날짜 (프로젝트 시작 전)
    /2024-\d{2}-\d{2}/g,
    /2023-\d{2}-\d{2}/g,
  ];

  const found: string[] = [];
  wrongPatterns.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) found.push(...matches);
  });

  return [...new Set(found)];
}

/**
 * 다음 버전 번호 제안
 * @param currentVersion 현재 버전
 * @param type 업데이트 타입 ('major' | 'minor' | 'patch')
 * @returns 다음 버전 번호
 */
export function getNextVersion(
  currentVersion: string,
  type: 'major' | 'minor' | 'patch' = 'minor'
): string {
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${(major ?? 0) + 1}.0.0`;
    case 'minor':
      return `${major ?? 0}.${(minor ?? 0) + 1}.0`;
    case 'patch':
      return `${major ?? 0}.${minor ?? 0}.${(patch ?? 0) + 1}`;
    default:
      return currentVersion;
  }
}

export const ProjectMeta = {
  duration: getProjectDuration,
  timeline: getProjectTimeline,
  progress: getProjectProgress,
  versionDate: getVersionDate,
  isValidDate: isValidProjectDate,
  checkWrongDates: detectWrongDates,
  nextVersion: getNextVersion,
};
