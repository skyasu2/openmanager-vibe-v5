"""
🧪 Basic ML Function 테스트
TDD 방식으로 Python 구현을 위한 테스트 케이스
"""

import unittest
import json
import numpy as np
from unittest.mock import Mock, patch
from main import (
    classify_text,
    generate_embedding,
    predict_trend,
    analyze_statistics,
    process_basic_ml,
    basic_ml
)


class TestTextClassification(unittest.TestCase):
    """텍스트 분류 테스트"""

    def test_classify_technical_text(self):
        """기술적 텍스트 분류 테스트"""
        queries = [
            "서버 CPU 사용률이 높습니다",
            "네트워크 에러가 발생했습니다",
            "데이터베이스 성능이 저하되었습니다"
        ]
        for query in queries:
            result = classify_text(query)
            self.assertEqual(result['classification'], 'technical')
            self.assertGreater(result['confidence'], 0.6)

    def test_classify_operational_text(self):
        """운영 관련 텍스트 분류 테스트"""
        queries = [
            "백업 설정을 변경해주세요",
            "시스템 권한을 관리해야 합니다",
            "배포 프로세스를 업데이트해주세요"
        ]
        for query in queries:
            result = classify_text(query)
            self.assertEqual(result['classification'], 'operational')

    def test_classify_analysis_text(self):
        """분석 관련 텍스트 분류 테스트"""
        queries = [
            "지난 주 트렌드를 분석해주세요",
            "메트릭 패턴을 보여주세요",
            "통계 리포트를 생성해주세요"
        ]
        for query in queries:
            result = classify_text(query)
            self.assertEqual(result['classification'], 'analysis')

    def test_classification_scores(self):
        """분류 점수 및 확률 테스트"""
        query = "서버 성능 분석과 백업 설정을 확인해주세요"
        result = classify_text(query)
        
        # 여러 카테고리가 매칭되는 경우
        self.assertIn('classification', result)
        self.assertIn('confidence', result)
        self.assertIn('probabilities', result)
        
        # 확률의 합이 1인지 확인
        prob_sum = sum(result['probabilities'].values())
        self.assertAlmostEqual(prob_sum, 1.0, places=5)


class TestEmbedding(unittest.TestCase):
    """텍스트 임베딩 테스트"""

    def test_generate_embedding_basic(self):
        """기본 임베딩 생성 테스트"""
        text = "서버 모니터링 시스템 분석"
        embedding = generate_embedding(text)
        
        # 임베딩 차원 확인
        self.assertIsInstance(embedding, np.ndarray)
        self.assertEqual(len(embedding), 100)  # 예상 차원
        
        # 정규화 확인
        norm = np.linalg.norm(embedding)
        self.assertAlmostEqual(norm, 1.0, places=5)

    def test_embedding_similarity(self):
        """유사 텍스트 임베딩 유사도 테스트"""
        text1 = "서버 CPU 모니터링"
        text2 = "서버 메모리 모니터링"
        text3 = "날씨가 좋습니다"
        
        emb1 = generate_embedding(text1)
        emb2 = generate_embedding(text2)
        emb3 = generate_embedding(text3)
        
        # 코사인 유사도 계산
        sim12 = np.dot(emb1, emb2)
        sim13 = np.dot(emb1, emb3)
        
        # 유사한 텍스트끼리 더 높은 유사도
        self.assertGreater(sim12, sim13)

    def test_embedding_korean_text(self):
        """한국어 텍스트 임베딩 테스트"""
        text = "서버 상태를 확인해주세요"
        embedding = generate_embedding(text)
        
        # 0이 아닌 값들이 있는지 확인
        self.assertTrue(np.any(embedding != 0))


class TestPrediction(unittest.TestCase):
    """예측 모델 테스트"""

    def test_predict_trend_increasing(self):
        """증가 추세 예측 테스트"""
        data = [10, 12, 15, 18, 22, 25, 30]
        result = predict_trend(data)
        
        self.assertEqual(result['trend'], 'increasing')
        self.assertGreater(result['prediction'], data[-1])
        self.assertGreater(result['confidence'], 0.8)

    def test_predict_trend_decreasing(self):
        """감소 추세 예측 테스트"""
        data = [30, 28, 25, 22, 18, 15, 10]
        result = predict_trend(data)
        
        self.assertEqual(result['trend'], 'decreasing')
        self.assertLess(result['prediction'], data[-1])

    def test_predict_trend_stable(self):
        """안정적 추세 예측 테스트"""
        data = [20, 19, 21, 20, 19, 20, 21]
        result = predict_trend(data)
        
        self.assertEqual(result['trend'], 'stable')
        self.assertAlmostEqual(result['prediction'], 20, delta=2)

    def test_predict_with_seasonality(self):
        """계절성 패턴 예측 테스트"""
        # 간단한 계절성 패턴
        data = [10, 20, 15, 25, 10, 20, 15, 25]
        result = predict_trend(data)
        
        self.assertIn('seasonality', result)
        self.assertIn('period', result)

    def test_anomaly_detection(self):
        """이상치 탐지 테스트"""
        data = [20, 22, 21, 20, 100, 19, 21, 22]  # 100은 이상치
        result = predict_trend(data)
        
        self.assertIn('anomalies', result)
        self.assertGreater(len(result['anomalies']), 0)


class TestStatistics(unittest.TestCase):
    """통계 분석 테스트"""

    def test_basic_statistics(self):
        """기본 통계 계산 테스트"""
        data = [10, 20, 30, 40, 50]
        stats = analyze_statistics(data)
        
        self.assertEqual(stats['mean'], 30)
        self.assertEqual(stats['median'], 30)
        self.assertEqual(stats['min'], 10)
        self.assertEqual(stats['max'], 50)
        self.assertGreater(stats['std'], 0)

    def test_outlier_detection(self):
        """이상치 탐지 테스트"""
        data = [10, 11, 12, 13, 14, 15, 100]  # 100은 이상치
        stats = analyze_statistics(data)
        
        self.assertIn('outliers', stats)
        self.assertEqual(len(stats['outliers']), 1)
        self.assertEqual(stats['outliers'][0], 100)

    def test_percentiles(self):
        """백분위수 계산 테스트"""
        data = list(range(1, 101))  # 1~100
        stats = analyze_statistics(data)
        
        self.assertAlmostEqual(stats['p25'], 25.5, delta=1)
        self.assertAlmostEqual(stats['p50'], 50.5, delta=1)
        self.assertAlmostEqual(stats['p75'], 75.5, delta=1)

    def test_empty_data(self):
        """빈 데이터 처리 테스트"""
        stats = analyze_statistics([])
        
        self.assertEqual(stats['mean'], 0)
        self.assertEqual(stats['count'], 0)
        self.assertEqual(len(stats['outliers']), 0)


class TestProcessBasicML(unittest.TestCase):
    """통합 ML 처리 테스트"""

    def test_process_basic_ml_success(self):
        """ML 처리 성공 테스트"""
        query = "서버 성능을 분석해주세요"
        context = {
            'metrics': [70, 75, 80, 85, 90, 95]
        }
        
        result = process_basic_ml(query, context)
        
        self.assertTrue(result['success'])
        self.assertIn('response', result)
        self.assertIn('classification', result)
        self.assertIn('embeddings', result)
        self.assertIn('predictions', result)
        self.assertIn('statistics', result)

    def test_process_without_metrics(self):
        """메트릭 없이 처리 테스트"""
        query = "서버 상태가 어떤가요?"
        result = process_basic_ml(query)
        
        self.assertTrue(result['success'])
        self.assertIsNone(result['predictions'])
        self.assertIsNone(result['statistics'])

    def test_response_generation(self):
        """응답 생성 테스트"""
        query = "CPU 사용률이 높은데 분석해주세요"
        context = {
            'metrics': [60, 70, 80, 90, 95, 98]
        }
        
        result = process_basic_ml(query, context)
        
        # 응답에 분류 결과 포함
        self.assertIn('기술', result['response'])
        # 예측 결과 포함
        self.assertIn('증가', result['response'])


class TestHTTPFunction(unittest.TestCase):
    """HTTP 함수 테스트"""

    def setUp(self):
        """테스트 환경 설정"""
        self.mock_request = Mock()
        self.mock_request.method = 'POST'
        self.mock_request.get_json = Mock()
        self.mock_request.headers = {'Content-Type': 'application/json'}

    def test_basic_ml_http_success(self):
        """HTTP 요청 성공 테스트"""
        self.mock_request.get_json.return_value = {
            'query': '서버 성능 분석해주세요',
            'context': {
                'metrics': [70, 75, 80, 85, 90]
            }
        }
        
        response = basic_ml(self.mock_request)
        
        self.assertEqual(response[1], 200)
        response_data = json.loads(response[0])
        self.assertTrue(response_data['success'])
        self.assertEqual(response_data['engine'], 'basic-ml-python')

    def test_basic_ml_health_check(self):
        """헬스 체크 테스트"""
        from main import basic_ml_health
        
        mock_request = Mock()
        mock_request.method = 'GET'
        
        response = basic_ml_health(mock_request)
        
        self.assertEqual(response[1], 200)
        health_data = json.loads(response[0])
        self.assertEqual(health_data['status'], 'healthy')
        self.assertIn('features', health_data)


class TestPerformanceOptimization(unittest.TestCase):
    """성능 최적화 테스트"""

    def test_batch_processing(self):
        """배치 처리 테스트"""
        queries = [
            "서버 상태 확인",
            "성능 분석 요청",
            "트렌드 예측"
        ]
        
        import time
        start = time.time()
        
        for query in queries:
            process_basic_ml(query)
        
        end = time.time()
        avg_time = (end - start) / len(queries) * 1000  # ms
        
        # 평균 처리 시간이 50ms 미만
        self.assertLess(avg_time, 50)

    def test_memory_efficiency(self):
        """메모리 효율성 테스트"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # 대량 데이터 처리
        for _ in range(100):
            data = list(range(1000))
            analyze_statistics(data)
            predict_trend(data[:100])
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # 메모리 증가가 100MB 미만 (무료티어 최적화)
        self.assertLess(memory_increase, 100)


if __name__ == '__main__':
    unittest.main()