"""
🤖 Basic ML Function (Python Version)

기본 머신러닝 처리 전문 Function - 무료티어 최적화
메모리: 512MB, 타임아웃: 120초
"""

import json
import time
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from datetime import datetime
import pickle
import base64

# Google Cloud Functions Framework
import functions_framework

# 경량 ML 라이브러리 (무료티어 최적화)
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.naive_bayes import MultinomialNB
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("Warning: scikit-learn not installed. Using basic ML functions.")


# 텍스트 분류를 위한 카테고리와 키워드
CATEGORIES = {
    'technical': {
        'keywords': ['서버', '시스템', '네트워크', '데이터베이스', 'CPU', '메모리', 
                    '디스크', '로그', '모니터링', '성능', '에러', '오류', 'API', 
                    '레이턴시', '처리량', '용량'],
        'weight': 1.0
    },
    'operational': {
        'keywords': ['운영', '관리', '설정', '배포', '백업', '복원', '유지보수', 
                    '업데이트', '보안', '권한', '접근', '제어', '정책', '프로세스'],
        'weight': 0.9
    },
    'analysis': {
        'keywords': ['분석', '통계', '예측', '추이', '트렌드', '패턴', '지표', 
                    '메트릭', '리포트', '인사이트', '시각화', '대시보드'],
        'weight': 0.8
    },
    'support': {
        'keywords': ['도움', '문제', '해결', '지원', '가이드', '설명', '방법', 
                    '절차', '문의', '요청', '확인', '점검'],
        'weight': 0.7
    },
    'general': {
        'keywords': ['안녕', '감사', '확인', '상태', '정보', '알림', '질문', 
                    '일반', '기타', '전체'],
        'weight': 0.5
    }
}

# 한국어 불용어 (간단한 버전)
KOREAN_STOPWORDS = ['은', '는', '이', '가', '을', '를', '의', '에', '에서', 
                   '으로', '와', '과', '만', '도', '까지', '부터']

# 글로벌 모델 캐시 (콜드 스타트 최적화)
_model_cache = {}


def classify_text(text: str) -> Dict[str, Any]:
    """텍스트 분류 - scikit-learn 또는 규칙 기반"""
    if SKLEARN_AVAILABLE and 'text_classifier' in _model_cache:
        # 학습된 모델 사용
        vectorizer = _model_cache['vectorizer']
        classifier = _model_cache['text_classifier']
        
        features = vectorizer.transform([text])
        probabilities = classifier.predict_proba(features)[0]
        
        # 확률이 가장 높은 카테고리
        best_idx = np.argmax(probabilities)
        categories = list(CATEGORIES.keys())
        
        return {
            'classification': categories[best_idx],
            'confidence': float(probabilities[best_idx]),
            'probabilities': {cat: float(prob) for cat, prob in zip(categories, probabilities)}
        }
    else:
        # 규칙 기반 분류 (폴백)
        return _rule_based_classification(text)


def _rule_based_classification(text: str) -> Dict[str, Any]:
    """규칙 기반 텍스트 분류"""
    text_lower = text.lower()
    scores = {}
    
    for category, data in CATEGORIES.items():
        score = 0
        matches = 0
        
        for keyword in data['keywords']:
            if keyword in text_lower:
                score += data['weight']
                matches += 1
        
        scores[category] = {
            'score': score,
            'matches': matches,
            'normalized': score / len(data['keywords']) if data['keywords'] else 0
        }
    
    # 점수를 확률로 변환
    total_score = sum(s['score'] for s in scores.values())
    if total_score > 0:
        probabilities = {cat: s['score'] / total_score for cat, s in scores.items()}
    else:
        probabilities = {cat: 1.0 / len(CATEGORIES) for cat in CATEGORIES}
    
    best_category = max(probabilities, key=probabilities.get)
    
    return {
        'classification': best_category,
        'confidence': probabilities[best_category],
        'probabilities': probabilities
    }


def generate_embedding(text: str, max_features: int = 100) -> np.ndarray:
    """텍스트 임베딩 생성 - TF-IDF 기반"""
    if SKLEARN_AVAILABLE:
        # TF-IDF 벡터화
        if 'tfidf_vectorizer' not in _model_cache:
            _model_cache['tfidf_vectorizer'] = TfidfVectorizer(
                max_features=max_features,
                ngram_range=(1, 2),  # 유니그램과 바이그램
                stop_words=None  # 한국어 불용어는 수동 처리
            )
            # 더미 데이터로 학습 (실제로는 코퍼스가 필요)
            sample_texts = []
            for cat_data in CATEGORIES.values():
                sample_texts.extend(cat_data['keywords'])
            _model_cache['tfidf_vectorizer'].fit(sample_texts)
        
        vectorizer = _model_cache['tfidf_vectorizer']
        
        # 한국어 불용어 제거
        words = text.split()
        filtered_text = ' '.join([w for w in words if w not in KOREAN_STOPWORDS])
        
        # 벡터화
        embedding = vectorizer.transform([filtered_text]).toarray()[0]
        
        # L2 정규화
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        
        return embedding
    else:
        # 기본 임베딩 (단어 빈도 기반)
        return _basic_embedding(text, max_features)


def _basic_embedding(text: str, max_features: int) -> np.ndarray:
    """기본 텍스트 임베딩 (폴백)"""
    # 모든 카테고리의 키워드를 vocabulary로 사용
    vocab = []
    for cat_data in CATEGORIES.values():
        vocab.extend(cat_data['keywords'])
    vocab = list(set(vocab))[:max_features]
    
    # 단어 빈도 계산
    text_lower = text.lower()
    embedding = np.zeros(len(vocab))
    
    for i, word in enumerate(vocab):
        embedding[i] = text_lower.count(word)
    
    # L2 정규화
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm
    
    return embedding


def predict_trend(data: List[float]) -> Dict[str, Any]:
    """시계열 예측 - 선형 회귀 + 이상치 탐지"""
    if len(data) < 2:
        return {
            'trend': 'insufficient_data',
            'confidence': 0.1,
            'prediction': data[0] if data else 0,
            'anomalies': []
        }
    
    X = np.arange(len(data)).reshape(-1, 1)
    y = np.array(data)
    
    # 이상치 탐지 (IQR 방법)
    q1, q3 = np.percentile(y, [25, 75])
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    anomalies = [(i, val) for i, val in enumerate(data) 
                 if val < lower_bound or val > upper_bound]
    
    # 이상치 제거한 데이터로 학습
    mask = (y >= lower_bound) & (y <= upper_bound)
    X_clean = X[mask]
    y_clean = y[mask]
    
    if len(X_clean) < 2:
        # 이상치 제거 후 데이터 부족
        return {
            'trend': 'anomaly_dominated',
            'confidence': 0.2,
            'prediction': np.mean(data),
            'anomalies': anomalies
        }
    
    if SKLEARN_AVAILABLE:
        # scikit-learn 선형 회귀
        model = LinearRegression()
        model.fit(X_clean, y_clean)
        
        # 다음 값 예측
        next_X = np.array([[len(data)]])
        prediction = float(model.predict(next_X)[0])
        
        # R² 점수로 신뢰도 계산
        r2_score = model.score(X_clean, y_clean)
        confidence = max(0.1, min(0.95, r2_score))
        
        # 트렌드 판단
        slope = model.coef_[0]
        if slope > 0.1:
            trend = 'increasing'
        elif slope < -0.1:
            trend = 'decreasing'
        else:
            trend = 'stable'
        
        # 계절성 탐지 (간단한 FFT)
        if len(data) >= 8:
            fft = np.fft.fft(y - np.mean(y))
            frequencies = np.fft.fftfreq(len(y))
            # 주요 주파수 찾기
            idx = np.argsort(np.abs(fft))[::-1][1:4]  # 상위 3개 (DC 제외)
            periods = [int(1/abs(frequencies[i])) for i in idx if frequencies[i] != 0]
            seasonality = periods[0] if periods and 2 <= periods[0] <= len(data)//2 else None
        else:
            seasonality = None
        
        return {
            'trend': trend,
            'confidence': confidence,
            'prediction': prediction,
            'slope': float(slope),
            'anomalies': anomalies,
            'seasonality': seasonality,
            'period': seasonality
        }
    else:
        # 기본 선형 회귀 (폴백)
        return _basic_linear_regression(X_clean, y_clean, len(data), anomalies)


def _basic_linear_regression(X: np.ndarray, y: np.ndarray, 
                            next_idx: int, anomalies: List) -> Dict[str, Any]:
    """기본 선형 회귀 구현"""
    # 최소자승법
    n = len(X)
    sum_x = np.sum(X)
    sum_y = np.sum(y)
    sum_xy = np.sum(X.flatten() * y)
    sum_xx = np.sum(X.flatten() ** 2)
    
    slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x ** 2)
    intercept = (sum_y - slope * sum_x) / n
    
    # 예측
    prediction = slope * next_idx + intercept
    
    # 트렌드 판단
    if slope > 0.1:
        trend = 'increasing'
    elif slope < -0.1:
        trend = 'decreasing'
    else:
        trend = 'stable'
    
    # R² 계산
    y_pred = X.flatten() * slope + intercept
    ss_res = np.sum((y - y_pred) ** 2)
    ss_tot = np.sum((y - np.mean(y)) ** 2)
    r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
    
    return {
        'trend': trend,
        'confidence': max(0.1, min(0.95, r2)),
        'prediction': float(prediction),
        'slope': float(slope),
        'anomalies': anomalies,
        'seasonality': None,
        'period': None
    }


def analyze_statistics(data: List[float]) -> Dict[str, Any]:
    """통계 분석"""
    if not data:
        return {
            'count': 0,
            'mean': 0,
            'median': 0,
            'std': 0,
            'min': 0,
            'max': 0,
            'p25': 0,
            'p50': 0,
            'p75': 0,
            'outliers': []
        }
    
    arr = np.array(data)
    
    # 기본 통계
    stats = {
        'count': len(data),
        'mean': float(np.mean(arr)),
        'median': float(np.median(arr)),
        'std': float(np.std(arr)),
        'min': float(np.min(arr)),
        'max': float(np.max(arr))
    }
    
    # 백분위수
    percentiles = np.percentile(arr, [25, 50, 75])
    stats['p25'] = float(percentiles[0])
    stats['p50'] = float(percentiles[1])
    stats['p75'] = float(percentiles[2])
    
    # IQR 기반 이상치 탐지
    q1, q3 = stats['p25'], stats['p75']
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    
    outliers = [float(x) for x in arr if x < lower_bound or x > upper_bound]
    stats['outliers'] = outliers
    
    # 추가 통계 (분포 특성)
    if len(data) > 3:
        # 왜도 (Skewness)
        mean_centered = arr - stats['mean']
        stats['skewness'] = float(np.mean(mean_centered ** 3) / (stats['std'] ** 3))
        
        # 첨도 (Kurtosis)
        stats['kurtosis'] = float(np.mean(mean_centered ** 4) / (stats['std'] ** 4) - 3)
    
    return stats


def process_basic_ml(query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """통합 ML 처리"""
    start_time = time.time()
    
    if context is None:
        context = {}
    
    # 1. 텍스트 분류
    classification = classify_text(query)
    
    # 2. 텍스트 임베딩
    embeddings = generate_embedding(query)
    
    # 3. 메트릭 분석 (있는 경우)
    predictions = None
    statistics = None
    
    if 'metrics' in context and isinstance(context['metrics'], list) and context['metrics']:
        predictions = predict_trend(context['metrics'])
        statistics = analyze_statistics(context['metrics'])
    
    # 4. 응답 생성
    response = _generate_response(classification, predictions, statistics, query)
    
    processing_time = (time.time() - start_time) * 1000  # ms
    
    return {
        'success': True,
        'response': response,
        'confidence': classification['confidence'],
        'classification': classification['classification'],
        'embeddings': embeddings.tolist(),
        'predictions': predictions,
        'statistics': statistics,
        'processingTime': processing_time
    }


def _generate_response(classification: Dict[str, Any], 
                      predictions: Optional[Dict[str, Any]],
                      statistics: Optional[Dict[str, Any]], 
                      query: str) -> str:
    """응답 생성"""
    category_responses = {
        'technical': '기술적 분석을 수행했습니다. 시스템 상태와 성능 지표를 확인했습니다.',
        'operational': '운영 관련 분석을 완료했습니다. 시스템 관리 최적화 방안을 제시합니다.',
        'analysis': '데이터 분석을 수행했습니다. 통계적 인사이트를 도출했습니다.',
        'support': '지원 요청을 분석했습니다. 문제 해결 방안을 제시합니다.',
        'general': '요청을 분석했습니다. 추가 정보를 제공합니다.'
    }
    
    response = category_responses.get(
        classification['classification'], 
        category_responses['general']
    )
    
    # 예측 결과 추가
    if predictions:
        trend_desc = {
            'increasing': '증가',
            'decreasing': '감소',
            'stable': '안정',
            'anomaly_dominated': '이상치 과다',
            'insufficient_data': '데이터 부족'
        }
        
        trend = trend_desc.get(predictions['trend'], predictions['trend'])
        response += f" 트렌드는 '{trend}' 추세이며, 다음 예측값은 {predictions['prediction']:.2f}입니다."
        
        if predictions.get('anomalies'):
            response += f" {len(predictions['anomalies'])}개의 이상치를 발견했습니다."
        
        if predictions.get('seasonality'):
            response += f" 주기성 패턴(주기: {predictions['seasonality']})을 감지했습니다."
    
    # 통계 정보 추가
    if statistics:
        response += f" 평균값은 {statistics['mean']:.2f}, 표준편차는 {statistics['std']:.2f}입니다."
        
        if statistics['outliers']:
            response += f" {len(statistics['outliers'])}개의 통계적 이상치가 있습니다."
    
    # 신뢰도 추가
    confidence_level = "높음" if classification['confidence'] > 0.8 else "보통"
    response += f" (분석 신뢰도: {confidence_level})"
    
    return response


def create_response(data: Dict[str, Any], status_code: int = 200) -> Tuple[str, int, Dict[str, str]]:
    """HTTP 응답 생성"""
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    return json.dumps(data), status_code, headers


@functions_framework.http
def basic_ml(request):
    """메인 HTTP 핸들러"""
    # CORS preflight
    if request.method == 'OPTIONS':
        return '', 204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    
    if request.method != 'POST':
        return create_response({
            'success': False,
            'error': 'Method not allowed',
            'engine': 'basic-ml-python'
        }, 405)
    
    try:
        # 요청 데이터 파싱
        request_data = request.get_json()
        if not request_data or 'query' not in request_data:
            return create_response({
                'success': False,
                'error': 'Invalid request format',
                'engine': 'basic-ml-python'
            }, 400)
        
        query = request_data['query']
        context = request_data.get('context', {})
        mode = request_data.get('mode', 'normal')
        
        print(f"Basic ML: Processing '{query}' (mode: {mode})")
        
        # ML 처리
        result = process_basic_ml(query, context)
        
        # 성공 응답
        response_data = {
            'success': True,
            'response': result['response'],
            'confidence': result['confidence'],
            'engine': 'basic-ml-python',
            'processingTime': result['processingTime'],
            'metadata': {
                'classification': result['classification'],
                'embeddingDimension': len(result['embeddings']),
                'predictions': result['predictions'],
                'statistics': result['statistics'],
                'mlLibrary': 'scikit-learn' if SKLEARN_AVAILABLE else 'numpy',
                'mode': mode
            }
        }
        
        print(f"Basic ML: Completed in {result['processingTime']:.2f}ms")
        
        return create_response(response_data, 200)
        
    except Exception as e:
        print(f"Basic ML error: {str(e)}")
        return create_response({
            'success': False,
            'error': str(e),
            'engine': 'basic-ml-python'
        }, 500)


@functions_framework.http
def basic_ml_health(request):
    """헬스 체크 엔드포인트"""
    if request.method == 'OPTIONS':
        return '', 204, {
            'Access-Control-Allow-Origin': '*'
        }
    
    # 테스트 수행
    test_result = process_basic_ml(
        '서버 성능을 분석해주세요',
        {'metrics': [70, 75, 80, 85, 90, 85, 95]}
    )
    
    health_data = {
        'status': 'healthy' if test_result['success'] else 'unhealthy',
        'timestamp': datetime.utcnow().isoformat(),
        'function': 'basic-ml-python',
        'memory': '512MB',
        'timeout': '120s',
        'version': '2.0.0',
        'features': {
            'scikit-learn': SKLEARN_AVAILABLE,
            'classification': True,
            'prediction': True,
            'statistics': True,
            'embeddings': True
        },
        'test': {
            'query': '서버 성능을 분석해주세요',
            'classification': test_result['classification'],
            'confidence': test_result['confidence'],
            'processingTime': test_result['processingTime']
        }
    }
    
    return create_response(health_data, 200 if test_result['success'] else 500)