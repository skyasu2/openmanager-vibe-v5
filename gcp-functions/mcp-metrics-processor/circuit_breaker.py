"""
Circuit Breaker 패턴 구현
시스템 안정성을 위한 서킷 브레이커 패턴
"""

import time
from enum import Enum
from typing import Optional, Callable, Any
from datetime import datetime, timedelta


class CircuitBreakerState(Enum):
    """서킷 브레이커 상태"""
    CLOSED = "closed"       # 정상 상태, 모든 요청 통과
    OPEN = "open"          # 차단 상태, 모든 요청 차단
    HALF_OPEN = "half-open" # 반개방 상태, 제한된 요청만 통과


class CircuitBreakerError(Exception):
    """서킷 브레이커 예외"""
    pass


class CircuitBreaker:
    """
    Circuit Breaker 패턴 구현
    
    시스템 장애 시 연쇄 장애를 방지하고 빠른 복구를 지원
    """
    
    def __init__(
        self,
        failure_threshold: int = 5,
        reset_timeout: int = 60,
        half_open_max_calls: int = 3,
        success_threshold: int = 2
    ):
        """
        Args:
            failure_threshold: 차단 상태로 전환할 연속 실패 횟수
            reset_timeout: 차단 상태 유지 시간 (초)
            half_open_max_calls: 반개방 상태에서 허용할 최대 호출 수
            success_threshold: 반개방에서 닫힘으로 전환할 연속 성공 횟수
        """
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.half_open_max_calls = half_open_max_calls
        self.success_threshold = success_threshold
        
        # 상태 관리
        self._state = CircuitBreakerState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: Optional[float] = None
        self._half_open_calls = 0
        
        # 통계
        self._total_calls = 0
        self._total_failures = 0
        self._total_successes = 0
        self._state_changed_at = time.time()
        
        # 콜백 함수들
        self._on_state_change: Optional[Callable[[CircuitBreakerState, CircuitBreakerState], None]] = None
    
    @property
    def state(self) -> str:
        """현재 상태 반환"""
        return self._state.value
    
    @property
    def failure_count(self) -> int:
        """현재 실패 횟수"""
        return self._failure_count
    
    @property
    def success_count(self) -> int:
        """현재 성공 횟수 (반개방 상태에서)"""
        return self._success_count
    
    @property
    def stats(self) -> dict:
        """통계 정보 반환"""
        return {
            'state': self.state,
            'total_calls': self._total_calls,
            'total_failures': self._total_failures,
            'total_successes': self._total_successes,
            'failure_rate': (
                self._total_failures / self._total_calls * 100 
                if self._total_calls > 0 else 0
            ),
            'current_failure_count': self._failure_count,
            'current_success_count': self._success_count,
            'state_duration_seconds': time.time() - self._state_changed_at,
            'last_failure_time': (
                datetime.fromtimestamp(self._last_failure_time).isoformat() 
                if self._last_failure_time else None
            )
        }
    
    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        보호된 함수 호출
        
        Args:
            func: 호출할 함수
            *args, **kwargs: 함수 인자
            
        Returns:
            함수 실행 결과
            
        Raises:
            CircuitBreakerError: 서킷 브레이커가 열린 상태일 때
        """
        self._total_calls += 1
        
        # 상태 확인 및 업데이트
        self._update_state()
        
        if self._state == CircuitBreakerState.OPEN:
            raise CircuitBreakerError("Circuit breaker is OPEN")
        
        if self._state == CircuitBreakerState.HALF_OPEN:
            if self._half_open_calls >= self.half_open_max_calls:
                raise CircuitBreakerError("Circuit breaker HALF_OPEN max calls exceeded")
            self._half_open_calls += 1
        
        try:
            result = func(*args, **kwargs)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise e
    
    def on_success(self) -> None:
        """성공 시 호출"""
        self._total_successes += 1
        
        if self._state == CircuitBreakerState.HALF_OPEN:
            self._success_count += 1
            if self._success_count >= self.success_threshold:
                self._change_state(CircuitBreakerState.CLOSED)
        elif self._state == CircuitBreakerState.CLOSED:
            # 닫힌 상태에서 성공 시 실패 카운트 리셋
            self._failure_count = 0
    
    def on_failure(self) -> None:
        """실패 시 호출"""
        self._total_failures += 1
        self._failure_count += 1
        self._last_failure_time = time.time()
        
        if self._state == CircuitBreakerState.CLOSED:
            if self._failure_count >= self.failure_threshold:
                self._change_state(CircuitBreakerState.OPEN)
        elif self._state == CircuitBreakerState.HALF_OPEN:
            self._change_state(CircuitBreakerState.OPEN)
    
    def _update_state(self) -> None:
        """상태 업데이트"""
        if self._state == CircuitBreakerState.OPEN:
            if self._should_attempt_reset():
                self._change_state(CircuitBreakerState.HALF_OPEN)
    
    def _should_attempt_reset(self) -> bool:
        """리셋 시도 여부 확인"""
        if not self._last_failure_time:
            return False
        
        return time.time() - self._last_failure_time >= self.reset_timeout
    
    def _change_state(self, new_state: CircuitBreakerState) -> None:
        """상태 변경"""
        old_state = self._state
        self._state = new_state
        self._state_changed_at = time.time()
        
        # 상태별 초기화
        if new_state == CircuitBreakerState.CLOSED:
            self._failure_count = 0
            self._success_count = 0
            self._half_open_calls = 0
        elif new_state == CircuitBreakerState.HALF_OPEN:
            self._success_count = 0
            self._half_open_calls = 0
        elif new_state == CircuitBreakerState.OPEN:
            self._success_count = 0
            self._half_open_calls = 0
        
        # 콜백 호출
        if self._on_state_change:
            self._on_state_change(old_state, new_state)
        
        print(f"Circuit breaker state changed: {old_state.value} -> {new_state.value}")
    
    def set_state_change_callback(self, callback: Callable[[CircuitBreakerState, CircuitBreakerState], None]) -> None:
        """상태 변경 콜백 설정"""
        self._on_state_change = callback
    
    def force_open(self) -> None:
        """강제로 열린 상태로 변경"""
        self._change_state(CircuitBreakerState.OPEN)
    
    def force_close(self) -> None:
        """강제로 닫힌 상태로 변경"""
        self._change_state(CircuitBreakerState.CLOSED)
    
    def force_half_open(self) -> None:
        """강제로 반개방 상태로 변경"""
        self._change_state(CircuitBreakerState.HALF_OPEN)
    
    def reset_stats(self) -> None:
        """통계 리셋"""
        self._total_calls = 0
        self._total_failures = 0
        self._total_successes = 0
        self._failure_count = 0
        self._success_count = 0
        self._half_open_calls = 0
        self._last_failure_time = None
        self._state_changed_at = time.time()


class CircuitBreakerManager:
    """
    여러 서킷 브레이커 관리
    서버별로 독립적인 서킷 브레이커 운영
    """
    
    def __init__(self):
        self._circuit_breakers: dict[str, CircuitBreaker] = {}
        self._default_config = {
            'failure_threshold': 5,
            'reset_timeout': 60,
            'half_open_max_calls': 3,
            'success_threshold': 2
        }
    
    def get_circuit_breaker(
        self, 
        name: str, 
        config: Optional[dict] = None
    ) -> CircuitBreaker:
        """서킷 브레이커 가져오기 (없으면 생성)"""
        if name not in self._circuit_breakers:
            cb_config = {**self._default_config, **(config or {})}
            self._circuit_breakers[name] = CircuitBreaker(**cb_config)
        
        return self._circuit_breakers[name]
    
    def call_with_circuit_breaker(
        self, 
        name: str, 
        func: Callable, 
        *args, 
        config: Optional[dict] = None,
        **kwargs
    ) -> Any:
        """서킷 브레이커를 통한 함수 호출"""
        cb = self.get_circuit_breaker(name, config)
        return cb.call(func, *args, **kwargs)
    
    def get_all_stats(self) -> dict[str, dict]:
        """모든 서킷 브레이커 통계"""
        return {name: cb.stats for name, cb in self._circuit_breakers.items()}
    
    def get_circuit_breaker_states(self) -> dict[str, str]:
        """모든 서킷 브레이커 상태"""
        return {name: cb.state for name, cb in self._circuit_breakers.items()}
    
    def reset_all(self) -> None:
        """모든 서킷 브레이커 리셋"""
        for cb in self._circuit_breakers.values():
            cb.force_close()
            cb.reset_stats()
    
    def get_health_summary(self) -> dict:
        """전체 건강도 요약"""
        if not self._circuit_breakers:
            return {
                'total_circuit_breakers': 0,
                'healthy': 0,
                'degraded': 0,
                'unhealthy': 0,
                'overall_health': 'unknown'
            }
        
        states = list(self.get_circuit_breaker_states().values())
        healthy = states.count('closed')
        degraded = states.count('half-open')
        unhealthy = states.count('open')
        
        total = len(states)
        health_score = (healthy * 100 + degraded * 50) / total if total > 0 else 0
        
        if health_score >= 90:
            overall_health = 'healthy'
        elif health_score >= 70:
            overall_health = 'degraded'
        else:
            overall_health = 'unhealthy'
        
        return {
            'total_circuit_breakers': total,
            'healthy': healthy,
            'degraded': degraded,
            'unhealthy': unhealthy,
            'health_score': round(health_score, 1),
            'overall_health': overall_health
        }


# 글로벌 서킷 브레이커 매니저 인스턴스
global_circuit_breaker_manager = CircuitBreakerManager()