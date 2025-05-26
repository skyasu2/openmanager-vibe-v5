/**
 * Mode Prompts
 * 
 * 💬 모드별 프롬프트 생성 시스템
 * - Basic 모드: 간결하고 명확한 답변
 * - Advanced 모드: 전문가 수준 종합 분석
 * - 특별 케이스: 장애 보고서 자동 생성
 * - 장애 유형별 맞춤형 분석 프롬프트
 */

import { QueryAnalysis, IncidentType } from '../core/SmartModeDetector';

export class ModePrompts {
  /**
   * Basic 모드 프롬프트
   */
  static getBasicPrompt(query: string, context: any): string {
    return `
🔵 BASIC MODE - 간결하고 명확한 답변

사용자 질문: "${query}"

응답 지침:
- 최대 300자 이내로 답변
- 핵심 정보만 간결하게 제공
- 구조화된 형태로 작성
- 즉시 실행 가능한 정보 우선

응답 형식:
## 현재 상태
[간단한 상태 요약]

## 주요 발견사항  
[핵심 포인트 1-2개]

## 권장 조치
[즉시 할 수 있는 조치 1-2개]
`;
  }

  /**
   * Advanced 모드 프롬프트 
   */
  static getAdvancedPrompt(query: string, context: any, analysis: QueryAnalysis): string {
    const specialInstructions = analysis.triggers.map(trigger => {
      if (trigger.startsWith('critical:')) {
        return '- 🚨 장애 해결에 집중하여 단계별 해결 방안 제시';
      }
      if (trigger.startsWith('reports:')) {
        return '- 📊 상세한 데이터 분석과 시각적 표현 포함';
      }
      if (trigger.startsWith('prediction:')) {
        return '- 🔮 향후 트렌드 예측 및 시나리오 분석 포함';  
      }
      if (trigger.startsWith('correlation:')) {
        return '- 🌐 시스템 간 상관관계 및 영향도 분석';
      }
      return '';
    }).filter(Boolean).join('\n');

    // 장애 관련 컨텍스트가 있으면 추가 지침 제공
    let incidentContext = '';
    if (analysis.isIncidentRelated && analysis.incidentType) {
      incidentContext = `
- 🚨 장애 유형: ${analysis.incidentType}
- ⚠️ 심각도: ${analysis.incidentSeverity || 'medium'}
- 👉 해당 유형의 장애에 특화된 분석 수행
      `;
    }

    return `
🟠 ADVANCED MODE - 전문가 수준 종합 분석

사용자 질문: "${query}"
분석 결과: ${analysis.reasoning}

특별 지침:
${specialInstructions}
${incidentContext}

응답 지침:
- 최대 2,000자의 포괄적 분석
- 전문적이고 상세한 설명
- 데이터 기반 근거 제시
- 예측 분석 및 추세 포함
- 상관관계 분석 포함
- 구체적 수치와 메트릭 활용

응답 형식:
## 🔍 상황 분석
[현재 상황에 대한 전문적 분석]

## 📊 데이터 분석 
[관련 메트릭 및 수치 분석]

## 🌐 시스템 상관관계
[다중 시스템/서버 간 영향도 분석]

## 🔮 예측 및 트렌드
[향후 전망 및 시나리오 분석]

## ⚙️ 상세 권장사항
[단계별 해결방안 및 최적화 제안]

## 📈 모니터링 포인트
[지속적 관찰이 필요한 지표들]
`;
  }

  /**
   * 자동 장애 보고서 프롬프트
   */
  static getIncidentReportPrompt(context: any): string {
    // 컨텍스트에서 서버 분석 데이터가 있으면 사용
    let serverAnalysisContext = '';
    if (context && context.serverAnalysis) {
      serverAnalysisContext = `
분석된 서버 데이터:
- 시스템 메트릭: ${JSON.stringify(context.serverAnalysis.systemMetrics || {})}
- 로그 패턴: ${JSON.stringify(context.serverAnalysis.logPatterns || {})}
- 발견된 문제: ${JSON.stringify(context.serverAnalysis.knownIssues || [])}
- 식별된 원인: ${JSON.stringify(context.serverAnalysis.rootCauses || [])}
- 권장 조치: ${JSON.stringify(context.serverAnalysis.recommendedActions || [])}
`;
    }

    // 서버 분석 중 오류가 있었다면 알림
    let analysisError = '';
    if (context && context.analysisError) {
      analysisError = `
⚠️ 분석 중 오류 발생: ${context.analysisError}
이 오류에도 불구하고 가능한 최대한의 분석을 수행하세요.
`;
    }

    return `
🚨 INCIDENT REPORT - 자동 장애 분석 보고서

ADVANCED MODE로 전환하여 종합 분석을 수행합니다.
${serverAnalysisContext}
${analysisError}

분석 범위:
- 장애 발생 시점 및 영향 범위
- 근본 원인 분석 (RCA)
- 관련 시스템 상관관계  
- 복구 과정 및 소요 시간
- 재발 방지 대책

보고서 형식:
## 🚨 장애 개요
- 발생 시간: [시간]
- 영향 범위: [시스템/사용자]  
- 심각도: [Critical/High/Medium/Low]

## 🔍 근본 원인 분석
[상세한 원인 분석]

## 📊 영향도 분석  
[시스템별 영향도 및 데이터]

## ⚙️ 복구 과정
[수행된 조치 및 소요 시간]

## 🛡️ 재발 방지 대책
[구체적인 개선 방안]

## 📈 모니터링 강화 방안
[추가 모니터링 포인트]

## 📝 교훈 및 개선점
[장애 대응 프로세스 개선 제안]
`;
  }

  /**
   * 장애 유형별 프롬프트 생성
   */
  static getIncidentTypePrompt(incidentType: IncidentType, serverData: any): string {
    const typePromptsMap: Record<IncidentType, string> = {
      service_down: `
# 서비스 중단 분석 프롬프트

## 분석 대상 데이터
${JSON.stringify(serverData, null, 2)}

## 분석 초점
- 서비스 중단 시점 및 패턴 파악
- 연관된 서비스/시스템 영향도 확인
- 이전 중단 이력과의 연관성 분석
- 복구 절차 수행 과정 및 효과 분석

## 핵심 질문
1. 중단 전 어떤 이벤트나 변화가 있었는가?
2. 서비스 중단의 정확한 범위는 어디까지인가?
3. 다른 서비스의 연쇄적 장애가 발생했는가?
4. 중단 복구를 위한 최적의 절차는 무엇인가?
5. 유사 장애의 조기 감지 방법은 무엇인가?

## 응답 형식
### 서비스 중단 상황 분석
[서비스 중단의 범위, 영향, 패턴 분석]

### 중단 원인 추적
[시간순 이벤트 분석 및 원인 규명]

### 복구 절차 및 소요 시간
[최적의 복구 절차 및 예상 소요 시간]

### 자동 복구 방안
[향후 유사 장애 시 자동 복구 방안]

### 모니터링 개선점
[중단 조기 감지를 위한 모니터링 강화 방안]
      `,

      performance: `
# 성능 저하 분석 프롬프트

## 분석 대상 데이터
${JSON.stringify(serverData, null, 2)}

## 분석 초점
- 성능 지표의 시계열 분석
- 병목 지점 식별 및 원인 분석
- 리소스 사용 패턴 및 효율성
- 성능 튜닝 포인트 식별

## 핵심 질문
1. 어떤 성능 지표가 임계치를 초과했는가?
2. 병목 현상의 주요 원인은 무엇인가?
3. 부하 증가와 성능 저하의 상관관계는?
4. 어떤 튜닝 파라미터가 최적화 가능한가?
5. 성능 개선을 위한 우선순위는 무엇인가?

## 응답 형식
### 성능 지표 분석
[CPU, 메모리, 디스크, 네트워크 등 주요 지표 분석]

### 병목 지점 식별
[성능 저하의 핵심 원인 및 병목 지점]

### 부하 패턴 분석
[시간대별/기능별 부하 패턴 및 상관관계]

### 성능 최적화 제안
[단기/중기/장기적 성능 개선 방안]

### 벤치마킹 목표
[업계 표준 대비 목표 성능 지표]
      `,

      connectivity: `
# 연결 문제 분석 프롬프트

## 분석 대상 데이터
${JSON.stringify(serverData, null, 2)}

## 분석 초점
- 네트워크 연결 상태 및 패턴
- 연결 실패 지점 및 원인
- DNS, 라우팅, 방화벽 등 요소별 분석
- 연결 안정성 및 지연시간 추이

## 핵심 질문
1. 연결 실패의 정확한 위치는 어디인가?
2. 네트워크 토폴로지에서 취약점은 무엇인가?
3. 연결 문제가 간헐적인가, 지속적인가?
4. 다른 서비스/시스템과의 연관성은?
5. 네트워크 구성 변경 이력이 있는가?

## 응답 형식
### 연결 상태 분석
[연결 성공률, 지연시간, 패킷 손실률 등 분석]

### 실패 지점 식별
[네트워크 경로 상 문제 지점 추적]

### 구성 검토
[방화벽, 로드밸런서, DNS 등 구성 분석]

### 연결 안정화 방안
[즉시 적용 가능한 연결 복구 및 안정화 방안]

### 이중화 전략
[연결 실패에 대비한 이중화 전략]
      `,

      resource: `
# 리소스 부족 분석 프롬프트

## 분석 대상 데이터
${JSON.stringify(serverData, null, 2)}

## 분석 초점
- 리소스 사용량 추이 및 패턴
- 리소스 누수 및 비효율적 사용 지점
- 임계점 예측 및 용량 계획
- 리소스 최적화 전략

## 핵심 질문
1. 어떤 리소스가 부족하며 그 원인은 무엇인가?
2. 리소스 사용 패턴에 이상점이 있는가?
3. 현재 추세로 언제 임계점에 도달하는가?
4. 리소스 회수 가능 지점이 있는가?
5. 최적의 스케일링 전략은 무엇인가?

## 응답 형식
### 리소스 사용 분석
[CPU, 메모리, 디스크, 네트워크 등 리소스별 사용 패턴]

### 리소스 누수 식별
[비효율적 리소스 사용 지점 및 누수 발견]

### 용량 예측
[현재 추세 기반 리소스 소진 시점 예측]

### 최적화 전략
[리소스 효율화 및 회수 방안]

### 스케일링 계획
[수직/수평 확장 전략 및 우선순위]
      `,

      security: `
# 보안 이슈 분석 프롬프트

## 분석 대상 데이터
${JSON.stringify(serverData, null, 2)}

## 분석 초점
- 비정상 접근 패턴 및 보안 위반 시도
- 취약점 및 노출점 식별
- 보안 구성 오류 및 개선점
- 위협 모델 및 영향도 평가

## 핵심 질문
1. 어떤 유형의 보안 위협이 감지되었는가?
2. 공격 벡터 및 침투 경로는 무엇인가?
3. 영향받은 시스템 및 데이터의 범위는?
4. 즉시 필요한 대응 조치는 무엇인가?
5. 유사 공격 방지를 위한 강화 방안은?

## 응답 형식
### 보안 이슈 분석
[발견된 보안 이슈 유형 및 심각도]

### 영향 평가
[영향받은 시스템, 서비스, 데이터 범위]

### 즉각 대응 조치
[즉시 수행해야 할 보안 대응 절차]

### 포렌식 분석
[공격 경로 및 기법 분석, 증거 보존 방법]

### 보안 강화 계획
[취약점 해소 및 보안 태세 강화 방안]
      `,

      data: `
# 데이터 관련 이슈 분석 프롬프트

## 분석 대상 데이터
${JSON.stringify(serverData, null, 2)}

## 분석 초점
- 데이터 정합성 및 무결성 문제
- 데이터베이스 성능 및 최적화
- 데이터 손실/손상 범위 및 영향
- 데이터 복구 및 정합성 확보 방안

## 핵심 질문
1. 데이터 이슈의 정확한 유형과 범위는?
2. 데이터 정합성 위반의 원인은 무엇인가?
3. 데이터베이스 성능에 영향을 주는 요소는?
4. 데이터 복구 가능성 및 방법은?
5. 데이터 관리 프로세스의 개선점은?

## 응답 형식
### 데이터 이슈 분석
[데이터 문제 유형, 범위, 패턴 분석]

### 원인 추적
[데이터 손상/불일치 원인 및 발생 지점]

### 데이터베이스 성능
[쿼리 성능, 인덱스, 락 등 성능 요소 분석]

### 복구 전략
[데이터 복구 및 정합성 확보 방안]

### 데이터 관리 개선
[데이터 무결성 유지를 위한 프로세스 개선]
      `,

      application: `
# 애플리케이션 오류 분석 프롬프트

## 분석 대상 데이터
${JSON.stringify(serverData, null, 2)}

## 분석 초점
- 애플리케이션 오류 유형 및 패턴
- 예외 발생 지점 및 스택 트레이스 분석
- 코드 경로 및 로직 오류 식별
- 애플리케이션 안정성 개선 방안

## 핵심 질문
1. 어떤 유형의 예외/오류가 발생했는가?
2. 오류 발생의 정확한 코드 경로는?
3. 오류의 빈도 및 재현성은 어떠한가?
4. 유사 오류 패턴이 과거에 있었는가?
5. 코드 개선 및 버그 수정 방향은?

## 응답 형식
### 오류 분석
[오류 유형, 발생 위치, 빈도 분석]

### 스택 트레이스 분석
[호출 스택 및 예외 발생 경로 분석]

### 코드 경로 추적
[오류 발생까지의 코드 실행 경로]

### 버그 수정 방향
[오류 해결을 위한 코드 개선 방향]

### 테스트 전략
[유사 버그 방지를 위한 테스트 전략]
      `,

      infrastructure: `
# 인프라 문제 분석 프롬프트

## 분석 대상 데이터
${JSON.stringify(serverData, null, 2)}

## 분석 초점
- 인프라 구성 요소별 상태 및 문제점
- 하드웨어/가상화/클라우드 계층별 분석
- 인프라 안정성 및 확장성 검토
- 인프라 현대화 및 개선 방안

## 핵심 질문
1. 어떤 인프라 구성요소에 문제가 있는가?
2. 인프라 장애의 패턴 및 빈도는?
3. 현재 인프라의 아키텍처적 한계는?
4. 인프라 복원력을 높이기 위한 방안은?
5. 클라우드/온프레미스 최적 구성은?

## 응답 형식
### 인프라 상태 분석
[서버, 네트워크, 스토리지 등 구성요소별 상태]

### 장애 패턴 분석
[인프라 장애 유형 및 발생 패턴]

### 아키텍처 검토
[현재 인프라 아키텍처 평가 및 한계점]

### 복원력 강화 방안
[고가용성 및 장애 대응력 향상 방안]

### 현대화 로드맵
[인프라 개선 및 현대화 단계별 계획]
      `,

      unknown: `
# 일반 장애 분석 프롬프트

## 분석 대상 데이터
${JSON.stringify(serverData, null, 2)}

## 분석 초점
- 장애 징후 및 패턴 포괄적 분석
- 시스템 전반의 상관관계 검토
- 다양한 원인 가설 수립 및 검증
- 종합적인 개선 방안 도출

## 핵심 질문
1. 어떤 증상 및 이상 징후가 관찰되는가?
2. 언제부터 문제가 발생했으며 어떤 변화가 있었는가?
3. 시스템의 어떤 부분이 영향을 받고 있는가?
4. 가능한 원인 가설은 무엇인가?
5. 즉각적인 조치와 장기적 개선점은?

## 응답 형식
### 장애 상황 분석
[관찰된 증상 및 이상 징후 종합]

### 시간대별 이벤트 분석
[장애 전후 이벤트 시퀀스 및 변화]

### 원인 가설
[가능성 있는 장애 원인 가설 및 검증]

### 종합 개선 방안
[즉각적 조치 및 장기적 개선 제안]

### 모니터링 강화
[조기 감지를 위한 모니터링 개선점]
      `
    };

    return typePromptsMap[incidentType] || typePromptsMap.unknown;
  }

  /**
   * 성능 분석 전용 프롬프트
   */
  static getPerformanceAnalysisPrompt(query: string, serverData: any): string {
    return `
⚡ PERFORMANCE ANALYSIS - 성능 전문 분석

질문: "${query}"

분석 대상 서버 데이터:
${JSON.stringify(serverData, null, 2)}

분석 지침:
- CPU, Memory, Disk, Network 메트릭 종합 분석
- 병목 지점 식별 및 원인 분석
- 성능 트렌드 및 패턴 분석
- 최적화 방안 제시
- 용량 계획 제안

응답 형식:
## ⚡ 성능 개요
[전체 성능 상태 요약]

## 📊 메트릭 분석
[각 리소스별 상세 분석]

## 🔍 병목 지점 분석
[성능 저하 원인 및 위치]

## 📈 트렌드 분석
[시간별 성능 변화 패턴]

## ⚙️ 최적화 제안
[구체적인 성능 개선 방안]

## 📋 용량 계획
[향후 리소스 확장 계획]
`;
  }

  /**
   * 로그 분석 전용 프롬프트
   */
  static getLogAnalysisPrompt(query: string, logData: any): string {
    return `
🔍 LOG ANALYSIS - 로그 전문 분석

질문: "${query}"

분석 대상 로그:
${JSON.stringify(logData, null, 2)}

분석 지침:
- 에러 패턴 및 빈도 분석
- 경고 메시지 분류 및 우선순위
- 시간대별 로그 패턴 분석
- 근본 원인 추적
- 예방 조치 제안

응답 형식:
## 🔍 로그 개요
[전체 로그 상태 요약]

## ❌ 에러 분석
[에러 유형별 분석 및 빈도]

## ⚠️ 경고 분석
[경고 메시지 분류 및 중요도]

## 📊 패턴 분석
[시간대별/유형별 로그 패턴]

## 🎯 근본 원인
[문제의 근본 원인 추적]

## 🛡️ 예방 조치
[재발 방지를 위한 구체적 방안]
`;
  }

  /**
   * 용량 계획 전용 프롬프트
   */
  static getCapacityPlanningPrompt(query: string, capacityData: any): string {
    return `
📈 CAPACITY PLANNING - 용량 계획 전문 분석

질문: "${query}"

현재 용량 데이터:
${JSON.stringify(capacityData, null, 2)}

분석 지침:
- 현재 리소스 사용률 분석
- 성장 트렌드 예측
- 임계점 도달 시기 예측
- 확장 시나리오 제안
- 비용 효율성 분석

응답 형식:
## 📊 현재 용량 상태
[리소스별 사용률 및 여유분]

## 📈 성장 트렌드
[과거 데이터 기반 성장 패턴]

## ⏰ 임계점 예측
[리소스별 한계 도달 예상 시기]

## 🚀 확장 시나리오
[단계별 확장 계획 옵션]

## 💰 비용 분석
[확장 옵션별 비용 효율성]

## 📋 실행 계획
[구체적인 실행 로드맵]
`;
  }

  /**
   * 종합 장애 분석 프롬프트
   */
  static getComprehensiveIncidentAnalysisPrompt(
    query: string, 
    incidentType: IncidentType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    serverData: any
  ): string {
    // 유형별 프롬프트 가져오기
    const typePrompt = this.getIncidentTypePrompt(incidentType, serverData);
    
    // 심각도별 추가 지침
    const severityInstructions: Record<string, string> = {
      critical: `
## 긴급 대응 지침 (심각도: CRITICAL)
- 즉각적인 조치에 최우선 순위 부여
- 비즈니스 영향도 상세 분석 필수
- 전체 복구 계획 및 단계별 마일스톤 포함
- 실시간 상황 보고 형식 제안
- 장애 대응팀 구성 및 역할 제안
      `,
      high: `
## 우선 대응 지침 (심각도: HIGH)
- 4시간 이내 해결 방안 제시
- 주요 영향 평가 및 완화 계획 포함
- 리소스 할당 우선순위 제안
- 에스컬레이션 기준 명확화
      `,
      medium: `
## 표준 대응 지침 (심각도: MEDIUM)
- 24시간 이내 해결 방안 제시
- 부분적 해결책 및 우회 방안 포함
- 정상 업무 프로세스 내 해결 계획
      `,
      low: `
## 계획 대응 지침 (심각도: LOW)
- 계획된 유지보수 기간 내 해결 방안
- 사용자 경험에 미치는 영향 최소화 방안
- 유사 이슈 통합 해결 가능성 검토
      `
    };

    // 종합 프롬프트 생성
    return `
# 🚨 종합 장애 분석 보고서

## 장애 개요
- 분석 질의: "${query}"
- 장애 유형: ${incidentType}
- 심각도: ${severity}
- 분석 시간: ${new Date().toISOString()}

${severityInstructions[severity] || ''}

${typePrompt}

## 추가 분석 지침
- 이 장애가 다른 시스템에 미치는 영향을 반드시 평가할 것
- 단기/중기/장기 해결 방안을 모두 제시할 것
- 유사 장애 재발 방지를 위한 체크리스트 포함
- 장애 감지 및 대응 프로세스 개선점 제안
`;
  }
} 