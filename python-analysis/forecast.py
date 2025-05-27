#!/usr/bin/env python3
"""
시계열 예측 스크립트 (Kats ARIMA)
오프라인 환경에서 실행 가능한 시계열 예측 모델
"""

import sys
import json
import warnings
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# 경고 메시지 숨기기
warnings.filterwarnings('ignore')

try:
    # Kats 라이브러리 (Facebook의 시계열 분석 도구)
    from kats.consts import TimeSeriesData
    from kats.models.arima import ARIMAModel, ARIMAParams
    from kats.models.prophet import ProphetModel, ProphetParams
    from kats.models.linear_model import LinearModel, LinearModelParams
    KATS_AVAILABLE = True
except ImportError:
    # Kats가 없으면 기본 통계 모델 사용
    from scipy import stats
    from sklearn.linear_model import LinearRegression
    KATS_AVAILABLE = False

def load_input():
    """stdin에서 JSON 입력 로드"""
    try:
        input_data = json.loads(sys.stdin.read())
        return input_data
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse input: {str(e)}"}))
        sys.exit(1)

def prepare_time_series(data):
    """시계열 데이터 준비"""
    try:
        timestamps = data['data']['timestamps']
        values = data['data']['values']
        
        # pandas DataFrame 생성
        df = pd.DataFrame({
            'time': pd.to_datetime(timestamps),
            'value': values
        })
        
        # 결측값 처리
        df['value'] = df['value'].fillna(df['value'].mean())
        
        # 시간 순서로 정렬
        df = df.sort_values('time').reset_index(drop=True)
        
        return df
    except Exception as e:
        raise ValueError(f"Failed to prepare time series data: {str(e)}")

def forecast_with_kats(df, horizon, model_type):
    """Kats를 사용한 예측"""
    try:
        # TimeSeriesData 객체 생성
        ts_data = TimeSeriesData(df)
        
        if model_type == 'arima':
            # ARIMA 모델
            params = ARIMAParams(p=2, d=1, q=2)
            model = ARIMAModel(data=ts_data, params=params)
        elif model_type == 'prophet':
            # Prophet 모델
            params = ProphetParams()
            model = ProphetModel(data=ts_data, params=params)
        else:
            # Linear 모델
            params = LinearModelParams()
            model = LinearModel(data=ts_data, params=params)
        
        # 모델 학습
        model.fit()
        
        # 예측 수행
        forecast = model.predict(steps=horizon)
        
        # 신뢰구간 계산 (간단한 구현)
        forecast_values = forecast['fcst'].values
        std_error = np.std(df['value']) * 0.1  # 표준오차 추정
        
        confidence_lower = forecast_values - 1.96 * std_error
        confidence_upper = forecast_values + 1.96 * std_error
        
        return {
            'forecast': forecast_values.tolist(),
            'confidence_lower': confidence_lower.tolist(),
            'confidence_upper': confidence_upper.tolist(),
            'model_params': {
                'model_type': model_type,
                'fitted': True,
                'data_points': len(df)
            }
        }
        
    except Exception as e:
        raise RuntimeError(f"Kats forecasting failed: {str(e)}")

def forecast_with_sklearn(df, horizon, model_type):
    """scikit-learn을 사용한 기본 예측"""
    try:
        # 시간 인덱스 생성
        X = np.arange(len(df)).reshape(-1, 1)
        y = df['value'].values
        
        # 선형 회귀 모델
        model = LinearRegression()
        model.fit(X, y)
        
        # 미래 시점 예측
        future_X = np.arange(len(df), len(df) + horizon).reshape(-1, 1)
        forecast_values = model.predict(future_X)
        
        # 잔차 기반 신뢰구간
        residuals = y - model.predict(X)
        std_error = np.std(residuals)
        
        confidence_lower = forecast_values - 1.96 * std_error
        confidence_upper = forecast_values + 1.96 * std_error
        
        return {
            'forecast': forecast_values.tolist(),
            'confidence_lower': confidence_lower.tolist(),
            'confidence_upper': confidence_upper.tolist(),
            'model_params': {
                'model_type': 'linear_regression',
                'r_squared': model.score(X, y),
                'coefficients': model.coef_.tolist(),
                'intercept': model.intercept_
            }
        }
        
    except Exception as e:
        raise RuntimeError(f"Sklearn forecasting failed: {str(e)}")

def main():
    """메인 실행 함수"""
    try:
        # 입력 데이터 로드
        input_data = load_input()
        
        # 파라미터 추출
        horizon = input_data.get('params', {}).get('horizon', 30)
        model_type = input_data.get('params', {}).get('model', 'arima')
        
        # 시계열 데이터 준비
        df = prepare_time_series(input_data)
        
        # 최소 데이터 포인트 확인
        if len(df) < 10:
            raise ValueError("Insufficient data points for forecasting (minimum 10 required)")
        
        # 예측 수행
        if KATS_AVAILABLE and len(df) >= 20:
            result = forecast_with_kats(df, horizon, model_type)
        else:
            result = forecast_with_sklearn(df, horizon, model_type)
        
        # 결과 출력
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'fallback_forecast': [df['value'].mean()] * horizon if 'df' in locals() else [50.0] * horizon,
            'model_params': {'error': True}
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main() 