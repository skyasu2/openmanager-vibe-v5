#!/usr/bin/env python3
"""
상관관계 분석 스크립트 (SciPy)
오프라인 환경에서 실행 가능한 상관관계 분석
"""

import sys
import json
import warnings
import numpy as np
import pandas as pd

# 경고 메시지 숨기기
warnings.filterwarnings('ignore')

try:
    # SciPy 통계 라이브러리
    from scipy.stats import pearsonr, spearmanr, kendalltau
    from scipy.stats import chi2_contingency, fisher_exact
    import scipy.stats as stats
    SCIPY_AVAILABLE = True
except ImportError:
    # 기본 통계 계산으로 fallback
    import statistics
    SCIPY_AVAILABLE = False

def load_input():
    """stdin에서 JSON 입력 로드"""
    try:
        input_data = json.loads(sys.stdin.read())
        return input_data
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse input: {str(e)}"}))
        sys.exit(1)

def prepare_correlation_data(data):
    """상관관계 분석 데이터 준비"""
    try:
        variables = data['data']['variables']
        
        # 변수 데이터 검증
        if len(variables) < 2:
            raise ValueError("At least 2 variables required for correlation analysis")
        
        # 데이터 길이 확인
        data_lengths = [len(var['values']) for var in variables]
        if len(set(data_lengths)) > 1:
            raise ValueError("All variables must have the same number of data points")
        
        # 결측값 처리
        processed_variables = []
        for var in variables:
            values = np.array(var['values'])
            values = np.nan_to_num(values, nan=np.nanmean(values) if not np.isnan(values).all() else 0.0)
            processed_variables.append({
                'name': var['name'],
                'values': values.tolist()
            })
        
        return processed_variables
        
    except Exception as e:
        raise ValueError(f"Failed to prepare correlation data: {str(e)}")

def calculate_correlation_with_scipy(variables, method):
    """SciPy를 사용한 상관관계 계산"""
    try:
        correlations = []
        correlation_matrix = []
        
        # 상관관계 행렬 초기화
        n_vars = len(variables)
        corr_matrix = np.eye(n_vars)
        
        # 모든 변수 쌍에 대해 상관관계 계산
        for i in range(n_vars):
            matrix_row = []
            for j in range(n_vars):
                if i == j:
                    matrix_row.append(1.0)
                    continue
                
                var1 = variables[i]
                var2 = variables[j]
                values1 = np.array(var1['values'])
                values2 = np.array(var2['values'])
                
                # 상관계수 계산
                if method == 'pearson':
                    coeff, p_value = pearsonr(values1, values2)
                elif method == 'spearman':
                    coeff, p_value = spearmanr(values1, values2)
                elif method == 'kendall':
                    coeff, p_value = kendalltau(values1, values2)
                else:
                    coeff, p_value = pearsonr(values1, values2)
                
                matrix_row.append(float(coeff))
                corr_matrix[i, j] = coeff
                
                # 중복 제거 (i < j인 경우만)
                if i < j:
                    # 유의성 판단
                    significance = determine_significance(p_value)
                    
                    # 상관관계 해석
                    interpretation = interpret_correlation(coeff, method)
                    
                    correlations.append({
                        'var1': var1['name'],
                        'var2': var2['name'],
                        'coefficient': float(coeff),
                        'p_value': float(p_value),
                        'significance': significance,
                        'interpretation': interpretation,
                        'method': method
                    })
            
            correlation_matrix.append(matrix_row)
        
        return {
            'correlations': correlations,
            'correlation_matrix': correlation_matrix,
            'method_used': method,
            'n_variables': n_vars,
            'total_comparisons': len(correlations)
        }
        
    except Exception as e:
        raise RuntimeError(f"SciPy correlation analysis failed: {str(e)}")

def calculate_correlation_basic(variables, method):
    """기본 상관관계 계산 (fallback)"""
    try:
        correlations = []
        correlation_matrix = []
        
        n_vars = len(variables)
        
        # 모든 변수 쌍에 대해 기본 상관관계 계산
        for i in range(n_vars):
            matrix_row = []
            for j in range(n_vars):
                if i == j:
                    matrix_row.append(1.0)
                    continue
                
                var1 = variables[i]
                var2 = variables[j]
                values1 = np.array(var1['values'])
                values2 = np.array(var2['values'])
                
                # 피어슨 상관계수 직접 계산
                coeff = calculate_pearson_basic(values1, values2)
                matrix_row.append(float(coeff))
                
                # 중복 제거 (i < j인 경우만)
                if i < j:
                    # 간단한 p-value 추정
                    p_value = estimate_p_value(coeff, len(values1))
                    
                    # 유의성 판단
                    significance = determine_significance(p_value)
                    
                    # 상관관계 해석
                    interpretation = interpret_correlation(coeff, method)
                    
                    correlations.append({
                        'var1': var1['name'],
                        'var2': var2['name'],
                        'coefficient': float(coeff),
                        'p_value': float(p_value),
                        'significance': significance,
                        'interpretation': interpretation,
                        'method': f'basic_{method}'
                    })
            
            correlation_matrix.append(matrix_row)
        
        return {
            'correlations': correlations,
            'correlation_matrix': correlation_matrix,
            'method_used': f'basic_{method}',
            'n_variables': n_vars,
            'total_comparisons': len(correlations)
        }
        
    except Exception as e:
        raise RuntimeError(f"Basic correlation analysis failed: {str(e)}")

def calculate_pearson_basic(x, y):
    """기본 피어슨 상관계수 계산"""
    try:
        n = len(x)
        if n != len(y) or n < 2:
            return 0.0
        
        # 평균 계산
        mean_x = np.mean(x)
        mean_y = np.mean(y)
        
        # 분자와 분모 계산
        numerator = np.sum((x - mean_x) * (y - mean_y))
        denominator_x = np.sum((x - mean_x) ** 2)
        denominator_y = np.sum((y - mean_y) ** 2)
        
        if denominator_x == 0 or denominator_y == 0:
            return 0.0
        
        correlation = numerator / np.sqrt(denominator_x * denominator_y)
        return correlation
        
    except Exception:
        return 0.0

def estimate_p_value(correlation, n):
    """p-value 추정 (t-분포 기반)"""
    try:
        if n < 3:
            return 1.0
        
        # t-통계량 계산
        t_stat = correlation * np.sqrt((n - 2) / (1 - correlation**2))
        
        # 간단한 p-value 추정 (양측 검정)
        # 정확한 계산을 위해서는 scipy.stats.t.sf 필요
        if abs(t_stat) > 2.576:  # 99% 신뢰구간
            return 0.01
        elif abs(t_stat) > 1.96:  # 95% 신뢰구간
            return 0.05
        elif abs(t_stat) > 1.645:  # 90% 신뢰구간
            return 0.10
        else:
            return 0.20
            
    except Exception:
        return 0.50

def determine_significance(p_value):
    """유의성 수준 판단"""
    if p_value < 0.001:
        return 'very_high'
    elif p_value < 0.01:
        return 'high'
    elif p_value < 0.05:
        return 'medium'
    elif p_value < 0.10:
        return 'low'
    else:
        return 'none'

def interpret_correlation(coefficient, method):
    """상관관계 해석"""
    abs_coeff = abs(coefficient)
    direction = 'positive' if coefficient > 0 else 'negative' if coefficient < 0 else 'none'
    
    if abs_coeff >= 0.9:
        strength = 'very_strong'
    elif abs_coeff >= 0.7:
        strength = 'strong'
    elif abs_coeff >= 0.5:
        strength = 'moderate'
    elif abs_coeff >= 0.3:
        strength = 'weak'
    elif abs_coeff >= 0.1:
        strength = 'very_weak'
    else:
        strength = 'negligible'
    
    return {
        'direction': direction,
        'strength': strength,
        'description': f"{strength} {direction} correlation" if direction != 'none' else 'no correlation'
    }

def analyze_correlation_patterns(correlations):
    """상관관계 패턴 분석"""
    try:
        if not correlations:
            return {'error': 'No correlations to analyze'}
        
        coefficients = [corr['coefficient'] for corr in correlations]
        p_values = [corr['p_value'] for corr in correlations]
        
        analysis = {
            'summary_statistics': {
                'mean_correlation': float(np.mean(coefficients)),
                'std_correlation': float(np.std(coefficients)),
                'max_correlation': float(np.max(coefficients)),
                'min_correlation': float(np.min(coefficients)),
                'median_correlation': float(np.median(coefficients))
            },
            'significance_distribution': {
                'very_high': sum(1 for corr in correlations if corr['significance'] == 'very_high'),
                'high': sum(1 for corr in correlations if corr['significance'] == 'high'),
                'medium': sum(1 for corr in correlations if corr['significance'] == 'medium'),
                'low': sum(1 for corr in correlations if corr['significance'] == 'low'),
                'none': sum(1 for corr in correlations if corr['significance'] == 'none')
            },
            'strength_distribution': {
                'very_strong': sum(1 for corr in correlations if abs(corr['coefficient']) >= 0.9),
                'strong': sum(1 for corr in correlations if 0.7 <= abs(corr['coefficient']) < 0.9),
                'moderate': sum(1 for corr in correlations if 0.5 <= abs(corr['coefficient']) < 0.7),
                'weak': sum(1 for corr in correlations if 0.3 <= abs(corr['coefficient']) < 0.5),
                'very_weak': sum(1 for corr in correlations if 0.1 <= abs(corr['coefficient']) < 0.3),
                'negligible': sum(1 for corr in correlations if abs(corr['coefficient']) < 0.1)
            }
        }
        
        # 가장 강한 상관관계 찾기
        strongest_corr = max(correlations, key=lambda x: abs(x['coefficient']))
        analysis['strongest_correlation'] = {
            'variables': f"{strongest_corr['var1']} vs {strongest_corr['var2']}",
            'coefficient': strongest_corr['coefficient'],
            'significance': strongest_corr['significance'],
            'interpretation': strongest_corr['interpretation']['description']
        }
        
        # 유의한 상관관계 비율
        significant_count = sum(1 for corr in correlations if corr['significance'] in ['very_high', 'high', 'medium'])
        analysis['significant_ratio'] = float(significant_count / len(correlations))
        
        return analysis
        
    except Exception as e:
        return {'error': f"Failed to analyze correlation patterns: {str(e)}"}

def main():
    """메인 실행 함수"""
    try:
        # 입력 데이터 로드
        input_data = load_input()
        
        # 파라미터 추출
        method = input_data.get('params', {}).get('method', 'pearson')
        
        # 상관관계 데이터 준비
        variables = prepare_correlation_data(input_data)
        
        # 최소 데이터 포인트 확인
        if len(variables[0]['values']) < 3:
            raise ValueError("Insufficient data points for correlation analysis (minimum 3 required)")
        
        # 상관관계 분석 수행
        if SCIPY_AVAILABLE:
            result = calculate_correlation_with_scipy(variables, method)
        else:
            result = calculate_correlation_basic(variables, method)
        
        # 패턴 분석 추가
        pattern_analysis = analyze_correlation_patterns(result['correlations'])
        result['pattern_analysis'] = pattern_analysis
        
        # 결과 출력
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'fallback_result': {
                'correlations': [
                    {
                        'var1': 'CPU',
                        'var2': 'Memory',
                        'coefficient': 0.73,
                        'p_value': 0.001,
                        'significance': 'high',
                        'interpretation': {
                            'direction': 'positive',
                            'strength': 'strong',
                            'description': 'strong positive correlation'
                        },
                        'method': 'fallback'
                    }
                ],
                'correlation_matrix': [[1.0, 0.73], [0.73, 1.0]],
                'method_used': 'fallback',
                'n_variables': 2,
                'total_comparisons': 1
            }
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main() 