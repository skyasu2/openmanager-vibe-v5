/**
 * 🔮 AI 예측 분석 API
 * 
 * 시계열 데이터 기반 미래 예측 서비스
 * - CPU/메모리/디스크 사용률 예측
 * - 트렌드 분석 및 패턴 감지
 * - 신뢰구간 및 추천사항 제공
 */

import { NextRequest, NextResponse } from 'next/server';
import { timeSeriesPredictor, PredictionRequest } from '@/services/ai/TimeSeriesPredictor';
import { enhancedDataGenerator } from '@/utils/enhanced-data-generator';

export async function POST(request: NextRequest) {
  try {
    console.log('🔮 AI 예측 API 요청 수신');
    
    const body = await request.json();
    
    // 요청 검증
    const {
      metric = 'cpu',
      horizon = 30,
      confidence = 0.95,
      data = null
    } = body;
    
    if (!['cpu', 'memory', 'disk', 'network'].includes(metric)) {
      return NextResponse.json(
        { error: '지원하지 않는 메트릭입니다. cpu, memory, disk, network 중 선택하세요.' },
        { status: 400 }
      );
    }
    
    if (horizon < 5 || horizon > 1440) { // 5분 ~ 24시간
      return NextResponse.json(
        { error: '예측 시간은 5분에서 1440분(24시간) 사이여야 합니다.' },
        { status: 400 }
      );
    }
    
    if (confidence < 0.8 || confidence > 0.99) {
      return NextResponse.json(
        { error: '신뢰도는 0.8에서 0.99 사이여야 합니다.' },
        { status: 400 }
      );
    }
    
    // 예측 요청 생성
    const predictionRequest: PredictionRequest = {
      metric,
      horizon,
      confidence,
      data: data || undefined
    };
    
    // 예측 실행
    const result = await timeSeriesPredictor.predict(predictionRequest);
    
    // 응답 데이터 구성
    const response = {
      success: true,
      prediction: result,
      system_status: {
        timestamp: new Date().toISOString(),
        predictor_stats: timeSeriesPredictor.getStats(),
        api_version: 'v3.0'
      },
      examples: {
        usage: '30분 후 CPU 예측',
        interpretation: {
          predicted_value: `${result.predicted_value}% (${result.trend} 트렌드)`,
          confidence_range: `${result.confidence_interval[0]}% ~ ${result.confidence_interval[1]}%`,
          accuracy: `${(result.accuracy_score * 100).toFixed(1)}% 정확도`,
          seasonality: result.seasonality.detected 
            ? `주기성 감지됨 (${result.seasonality.period}포인트 주기)` 
            : '주기성 없음'
        }
      }
    };
    
    console.log(`✅ 예측 완료: ${result.predicted_value}% (${result.metadata.computation_time}ms)`);
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ AI 예측 API 에러:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const demo = searchParams.get('demo');
    
    if (demo === 'true') {
      // 데모 모드: 샘플 데이터로 여러 메트릭 예측
      console.log('🎮 데모 모드: 샘플 예측 실행');
      
      const metrics = ['cpu', 'memory', 'disk'];
      const horizons = [15, 30, 60]; // 15분, 30분, 1시간
      
      const predictions = [];
      
      for (const metric of metrics) {
        for (const horizon of horizons) {
          try {
            const result = await timeSeriesPredictor.predict({
              metric,
              horizon,
              confidence: 0.95
            });
            
            predictions.push({
              metric,
              horizon_minutes: horizon,
              predicted_value: result.predicted_value,
              trend: result.trend,
              confidence_interval: result.confidence_interval,
              recommendations: result.recommendations.slice(0, 2), // 상위 2개만
              accuracy: result.accuracy_score
            });
            
          } catch (error) {
            console.warn(`⚠️ ${metric} 예측 실패:`, error);
          }
        }
      }
      
      // 시스템 통계
      const stats = timeSeriesPredictor.getStats();
      
      const response = {
        success: true,
        demo_mode: true,
        predictions,
        summary: {
          total_predictions: predictions.length,
          average_accuracy: predictions.length > 0 
            ? (predictions.reduce((sum, p) => sum + p.accuracy, 0) / predictions.length).toFixed(3)
            : 0,
          trends_detected: {
            increasing: predictions.filter(p => p.trend === 'increasing').length,
            decreasing: predictions.filter(p => p.trend === 'decreasing').length,
            stable: predictions.filter(p => p.trend === 'stable').length
          }
        },
        system_stats: {
          ...stats,
          timestamp: new Date().toISOString()
        },
        usage_examples: {
          post_request: {
            url: '/api/ai/prediction',
            method: 'POST',
            body: {
              metric: 'cpu',
              horizon: 30,
              confidence: 0.95,
              data: 'optional_time_series_data'
            }
          },
          get_demo: {
            url: '/api/ai/prediction?demo=true',
            method: 'GET'
          }
        }
      };
      
      console.log(`✅ 데모 완료: ${predictions.length}개 예측 생성`);
      return NextResponse.json(response);
      
    } else {
      // 일반 모드: API 정보 제공
      return NextResponse.json({
        service: '🔮 AI 시계열 예측 서비스',
        version: 'v3.0',
        description: 'AI 기반 서버 메트릭 미래 예측 및 패턴 분석',
        features: [
          '30분~24시간 미래 예측',
          '트렌드 및 계절성 자동 감지',
          '신뢰구간 제공',
          '스마트 추천사항 생성',
          '85%+ 예측 정확도'
        ],
        supported_metrics: ['cpu', 'memory', 'disk', 'network'],
        endpoints: {
          predict: {
            method: 'POST',
            path: '/api/ai/prediction',
            description: '시계열 예측 실행'
          },
          demo: {
            method: 'GET',
            path: '/api/ai/prediction?demo=true',
            description: '데모 예측 실행'
          }
        },
        current_stats: timeSeriesPredictor.getStats(),
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error: any) {
    console.error('❌ 예측 API GET 에러:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 