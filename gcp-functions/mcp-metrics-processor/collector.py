"""
MCP 메트릭 수집기
10개 MCP 서버의 실시간 상태 및 성능 메트릭을 효율적으로 수집
"""

import asyncio
import aiohttp
import time
import json
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from functools import lru_cache


@dataclass
class MCPServerMetrics:
    """MCP 서버 메트릭 데이터 구조"""
    name: str
    status: str  # 'healthy', 'degraded', 'unhealthy', 'unknown'
    response_time_ms: float
    error_rate: float
    last_check: str
    consecutive_failures: int
    uptime_percentage: float
    memory_usage_mb: Optional[float] = None
    cpu_usage_percent: Optional[float] = None
    error_message: Optional[str] = None


class MCPMetricsCollector:
    """MCP 서버 메트릭 수집기"""
    
    def __init__(self):
        self.server_configs = self._load_server_configs()
        self.metrics_cache = {}
        self.cache_ttl = 15  # 15초 캐시
        
        # HTTP 클라이언트 설정 (재사용으로 성능 향상)
        self.session = None
        self._connector_limit = 20  # 동시 연결 제한
        
        # 메트릭 히스토리 (메모리 기반, 제한된 크기)
        self.metrics_history = {}
        self.max_history_size = 100
    
    async def __aenter__(self):
        """비동기 컨텍스트 매니저 진입"""
        if self.session is None:
            connector = aiohttp.TCPConnector(
                limit=self._connector_limit,
                limit_per_host=5,
                keepalive_timeout=30,
                enable_cleanup_closed=True
            )
            timeout = aiohttp.ClientTimeout(total=10, connect=5)
            self.session = aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers={'User-Agent': 'MCP-Metrics-Collector/1.0.0'}
            )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """비동기 컨텍스트 매니저 종료"""
        if self.session:
            await self.session.close()
            self.session = None
    
    @lru_cache(maxsize=1)
    def _load_server_configs(self) -> Dict[str, Dict[str, Any]]:
        """서버 설정 로드 (캐싱)"""
        return {
            'filesystem': {
                'name': 'filesystem',
                'type': 'core',
                'priority': 'critical',
                'runtime': 'node',
                'thresholds': {'responseTime': 100, 'errorRate': 2, 'maxRetries': 3},
                'healthCheck': {'timeout': 5000, 'retries': 3, 'interval': 15000}
            },
            'memory': {
                'name': 'memory',
                'type': 'core',
                'priority': 'critical',
                'runtime': 'node',
                'thresholds': {'responseTime': 150, 'errorRate': 2, 'maxRetries': 3},
                'healthCheck': {'timeout': 5000, 'retries': 3, 'interval': 15000}
            },
            'github': {
                'name': 'github',
                'type': 'core',
                'priority': 'high',
                'runtime': 'node',
                'thresholds': {'responseTime': 200, 'errorRate': 5, 'maxRetries': 2},
                'healthCheck': {'timeout': 8000, 'retries': 2, 'interval': 15000}
            },
            'supabase': {
                'name': 'supabase',
                'type': 'core',
                'priority': 'critical',
                'runtime': 'node',
                'thresholds': {'responseTime': 300, 'errorRate': 3, 'maxRetries': 3},
                'healthCheck': {'timeout': 10000, 'retries': 3, 'interval': 15000}
            },
            'tavily-mcp': {
                'name': 'tavily-mcp',
                'type': 'utility',
                'priority': 'medium',
                'runtime': 'node',
                'thresholds': {'responseTime': 500, 'errorRate': 5, 'maxRetries': 2},
                'healthCheck': {'timeout': 8000, 'retries': 2, 'interval': 15000}
            },
            'sequential-thinking': {
                'name': 'sequential-thinking',
                'type': 'analysis',
                'priority': 'medium',
                'runtime': 'node',
                'thresholds': {'responseTime': 400, 'errorRate': 5, 'maxRetries': 2},
                'healthCheck': {'timeout': 6000, 'retries': 2, 'interval': 15000}
            },
            'playwright': {
                'name': 'playwright',
                'type': 'utility',
                'priority': 'medium',
                'runtime': 'node',
                'thresholds': {'responseTime': 800, 'errorRate': 10, 'maxRetries': 2},
                'healthCheck': {'timeout': 10000, 'retries': 2, 'interval': 15000}
            },
            'context7': {
                'name': 'context7',
                'type': 'utility',
                'priority': 'medium',
                'runtime': 'node',
                'thresholds': {'responseTime': 300, 'errorRate': 5, 'maxRetries': 2},
                'healthCheck': {'timeout': 8000, 'retries': 2, 'interval': 15000}
            },
            'time': {
                'name': 'time',
                'type': 'utility',
                'priority': 'low',
                'runtime': 'python',
                'thresholds': {'responseTime': 200, 'errorRate': 5, 'maxRetries': 2},
                'healthCheck': {'timeout': 5000, 'retries': 2, 'interval': 15000}
            },
            'serena': {
                'name': 'serena',
                'type': 'analysis',
                'priority': 'high',
                'runtime': 'python',
                'thresholds': {'responseTime': 600, 'errorRate': 8, 'maxRetries': 3},
                'healthCheck': {'timeout': 12000, 'retries': 3, 'interval': 15000}
            }
        }
    
    async def collect_all_metrics(self) -> Dict[str, MCPServerMetrics]:
        """모든 MCP 서버의 메트릭 수집"""
        async with self:
            servers = list(self.server_configs.keys())
            
            # 우선순위별로 정렬 (critical > high > medium > low)
            priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
            servers.sort(key=lambda s: priority_order.get(
                self.server_configs[s]['priority'], 4
            ))
            
            # 병렬 수집 (critical 서버 우선 처리)
            critical_servers = [s for s in servers 
                             if self.server_configs[s]['priority'] == 'critical']
            other_servers = [s for s in servers 
                           if self.server_configs[s]['priority'] != 'critical']
            
            # Critical 서버 먼저 처리
            critical_tasks = [self._collect_server_metrics(server) 
                            for server in critical_servers]
            critical_results = await asyncio.gather(*critical_tasks, return_exceptions=True)
            
            # 나머지 서버 처리
            other_tasks = [self._collect_server_metrics(server) 
                         for server in other_servers]
            other_results = await asyncio.gather(*other_tasks, return_exceptions=True)
            
            # 결과 병합
            all_results = list(zip(critical_servers + other_servers, 
                                 critical_results + other_results))
            
            metrics = {}
            for server_name, result in all_results:
                if isinstance(result, Exception):
                    metrics[server_name] = self._create_error_metrics(server_name, str(result))
                else:
                    metrics[server_name] = result
            
            # 캐시 업데이트
            self._update_cache(metrics)
            
            return metrics
    
    async def collect_specific_metrics(self, server_names: List[str]) -> Dict[str, MCPServerMetrics]:
        """특정 서버들의 메트릭 수집"""
        async with self:
            # 유효한 서버명만 필터링
            valid_servers = [name for name in server_names 
                           if name in self.server_configs]
            
            if not valid_servers:
                raise ValueError(f"No valid servers found in {server_names}")
            
            # 병렬 수집
            tasks = [self._collect_server_metrics(server) for server in valid_servers]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            metrics = {}
            for server_name, result in zip(valid_servers, results):
                if isinstance(result, Exception):
                    metrics[server_name] = self._create_error_metrics(server_name, str(result))
                else:
                    metrics[server_name] = result
            
            return metrics
    
    async def health_check_all(self) -> Dict[str, Dict[str, Any]]:
        """모든 서버의 헬스 체크"""
        async with self:
            servers = list(self.server_configs.keys())
            
            # 병렬 헬스 체크
            tasks = [self._health_check_server(server) for server in servers]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            health_status = {}
            for server_name, result in zip(servers, results):
                if isinstance(result, Exception):
                    health_status[server_name] = {
                        'status': 'unhealthy',
                        'error': str(result),
                        'timestamp': datetime.utcnow().isoformat()
                    }
                else:
                    health_status[server_name] = result
            
            return health_status
    
    async def _collect_server_metrics(self, server_name: str) -> MCPServerMetrics:
        """개별 서버 메트릭 수집"""
        config = self.server_configs.get(server_name)
        if not config:
            raise ValueError(f"Unknown server: {server_name}")
        
        # 캐시 확인
        if self._is_cache_valid(server_name):
            return self.metrics_cache[server_name]['data']
        
        start_time = time.time()
        error_message = None
        status = 'unknown'
        consecutive_failures = 0
        
        try:
            # MCP 서버 상태 확인 (실제 프로세스 체크)
            is_running, process_info = await self._check_mcp_process(server_name, config)
            
            if is_running:
                # 응답 시간 측정
                response_time = await self._measure_response_time(server_name, config)
                
                # 임계값 기반 상태 결정
                threshold = config['thresholds']['responseTime']
                if response_time <= threshold:
                    status = 'healthy'
                elif response_time <= threshold * 1.5:
                    status = 'degraded'
                else:
                    status = 'unhealthy'
                
                # 프로세스 정보에서 리소스 사용량 추출
                cpu_usage = process_info.get('cpu_percent', 0.0)
                memory_usage = process_info.get('memory_mb', 0.0)
                
            else:
                status = 'unhealthy'
                response_time = float('inf')
                cpu_usage = 0.0
                memory_usage = 0.0
                error_message = "Process not running"
                consecutive_failures = self._get_consecutive_failures(server_name) + 1
        
        except Exception as e:
            status = 'unhealthy'
            response_time = time.time() - start_time
            cpu_usage = 0.0
            memory_usage = 0.0
            error_message = str(e)
            consecutive_failures = self._get_consecutive_failures(server_name) + 1
        
        # 메트릭 객체 생성
        metrics = MCPServerMetrics(
            name=server_name,
            status=status,
            response_time_ms=round(response_time * 1000, 2),
            error_rate=self._calculate_error_rate(server_name, status != 'healthy'),
            last_check=datetime.utcnow().isoformat(),
            consecutive_failures=consecutive_failures,
            uptime_percentage=self._calculate_uptime(server_name, status == 'healthy'),
            memory_usage_mb=round(memory_usage, 2) if memory_usage > 0 else None,
            cpu_usage_percent=round(cpu_usage, 2) if cpu_usage > 0 else None,
            error_message=error_message
        )
        
        # 히스토리 업데이트
        self._update_metrics_history(server_name, metrics)
        
        return metrics
    
    async def _health_check_server(self, server_name: str) -> Dict[str, Any]:
        """개별 서버 헬스 체크"""
        config = self.server_configs.get(server_name)
        if not config:
            raise ValueError(f"Unknown server: {server_name}")
        
        start_time = time.time()
        
        try:
            is_running, process_info = await self._check_mcp_process(server_name, config)
            response_time = time.time() - start_time
            
            return {
                'status': 'healthy' if is_running else 'unhealthy',
                'response_time_ms': round(response_time * 1000, 2),
                'process_info': process_info,
                'timestamp': datetime.utcnow().isoformat(),
                'config': {
                    'priority': config['priority'],
                    'type': config['type'],
                    'runtime': config['runtime']
                }
            }
            
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'response_time_ms': round((time.time() - start_time) * 1000, 2),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    async def _check_mcp_process(self, server_name: str, config: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """MCP 프로세스 상태 확인"""
        try:
            # Claude MCP 서버 상태 확인
            result = subprocess.run(
                ['claude', 'mcp', 'list'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                # 출력에서 서버 상태 파싱
                output_lines = result.stdout.strip().split('\n')
                for line in output_lines:
                    if server_name in line and 'Connected' in line:
                        return True, {
                            'status': 'connected',
                            'cpu_percent': 0.0,  # MCP 서버는 별도 프로세스가 아님
                            'memory_mb': 0.0,
                            'runtime': config['runtime']
                        }
                
                # 서버가 목록에 있지만 연결되지 않음
                return False, {'status': 'not_connected', 'runtime': config['runtime']}
            
            else:
                # Claude CLI 오류
                return False, {'status': 'cli_error', 'error': result.stderr}
        
        except subprocess.TimeoutExpired:
            return False, {'status': 'timeout', 'error': 'Process check timeout'}
        except Exception as e:
            return False, {'status': 'error', 'error': str(e)}
    
    async def _measure_response_time(self, server_name: str, config: Dict[str, Any]) -> float:
        """응답 시간 측정 (간접 측정)"""
        start_time = time.time()
        
        try:
            # MCP 서버 연결 테스트 (간접적)
            result = subprocess.run(
                ['claude', 'mcp', 'get', server_name],
                capture_output=True,
                text=True,
                timeout=config['healthCheck']['timeout'] / 1000
            )
            
            response_time = time.time() - start_time
            
            # 성공적인 응답인지 확인
            if result.returncode == 0 and server_name in result.stdout:
                return response_time
            else:
                # 오류 응답도 응답 시간에 포함
                return response_time
                
        except subprocess.TimeoutExpired:
            return config['healthCheck']['timeout'] / 1000
        except Exception:
            return time.time() - start_time
    
    def _is_cache_valid(self, server_name: str) -> bool:
        """캐시 유효성 확인"""
        if server_name not in self.metrics_cache:
            return False
        
        cache_entry = self.metrics_cache[server_name]
        cache_age = time.time() - cache_entry['timestamp']
        
        return cache_age < self.cache_ttl
    
    def _update_cache(self, metrics: Dict[str, MCPServerMetrics]) -> None:
        """메트릭 캐시 업데이트"""
        current_time = time.time()
        
        for server_name, metric in metrics.items():
            self.metrics_cache[server_name] = {
                'data': metric,
                'timestamp': current_time
            }
    
    def _update_metrics_history(self, server_name: str, metrics: MCPServerMetrics) -> None:
        """메트릭 히스토리 업데이트"""
        if server_name not in self.metrics_history:
            self.metrics_history[server_name] = []
        
        # 메트릭 히스토리에 추가
        self.metrics_history[server_name].append(asdict(metrics))
        
        # 크기 제한 적용
        if len(self.metrics_history[server_name]) > self.max_history_size:
            self.metrics_history[server_name] = self.metrics_history[server_name][-self.max_history_size:]
    
    def _get_consecutive_failures(self, server_name: str) -> int:
        """연속 실패 횟수 조회"""
        if server_name not in self.metrics_history:
            return 0
        
        history = self.metrics_history[server_name]
        if not history:
            return 0
        
        consecutive_failures = 0
        for metric in reversed(history):
            if metric['status'] != 'healthy':
                consecutive_failures += 1
            else:
                break
        
        return consecutive_failures
    
    def _calculate_error_rate(self, server_name: str, is_error: bool) -> float:
        """에러율 계산 (최근 100개 메트릭 기준)"""
        if server_name not in self.metrics_history:
            return 100.0 if is_error else 0.0
        
        history = self.metrics_history[server_name]
        if not history:
            return 100.0 if is_error else 0.0
        
        # 최근 데이터 기준 에러율 계산
        recent_data = history[-50:]  # 최근 50개 데이터
        error_count = sum(1 for metric in recent_data if metric['status'] != 'healthy')
        
        return round((error_count / len(recent_data)) * 100, 2)
    
    def _calculate_uptime(self, server_name: str, is_healthy: bool) -> float:
        """가동률 계산"""
        if server_name not in self.metrics_history:
            return 100.0 if is_healthy else 0.0
        
        history = self.metrics_history[server_name]
        if not history:
            return 100.0 if is_healthy else 0.0
        
        # 전체 히스토리 기준 가동률 계산
        healthy_count = sum(1 for metric in history if metric['status'] == 'healthy')
        
        return round((healthy_count / len(history)) * 100, 2)
    
    def _create_error_metrics(self, server_name: str, error_message: str) -> MCPServerMetrics:
        """에러 메트릭 생성"""
        return MCPServerMetrics(
            name=server_name,
            status='unhealthy',
            response_time_ms=float('inf'),
            error_rate=100.0,
            last_check=datetime.utcnow().isoformat(),
            consecutive_failures=self._get_consecutive_failures(server_name) + 1,
            uptime_percentage=0.0,
            error_message=error_message
        )
    
    def get_metrics_history(self, server_name: str, limit: int = 50) -> List[Dict[str, Any]]:
        """메트릭 히스토리 조회"""
        if server_name not in self.metrics_history:
            return []
        
        return self.metrics_history[server_name][-limit:]
    
    def clear_cache(self) -> None:
        """캐시 클리어"""
        self.metrics_cache.clear()
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """캐시 통계"""
        return {
            'cache_size': len(self.metrics_cache),
            'cache_ttl': self.cache_ttl,
            'history_size': {name: len(history) for name, history in self.metrics_history.items()},
            'total_history_entries': sum(len(history) for history in self.metrics_history.values())
        }