"""
🧪 Korean NLP Function 테스트
TDD 방식으로 Python 구현을 위한 테스트 케이스
"""

import unittest
import json
from unittest.mock import Mock, patch
from main import (
    classify_intent,
    analyze_sentiment,
    extract_entities,
    analyze_morphology,
    generate_korean_response,
    process_korean_nlp,
    korean_nlp
)


class TestKoreanNLPFunctions(unittest.TestCase):
    """한국어 NLP 함수별 단위 테스트"""

    def test_classify_intent_question(self):
        """질문 의도 분류 테스트"""
        queries = [
            "서버 상태가 어떻습니까?",
            "무엇이 문제인가요?",
            "CPU 사용률이 뭐야?"
        ]
        for query in queries:
            self.assertEqual(classify_intent(query), 'question')

    def test_classify_intent_command(self):
        """명령 의도 분류 테스트"""
        queries = [
            "서버를 재시작해줘",
            "로그를 보여주세요",
            "모니터링을 시작하자"
        ]
        for query in queries:
            self.assertEqual(classify_intent(query), 'command')

    def test_classify_intent_request(self):
        """요청 의도 분류 테스트"""
        queries = [
            "서버 정보를 알려줘",
            "메트릭을 보여줘",
            "상태를 설명해줘"
        ]
        for query in queries:
            self.assertEqual(classify_intent(query), 'request')

    def test_classify_intent_check(self):
        """확인 의도 분류 테스트"""
        queries = [
            "서버 상태 확인해줘",
            "메모리를 체크해줘",
            "디스크 용량 검사해줘"
        ]
        for query in queries:
            self.assertEqual(classify_intent(query), 'check')

    def test_classify_intent_analysis(self):
        """분석 의도 분류 테스트"""
        queries = [
            "로그를 분석해줘",
            "성능을 분석해",
            "문제를 조사해줘"
        ]
        for query in queries:
            self.assertEqual(classify_intent(query), 'analysis')

    def test_analyze_sentiment(self):
        """감정 분석 테스트"""
        test_cases = [
            ("서버가 잘 작동하고 있어서 좋아", "positive"),
            ("시스템에 문제가 발생했어", "negative"),
            ("긴급하게 처리해줘", "urgent"),
            ("서버 상태 확인해줘", "neutral")
        ]
        for query, expected in test_cases:
            self.assertEqual(analyze_sentiment(query), expected)

    def test_extract_entities(self):
        """엔티티 추출 테스트"""
        query = "web-01 서버의 CPU가 80% 넘었고 어제부터 문제가 발생했어"
        entities = extract_entities(query)
        
        # 서버 이름 추출 확인
        self.assertTrue(any("web-01" in entity for entity in entities))
        # 숫자 추출 확인
        self.assertTrue(any("NUMBER:80" in entity for entity in entities))
        # 시간 추출 확인
        self.assertTrue(any("TIME:어제" in entity for entity in entities))

    def test_analyze_morphology_with_kiwipiepy(self):
        """형태소 분석 테스트 (kiwipiepy 사용)"""
        query = "서버가 느려지고 있습니다"
        result = analyze_morphology(query)
        
        # 기본 구조 확인
        self.assertIn('nouns', result)
        self.assertIn('verbs', result)
        self.assertIn('adjectives', result)
        self.assertIn('tokens', result)
        
        # 명사 추출 확인
        self.assertTrue(any('서버' in noun for noun in result['nouns']))

    def test_generate_korean_response(self):
        """한국어 응답 생성 테스트"""
        analysis = {
            'intent': 'question',
            'sentiment': 'urgent',
            'entities': ['web-01 서버', 'NUMBER:80'],
            'morphology': {'nouns': ['서버', 'CPU']}
        }
        query = "web-01 서버의 CPU가 80% 넘었는데 어떻게 해야 해?"
        
        response = generate_korean_response(analysis, query)
        
        # 응답이 문자열인지 확인
        self.assertIsInstance(response, str)
        # 응답에 긴급 처리 관련 문구 포함 확인
        self.assertIn('긴급', response)

    def test_process_korean_nlp_success(self):
        """한국어 NLP 전체 처리 성공 테스트"""
        query = "서버 상태를 확인해주세요"
        result = process_korean_nlp(query)
        
        self.assertTrue(result['success'])
        self.assertIn('response', result)
        self.assertIn('confidence', result)
        self.assertIn('analysis', result)
        self.assertIn('processingTime', result)
        
        # 신뢰도가 0과 1 사이인지 확인
        self.assertGreaterEqual(result['confidence'], 0)
        self.assertLessEqual(result['confidence'], 1)

    def test_process_korean_nlp_non_korean(self):
        """비한국어 입력 처리 테스트"""
        query = "Check server status"
        result = process_korean_nlp(query)
        
        self.assertFalse(result['success'])
        self.assertEqual(result['confidence'], 0.1)
        self.assertIn('error', result)


class TestKoreanNLPHTTPFunction(unittest.TestCase):
    """HTTP 함수 통합 테스트"""

    def setUp(self):
        """테스트 환경 설정"""
        self.mock_request = Mock()
        self.mock_request.method = 'POST'
        self.mock_request.get_json = Mock()
        self.mock_request.headers = {'Content-Type': 'application/json'}

    def test_korean_nlp_http_success(self):
        """HTTP 요청 성공 테스트"""
        # 요청 데이터 설정
        self.mock_request.get_json.return_value = {
            'query': '서버 상태가 어떻습니까?',
            'mode': 'detailed',
            'context': {}
        }
        
        # 함수 실행
        response = korean_nlp(self.mock_request)
        
        # 응답 검증
        self.assertEqual(response[1], 200)  # HTTP 상태 코드
        
        # 응답 데이터 파싱
        response_data = json.loads(response[0])
        self.assertTrue(response_data['success'])
        self.assertIn('response', response_data)
        self.assertIn('confidence', response_data)
        self.assertEqual(response_data['engine'], 'korean-nlp-python')

    def test_korean_nlp_http_invalid_method(self):
        """잘못된 HTTP 메소드 테스트"""
        self.mock_request.method = 'GET'
        
        response = korean_nlp(self.mock_request)
        
        self.assertEqual(response[1], 405)
        response_data = json.loads(response[0])
        self.assertFalse(response_data['success'])

    def test_korean_nlp_http_invalid_request(self):
        """잘못된 요청 형식 테스트"""
        self.mock_request.get_json.return_value = None
        
        response = korean_nlp(self.mock_request)
        
        self.assertEqual(response[1], 400)
        response_data = json.loads(response[0])
        self.assertFalse(response_data['success'])

    def test_korean_nlp_http_exception_handling(self):
        """예외 처리 테스트"""
        self.mock_request.get_json.side_effect = Exception("Test error")
        
        response = korean_nlp(self.mock_request)
        
        self.assertEqual(response[1], 500)
        response_data = json.loads(response[0])
        self.assertFalse(response_data['success'])
        self.assertIn('error', response_data)

    def test_korean_nlp_health_check(self):
        """헬스 체크 엔드포인트 테스트"""
        from main import korean_nlp_health
        
        mock_request = Mock()
        mock_request.method = 'GET'
        
        response = korean_nlp_health(mock_request)
        
        self.assertEqual(response[1], 200)
        health_data = json.loads(response[0])
        self.assertEqual(health_data['status'], 'healthy')
        self.assertEqual(health_data['function'], 'korean-nlp-python')
        self.assertIn('test', health_data)


class TestPerformanceOptimization(unittest.TestCase):
    """성능 최적화 테스트"""

    def test_memory_usage(self):
        """메모리 사용량 테스트"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # 여러 번 처리하여 메모리 누수 확인
        for _ in range(100):
            process_korean_nlp("서버 상태를 확인해주세요")
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # 메모리 증가가 50MB 미만인지 확인 (무료티어 최적화)
        self.assertLess(memory_increase, 50)

    def test_processing_time(self):
        """처리 시간 테스트"""
        import time
        
        queries = [
            "서버 상태가 어떻습니까?",
            "CPU 사용률이 높은 서버를 찾아줘",
            "메모리 누수가 발생한 것 같아"
        ]
        
        for query in queries:
            start = time.time()
            result = process_korean_nlp(query)
            end = time.time()
            
            processing_time = (end - start) * 1000  # ms
            
            # 처리 시간이 100ms 미만인지 확인
            self.assertLess(processing_time, 100)
            self.assertTrue(result['success'])


if __name__ == '__main__':
    unittest.main()