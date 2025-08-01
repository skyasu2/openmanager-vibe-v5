"""
MCP 메트릭 데이터 처리기
수집된 메트릭을 분석하고 인사이트를 생성하는 고성능 처리 엔진
"""

import statistics
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from functools import lru_cache
import json

from collector import MCPServerMetrics


@dataclass
class ProcessedMetrics:
    """처리된 메트릭 데이터"""
    server_count: int
    healthy_servers: List[str]
    unhealthy_servers: List[str]
    degraded_servers: List[str]
    overall_health_score: float
    average_response_time: float
    total_error_rate: float
    critical_alerts: List[Dict[str, Any]]
    performance_summary: Dict[str, Any]
    trends: Dict[str, Any]


@dataclass
class PerformanceAlert:
    """성능 알림"""
    severity: str  # 'critical', 'warning', 'info'
    server_name: str
    metric_type: str  # 'response_time', 'error_rate', 'availability'
    current_value: float
    threshold_value: float
    message: str
    timestamp: str


class MetricsProcessor:
    """메트릭 데이터 처리기"""
    
    def __init__(self):
        self.performance_thresholds = self._load_performance_thresholds()
        self.processing_history = []
        self.max_history_size = 100
        
        # 성능 임계값
        self.global_thresholds = {
            'response_time_warning': 300,  # 300ms
            'response_time_critical': 500,  # 500ms
            'error_rate_warning': 5,  # 5%
            'error_rate_critical': 10,  # 10%
            'availability_warning': 95,  # 95%
            'availability_critical': 90,  # 90%
            'consecutive_failures_warning': 3,
            'consecutive_failures_critical': 5,
        }
    
    def process_metrics(self, raw_metrics: Dict[str, MCPServerMetrics]) -> Dict[str, Any]:
        """메트릭 데이터 전체 처리"""
        start_time = datetime.utcnow()
        
        try:
            # 1. 기본 통계 계산
            basic_stats = self._calculate_basic_statistics(raw_metrics)
            
            # 2. 서버 상태 분류
            server_classification = self._classify_servers(raw_metrics)
            
            # 3. 성능 알림 생성
            alerts = self._generate_performance_alerts(raw_metrics)
            
            # 4. 트렌드 분석
            trends = self._analyze_trends(raw_metrics)
            
            # 5. 전체 건강도 점수 계산
            health_score = self._calculate_overall_health_score(raw_metrics)
            
            # 6. 성능 요약 생성
            performance_summary = self._generate_performance_summary(raw_metrics, basic_stats)
            
            # 7. 추천사항 생성
            recommendations = self._generate_recommendations(raw_metrics, alerts)
            
            # 처리된 결과 구성
            processed_data = {
                'summary': {
                    'total_servers': len(raw_metrics),
                    'healthy_count': len(server_classification['healthy']),
                    'degraded_count': len(server_classification['degraded']),
                    'unhealthy_count': len(server_classification['unhealthy']),
                    'overall_health_score': round(health_score, 2),
                    'average_response_time_ms': round(basic_stats['avg_response_time'], 2),
                    'total_error_rate': round(basic_stats['total_error_rate'], 2),
                    'processing_time_ms': round((datetime.utcnow() - start_time).total_seconds() * 1000, 2)
                },
                'servers': {
                    name: self._server_metrics_to_dict(metrics) 
                    for name, metrics in raw_metrics.items()
                },
                'classification': server_classification,
                'alerts': [asdict(alert) for alert in alerts],
                'trends': trends,
                'performance_summary': performance_summary,
                'recommendations': recommendations,
                'metadata': {
                    'processed_at': start_time.isoformat(),
                    'processor_version': '1.0.0',
                    'data_quality_score': self._calculate_data_quality_score(raw_metrics)
                }
            }
            
            # 처리 히스토리 업데이트
            self._update_processing_history(processed_data)
            
            return processed_data
            
        except Exception as e:
            # 처리 실패 시 기본 구조 반환
            return {
                'summary': {
                    'total_servers': len(raw_metrics),
                    'processing_error': str(e),
                    'processing_time_ms': round((datetime.utcnow() - start_time).total_seconds() * 1000, 2)
                },
                'servers': {name: self._server_metrics_to_dict(metrics) for name, metrics in raw_metrics.items()},
                'error': True,
                'metadata': {
                    'processed_at': start_time.isoformat(),
                    'processor_version': '1.0.0'
                }
            }
    
    def _calculate_basic_statistics(self, metrics: Dict[str, MCPServerMetrics]) -> Dict[str, float]:
        """기본 통계 계산"""
        if not metrics:
            return {
                'avg_response_time': 0.0,
                'median_response_time': 0.0,
                'total_error_rate': 0.0,
                'avg_uptime': 0.0
            }
        
        # 응답 시간 통계 (무한대 값 제외)
        response_times = [m.response_time_ms for m in metrics.values() 
                         if m.response_time_ms != float('inf')]
        
        avg_response_time = statistics.mean(response_times) if response_times else 0.0
        median_response_time = statistics.median(response_times) if response_times else 0.0
        
        # 에러율 통계
        error_rates = [m.error_rate for m in metrics.values()]
        total_error_rate = statistics.mean(error_rates) if error_rates else 0.0
        
        # 가동률 통계
        uptime_percentages = [m.uptime_percentage for m in metrics.values()]
        avg_uptime = statistics.mean(uptime_percentages) if uptime_percentages else 0.0
        
        return {
            'avg_response_time': avg_response_time,
            'median_response_time': median_response_time,
            'total_error_rate': total_error_rate,
            'avg_uptime': avg_uptime,
            'max_response_time': max(response_times) if response_times else 0.0,
            'min_response_time': min(response_times) if response_times else 0.0
        }
    
    def _classify_servers(self, metrics: Dict[str, MCPServerMetrics]) -> Dict[str, List[str]]:
        """서버 상태별 분류"""
        classification = {
            'healthy': [],
            'degraded': [],
            'unhealthy': [],
            'unknown': []
        }
        
        for name, metric in metrics.items():
            status = metric.status
            if status in classification:
                classification[status].append(name)
            else:
                classification['unknown'].append(name)
        
        return classification
    
    def _generate_performance_alerts(self, metrics: Dict[str, MCPServerMetrics]) -> List[PerformanceAlert]:
        """성능 알림 생성"""
        alerts = []
        current_time = datetime.utcnow().isoformat()
        
        for name, metric in metrics.items():
            server_config = self.performance_thresholds.get(name, {})
            
            # 응답 시간 알림
            if metric.response_time_ms != float('inf'):
                response_threshold = server_config.get('responseTime', self.global_thresholds['response_time_warning'])
                
                if metric.response_time_ms > self.global_thresholds['response_time_critical']:
                    alerts.append(PerformanceAlert(
                        severity='critical',
                        server_name=name,
                        metric_type='response_time',
                        current_value=metric.response_time_ms,
                        threshold_value=self.global_thresholds['response_time_critical'],
                        message=f"Critical response time: {metric.response_time_ms:.1f}ms > {self.global_thresholds['response_time_critical']}ms",
                        timestamp=current_time
                    ))
                elif metric.response_time_ms > response_threshold:
                    alerts.append(PerformanceAlert(
                        severity='warning',
                        server_name=name,
                        metric_type='response_time',
                        current_value=metric.response_time_ms,
                        threshold_value=response_threshold,
                        message=f"High response time: {metric.response_time_ms:.1f}ms > {response_threshold}ms",
                        timestamp=current_time
                    ))
            
            # 에러율 알림
            if metric.error_rate > self.global_thresholds['error_rate_critical']:
                alerts.append(PerformanceAlert(
                    severity='critical',
                    server_name=name,
                    metric_type='error_rate',
                    current_value=metric.error_rate,
                    threshold_value=self.global_thresholds['error_rate_critical'],
                    message=f"Critical error rate: {metric.error_rate:.1f}% > {self.global_thresholds['error_rate_critical']}%",
                    timestamp=current_time
                ))
            elif metric.error_rate > self.global_thresholds['error_rate_warning']:
                alerts.append(PerformanceAlert(
                    severity='warning',
                    server_name=name,
                    metric_type='error_rate',
                    current_value=metric.error_rate,
                    threshold_value=self.global_thresholds['error_rate_warning'],
                    message=f"High error rate: {metric.error_rate:.1f}% > {self.global_thresholds['error_rate_warning']}%",
                    timestamp=current_time
                ))
            
            # 가동률 알림
            if metric.uptime_percentage < self.global_thresholds['availability_critical']:
                alerts.append(PerformanceAlert(
                    severity='critical',
                    server_name=name,
                    metric_type='availability',
                    current_value=metric.uptime_percentage,
                    threshold_value=self.global_thresholds['availability_critical'],
                    message=f"Critical availability: {metric.uptime_percentage:.1f}% < {self.global_thresholds['availability_critical']}%",
                    timestamp=current_time
                ))
            elif metric.uptime_percentage < self.global_thresholds['availability_warning']:
                alerts.append(PerformanceAlert(
                    severity='warning',
                    server_name=name,
                    metric_type='availability',
                    current_value=metric.uptime_percentage,
                    threshold_value=self.global_thresholds['availability_warning'],
                    message=f"Low availability: {metric.uptime_percentage:.1f}% < {self.global_thresholds['availability_warning']}%",
                    timestamp=current_time
                ))
            
            # 연속 실패 알림
            if metric.consecutive_failures >= self.global_thresholds['consecutive_failures_critical']:
                alerts.append(PerformanceAlert(
                    severity='critical',
                    server_name=name,
                    metric_type='consecutive_failures',
                    current_value=metric.consecutive_failures,
                    threshold_value=self.global_thresholds['consecutive_failures_critical'],
                    message=f"Critical: {metric.consecutive_failures} consecutive failures",
                    timestamp=current_time
                ))
            elif metric.consecutive_failures >= self.global_thresholds['consecutive_failures_warning']:
                alerts.append(PerformanceAlert(
                    severity='warning',
                    server_name=name,
                    metric_type='consecutive_failures',
                    current_value=metric.consecutive_failures,
                    threshold_value=self.global_thresholds['consecutive_failures_warning'],
                    message=f"Warning: {metric.consecutive_failures} consecutive failures",
                    timestamp=current_time
                ))
        
        # 심각도별 정렬 (critical > warning > info)
        severity_order = {'critical': 0, 'warning': 1, 'info': 2}
        alerts.sort(key=lambda x: severity_order.get(x.severity, 3))
        
        return alerts
    
    def _analyze_trends(self, metrics: Dict[str, MCPServerMetrics]) -> Dict[str, Any]:
        """트렌드 분석 (단순화된 버전)"""
        # 현재는 기본적인 트렌드만 제공
        # 실제 구현에서는 시계열 데이터 분석 필요
        
        trends = {
            'performance_trend': 'stable',  # 'improving', 'degrading', 'stable'
            'reliability_trend': 'stable',
            'top_performers': [],
            'attention_needed': [],
            'trend_analysis': {
                'total_alerts': len(self._generate_performance_alerts(metrics)),
                'critical_issues': len([a for a in self._generate_performance_alerts(metrics) if a.severity == 'critical']),
                'stable_servers': len([m for m in metrics.values() if m.status == 'healthy']),
                'degraded_servers': len([m for m in metrics.values() if m.status == 'degraded'])
            }
        }
        
        # 상위 성능 서버 (응답 시간 기준)
        healthy_servers = [(name, m) for name, m in metrics.items() 
                          if m.status == 'healthy' and m.response_time_ms != float('inf')]
        healthy_servers.sort(key=lambda x: x[1].response_time_ms)
        trends['top_performers'] = [name for name, _ in healthy_servers[:3]]
        
        # 주의 필요 서버
        problem_servers = [(name, m) for name, m in metrics.items() 
                          if m.status in ['degraded', 'unhealthy']]
        problem_servers.sort(key=lambda x: x[1].consecutive_failures, reverse=True)
        trends['attention_needed'] = [name for name, _ in problem_servers[:3]]
        
        return trends
    
    def _calculate_overall_health_score(self, metrics: Dict[str, MCPServerMetrics]) -> float:
        """전체 건강도 점수 계산 (0-100)"""
        if not metrics:
            return 0.0
        
        total_score = 0.0
        total_weight = 0.0
        
        # 서버 우선순위별 가중치
        priority_weights = {
            'critical': 3.0,
            'high': 2.0,
            'medium': 1.5,
            'low': 1.0
        }
        
        for name, metric in metrics.items():
            # 서버 우선순위 결정 (설정에서 가져오거나 기본값 사용)
            server_priority = self._get_server_priority(name)
            weight = priority_weights.get(server_priority, 1.0)
            
            # 개별 서버 점수 계산
            server_score = self._calculate_server_health_score(metric)
            
            total_score += server_score * weight
            total_weight += weight
        
        return (total_score / total_weight) if total_weight > 0 else 0.0
    
    def _calculate_server_health_score(self, metric: MCPServerMetrics) -> float:
        """개별 서버 건강도 점수 계산"""
        score = 0.0
        
        # 상태별 기본 점수
        status_scores = {
            'healthy': 100.0,
            'degraded': 60.0,
            'unhealthy': 20.0,
            'unknown': 0.0
        }
        
        base_score = status_scores.get(metric.status, 0.0)
        
        # 응답 시간 보정
        if metric.response_time_ms != float('inf') and metric.response_time_ms > 0:
            # 100ms 이하면 보정 없음, 그 이상은 점수 감소
            if metric.response_time_ms > 100:
                response_penalty = min(30, (metric.response_time_ms - 100) / 10)
                base_score -= response_penalty
        
        # 에러율 보정
        if metric.error_rate > 0:
            error_penalty = min(20, metric.error_rate * 2)
            base_score -= error_penalty
        
        # 연속 실패 보정
        if metric.consecutive_failures > 0:
            failure_penalty = min(25, metric.consecutive_failures * 5)
            base_score -= failure_penalty
        
        return max(0.0, min(100.0, base_score))
    
    def _generate_performance_summary(self, metrics: Dict[str, MCPServerMetrics], 
                                    basic_stats: Dict[str, float]) -> Dict[str, Any]:
        """성능 요약 생성"""
        return {
            'response_time': {
                'average': round(basic_stats['avg_response_time'], 2),
                'median': round(basic_stats['median_response_time'], 2),
                'max': round(basic_stats['max_response_time'], 2),
                'min': round(basic_stats['min_response_time'], 2),
                'target': 150.0,  # 목표 응답 시간
                'achievement_rate': round(
                    len([m for m in metrics.values() 
                        if m.response_time_ms <= 150 and m.response_time_ms != float('inf')]) 
                    / len(metrics) * 100, 1
                ) if metrics else 0.0
            },
            'availability': {
                'average': round(basic_stats['avg_uptime'], 2),
                'target': 99.5,
                'servers_meeting_target': len([m for m in metrics.values() if m.uptime_percentage >= 99.5])
            },
            'reliability': {
                'total_error_rate': round(basic_stats['total_error_rate'], 2),
                'servers_with_errors': len([m for m in metrics.values() if m.error_rate > 0]),
                'servers_with_consecutive_failures': len([m for m in metrics.values() if m.consecutive_failures > 0])
            }
        }
    
    def _generate_recommendations(self, metrics: Dict[str, MCPServerMetrics], 
                                alerts: List[PerformanceAlert]) -> List[Dict[str, Any]]:
        """개선 추천사항 생성"""
        recommendations = []
        
        # Critical 알림이 있는 경우
        critical_alerts = [a for a in alerts if a.severity == 'critical']
        if critical_alerts:
            recommendations.append({
                'priority': 'high',
                'category': 'critical_issues',
                'title': f'{len(critical_alerts)}개 서버에서 심각한 문제 발생',
                'action': '즉시 해당 서버들의 상태를 확인하고 복구 작업을 시작하세요.',
                'affected_servers': list(set([a.server_name for a in critical_alerts]))
            })
        
        # 응답 시간 개선
        slow_servers = [name for name, m in metrics.items() 
                       if m.response_time_ms > 300 and m.response_time_ms != float('inf')]
        if slow_servers:
            recommendations.append({
                'priority': 'medium',
                'category': 'performance',
                'title': f'{len(slow_servers)}개 서버의 응답 시간 개선 필요',
                'action': '리소스 할당 검토 또는 최적화를 고려하세요.',
                'affected_servers': slow_servers
            })
        
        # 가동률 개선
        unreliable_servers = [name for name, m in metrics.items() if m.uptime_percentage < 95]
        if unreliable_servers:
            recommendations.append({
                'priority': 'medium',
                'category': 'reliability',
                'title': f'{len(unreliable_servers)}개 서버의 안정성 개선 필요',
                'action': '서버 설정 검토 및 모니터링 강화를 고려하세요.',
                'affected_servers': unreliable_servers
            })
        
        return recommendations
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """성능 요약 조회"""
        if not self.processing_history:
            return {'message': 'No processing history available'}
        
        latest_processing = self.processing_history[-1]
        return latest_processing.get('performance_summary', {})
    
    def _load_performance_thresholds(self) -> Dict[str, Dict[str, Any]]:
        """성능 임계값 로드"""
        return {
            'filesystem': {'responseTime': 100, 'errorRate': 2},
            'memory': {'responseTime': 150, 'errorRate': 2},
            'github': {'responseTime': 200, 'errorRate': 5},
            'supabase': {'responseTime': 300, 'errorRate': 3},
            'tavily-mcp': {'responseTime': 500, 'errorRate': 5},
            'sequential-thinking': {'responseTime': 400, 'errorRate': 5},
            'playwright': {'responseTime': 800, 'errorRate': 10},
            'context7': {'responseTime': 300, 'errorRate': 5},
            'time': {'responseTime': 200, 'errorRate': 5},
            'serena': {'responseTime': 600, 'errorRate': 8},
        }
    
    def _get_server_priority(self, server_name: str) -> str:
        """서버 우선순위 조회"""
        priority_map = {
            'filesystem': 'critical',
            'memory': 'critical',
            'supabase': 'critical',
            'github': 'high',
            'serena': 'high',
            'tavily-mcp': 'medium',
            'sequential-thinking': 'medium',
            'playwright': 'medium',
            'context7': 'medium',
            'time': 'low'
        }
        return priority_map.get(server_name, 'medium')
    
    def _server_metrics_to_dict(self, metrics: MCPServerMetrics) -> Dict[str, Any]:
        """MCPServerMetrics를 딕셔너리로 변환"""
        return asdict(metrics)
    
    def _calculate_data_quality_score(self, metrics: Dict[str, MCPServerMetrics]) -> float:
        """데이터 품질 점수 계산"""
        if not metrics:
            return 0.0
        
        quality_factors = []
        
        for metric in metrics.values():
            # 응답 시간 데이터 품질
            if metric.response_time_ms != float('inf'):
                quality_factors.append(1.0)
            else:
                quality_factors.append(0.5)
            
            # 에러 메시지 존재 여부
            if metric.error_message:
                quality_factors.append(0.8)  # 에러가 있지만 정보는 있음
            else:
                quality_factors.append(1.0)
        
        return round(sum(quality_factors) / len(quality_factors) * 100, 1) if quality_factors else 0.0
    
    def _update_processing_history(self, processed_data: Dict[str, Any]) -> None:
        """처리 히스토리 업데이트"""
        self.processing_history.append(processed_data)
        
        # 크기 제한 적용
        if len(self.processing_history) > self.max_history_size:
            self.processing_history = self.processing_history[-self.max_history_size:]
    
    def get_processing_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """처리 히스토리 조회"""
        return self.processing_history[-limit:]
    
    def clear_history(self) -> None:
        """히스토리 클리어"""
        self.processing_history.clear()