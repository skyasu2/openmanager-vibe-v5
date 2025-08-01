#!/usr/bin/env python3
"""
MCP 메트릭 처리기 사용 예시
로컬 테스트 및 API 호출 예제
"""

import asyncio
import json
import time
import requests
from datetime import datetime
from typing import Dict, Any

# 로컬 모듈 import
from collector import MCPMetricsCollector, MCPServerMetrics
from processor import MetricsProcessor
from circuit_breaker import CircuitBreaker


def example_local_usage():
    """로컬 사용 예시"""
    print("🚀 MCP 메트릭 처리기 로컬 사용 예시")
    print("=" * 50)
    
    # 1. 메트릭 수집기 및 처리기 초기화
    collector = MCPMetricsCollector()
    processor = MetricsProcessor()
    circuit_breaker = CircuitBreaker()
    
    print("✅ 컴포넌트 초기화 완료")
    
    # 2. 샘플 메트릭 데이터 생성 (실제 수집 대신)
    sample_metrics = {
        'filesystem': MCPServerMetrics(
            name='filesystem',
            status='healthy',
            response_time_ms=89.5,
            error_rate=0.0,
            last_check=datetime.utcnow().isoformat(),
            consecutive_failures=0,
            uptime_percentage=99.9,
            memory_usage_mb=45.2,
            cpu_usage_percent=12.5
        ),
        'memory': MCPServerMetrics(
            name='memory',
            status='healthy',
            response_time_ms=125.3,
            error_rate=0.0,
            last_check=datetime.utcnow().isoformat(),
            consecutive_failures=0,
            uptime_percentage=99.7,
            memory_usage_mb=38.1,
            cpu_usage_percent=8.3
        ),
        'github': MCPServerMetrics(
            name='github',
            status='degraded',
            response_time_ms=285.0,
            error_rate=3.5,
            last_check=datetime.utcnow().isoformat(),
            consecutive_failures=1,
            uptime_percentage=96.2,
            memory_usage_mb=52.8,
            cpu_usage_percent=18.7
        ),
        'problematic-server': MCPServerMetrics(
            name='problematic-server',
            status='unhealthy',
            response_time_ms=float('inf'),
            error_rate=100.0,
            last_check=datetime.utcnow().isoformat(),
            consecutive_failures=5,
            uptime_percentage=15.3,
            error_message='Connection timeout after 10 seconds'
        )
    }
    
    print(f"📊 샘플 메트릭 생성: {len(sample_metrics)}개 서버")
    
    # 3. 메트릭 처리
    start_time = time.time()
    processed_data = processor.process_metrics(sample_metrics)
    processing_time = time.time() - start_time
    
    print(f"⚡ 처리 시간: {processing_time*1000:.2f}ms")
    
    # 4. 결과 출력
    print("\n📈 처리 결과 요약:")
    summary = processed_data['summary']
    print(f"  • 전체 서버: {summary['total_servers']}개")
    print(f"  • 정상: {summary['healthy_count']}개")
    print(f"  • 성능저하: {summary['degraded_count']}개") 
    print(f"  • 비정상: {summary['unhealthy_count']}개")
    print(f"  • 전체 건강도: {summary['overall_health_score']:.1f}점")
    print(f"  • 평균 응답시간: {summary['average_response_time_ms']:.1f}ms")
    print(f"  • 전체 에러율: {summary['total_error_rate']:.1f}%")
    
    # 5. 알림 확인
    alerts = processed_data['alerts']
    if alerts:
        print(f"\n🚨 알림 {len(alerts)}개:")
        for alert in alerts[:3]:  # 상위 3개만 표시
            print(f"  • [{alert['severity'].upper()}] {alert['server_name']}: {alert['message']}")
    
    # 6. 추천사항
    recommendations = processed_data['recommendations']
    if recommendations:
        print(f"\n💡 추천사항 {len(recommendations)}개:")
        for rec in recommendations[:2]:  # 상위 2개만 표시
            print(f"  • [{rec['priority'].upper()}] {rec['title']}")
            print(f"    → {rec['action']}")
    
    # 7. Circuit Breaker 테스트
    print(f"\n🔧 Circuit Breaker 상태: {circuit_breaker.state}")
    print(f"  • 전체 호출: {circuit_breaker.stats['total_calls']}")
    print(f"  • 성공률: {circuit_breaker.stats['failure_rate']:.1f}%")
    
    return processed_data


async def example_async_collection():
    """비동기 메트릭 수집 예시"""
    print("\n🔄 비동기 메트릭 수집 예시")
    print("=" * 50)
    
    collector = MCPMetricsCollector()
    
    try:
        async with collector:
            print("📡 비동기 메트릭 수집 시작...")
            start_time = time.time()
            
            # 실제 MCP 서버들로부터 메트릭 수집 시도
            # (로컬 환경에서는 Mock 데이터로 대체됩니다)
            metrics = await collector.collect_all_metrics()
            
            collection_time = time.time() - start_time
            print(f"⚡ 수집 시간: {collection_time*1000:.2f}ms")
            print(f"📊 수집된 서버: {len(metrics)}개")
            
            # 수집된 메트릭 요약
            healthy_count = sum(1 for m in metrics.values() if m.status == 'healthy')
            print(f"  • 정상 서버: {healthy_count}개")
            print(f"  • 문제 서버: {len(metrics) - healthy_count}개")
            
            return metrics
            
    except Exception as e:
        print(f"❌ 비동기 수집 실패: {e}")
        return {}


def example_api_calls():
    """API 호출 예시 (배포된 함수 대상)"""
    print("\n🌐 API 호출 예시")
    print("=" * 50)
    
    # 실제 배포된 함수 URL (예시)
    base_url = "https://us-central1-your-project.cloudfunctions.net/mcp-metrics-processor"
    
    print("💡 실제 사용 시에는 base_url을 배포된 함수 URL로 변경하세요.")
    
    # 예시 호출들
    api_examples = [
        {
            'name': '헬스 체크',
            'url': f"{base_url}?operation=health_check",
            'method': 'GET'
        },
        {
            'name': '전체 메트릭 수집',
            'url': f"{base_url}?operation=collect_all",
            'method': 'GET'
        },
        {
            'name': '특정 서버 메트릭',
            'url': f"{base_url}?operation=collect_specific&servers=filesystem&servers=memory",
            'method': 'GET'
        },
        {
            'name': '성능 요약',
            'url': f"{base_url}?operation=performance_summary",
            'method': 'GET'
        },
        {
            'name': 'POST 요청 예시',
            'url': base_url,
            'method': 'POST',
            'data': {
                'operation': 'collect_specific',
                'servers': ['filesystem', 'memory', 'github'],
                'include_history': True
            }
        }
    ]
    
    for example in api_examples:
        print(f"\n📡 {example['name']}:")
        if example['method'] == 'GET':
            print(f"  curl \"{example['url']}\"")
        else:
            print(f"  curl -X POST \"{example['url']}\" \\")
            print(f"    -H \"Content-Type: application/json\" \\")
            print(f"    -d '{json.dumps(example['data'], indent=2)}'")


def example_monitoring_dashboard():
    """모니터링 대시보드 시뮬레이션"""
    print("\n📊 모니터링 대시보드 시뮬레이션")
    print("=" * 50)
    
    # 시뮬레이션된 데이터
    servers = ['filesystem', 'memory', 'github', 'supabase', 'tavily-mcp', 
               'sequential-thinking', 'playwright', 'context7', 'time', 'serena']
    
    print("┌─────────────────┬─────────┬─────────────┬──────────┬─────────────┐")
    print("│ 서버명          │ 상태    │ 응답시간(ms)│ 에러율(%)│ 가동률(%)   │")
    print("├─────────────────┼─────────┼─────────────┼──────────┼─────────────┤")
    
    import random
    for server in servers:
        # 랜덤 시뮬레이션 데이터
        status_options = ['🟢 정상', '🟡 성능저하', '🔴 비정상']
        weights = [0.7, 0.2, 0.1]  # 정상 70%, 성능저하 20%, 비정상 10%
        status = random.choices(status_options, weights=weights)[0]
        
        if '정상' in status:
            response_time = random.randint(50, 150)
            error_rate = random.uniform(0, 2)
            uptime = random.uniform(99, 100)
        elif '성능저하' in status:
            response_time = random.randint(200, 400)
            error_rate = random.uniform(3, 8)
            uptime = random.uniform(95, 98)
        else:
            response_time = random.randint(500, 2000)
            error_rate = random.uniform(50, 100)
            uptime = random.uniform(0, 50)
        
        print(f"│ {server:<15} │ {status:<7} │ {response_time:>11} │ {error_rate:>8.1f} │ {uptime:>11.1f} │")
    
    print("└─────────────────┴─────────┴─────────────┴──────────┴─────────────┘")
    
    # 전체 통계
    print(f"\n📈 전체 통계:")
    print(f"  • 모니터링 서버: {len(servers)}개")
    print(f"  • 예상 정상률: 70%")
    print(f"  • 평균 응답시간: ~150ms")
    print(f"  • 목표 달성률: 95%")


def example_performance_test():
    """성능 테스트 시뮬레이션"""
    print("\n⚡ 성능 테스트 시뮬레이션")
    print("=" * 50)
    
    processor = MetricsProcessor()
    
    # 다양한 크기의 메트릭 데이터로 성능 테스트
    test_sizes = [1, 5, 10, 20, 50]
    
    print("┌─────────────┬─────────────────┬─────────────────┬─────────────────┐")
    print("│ 서버 수     │ 처리시간(ms)    │ 메모리(MB)      │ 처리량(ops/sec) │")
    print("├─────────────┼─────────────────┼─────────────────┼─────────────────┤")
    
    for size in test_sizes:
        # 테스트 데이터 생성
        test_metrics = {}
        for i in range(size):
            test_metrics[f'server-{i}'] = MCPServerMetrics(
                name=f'server-{i}',
                status='healthy',
                response_time_ms=100.0,
                error_rate=0.0,
                last_check=datetime.utcnow().isoformat(),
                consecutive_failures=0,
                uptime_percentage=99.9
            )
        
        # 성능 측정
        start_time = time.time()
        processed_data = processor.process_metrics(test_metrics)
        processing_time = (time.time() - start_time) * 1000
        
        # 메모리 사용량 시뮬레이션 (실제로는 psutil 필요)
        estimated_memory = size * 2.5  # 서버당 약 2.5MB 추정
        throughput = size / (processing_time / 1000) if processing_time > 0 else 0
        
        print(f"│ {size:>11} │ {processing_time:>15.2f} │ {estimated_memory:>15.1f} │ {throughput:>15.1f} │")
    
    print("└─────────────┴─────────────────┴─────────────────┴─────────────────┘")
    
    print(f"\n✅ 성능 목표 달성 여부:")
    print(f"  • 응답시간 < 100ms: {'✅' if processing_time < 100 else '❌'}")
    print(f"  • 메모리 < 256MB: {'✅' if estimated_memory < 256 else '❌'}")
    print(f"  • 처리량 > 10 ops/sec: {'✅' if throughput > 10 else '❌'}")


async def main():
    """메인 실행 함수"""
    print("🚀 MCP 메트릭 처리기 종합 예시")
    print("=" * 70)
    
    try:
        # 1. 로컬 사용 예시
        processed_data = example_local_usage()
        
        # 2. 비동기 수집 예시
        await example_async_collection()
        
        # 3. API 호출 예시
        example_api_calls()
        
        # 4. 모니터링 대시보드
        example_monitoring_dashboard()
        
        # 5. 성능 테스트
        example_performance_test()
        
        print(f"\n🎉 모든 예시 실행 완료!")
        print(f"📊 최종 데이터 품질 점수: {processed_data['metadata']['data_quality_score']:.1f}점")
        
    except Exception as e:
        print(f"\n❌ 실행 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    # 비동기 메인 함수 실행
    asyncio.run(main())