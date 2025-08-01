"""
MCP 메트릭 처리기 - GCP Functions 메인 엔트리포인트
10개 MCP 서버의 실시간 메트릭 수집 및 처리 시스템

무료 티어 최적화:
- 응답시간 < 100ms 목표
- 메모리 사용량 256MB 이내
- 2백만 요청/월 제한 준수
"""

import functions_framework
import json
import time
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from flask import Request, jsonify

from collector import MCPMetricsCollector
from processor import MetricsProcessor
from circuit_breaker import CircuitBreaker


# 글로벌 인스턴스 (콜드 스타트 최적화)
collector = None
processor = None
circuit_breaker = None


def initialize_components():
    """컴포넌트 초기화 (지연 초기화로 콜드 스타트 최적화)"""
    global collector, processor, circuit_breaker
    
    if collector is None:
        collector = MCPMetricsCollector()
    
    if processor is None:
        processor = MetricsProcessor()
    
    if circuit_breaker is None:
        circuit_breaker = CircuitBreaker(
            failure_threshold=5,
            reset_timeout=60,
            half_open_max_calls=3
        )


@functions_framework.http
def main(request: Request) -> Dict[str, Any]:
    """
    MCP 메트릭 처리 메인 함수
    
    Args:
        request: HTTP 요청 객체
        
    Returns:
        Dict: 처리 결과 및 메트릭 데이터
    """
    start_time = time.time()
    
    try:
        # CORS 헤더 설정
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=30, s-maxage=60',  # 30초 클라이언트, 60초 CDN 캐시
        }
        
        # OPTIONS 요청 처리 (CORS preflight)
        if request.method == 'OPTIONS':
            return ('', 204, headers)
        
        # 컴포넌트 초기화
        initialize_components()
        
        # 요청 파라미터 파싱
        request_data = _parse_request(request)
        operation = request_data.get('operation', 'collect_all')
        servers = request_data.get('servers', [])
        
        # Circuit Breaker 패턴 적용
        if circuit_breaker.state == 'open':
            return _create_response(
                success=False,
                message="Circuit breaker is open - service temporarily unavailable",
                data={},
                processing_time=time.time() - start_time,
                headers=headers,
                status_code=503
            )
        
        # 요청 처리
        result = _process_request(operation, servers, start_time)
        
        # Circuit Breaker 성공 기록
        circuit_breaker.on_success()
        
        # 응답 생성
        processing_time = time.time() - start_time
        
        # 성능 목표 확인 (100ms)
        if processing_time > 0.1:
            print(f"Warning: Processing time {processing_time:.3f}s exceeds 100ms target")
        
        return _create_response(
            success=True,
            message="Metrics processed successfully",
            data=result,
            processing_time=processing_time,
            headers=headers
        )
        
    except Exception as e:
        # Circuit Breaker 실패 기록
        if circuit_breaker:
            circuit_breaker.on_failure()
        
        processing_time = time.time() - start_time
        error_message = f"Error processing MCP metrics: {str(e)}"
        
        print(f"Error: {error_message}")
        
        return _create_response(
            success=False,
            message=error_message,
            data={},
            processing_time=processing_time,
            headers=headers,
            status_code=500
        )


def _parse_request(request: Request) -> Dict[str, Any]:
    """요청 데이터 파싱"""
    try:
        if request.method == 'GET':
            return {
                'operation': request.args.get('operation', 'collect_all'),
                'servers': request.args.getlist('servers'),
                'include_history': request.args.get('include_history', 'false').lower() == 'true',
                'priority_filter': request.args.get('priority_filter'),
            }
        elif request.method == 'POST':
            request_json = request.get_json(silent=True) or {}
            return {
                'operation': request_json.get('operation', 'collect_all'),
                'servers': request_json.get('servers', []),
                'include_history': request_json.get('include_history', False),
                'priority_filter': request_json.get('priority_filter'),
            }
        else:
            return {'operation': 'collect_all'}
    except Exception as e:
        print(f"Request parsing error: {e}")
        return {'operation': 'collect_all'}


def _process_request(operation: str, servers: list, start_time: float) -> Dict[str, Any]:
    """요청 처리 로직"""
    try:
        if operation == 'collect_all':
            # 모든 서버 메트릭 수집
            metrics = asyncio.run(collector.collect_all_metrics())
            processed_data = processor.process_metrics(metrics)
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'operation': operation,
                'metrics': processed_data,
                'servers_count': len(processed_data.get('servers', {})),
                'circuit_breaker_state': circuit_breaker.state,
            }
            
        elif operation == 'collect_specific':
            # 특정 서버 메트릭 수집
            if not servers:
                raise ValueError("No servers specified for collect_specific operation")
            
            metrics = asyncio.run(collector.collect_specific_metrics(servers))
            processed_data = processor.process_metrics(metrics)
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'operation': operation,
                'requested_servers': servers,
                'metrics': processed_data,
                'circuit_breaker_state': circuit_breaker.state,
            }
            
        elif operation == 'health_check':
            # 헬스 체크
            health_status = asyncio.run(collector.health_check_all())
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'operation': operation,
                'health_status': health_status,
                'overall_health': _calculate_overall_health(health_status),
                'circuit_breaker_state': circuit_breaker.state,
            }
            
        elif operation == 'performance_summary':
            # 성능 요약
            summary = processor.get_performance_summary()
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'operation': operation,
                'performance_summary': summary,
                'circuit_breaker_state': circuit_breaker.state,
            }
            
        else:
            raise ValueError(f"Unknown operation: {operation}")
            
    except Exception as e:
        raise Exception(f"Request processing failed: {str(e)}")


def _calculate_overall_health(health_status: Dict[str, Any]) -> str:
    """전체 헬스 상태 계산"""
    if not health_status:
        return 'unknown'
    
    healthy_count = sum(1 for status in health_status.values() if status.get('status') == 'healthy')
    total_count = len(health_status)
    
    if healthy_count == total_count:
        return 'healthy'
    elif healthy_count >= total_count * 0.7:
        return 'degraded'
    else:
        return 'unhealthy'


def _create_response(
    success: bool,
    message: str,
    data: Dict[str, Any],
    processing_time: float,
    headers: Dict[str, str],
    status_code: int = 200
) -> tuple:
    """표준화된 응답 생성"""
    response_data = {
        'success': success,
        'message': message,
        'data': data,
        'metadata': {
            'processing_time_ms': round(processing_time * 1000, 2),
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'function_name': 'mcp-metrics-processor',
        }
    }
    
    return (json.dumps(response_data, ensure_ascii=False), status_code, headers)


# 헬스 체크 엔드포인트 (별도 함수로 최적화)
@functions_framework.http
def health(request: Request) -> Dict[str, Any]:
    """간단한 헬스 체크 엔드포인트 (< 10ms 목표)"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'mcp-metrics-processor',
        'version': '1.0.0',
    })


if __name__ == '__main__':
    # 로컬 테스트용
    from flask import Flask
    app = Flask(__name__)
    app.add_url_rule('/', 'main', main, methods=['GET', 'POST', 'OPTIONS'])
    app.add_url_rule('/health', 'health', health, methods=['GET'])
    app.run(debug=True, port=8080)