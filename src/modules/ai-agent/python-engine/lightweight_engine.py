#!/usr/bin/env python3
"""
🚀 Lightweight AI Analysis Engine
Vercel 최적화 버전 - 5초 내 실행, 400MB 이하 메모리 사용

주요 특징:
- 지연 로딩으로 콜드스타트 최적화
- 경량 알고리즘 우선 사용
- 메모리 효율적 처리
- Fallback 메커니즘 내장
"""

import sys
import json
import time
import traceback
import warnings
from typing import Dict, Any, Optional, List, Tuple
import gc

# 경고 메시지 억제 (성능 향상)
warnings.filterwarnings('ignore')

class LightweightAIEngine:
    """Vercel 최적화 AI 엔진 (5초 제한)"""
    
    def __init__(self):
        self.models = {}
        self.is_initialized = False
        self.start_time = time.time()
        self.max_execution_time = 8.0  # Vercel 10초 제한 고려
        
    def _check_time_limit(self, operation: str) -> bool:
        """시간 제한 확인"""
        elapsed = time.time() - self.start_time
        if elapsed > self.max_execution_time:
            raise TimeoutError(f"Time limit exceeded during {operation}")
        return True
    
    def _lazy_import(self, module_name: str):
        """지연 로딩으로 필요할 때만 모듈 import"""
        if module_name not in self.models:
            try:
                if module_name == 'sklearn':
                    from sklearn.ensemble import IsolationForest
                    from sklearn.cluster import KMeans
                    from sklearn.linear_model import LinearRegression
                    from sklearn.preprocessing import StandardScaler
                    self.models['sklearn'] = {
                        'IsolationForest': IsolationForest,
                        'KMeans': KMeans,
                        'LinearRegression': LinearRegression,
                        'StandardScaler': StandardScaler
                    }
                elif module_name == 'scipy':
                    from scipy import stats
                    self.models['scipy'] = {'stats': stats}
                elif module_name == 'numpy':
                    import numpy as np
                    self.models['numpy'] = np
                elif module_name == 'pandas':
                    import pandas as pd
                    self.models['pandas'] = pd
                elif module_name == 'statsmodels':
                    from statsmodels.tsa.arima.model import ARIMA
                    from statsmodels.tsa.holtwinters import ExponentialSmoothing
                    self.models['statsmodels'] = {
                        'ARIMA': ARIMA,
                        'ExponentialSmoothing': ExponentialSmoothing
                    }
            except ImportError as e:
                print(f"Warning: {module_name} not available: {e}", file=sys.stderr)
                return None
        return self.models.get(module_name)
    
    async def quick_comprehensive_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """종합 분석 (5초 제한)"""
        try:
            results = {}
            self._check_time_limit("initialization")
            
            # 1초: 빠른 이상 탐지
            if 'features' in data:
                results['anomaly'] = await self._fast_anomaly_detection(data['features'])
                self._check_time_limit("anomaly detection")
            
            # 2초: 경량 시계열 예측
            if 'timeseries' in data:
                results['forecast'] = await self._lightweight_forecast(data['timeseries'])
                self._check_time_limit("forecasting")
            
            # 1초: 빠른 클러스터링
            if 'features' in data and len(data['features']) > 3:
                results['clustering'] = await self._fast_clustering(data['features'])
                self._check_time_limit("clustering")
            
            # 1초: 상관관계 분석
            if 'variables' in data:
                results['correlation'] = await self._quick_correlation(data['variables'])
                self._check_time_limit("correlation")
            
            # 메모리 정리
            gc.collect()
            
            return {
                'success': True, 
                'results': results, 
                'method': 'lightweight',
                'execution_time': time.time() - self.start_time,
                'memory_optimized': True
            }
            
        except TimeoutError as e:
            return {
                'success': False, 
                'error': str(e), 
                'partial_results': results if 'results' in locals() else {},
                'fallback_available': True
            }
        except Exception as e:
            return {
                'success': False, 
                'error': str(e), 
                'traceback': traceback.format_exc(),
                'fallback_available': True
            }
    
    async def _fast_anomaly_detection(self, features: List[List[float]]) -> Dict[str, Any]:
        """빠른 이상 탐지 (IsolationForest 경량화)"""
        try:
            sklearn = self._lazy_import('sklearn')
            np = self._lazy_import('numpy')
            
            if not sklearn or not np:
                return self._statistical_anomaly_fallback(features)
            
            # 데이터 크기 제한 (성능 최적화)
            if len(features) > 1000:
                features = features[:1000]
            
            # 경량 IsolationForest
            model = sklearn['IsolationForest'](
                contamination=0.1,
                n_estimators=50,  # 기본 100에서 50으로 감소
                max_samples=min(256, len(features)),  # 메모리 제한
                random_state=42,
                n_jobs=1  # 단일 스레드로 메모리 절약
            )
            
            X = np.array(features)
            anomaly_scores = model.fit_predict(X)
            outlier_scores = model.score_samples(X)
            
            anomaly_count = sum(1 for score in anomaly_scores if score == -1)
            
            return {
                'anomaly_scores': outlier_scores.tolist(),
                'is_anomaly': (anomaly_scores == -1).tolist(),
                'anomaly_count': anomaly_count,
                'anomaly_percentage': (anomaly_count / len(features)) * 100,
                'algorithm': 'isolation_forest_light',
                'total_samples': len(features)
            }
            
        except Exception as e:
            return self._statistical_anomaly_fallback(features)
    
    def _statistical_anomaly_fallback(self, features: List[List[float]]) -> Dict[str, Any]:
        """통계적 이상 탐지 fallback (라이브러리 없이)"""
        try:
            # 간단한 Z-score 기반 이상 탐지
            import statistics
            
            anomalies = []
            for i, feature_set in enumerate(features):
                z_scores = []
                for feature in feature_set:
                    mean_val = statistics.mean([f[feature_set.index(feature)] for f in features])
                    std_val = statistics.stdev([f[feature_set.index(feature)] for f in features])
                    if std_val > 0:
                        z_score = abs((feature - mean_val) / std_val)
                        z_scores.append(z_score)
                
                # Z-score > 2.5면 이상치로 판단
                is_anomaly = any(z > 2.5 for z in z_scores)
                anomalies.append(is_anomaly)
            
            anomaly_count = sum(anomalies)
            
            return {
                'is_anomaly': anomalies,
                'anomaly_count': anomaly_count,
                'anomaly_percentage': (anomaly_count / len(features)) * 100,
                'algorithm': 'statistical_zscore',
                'total_samples': len(features)
            }
            
        except Exception:
            return {
                'error': 'Anomaly detection failed',
                'algorithm': 'fallback_failed'
            }
    
    async def _lightweight_forecast(self, timeseries: Dict[str, Any]) -> Dict[str, Any]:
        """경량 시계열 예측"""
        try:
            values = timeseries.get('values', [])
            horizon = timeseries.get('horizon', 10)
            
            if len(values) < 3:
                return {'error': 'Insufficient data for forecasting'}
            
            # 데이터 크기 제한
            if len(values) > 100:
                values = values[-100:]  # 최근 100개만 사용
            
            # 간단한 선형 회귀 예측 (빠름)
            try:
                sklearn = self._lazy_import('sklearn')
                np = self._lazy_import('numpy')
                
                if sklearn and np:
                    X = np.array(range(len(values))).reshape(-1, 1)
                    y = np.array(values)
                    
                    model = sklearn['LinearRegression']()
                    model.fit(X, y)
                    
                    # 미래 예측
                    future_X = np.array(range(len(values), len(values) + horizon)).reshape(-1, 1)
                    forecast = model.predict(future_X)
                    
                    # 트렌드 분석
                    trend = 'increasing' if model.coef_[0] > 0.1 else 'decreasing' if model.coef_[0] < -0.1 else 'stable'
                    
                    return {
                        'forecast': forecast.tolist(),
                        'model': 'linear_regression',
                        'trend': trend,
                        'confidence': min(0.9, max(0.5, 1 - abs(model.coef_[0]) * 0.1))
                    }
            except Exception:
                pass
            
            # Fallback: 단순 이동평균
            return self._simple_moving_average_forecast(values, horizon)
            
        except Exception as e:
            return {'error': f'Forecasting failed: {str(e)}'}
    
    def _simple_moving_average_forecast(self, values: List[float], horizon: int) -> Dict[str, Any]:
        """단순 이동평균 예측 (fallback)"""
        try:
            window = min(5, len(values))
            recent_avg = sum(values[-window:]) / window
            
            # 트렌드 계산
            if len(values) >= 2:
                trend_slope = (values[-1] - values[0]) / len(values)
            else:
                trend_slope = 0
            
            # 예측값 생성
            forecast = []
            for i in range(horizon):
                predicted = recent_avg + (trend_slope * i)
                forecast.append(predicted)
            
            trend = 'increasing' if trend_slope > 0.1 else 'decreasing' if trend_slope < -0.1 else 'stable'
            
            return {
                'forecast': forecast,
                'model': 'moving_average',
                'trend': trend,
                'confidence': 0.6
            }
            
        except Exception:
            return {'error': 'Simple forecasting failed'}
    
    async def _fast_clustering(self, features: List[List[float]]) -> Dict[str, Any]:
        """빠른 클러스터링"""
        try:
            sklearn = self._lazy_import('sklearn')
            np = self._lazy_import('numpy')
            
            if not sklearn or not np:
                return self._simple_clustering_fallback(features)
            
            # 데이터 크기 제한
            if len(features) > 500:
                features = features[:500]
            
            X = np.array(features)
            
            # 최적 클러스터 수 추정 (간단한 방법)
            n_clusters = min(5, max(2, len(features) // 10))
            
            # 빠른 K-means
            model = sklearn['KMeans'](
                n_clusters=n_clusters,
                init='k-means++',
                max_iter=100,  # 기본 300에서 100으로 감소
                random_state=42,
                n_init=1  # 기본 10에서 1로 감소
            )
            
            labels = model.fit_predict(X)
            
            # 클러스터 통계
            cluster_stats = {}
            for i in range(n_clusters):
                cluster_mask = labels == i
                cluster_size = sum(cluster_mask)
                cluster_stats[f'cluster_{i}'] = {
                    'size': cluster_size,
                    'percentage': (cluster_size / len(features)) * 100
                }
            
            return {
                'cluster_labels': labels.tolist(),
                'n_clusters': n_clusters,
                'cluster_stats': cluster_stats,
                'algorithm': 'kmeans_fast'
            }
            
        except Exception as e:
            return self._simple_clustering_fallback(features)
    
    def _simple_clustering_fallback(self, features: List[List[float]]) -> Dict[str, Any]:
        """간단한 클러스터링 fallback"""
        try:
            # 거리 기반 간단한 클러스터링
            import math
            
            def euclidean_distance(p1, p2):
                return math.sqrt(sum((a - b) ** 2 for a, b in zip(p1, p2)))
            
            clusters = []
            threshold = 1.0  # 클러스터링 임계값
            
            for feature in features:
                assigned = False
                for cluster in clusters:
                    if any(euclidean_distance(feature, existing) < threshold for existing in cluster):
                        cluster.append(feature)
                        assigned = True
                        break
                
                if not assigned:
                    clusters.append([feature])
            
            # 라벨 생성
            labels = []
            for feature in features:
                for i, cluster in enumerate(clusters):
                    if feature in cluster:
                        labels.append(i)
                        break
            
            return {
                'cluster_labels': labels,
                'n_clusters': len(clusters),
                'algorithm': 'distance_based_simple'
            }
            
        except Exception:
            return {'error': 'Simple clustering failed'}
    
    async def _quick_correlation(self, variables: List[Dict[str, Any]]) -> Dict[str, Any]:
        """빠른 상관관계 분석"""
        try:
            scipy = self._lazy_import('scipy')
            
            if len(variables) < 2:
                return {'error': 'Need at least 2 variables for correlation'}
            
            correlations = []
            
            for i in range(len(variables)):
                for j in range(i + 1, len(variables)):
                    var1 = variables[i]
                    var2 = variables[j]
                    
                    values1 = var1.get('values', [])
                    values2 = var2.get('values', [])
                    
                    if len(values1) != len(values2) or len(values1) < 3:
                        continue
                    
                    # 데이터 크기 제한
                    if len(values1) > 1000:
                        values1 = values1[:1000]
                        values2 = values2[:1000]
                    
                    try:
                        if scipy:
                            # Pearson 상관계수
                            corr_coef, p_value = scipy['stats'].pearsonr(values1, values2)
                        else:
                            # 수동 계산 fallback
                            corr_coef = self._calculate_pearson_correlation(values1, values2)
                            p_value = 0.05  # 기본값
                        
                        significance = 'high' if p_value < 0.01 else 'medium' if p_value < 0.05 else 'low'
                        
                        correlations.append({
                            'variable1': var1.get('name', f'var_{i}'),
                            'variable2': var2.get('name', f'var_{j}'),
                            'coefficient': float(corr_coef),
                            'p_value': float(p_value),
                            'significance': significance
                        })
                        
                    except Exception:
                        continue
            
            return {
                'correlations': correlations,
                'method': 'pearson',
                'total_pairs': len(correlations)
            }
            
        except Exception as e:
            return {'error': f'Correlation analysis failed: {str(e)}'}
    
    def _calculate_pearson_correlation(self, x: List[float], y: List[float]) -> float:
        """수동 Pearson 상관계수 계산"""
        try:
            n = len(x)
            if n == 0:
                return 0.0
            
            sum_x = sum(x)
            sum_y = sum(y)
            sum_xy = sum(xi * yi for xi, yi in zip(x, y))
            sum_x2 = sum(xi * xi for xi in x)
            sum_y2 = sum(yi * yi for yi in y)
            
            numerator = n * sum_xy - sum_x * sum_y
            denominator = ((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y)) ** 0.5
            
            if denominator == 0:
                return 0.0
            
            return numerator / denominator
            
        except Exception:
            return 0.0

def main():
    """메인 실행 함수"""
    try:
        # stdin에서 요청 읽기
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({'error': 'No input data provided'}))
            return
        
        request = json.loads(input_data)
        
        # 엔진 초기화
        engine = LightweightAIEngine()
        
        # 분석 실행
        import asyncio
        result = asyncio.run(engine.quick_comprehensive_analysis(request.get('data', {})))
        
        # 결과 출력
        print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            'error': f'Invalid JSON input: {str(e)}',
            'fallback_available': True
        }))
    except Exception as e:
        print(json.dumps({
            'error': f'Engine execution failed: {str(e)}',
            'traceback': traceback.format_exc(),
            'fallback_available': True
        }))

if __name__ == '__main__':
    main() 