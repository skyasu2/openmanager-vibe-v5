/**
 * 🧪 타입 레벨 테스트 - Prediction System
 *
 * @description Vitest expectTypeOf를 사용한 타입 안전성 검증
 * @author Claude Code
 * @created 2025-11-26
 * @benefits
 *  - 리팩토링 시 타입 변경 감지
 *  - 런타임 오류 사전 방지
 *  - API 계약 검증
 */

import { describe, expectTypeOf, it } from 'vitest';
import type {
  Incident,
  IncidentReport,
  IntegratedAnalysisResult,
  MetricDataPoint,
  PredictionResult,
  RuleBasedAnalysisResult,
  ServerMetrics,
} from '@/types/integrated-prediction-system.types';

describe('🔮 Prediction System 타입 테스트', () => {
  describe('PredictionResult 타입', () => {
    it('필수 속성을 모두 포함한다', () => {
      expectTypeOf<PredictionResult>().toHaveProperty('serverId');
      expectTypeOf<PredictionResult>().toHaveProperty('failureProbability');
      expectTypeOf<PredictionResult>().toHaveProperty('predictedTime');
      expectTypeOf<PredictionResult>().toHaveProperty('confidence');
      expectTypeOf<PredictionResult>().toHaveProperty('triggerMetrics');
      expectTypeOf<PredictionResult>().toHaveProperty('preventiveActions');
      expectTypeOf<PredictionResult>().toHaveProperty('severity');
      expectTypeOf<PredictionResult>().toHaveProperty('analysisType');
    });

    it('각 속성의 타입이 올바르다', () => {
      expectTypeOf<PredictionResult['serverId']>().toBeString();
      expectTypeOf<PredictionResult['failureProbability']>().toBeNumber();
      expectTypeOf<PredictionResult['predictedTime']>().toEqualTypeOf<Date>();
      expectTypeOf<PredictionResult['confidence']>().toBeNumber();
      expectTypeOf<PredictionResult['triggerMetrics']>().toEqualTypeOf<
        string[]
      >();
      expectTypeOf<PredictionResult['preventiveActions']>().toEqualTypeOf<
        string[]
      >();
    });

    it('severity는 특정 문자열 리터럴만 허용한다', () => {
      expectTypeOf<PredictionResult['severity']>().toEqualTypeOf<
        'low' | 'medium' | 'high' | 'critical'
      >();
    });

    it('analysisType은 특정 문자열 리터럴만 허용한다', () => {
      expectTypeOf<PredictionResult['analysisType']>().toEqualTypeOf<
        'trend' | 'anomaly' | 'pattern' | 'hybrid'
      >();
    });
  });

  describe('MetricDataPoint 타입', () => {
    it('모든 메트릭 속성이 숫자다', () => {
      expectTypeOf<MetricDataPoint['cpu']>().toBeNumber();
      expectTypeOf<MetricDataPoint['memory']>().toBeNumber();
      expectTypeOf<MetricDataPoint['disk']>().toBeNumber();
      expectTypeOf<MetricDataPoint['network']>().toBeNumber();
      expectTypeOf<MetricDataPoint['errorRate']>().toBeNumber();
      expectTypeOf<MetricDataPoint['responseTime']>().toBeNumber();
    });

    it('timestamp는 Date 타입이다', () => {
      expectTypeOf<MetricDataPoint['timestamp']>().toEqualTypeOf<Date>();
    });
  });

  describe('ServerMetrics 타입', () => {
    it('중첩된 객체 구조를 올바르게 정의한다', () => {
      // CPU 메트릭
      expectTypeOf<ServerMetrics['cpu']>().toHaveProperty('usage');
      expectTypeOf<ServerMetrics['cpu']>().toHaveProperty('temperature');
      expectTypeOf<ServerMetrics['cpu']['usage']>().toBeNumber();
      expectTypeOf<ServerMetrics['cpu']['temperature']>().toBeNumber();

      // Memory 메트릭
      expectTypeOf<ServerMetrics['memory']>().toHaveProperty('usage');
      expectTypeOf<ServerMetrics['memory']>().toHaveProperty('available');
      expectTypeOf<ServerMetrics['memory']['usage']>().toBeNumber();
      expectTypeOf<ServerMetrics['memory']['available']>().toBeNumber();

      // Disk 메트릭
      expectTypeOf<ServerMetrics['disk']>().toHaveProperty('usage');
      expectTypeOf<ServerMetrics['disk']>().toHaveProperty('io');
      expectTypeOf<ServerMetrics['disk']['usage']>().toBeNumber();
      expectTypeOf<ServerMetrics['disk']['io']>().toBeNumber();

      // Network 메트릭
      expectTypeOf<ServerMetrics['network']>().toHaveProperty('in');
      expectTypeOf<ServerMetrics['network']>().toHaveProperty('out');
      expectTypeOf<ServerMetrics['network']['in']>().toBeNumber();
      expectTypeOf<ServerMetrics['network']['out']>().toBeNumber();
    });
  });

  describe('Incident 타입', () => {
    it('필수 속성을 포함한다', () => {
      expectTypeOf<Incident>().toHaveProperty('id');
      expectTypeOf<Incident>().toHaveProperty('serverId');
      expectTypeOf<Incident>().toHaveProperty('type');
      expectTypeOf<Incident>().toHaveProperty('severity');
      expectTypeOf<Incident>().toHaveProperty('affectedServer');
      expectTypeOf<Incident>().toHaveProperty('detectedAt');
    });

    it('predictedTime은 optional이고 number 타입이다', () => {
      expectTypeOf<Incident['predictedTime']>().toEqualTypeOf<
        number | undefined
      >();
    });

    it('severity는 warning 또는 critical만 허용한다', () => {
      expectTypeOf<Incident['severity']>().toEqualTypeOf<
        'warning' | 'critical'
      >();
    });
  });

  describe('IncidentReport 타입', () => {
    it('Incident를 포함한다', () => {
      expectTypeOf<IncidentReport['incident']>().toEqualTypeOf<Incident>();
    });

    it('PredictionResult를 포함한다', () => {
      expectTypeOf<
        IncidentReport['prediction']
      >().toEqualTypeOf<PredictionResult>();
    });

    it('analysis는 문자열이다', () => {
      expectTypeOf<IncidentReport['analysis']>().toBeString();
    });

    it('solutions는 문자열 배열이다', () => {
      expectTypeOf<IncidentReport['solutions']>().toEqualTypeOf<string[]>();
    });
  });

  describe('IntegratedAnalysisResult 타입', () => {
    it('세 가지 분석 결과를 통합한다', () => {
      expectTypeOf<
        IntegratedAnalysisResult['mlPrediction']
      >().toEqualTypeOf<PredictionResult>();
      expectTypeOf<
        IntegratedAnalysisResult['ruleBasedAnalysis']
      >().toEqualTypeOf<RuleBasedAnalysisResult>();
      expectTypeOf<
        IntegratedAnalysisResult['anomalyDetection']
      >().toMatchTypeOf<{
        isAnomaly: boolean;
      }>();
    });

    it('combinedConfidence는 숫자다', () => {
      expectTypeOf<
        IntegratedAnalysisResult['combinedConfidence']
      >().toBeNumber();
    });

    it('alertLevel은 특정 색상 문자열만 허용한다', () => {
      expectTypeOf<IntegratedAnalysisResult['alertLevel']>().toEqualTypeOf<
        'green' | 'yellow' | 'orange' | 'red'
      >();
    });

    it('processingTime은 숫자다', () => {
      expectTypeOf<IntegratedAnalysisResult['processingTime']>().toBeNumber();
    });
  });

  describe('타입 호환성 테스트', () => {
    it('PredictionResult를 IncidentReport에서 사용할 수 있다', () => {
      expectTypeOf<IncidentReport>().toMatchTypeOf<{
        prediction: PredictionResult;
      }>();
    });

    it('RuleBasedAnalysisResult가 IntegratedAnalysisResult에 포함된다', () => {
      expectTypeOf<IntegratedAnalysisResult>().toMatchTypeOf<{
        ruleBasedAnalysis: RuleBasedAnalysisResult;
      }>();
    });
  });

  describe('타입 안전성 검증', () => {
    it('severity 타입은 임의의 문자열을 허용하지 않는다', () => {
      // @ts-expect-error - 올바르지 않은 severity 값
      expectTypeOf<PredictionResult['severity']>().not.toEqualTypeOf<string>();
    });

    it('analysisType 타입은 임의의 문자열을 허용하지 않는다', () => {
      // @ts-expect-error - 올바르지 않은 analysisType 값
      expectTypeOf<
        PredictionResult['analysisType']
      >().not.toEqualTypeOf<string>();
    });
  });
});
