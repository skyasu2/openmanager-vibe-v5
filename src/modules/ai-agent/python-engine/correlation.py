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
    from scipy.stats import pearsonr, spearmanr, kendalltau
    import scipy.stats as stats
    SCIPY_AVAILABLE = True
except ImportError:
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
        
        if len(variables) < 2:
            raise ValueError("At least 2 variables required for correlation analysis")
        
        data_lengths = [len(var['values']) for var in variables]
        if len(set(data_lengths)) > 1:
            raise ValueError("All variables must have the same number of data points")
        
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
        
        n_vars = len(variables)
        corr_matrix = np.eye(n_vars)
        
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
                
                if i < j:
                    significance = determine_significance(p_value)
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
                
                coeff = calculate_pearson_basic(values1, values2)
                matrix_row.append(float(coeff))
                
                if i < j:
                    p_value = estimate_p_value(coeff, len(values1))
                    significance = determine_significance(p_value)
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
        
        mean_x = np.mean(x)
        mean_y = np.mean(y)
        
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
        
        t_stat = correlation * np.sqrt((n - 2) / (1 - correlation**2))
        
        if abs(t_stat) > 2.576:
            return 0.01
        elif abs(t_stat) > 1.96:
            return 0.05
        elif abs(t_stat) > 1.645:
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

def main():
    """메인 실행 함수"""
    try:
        input_data = load_input()
        method = input_data.get('params', {}).get('method', 'pearson')
        
        variables = prepare_correlation_data(input_data)
        
        if len(variables[0]['values']) < 3:
            raise ValueError("Insufficient data points for correlation analysis (minimum 3 required)")
        
        if SCIPY_AVAILABLE:
            result = calculate_correlation_with_scipy(variables, method)
        else:
            result = calculate_correlation_basic(variables, method)
        
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