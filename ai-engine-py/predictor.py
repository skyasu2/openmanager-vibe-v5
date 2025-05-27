"""
AI 분석 예측 엔진
시스템 메트릭을 분석하여 문제점과 권장사항을 제공
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
import json

class MetricsPredictor:
    """시스템 메트릭 분석 및 예측 클래스"""
    
    def __init__(self):
        self.confidence_threshold = 0.8
        self.critical_cpu_threshold = 90
        self.critical_memory_threshold = 85
        self.critical_disk_threshold = 90
        
    def analyze_metrics(self, query: Optional[str] = None, 
                       metrics: Optional[List[Dict[str, Any]]] = None,
                       data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        메트릭 데이터를 분석하여 문제점과 권장사항을 반환
        
        Args:
            query: 분석 요청 쿼리
            metrics: 시스템 메트릭 리스트
            data: 추가 데이터
            
        Returns:
            분석 결과 딕셔너리
        """
        
        # 기본 분석 결과
        analysis_result = {
            "summary": "정상적인 시스템 상태입니다",
            "confidence": 0.95,
            "recommendations": ["정기적인 모니터링 지속"],
            "analysis_data": {
                "query": query,
                "metrics_count": len(metrics) if metrics else 0,
                "timestamp": datetime.now().isoformat(),
                "analysis_type": "general"
            }
        }
        
        # 쿼리 기반 분석
        if query:
            analysis_result.update(self._analyze_by_query(query))
            
        # 메트릭 기반 분석
        if metrics and len(metrics) > 0:
            metric_analysis = self._analyze_metrics_data(metrics)
            analysis_result.update(metric_analysis)
            
        return analysis_result
    
    def _analyze_by_query(self, query: str) -> Dict[str, Any]:
        """쿼리 키워드 기반 분석"""
        
        query_lower = query.lower()
        
        # CPU 관련 분석
        if any(keyword in query_lower for keyword in ['cpu', '프로세서', '처리율', '사용률']):
            if any(keyword in query_lower for keyword in ['급증', '증가', '높음', '과부하']):
                return {
                    "summary": "CPU 부하 증가로 인한 응답 지연 가능성",
                    "confidence": 0.92,
                    "recommendations": [
                        "nginx 상태 확인",
                        "DB 커넥션 수 점검",
                        "실행 중인 프로세스 확인",
                        "CPU 집약적 작업 최적화 검토"
                    ],
                    "analysis_data": {
                        "analysis_type": "cpu_performance",
                        "severity": "high"
                    }
                }
        
        # 메모리 관련 분석
        elif any(keyword in query_lower for keyword in ['메모리', '램', 'memory', 'ram']):
            return {
                "summary": "메모리 사용량 최적화가 필요합니다",
                "confidence": 0.88,
                "recommendations": [
                    "메모리 누수 점검",
                    "캐시 정리 실행",
                    "불필요한 프로세스 종료"
                ],
                "analysis_data": {
                    "analysis_type": "memory_optimization",
                    "severity": "medium"
                }
            }
        
        # 디스크 관련 분석
        elif any(keyword in query_lower for keyword in ['디스크', '저장소', 'disk', 'storage']):
            return {
                "summary": "디스크 공간 또는 I/O 성능 점검이 필요합니다",
                "confidence": 0.85,
                "recommendations": [
                    "디스크 사용량 확인",
                    "로그 파일 정리",
                    "디스크 조각 모음 실행"
                ],
                "analysis_data": {
                    "analysis_type": "disk_performance",
                    "severity": "medium"
                }
            }
        
        # 네트워크 관련 분석
        elif any(keyword in query_lower for keyword in ['네트워크', '연결', 'network', '지연']):
            return {
                "summary": "네트워크 연결 상태 점검이 필요합니다",
                "confidence": 0.80,
                "recommendations": [
                    "네트워크 대역폭 확인",
                    "방화벽 규칙 점검",
                    "DNS 해석 속도 확인"
                ],
                "analysis_data": {
                    "analysis_type": "network_analysis",
                    "severity": "medium"
                }
            }
        
        return {}
    
    def _analyze_metrics_data(self, metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """실제 메트릭 데이터 분석"""
        
        # 가장 최근 메트릭 분석
        latest_metric = metrics[-1] if metrics else {}
        
        cpu_usage = latest_metric.get('cpu', 0)
        memory_usage = latest_metric.get('memory', 0)
        disk_usage = latest_metric.get('disk', 0)
        
        issues = []
        recommendations = []
        severity = "low"
        confidence = 0.95
        
        # CPU 분석
        if cpu_usage >= self.critical_cpu_threshold:
            issues.append(f"CPU 사용률이 위험 수준입니다 ({cpu_usage}%)")
            recommendations.extend([
                "CPU 집약적 프로세스 확인",
                "로드 밸런싱 검토",
                "서버 스케일링 고려"
            ])
            severity = "critical"
            
        elif cpu_usage >= 70:
            issues.append(f"CPU 사용률이 높습니다 ({cpu_usage}%)")
            recommendations.append("CPU 사용량 모니터링 강화")
            severity = "high" if severity == "low" else severity
        
        # 메모리 분석
        if memory_usage >= self.critical_memory_threshold:
            issues.append(f"메모리 사용률이 위험 수준입니다 ({memory_usage}%)")
            recommendations.extend([
                "메모리 누수 점검",
                "캐시 최적화",
                "메모리 증설 검토"
            ])
            severity = "critical"
            
        elif memory_usage >= 70:
            issues.append(f"메모리 사용률이 높습니다 ({memory_usage}%)")
            recommendations.append("메모리 사용량 모니터링")
            severity = "high" if severity == "low" else severity
        
        # 디스크 분석
        if disk_usage >= self.critical_disk_threshold:
            issues.append(f"디스크 사용률이 위험 수준입니다 ({disk_usage}%)")
            recommendations.extend([
                "디스크 정리 즉시 실행",
                "로그 파일 아카이브",
                "디스크 용량 증설"
            ])
            severity = "critical"
        
        # 분석 결과 생성
        if issues:
            summary = "; ".join(issues)
            if severity == "critical":
                confidence = 0.95
            elif severity == "high":
                confidence = 0.88
            else:
                confidence = 0.75
        else:
            summary = "모든 메트릭이 정상 범위 내에 있습니다"
            recommendations = ["현재 상태 유지", "정기적인 모니터링 지속"]
        
        return {
            "summary": summary,
            "confidence": confidence,
            "recommendations": recommendations,
            "analysis_data": {
                "analysis_type": "metrics_analysis",
                "severity": severity,
                "metrics_analyzed": {
                    "cpu": cpu_usage,
                    "memory": memory_usage,
                    "disk": disk_usage
                }
            }
        }

# 글로벌 예측기 인스턴스
predictor = MetricsPredictor() 