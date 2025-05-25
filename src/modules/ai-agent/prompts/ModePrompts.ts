/**
 * Mode Prompts
 * 
 * 💬 모드별 프롬프트 생성 시스템
 * - Basic 모드: 간결하고 명확한 답변
 * - Advanced 모드: 전문가 수준 종합 분석
 * - 특별 케이스: 장애 보고서 자동 생성
 */

import { QueryAnalysis } from '../core/SmartModeDetector';

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

    return `
🟠 ADVANCED MODE - 전문가 수준 종합 분석

사용자 질문: "${query}"
분석 결과: ${analysis.reasoning}

특별 지침:
${specialInstructions}

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
    return `
🚨 INCIDENT REPORT - 자동 장애 분석 보고서

ADVANCED MODE로 전환하여 종합 분석을 수행합니다.

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
`;
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
} 