"""
🧠 Korean NLP Function (Python Version)

한국어 자연어 처리 전문 Function - 무료티어 최적화
메모리: 512MB, 타임아웃: 180초
"""

import json
import time
import re
from typing import Dict, List, Tuple, Any
from datetime import datetime

# Google Cloud Functions Framework
import functions_framework

# 경량 한국어 형태소 분석기 (무료티어 최적화)
try:
    from kiwipiepy import Kiwi
    kiwi = Kiwi()
    USE_KIWI = True
except ImportError:
    USE_KIWI = False
    print("Warning: kiwipiepy not installed. Using basic morphology analysis.")


# 한국어 언어 자원
KOREAN_PARTICLES = [
    '은', '는', '이', '가', '을', '를', '에', '의', '로', '와', '과', 
    '에서', '부터', '까지', '만', '도', '라도', '조차', '마저'
]

KOREAN_ENDINGS = [
    '다', '요', '습니다', '이다', '였다', '했다', '될', '될까', 
    '하자', '하지만', '그러나', '그런데'
]

# 의도 분류를 위한 패턴
INTENT_PATTERNS = {
    'question': ['무엇', '뭐', '뭘', '어떻게', '어떤', '왜', '언제', '어디', '누가', '?'],
    'command': ['해줘', '해주세요', '하자', '하세요', '해라', '하라'],
    'request': ['알려', '보여', '설명', '찾아', '확인해'],
    'check': ['확인', '체크', '검사', '점검', '살펴'],
    'analysis': ['분석', '조사', '파악', '진단', '평가'],
    'server-info': ['서버', '시스템', '상태', '모니터링', 'CPU', '메모리', '디스크']
}

# 감정 분석을 위한 단어
SENTIMENT_WORDS = {
    'positive': ['좋다', '좋아', '훌륭', '완벽', '최고', '감사', '고마워', '잘됐다', '성공', '안정적'],
    'negative': ['나쁘다', '안좋다', '문제', '오류', '에러', '실패', '안됨', '못함', '어려워', '위험'],
    'urgent': ['급해', '빨리', '즉시', '지금', '당장', '긴급', '중요해', '시급']
}


def is_korean(text: str) -> bool:
    """텍스트가 한국어인지 확인"""
    korean_pattern = re.compile('[가-힣]+')
    return bool(korean_pattern.search(text))


def classify_intent(query: str) -> str:
    """한국어 의도 분류"""
    query_lower = query.lower()
    
    # 패턴 매칭을 통한 의도 분류
    intent_scores = {}
    for intent, patterns in INTENT_PATTERNS.items():
        score = sum(1 for pattern in patterns if pattern in query_lower)
        if score > 0:
            intent_scores[intent] = score
    
    # 가장 높은 점수의 의도 반환
    if intent_scores:
        return max(intent_scores, key=intent_scores.get)
    
    return 'general'


def analyze_sentiment(query: str) -> str:
    """한국어 감정 분석"""
    query_lower = query.lower()
    
    # 긴급성 우선 확인
    if any(word in query_lower for word in SENTIMENT_WORDS['urgent']):
        return 'urgent'
    
    # 긍정/부정 감정 점수 계산
    positive_score = sum(1 for word in SENTIMENT_WORDS['positive'] if word in query_lower)
    negative_score = sum(1 for word in SENTIMENT_WORDS['negative'] if word in query_lower)
    
    if positive_score > negative_score:
        return 'positive'
    elif negative_score > positive_score:
        return 'negative'
    
    return 'neutral'


def extract_entities(query: str) -> List[str]:
    """한국어 엔티티 추출"""
    entities = []
    
    # 서버 관련 엔티티 패턴
    server_patterns = [
        r'([a-zA-Z0-9\-]+)\s*서버',
        r'서버\s*([a-zA-Z0-9\-]+)',
        r'(web|api|db|cache|app)-\d+',
        r'server-\d+'
    ]
    
    for pattern in server_patterns:
        matches = re.findall(pattern, query, re.IGNORECASE)
        entities.extend(matches)
    
    # 숫자 엔티티
    numbers = re.findall(r'\d+', query)
    entities.extend([f"NUMBER:{num}" for num in numbers])
    
    # 시간 엔티티
    time_pattern = r'(오늘|어제|내일|이번|지난|다음)\s*(주|달|년|시간|분|초)?'
    times = re.findall(time_pattern, query)
    entities.extend([f"TIME:{''.join(time)}" for time in times])
    
    # 메트릭 관련 엔티티
    metric_keywords = ['CPU', 'RAM', '메모리', '디스크', '네트워크', '트래픽']
    for keyword in metric_keywords:
        if keyword in query.upper():
            entities.append(f"METRIC:{keyword}")
    
    # 중복 제거
    return list(set(entities))


def analyze_morphology(query: str) -> Dict[str, List[str]]:
    """한국어 형태소 분석"""
    result = {
        'nouns': [],
        'verbs': [],
        'adjectives': [],
        'tokens': []
    }
    
    if USE_KIWI:
        # kiwipiepy를 사용한 정확한 형태소 분석
        try:
            tokens = kiwi.tokenize(query)
            for token in tokens:
                result['tokens'].append({
                    'form': token.form,
                    'tag': token.tag,
                    'start': token.start,
                    'end': token.end
                })
                
                # 품사별 분류
                if token.tag.startswith('N'):  # 명사류
                    result['nouns'].append(token.form)
                elif token.tag.startswith('V'):  # 동사류
                    result['verbs'].append(token.form)
                elif token.tag.startswith('VA') or token.tag.startswith('XS'):  # 형용사류
                    result['adjectives'].append(token.form)
        except Exception as e:
            print(f"Kiwi analysis error: {e}")
            # 폴백으로 기본 분석 사용
            return _basic_morphology_analysis(query)
    else:
        # 기본 형태소 분석 (kiwipiepy 없을 때)
        return _basic_morphology_analysis(query)
    
    return result


def _basic_morphology_analysis(query: str) -> Dict[str, List[str]]:
    """기본 형태소 분석 (폴백)"""
    words = query.split()
    result = {
        'nouns': [],
        'verbs': [],
        'adjectives': [],
        'tokens': []
    }
    
    for word in words:
        # 간단한 규칙 기반 분류
        has_particle = any(particle in word for particle in KOREAN_PARTICLES)
        
        if any(ending in word for ending in ['하다', '되다', '있다', '없다']):
            result['verbs'].append(word)
        elif any(adj in word for adj in ['좋다', '나쁘다', '크다', '작다', '많다', '적다']):
            result['adjectives'].append(word)
        elif not has_particle:
            result['nouns'].append(word)
        
        result['tokens'].append({'form': word, 'tag': 'UNKNOWN'})
    
    return result


def generate_korean_response(analysis: Dict[str, Any], query: str) -> str:
    """한국어 응답 생성"""
    intent = analysis['intent']
    sentiment = analysis['sentiment']
    entities = analysis['entities']
    
    # 의도별 응답 템플릿
    templates = {
        'question': [
            "질문해주신 '{}'에 대해 분석해보겠습니다.",
            "궁금해하시는 내용을 확인하여 답변드리겠습니다.",
            "문의하신 사항에 대한 정보를 제공해드리겠습니다."
        ],
        'command': [
            "요청하신 작업을 즉시 수행하겠습니다.",
            "지시사항을 확인하여 처리하겠습니다.",
            "명령을 실행하도록 하겠습니다."
        ],
        'request': [
            "요청하신 정보를 확인하여 제공해드리겠습니다.",
            "필요하신 내용을 조회하여 알려드리겠습니다.",
            "원하시는 정보를 찾아서 전달드리겠습니다."
        ],
        'check': [
            "시스템 상태를 확인하여 결과를 알려드리겠습니다.",
            "요청하신 항목을 점검하여 보고드리겠습니다.",
            "상태 체크를 진행하겠습니다."
        ],
        'analysis': [
            "요청하신 분석을 수행하여 결과를 제공하겠습니다.",
            "데이터를 상세히 분석하여 인사이트를 도출하겠습니다.",
            "심층 분석을 통해 문제점과 개선방안을 제시하겠습니다."
        ],
        'server-info': [
            "서버 모니터링 정보를 확인하여 제공하겠습니다.",
            "시스템 상태와 성능 지표를 분석하여 보고드리겠습니다.",
            "서버 운영 현황을 점검하여 알려드리겠습니다."
        ],
        'general': [
            "요청사항을 처리하여 도움을 드리겠습니다.",
            "문의하신 내용에 대해 확인하여 답변드리겠습니다.",
            "필요하신 지원을 제공하겠습니다."
        ]
    }
    
    # 기본 응답 선택
    base_response = templates[intent][0]
    
    # 감정에 따른 응답 수정
    if sentiment == 'urgent':
        base_response = f"🚨 긴급 요청을 확인했습니다. {base_response}"
    elif sentiment == 'negative':
        base_response = f"문제 상황을 인지했습니다. {base_response}"
    elif sentiment == 'positive':
        base_response = f"긍정적인 피드백 감사합니다. {base_response}"
    
    # 엔티티 정보 추가
    server_entities = [e for e in entities if not e.startswith(('NUMBER:', 'TIME:', 'METRIC:'))]
    metric_entities = [e.replace('METRIC:', '') for e in entities if e.startswith('METRIC:')]
    
    if server_entities:
        base_response += f" 특히 {', '.join(server_entities)}에 중점을 두어 확인하겠습니다."
    
    if metric_entities:
        base_response += f" {', '.join(metric_entities)} 지표를 중심으로 분석하겠습니다."
    
    return base_response


def process_korean_nlp(query: str) -> Dict[str, Any]:
    """한국어 NLP 전체 처리"""
    start_time = time.time()
    
    # 한국어 검증
    if not is_korean(query):
        return {
            'success': False,
            'confidence': 0.1,
            'error': 'Not a Korean query'
        }
    
    # 분석 수행
    intent = classify_intent(query)
    sentiment = analyze_sentiment(query)
    entities = extract_entities(query)
    morphology = analyze_morphology(query)
    
    analysis = {
        'intent': intent,
        'sentiment': sentiment,
        'entities': entities,
        'morphology': morphology
    }
    
    # 응답 생성
    response = generate_korean_response(analysis, query)
    
    # 신뢰도 계산
    confidence = 0.85  # 기본 신뢰도
    if entities:
        confidence += 0.05
    if intent != 'general':
        confidence += 0.05
    if sentiment != 'neutral':
        confidence += 0.03
    if USE_KIWI:
        confidence += 0.02  # kiwipiepy 사용 시 추가 신뢰도
    
    confidence = min(confidence, 0.98)
    
    processing_time = (time.time() - start_time) * 1000  # ms
    
    return {
        'success': True,
        'response': response,
        'confidence': confidence,
        'analysis': analysis,
        'processingTime': processing_time
    }


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
def korean_nlp(request):
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
            'engine': 'korean-nlp-python'
        }, 405)
    
    try:
        # 요청 데이터 파싱
        request_data = request.get_json()
        if not request_data or 'query' not in request_data:
            return create_response({
                'success': False,
                'error': 'Invalid request format',
                'engine': 'korean-nlp-python'
            }, 400)
        
        query = request_data['query']
        mode = request_data.get('mode', 'normal')
        context = request_data.get('context', {})
        
        print(f"Korean NLP: Processing '{query}' (mode: {mode})")
        
        # NLP 처리
        result = process_korean_nlp(query)
        
        if not result['success']:
            return create_response({
                'success': False,
                'error': result.get('error', 'Processing failed'),
                'engine': 'korean-nlp-python'
            }, 400)
        
        # 성공 응답
        response_data = {
            'success': True,
            'response': result['response'],
            'confidence': result['confidence'],
            'engine': 'korean-nlp-python',
            'processingTime': result['processingTime'],
            'metadata': {
                'analysis': result['analysis'],
                'koreanSpecific': True,
                'morphologyEngine': 'kiwipiepy' if USE_KIWI else 'basic',
                'mode': mode
            }
        }
        
        print(f"Korean NLP: Completed in {result['processingTime']:.2f}ms (confidence: {result['confidence']:.2f})")
        
        return create_response(response_data, 200)
        
    except Exception as e:
        print(f"Korean NLP error: {str(e)}")
        return create_response({
            'success': False,
            'error': str(e),
            'engine': 'korean-nlp-python'
        }, 500)


@functions_framework.http
def korean_nlp_health(request):
    """헬스 체크 엔드포인트"""
    if request.method == 'OPTIONS':
        return '', 204, {
            'Access-Control-Allow-Origin': '*'
        }
    
    # 간단한 테스트 수행
    test_result = process_korean_nlp('서버 상태가 어떻습니까?')
    
    health_data = {
        'status': 'healthy' if test_result['success'] else 'unhealthy',
        'timestamp': datetime.utcnow().isoformat(),
        'function': 'korean-nlp-python',
        'memory': '512MB',
        'timeout': '180s',
        'version': '2.0.0',
        'features': {
            'kiwipiepy': USE_KIWI,
            'morphology': 'advanced' if USE_KIWI else 'basic'
        },
        'test': {
            'query': '서버 상태가 어떻습니까?',
            'confidence': test_result.get('confidence', 0),
            'processingTime': test_result.get('processingTime', 0)
        }
    }
    
    return create_response(health_data, 200 if test_result['success'] else 500)