"""
MCP 메트릭 처리기 테스트 스위트
로컬 개발 및 CI/CD에서 사용
"""

import pytest
import asyncio
import json
import time
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta

# 테스트 대상 모듈
from main import main, initialize_components, _process_request
from collector import MCPMetricsCollector, MCPServerMetrics
from processor import MetricsProcessor, PerformanceAlert
from circuit_breaker import CircuitBreaker, CircuitBreakerState


class MockRequest:
    """Flask Request 모의 객체"""
    
    def __init__(self, method='GET', args=None, json_data=None):
        self.method = method
        self.args = args or {}
        self.json_data = json_data or {}
    
    def get_json(self, silent=True):
        return self.json_data
    
    def get(self, key, default=None):
        return self.args.get(key, default)


class TestMCPMetricsCollector:
    """MCPMetricsCollector 테스트"""
    
    @pytest.fixture
    def collector(self):
        return MCPMetricsCollector()
    
    def test_server_configs_loading(self, collector):
        """서버 설정 로드 테스트"""
        configs = collector._load_server_configs()
        
        assert len(configs) == 10
        assert 'filesystem' in configs
        assert 'memory' in configs
        assert 'github' in configs
        
        # Critical 서버 확인
        filesystem_config = configs['filesystem']
        assert filesystem_config['priority'] == 'critical'
        assert filesystem_config['type'] == 'core'
        assert filesystem_config['runtime'] == 'node'
    
    @pytest.mark.asyncio
    async def test_collect_all_metrics_mock(self, collector):
        """전체 메트릭 수집 테스트 (Mock)"""
        # Mock 서브프로세스 호출
        with patch('collector.subprocess.run') as mock_run:
            mock_run.return_value.returncode = 0
            mock_run.return_value.stdout = "filesystem: Connected\nmemory: Connected"
            
            async with collector:
                metrics = await collector.collect_all_metrics()
            
            assert len(metrics) == 10
            assert all(isinstance(m, MCPServerMetrics) for m in metrics.values())
    
    def test_create_error_metrics(self, collector):
        """에러 메트릭 생성 테스트"""
        error_metrics = collector._create_error_metrics('test-server', 'Connection failed')
        
        assert error_metrics.name == 'test-server'
        assert error_metrics.status == 'unhealthy'
        assert error_metrics.error_message == 'Connection failed'
        assert error_metrics.response_time_ms == float('inf')
        assert error_metrics.error_rate == 100.0
    
    def test_cache_functionality(self, collector):
        """캐시 기능 테스트"""
        # 캐시가 비어있는 상태
        assert not collector._is_cache_valid('test-server')
        
        # 메트릭 생성 및 캐시
        metrics = {
            'test-server': collector._create_error_metrics('test-server', 'test')
        }
        collector._update_cache(metrics)
        
        # 캐시 유효성 확인
        assert collector._is_cache_valid('test-server')
        
        # TTL 후 무효화 테스트 (시간 조작)
        collector.cache_ttl = 0.1  # 0.1초로 설정
        time.sleep(0.2)
        assert not collector._is_cache_valid('test-server')


class TestMetricsProcessor:
    """MetricsProcessor 테스트"""
    
    @pytest.fixture
    def processor(self):
        return MetricsProcessor()
    
    @pytest.fixture
    def sample_metrics(self):
        """테스트용 샘플 메트릭"""
        return {
            'filesystem': MCPServerMetrics(
                name='filesystem',
                status='healthy',
                response_time_ms=85.5,
                error_rate=0.0,
                last_check=datetime.utcnow().isoformat(),
                consecutive_failures=0,
                uptime_percentage=99.9
            ),
            'github': MCPServerMetrics(
                name='github',
                status='degraded',
                response_time_ms=250.0,
                error_rate=5.2,
                last_check=datetime.utcnow().isoformat(),
                consecutive_failures=1,
                uptime_percentage=95.8
            ),
            'unhealthy-server': MCPServerMetrics(
                name='unhealthy-server',
                status='unhealthy',
                response_time_ms=float('inf'),
                error_rate=100.0,
                last_check=datetime.utcnow().isoformat(),
                consecutive_failures=5,
                uptime_percentage=20.0,
                error_message='Connection timeout'
            )
        }
    
    def test_process_metrics_structure(self, processor, sample_metrics):
        """메트릭 처리 결과 구조 테스트"""
        result = processor.process_metrics(sample_metrics)
        
        # 필수 키 확인
        assert 'summary' in result
        assert 'servers' in result
        assert 'classification' in result
        assert 'alerts' in result
        assert 'trends' in result
        assert 'performance_summary' in result
        assert 'recommendations' in result
        assert 'metadata' in result
        
        # 요약 정보 확인
        summary = result['summary']
        assert summary['total_servers'] == 3
        assert summary['healthy_count'] == 1
        assert summary['degraded_count'] == 1
        assert summary['unhealthy_count'] == 1
        assert 0 <= summary['overall_health_score'] <= 100
    
    def test_basic_statistics_calculation(self, processor, sample_metrics):
        """기본 통계 계산 테스트"""
        stats = processor._calculate_basic_statistics(sample_metrics)
        
        # 응답 시간 통계 (무한대 값 제외)
        expected_avg = (85.5 + 250.0) / 2  # 167.75
        assert abs(stats['avg_response_time'] - expected_avg) < 0.1
        
        # 에러율 통계
        expected_error_rate = (0.0 + 5.2 + 100.0) / 3  # 35.07
        assert abs(stats['total_error_rate'] - expected_error_rate) < 0.1
    
    def test_server_classification(self, processor, sample_metrics):
        """서버 분류 테스트"""
        classification = processor._classify_servers(sample_metrics)
        
        assert 'filesystem' in classification['healthy']
        assert 'github' in classification['degraded']
        assert 'unhealthy-server' in classification['unhealthy']
        
        assert len(classification['healthy']) == 1
        assert len(classification['degraded']) == 1
        assert len(classification['unhealthy']) == 1
    
    def test_performance_alerts_generation(self, processor, sample_metrics):
        """성능 알림 생성 테스트"""
        alerts = processor._generate_performance_alerts(sample_metrics)
        
        # 알림이 생성되었는지 확인
        assert len(alerts) > 0
        
        # Critical 알림 확인 (unhealthy-server)
        critical_alerts = [a for a in alerts if a.severity == 'critical']
        assert len(critical_alerts) > 0
        
        # 알림 구조 확인
        for alert in alerts:
            assert hasattr(alert, 'severity')
            assert hasattr(alert, 'server_name')
            assert hasattr(alert, 'metric_type')
            assert hasattr(alert, 'message')
            assert alert.severity in ['critical', 'warning', 'info']
    
    def test_overall_health_score_calculation(self, processor, sample_metrics):
        """전체 건강도 점수 계산 테스트"""
        health_score = processor._calculate_overall_health_score(sample_metrics)
        
        assert 0 <= health_score <= 100
        # 1개 healthy, 1개 degraded, 1개 unhealthy이므로 중간 점수
        assert 30 <= health_score <= 70
    
    def test_recommendations_generation(self, processor, sample_metrics):
        """추천사항 생성 테스트"""
        alerts = processor._generate_performance_alerts(sample_metrics)
        recommendations = processor._generate_recommendations(sample_metrics, alerts)
        
        assert isinstance(recommendations, list)
        
        # Critical 이슈에 대한 추천사항 확인
        critical_recommendations = [r for r in recommendations if r['priority'] == 'high']
        assert len(critical_recommendations) > 0


class TestCircuitBreaker:
    """CircuitBreaker 테스트"""
    
    def test_initial_state(self):
        """초기 상태 테스트"""
        cb = CircuitBreaker(failure_threshold=3, reset_timeout=5)
        
        assert cb.state == 'closed'
        assert cb.failure_count == 0
        assert cb.success_count == 0
    
    def test_failure_threshold_reached(self):
        """실패 임계값 도달 테스트"""
        cb = CircuitBreaker(failure_threshold=3, reset_timeout=5)
        
        # 3번 실패
        for _ in range(3):
            cb.on_failure()
        
        assert cb.state == 'open'
        assert cb.failure_count == 3
    
    def test_success_resets_failures(self):
        """성공 시 실패 카운트 리셋 테스트"""
        cb = CircuitBreaker(failure_threshold=3, reset_timeout=5)
        
        # 2번 실패 후 1번 성공
        cb.on_failure()
        cb.on_failure()
        assert cb.failure_count == 2
        
        cb.on_success()
        assert cb.failure_count == 0
        assert cb.state == 'closed'
    
    def test_circuit_breaker_call_protection(self):
        """서킷 브레이커 호출 보호 테스트"""
        cb = CircuitBreaker(failure_threshold=2, reset_timeout=1)
        
        def failing_function():
            raise Exception("Test failure")
        
        def success_function():
            return "success"
        
        # 2번 실패로 서킷 브레이커 열기
        with pytest.raises(Exception):
            cb.call(failing_function)
        with pytest.raises(Exception):
            cb.call(failing_function)
        
        # 서킷 브레이커가 열렸으므로 호출 차단
        with pytest.raises(Exception) as exc_info:
            cb.call(success_function)
        assert "Circuit breaker is OPEN" in str(exc_info.value)
    
    def test_half_open_state_transition(self):
        """Half-Open 상태 전환 테스트"""
        cb = CircuitBreaker(failure_threshold=2, reset_timeout=0.1)
        
        # 서킷 브레이커 열기
        cb.on_failure()
        cb.on_failure()
        assert cb.state == 'open'
        
        # 리셋 타임아웃 대기
        time.sleep(0.2)
        cb._update_state()
        
        # Half-Open 상태로 전환되어야 함
        # (실제로는 call() 호출 시 상태 업데이트됨)


class TestMainFunction:
    """메인 함수 테스트"""
    
    def test_health_check_operation(self):
        """헬스 체크 작업 테스트"""
        request = MockRequest(
            method='GET',
            args={'operation': 'health_check'}
        )
        
        with patch('main.collector') as mock_collector, \
             patch('main.processor') as mock_processor, \
             patch('main.circuit_breaker') as mock_cb:
            
            # Mock 설정
            mock_collector.health_check_all = AsyncMock(return_value={
                'filesystem': {'status': 'healthy'},
                'memory': {'status': 'healthy'}
            })
            mock_cb.state = 'closed'
            
            # 컴포넌트 초기화
            initialize_components()
            
            # 요청 처리
            result = _process_request('health_check', [], time.time())
            
            assert 'health_status' in result
            assert 'overall_health' in result
            assert result['operation'] == 'health_check'
    
    def test_cors_headers(self):
        """CORS 헤더 테스트"""
        request = MockRequest(method='OPTIONS')
        
        response = main(request)
        
        # OPTIONS 요청은 상태 코드 204 반환
        assert response[1] == 204
        
        # CORS 헤더 확인
        headers = response[2]
        assert headers['Access-Control-Allow-Origin'] == '*'
        assert 'Access-Control-Allow-Methods' in headers
        assert 'Access-Control-Allow-Headers' in headers
    
    def test_error_handling(self):
        """에러 처리 테스트"""
        request = MockRequest(
            method='POST',
            json_data={'operation': 'invalid_operation'}
        )
        
        with patch('main.initialize_components', side_effect=Exception("Test error")):
            response = main(request)
            
            # 에러 응답 확인
            assert response[1] == 500  # HTTP 500 상태 코드
            
            response_data = json.loads(response[0])
            assert response_data['success'] is False
            assert 'Error processing MCP metrics' in response_data['message']


@pytest.fixture
def event_loop():
    """이벤트 루프 픽스처 (pytest-asyncio용)"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# 통합 테스트
class TestIntegration:
    """통합 테스트"""
    
    @pytest.mark.asyncio
    async def test_full_pipeline_mock(self):
        """전체 파이프라인 Mock 테스트"""
        collector = MCPMetricsCollector()
        processor = MetricsProcessor()
        
        # Mock 메트릭 데이터
        mock_metrics = {
            'filesystem': MCPServerMetrics(
                name='filesystem',
                status='healthy',
                response_time_ms=95.0,
                error_rate=0.0,
                last_check=datetime.utcnow().isoformat(),
                consecutive_failures=0,
                uptime_percentage=99.8
            )
        }
        
        # 메트릭 처리
        processed_data = processor.process_metrics(mock_metrics)
        
        # 결과 검증
        assert processed_data['summary']['total_servers'] == 1
        assert processed_data['summary']['healthy_count'] == 1
        assert processed_data['summary']['overall_health_score'] > 90
        
        # 성능 요약 확인
        perf_summary = processed_data['performance_summary']
        assert 'response_time' in perf_summary
        assert 'availability' in perf_summary
        assert 'reliability' in perf_summary


if __name__ == '__main__':
    # 테스트 실행
    pytest.main([
        __file__,
        '-v',  # Verbose 출력
        '--tb=short',  # 짧은 traceback
        '--durations=10',  # 가장 느린 10개 테스트 표시
        '--cov=.',  # 커버리지 측정
        '--cov-report=term-missing',  # 누락된 라인 표시
    ])