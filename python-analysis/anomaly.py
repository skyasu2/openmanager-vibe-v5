#!/usr/bin/env python3
"""
이상 탐지 스크립트 (PyOD)
오프라인 환경에서 실행 가능한 이상 탐지 모델
"""

import sys
import json
import warnings
import numpy as np
import pandas as pd

# 경고 메시지 숨기기
warnings.filterwarnings('ignore')

try:
    # PyOD 라이브러리 (이상 탐지 전용)
    from pyod.models.iforest import IForest
    from pyod.models.autoencoder import AutoEncoder
    from pyod.models.lof import LOF
    from pyod.models.knn import KNN
    PYOD_AVAILABLE = True
except ImportError:
    # PyOD가 없으면 scikit-learn 기본 모델 사용
    from sklearn.ensemble import IsolationForest
    from sklearn.neighbors import LocalOutlierFactor
    from sklearn.preprocessing import StandardScaler
    PYOD_AVAILABLE = False

def load_input():
    """stdin에서 JSON 입력 로드"""
    try:
        input_data = json.loads(sys.stdin.read())
        return input_data
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse input: {str(e)}"}))
        sys.exit(1)

def prepare_features(data):
    """특성 데이터 준비"""
    try:
        features = np.array(data['data']['features'])
        
        # 결측값 처리
        features = np.nan_to_num(features, nan=0.0)
        
        # 최소 특성 수 확인
        if features.shape[1] < 2:
            raise ValueError("At least 2 features required for anomaly detection")
        
        return features
    except Exception as e:
        raise ValueError(f"Failed to prepare features: {str(e)}")

def detect_with_pyod(features, algorithm, contamination):
    """PyOD를 사용한 이상 탐지"""
    try:
        # 알고리즘 선택
        if algorithm == 'isolation_forest':
            model = IForest(contamination=contamination, random_state=42)
        elif algorithm == 'autoencoder':
            model = AutoEncoder(contamination=contamination, random_state=42)
        elif algorithm == 'lof':
            model = LOF(contamination=contamination)
        else:
            # 기본값: KNN
            model = KNN(contamination=contamination)
        
        # 모델 학습 및 예측
        model.fit(features)
        anomaly_scores = model.decision_scores_
        is_anomaly = model.labels_.astype(bool)
        threshold = model.threshold_
        
        return {
            'anomaly_scores': anomaly_scores.tolist(),
            'is_anomaly': is_anomaly.tolist(),
            'threshold': float(threshold),
            'contamination_rate': contamination,
            'algorithm_used': algorithm,
            'n_outliers': int(np.sum(is_anomaly))
        }
        
    except Exception as e:
        raise RuntimeError(f"PyOD anomaly detection failed: {str(e)}")

def detect_with_sklearn(features, algorithm, contamination):
    """scikit-learn을 사용한 기본 이상 탐지"""
    try:
        # 데이터 정규화
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)
        
        if algorithm == 'isolation_forest':
            # Isolation Forest
            model = IsolationForest(
                contamination=contamination,
                random_state=42,
                n_estimators=100
            )
            model.fit(features_scaled)
            anomaly_scores = model.decision_function(features_scaled)
            is_anomaly = model.predict(features_scaled) == -1
            
        else:
            # Local Outlier Factor
            model = LocalOutlierFactor(
                contamination=contamination,
                novelty=False
            )
            is_anomaly = model.fit_predict(features_scaled) == -1
            anomaly_scores = model.negative_outlier_factor_
        
        # 임계값 계산
        threshold = np.percentile(anomaly_scores, (1 - contamination) * 100)
        
        return {
            'anomaly_scores': anomaly_scores.tolist(),
            'is_anomaly': is_anomaly.tolist(),
            'threshold': float(threshold),
            'contamination_rate': contamination,
            'algorithm_used': f'sklearn_{algorithm}',
            'n_outliers': int(np.sum(is_anomaly))
        }
        
    except Exception as e:
        raise RuntimeError(f"Sklearn anomaly detection failed: {str(e)}")

def calculate_anomaly_statistics(features, anomaly_scores, is_anomaly):
    """이상 탐지 통계 계산"""
    try:
        stats = {
            'total_samples': len(features),
            'anomaly_count': int(np.sum(is_anomaly)),
            'anomaly_percentage': float(np.mean(is_anomaly) * 100),
            'score_statistics': {
                'mean': float(np.mean(anomaly_scores)),
                'std': float(np.std(anomaly_scores)),
                'min': float(np.min(anomaly_scores)),
                'max': float(np.max(anomaly_scores)),
                'median': float(np.median(anomaly_scores))
            }
        }
        
        # 특성별 이상치 분석
        if len(features.shape) > 1:
            feature_stats = []
            for i in range(features.shape[1]):
                feature_values = features[:, i]
                anomaly_feature_values = feature_values[is_anomaly]
                
                if len(anomaly_feature_values) > 0:
                    feature_stats.append({
                        'feature_index': i,
                        'normal_mean': float(np.mean(feature_values[~is_anomaly])) if np.sum(~is_anomaly) > 0 else 0.0,
                        'anomaly_mean': float(np.mean(anomaly_feature_values)),
                        'difference_ratio': float(np.mean(anomaly_feature_values) / np.mean(feature_values[~is_anomaly])) if np.sum(~is_anomaly) > 0 and np.mean(feature_values[~is_anomaly]) != 0 else 1.0
                    })
            
            stats['feature_analysis'] = feature_stats
        
        return stats
        
    except Exception as e:
        return {'error': f"Failed to calculate statistics: {str(e)}"}

def main():
    """메인 실행 함수"""
    try:
        # 입력 데이터 로드
        input_data = load_input()
        
        # 파라미터 추출
        contamination = input_data.get('params', {}).get('contamination', 0.05)
        algorithm = input_data.get('params', {}).get('algorithm', 'isolation_forest')
        
        # 특성 데이터 준비
        features = prepare_features(input_data)
        
        # 최소 샘플 수 확인
        if len(features) < 10:
            raise ValueError("Insufficient samples for anomaly detection (minimum 10 required)")
        
        # 이상 탐지 수행
        if PYOD_AVAILABLE and len(features) >= 20:
            result = detect_with_pyod(features, algorithm, contamination)
        else:
            result = detect_with_sklearn(features, algorithm, contamination)
        
        # 통계 정보 추가
        stats = calculate_anomaly_statistics(features, result['anomaly_scores'], result['is_anomaly'])
        result['statistics'] = stats
        
        # 결과 출력
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'fallback_result': {
                'anomaly_scores': [0.0] * len(features) if 'features' in locals() else [0.0] * 10,
                'is_anomaly': [False] * len(features) if 'features' in locals() else [False] * 10,
                'threshold': 0.0,
                'contamination_rate': 0.05,
                'algorithm_used': 'fallback',
                'n_outliers': 0
            }
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main() 