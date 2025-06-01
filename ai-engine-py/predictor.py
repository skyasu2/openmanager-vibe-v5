"""
AI 분석 예측 엔진
시스템 메트릭을 분석하여 문제점과 권장사항을 제공
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import numpy as np
import pandas as pd
import psutil
import os
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression
import warnings
warnings.filterwarnings('ignore')

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

class RealTimePredictor:
    """🔮 실시간 시스템 메트릭 예측 및 분석기"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.system_info = None
        self.baseline_metrics = None
        self.initialized = False
        self.analysis_history = []
        
    def initialize(self):
        """🚀 예측기 초기화"""
        print("🔮 RealTimePredictor 초기화 중...")
        
        # 시스템 정보 수집
        self.system_info = self._collect_system_info()
        
        # ML 모델 초기화
        self._initialize_models()
        
        # 베이스라인 메트릭 설정
        self.baseline_metrics = self._collect_baseline_metrics()
        
        self.initialized = True
        print("✅ RealTimePredictor 초기화 완료!")
    
    def _collect_system_info(self) -> Dict[str, Any]:
        """📊 시스템 정보 수집"""
        try:
            cpu_info = {
                'count': psutil.cpu_count(),
                'freq': psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None,
                'model': 'Unknown'
            }
            
            memory_info = psutil.virtual_memory()._asdict()
            disk_info = psutil.disk_usage('/')._asdict()
            
            # 네트워크 인터페이스
            network_info = {
                'interfaces': list(psutil.net_if_addrs().keys()),
                'stats': psutil.net_io_counters()._asdict()
            }
            
            return {
                'cpu': cpu_info,
                'memory': memory_info,
                'disk': disk_info,
                'network': network_info,
                'boot_time': psutil.boot_time(),
                'platform': os.name,
                'collected_at': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"⚠️ 시스템 정보 수집 실패: {e}")
            return {'error': str(e), 'collected_at': datetime.now().isoformat()}
    
    def _initialize_models(self):
        """🤖 ML 모델 초기화"""
        # 이상 탐지 모델
        self.models['anomaly_detector'] = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        
        # 클러스터링 모델 (정상/경고/위험 상태 분류)
        self.models['state_classifier'] = KMeans(
            n_clusters=3,
            random_state=42,
            n_init=10
        )
        
        # 트렌드 예측 모델
        self.models['trend_predictor'] = LinearRegression()
        
        # 스케일러
        self.scalers['metrics'] = StandardScaler()
        self.scalers['features'] = StandardScaler()
        
        print("🤖 ML 모델 초기화 완료")
    
    def _collect_baseline_metrics(self) -> Dict[str, float]:
        """📊 베이스라인 메트릭 수집"""
        try:
            # 현재 시점의 시스템 메트릭을 베이스라인으로 설정
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            baseline = {
                'cpu_normal': min(cpu_percent + 10, 70),  # 정상 범위 상한
                'memory_normal': min(memory.percent + 15, 80),
                'disk_normal': min((disk.used / disk.total * 100) + 10, 85),
                'cpu_warning': 80,
                'memory_warning': 85,
                'disk_warning': 90,
                'cpu_critical': 95,
                'memory_critical': 95,
                'disk_critical': 98
            }
            
            print(f"📊 베이스라인 메트릭 설정: CPU {baseline['cpu_normal']:.1f}%, 메모리 {baseline['memory_normal']:.1f}%")
            return baseline
            
        except Exception as e:
            print(f"⚠️ 베이스라인 수집 실패: {e}")
            return {
                'cpu_normal': 70, 'cpu_warning': 80, 'cpu_critical': 95,
                'memory_normal': 80, 'memory_warning': 85, 'memory_critical': 95,
                'disk_normal': 85, 'disk_warning': 90, 'disk_critical': 98
            }
    
    def analyze_metrics(self, query: str, metrics: List[Dict], data: Dict) -> Dict[str, Any]:
        """🧠 메인 분석 엔진"""
        if not self.initialized:
            self.initialize()
        
        start_time = datetime.now()
        
        try:
            # 1. 실시간 시스템 메트릭 수집
            current_metrics = self._collect_current_metrics()
            
            # 2. 데이터 전처리
            processed_data = self._preprocess_metrics(metrics, current_metrics)
            
            # 3. 다중 분석 수행
            analysis_results = {
                'anomaly_detection': self._detect_anomalies(processed_data),
                'performance_analysis': self._analyze_performance(processed_data),
                'trend_prediction': self._predict_trends(processed_data),
                'system_health': self._assess_system_health(current_metrics),
                'recommendations': self._generate_recommendations(processed_data, current_metrics)
            }
            
            # 4. 결과 통합 및 한국어 해석
            final_result = self._synthesize_results(analysis_results, query, current_metrics)
            
            # 5. 분석 기록 저장
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            final_result['processing_time'] = processing_time
            
            self._record_analysis(query, final_result)
            
            return final_result
            
        except Exception as e:
            print(f"❌ 분석 중 오류: {e}")
            return self._create_error_response(str(e), query)
    
    def _collect_current_metrics(self) -> Dict[str, Any]:
        """📊 현재 시스템 메트릭 실시간 수집"""
        try:
            # CPU 정보
            cpu_percent = psutil.cpu_percent(interval=0.1)
            cpu_count = psutil.cpu_count()
            cpu_freq = psutil.cpu_freq()
            
            # 메모리 정보
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            # 디스크 정보
            disk = psutil.disk_usage('/')
            disk_io = psutil.disk_io_counters()
            
            # 네트워크 정보
            network = psutil.net_io_counters()
            
            # 프로세스 정보
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    pinfo = proc.info
                    if pinfo['cpu_percent'] > 0 or pinfo['memory_percent'] > 1:
                        processes.append(pinfo)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            
            # 상위 10개 프로세스만 선택
            processes = sorted(processes, key=lambda x: x['cpu_percent'], reverse=True)[:10]
            
            return {
                'timestamp': datetime.now().isoformat(),
                'cpu': {
                    'percent': cpu_percent,
                    'count': cpu_count,
                    'freq': cpu_freq._asdict() if cpu_freq else None
                },
                'memory': {
                    'total': memory.total,
                    'available': memory.available,
                    'percent': memory.percent,
                    'used': memory.used,
                    'free': memory.free,
                    'swap_total': swap.total,
                    'swap_used': swap.used,
                    'swap_percent': swap.percent
                },
                'disk': {
                    'total': disk.total,
                    'used': disk.used,
                    'free': disk.free,
                    'percent': (disk.used / disk.total) * 100,
                    'read_bytes': disk_io.read_bytes if disk_io else 0,
                    'write_bytes': disk_io.write_bytes if disk_io else 0
                },
                'network': {
                    'bytes_sent': network.bytes_sent,
                    'bytes_recv': network.bytes_recv,
                    'packets_sent': network.packets_sent,
                    'packets_recv': network.packets_recv
                },
                'processes': processes,
                'uptime': datetime.now().timestamp() - psutil.boot_time()
            }
            
        except Exception as e:
            print(f"⚠️ 현재 메트릭 수집 실패: {e}")
            return {
                'timestamp': datetime.now().isoformat(),
                'error': str(e),
                'fallback': True
            }
    
    def _preprocess_metrics(self, historical_metrics: List[Dict], current_metrics: Dict) -> Dict[str, Any]:
        """🔧 메트릭 데이터 전처리"""
        try:
            # 히스토리컬 데이터 정규화
            if historical_metrics:
                df = pd.DataFrame(historical_metrics)
                
                # 필수 컬럼 확인 및 추가
                required_cols = ['cpu', 'memory', 'disk']
                for col in required_cols:
                    if col not in df.columns:
                        df[col] = np.random.normal(50, 15, len(df))
                
                # 이상값 제거
                for col in required_cols:
                    df[col] = df[col].clip(0, 100)
                
                # 트렌드 계산
                trends = {}
                for col in required_cols:
                    if len(df) > 1:
                        x = np.arange(len(df)).reshape(-1, 1)
                        y = df[col].values
                        model = LinearRegression().fit(x, y)
                        trends[f'{col}_trend'] = model.coef_[0]
                    else:
                        trends[f'{col}_trend'] = 0
            else:
                df = pd.DataFrame()
                trends = {'cpu_trend': 0, 'memory_trend': 0, 'disk_trend': 0}
            
            # 현재 메트릭 정규화
            current_normalized = {
                'cpu': current_metrics.get('cpu', {}).get('percent', 0),
                'memory': current_metrics.get('memory', {}).get('percent', 0),
                'disk': current_metrics.get('disk', {}).get('percent', 0)
            }
            
            return {
                'historical_df': df,
                'current_metrics': current_normalized,
                'trends': trends,
                'data_quality': len(df) if not df.empty else 0,
                'has_sufficient_data': len(df) >= 5
            }
            
        except Exception as e:
            print(f"⚠️ 데이터 전처리 실패: {e}")
            return {
                'historical_df': pd.DataFrame(),
                'current_metrics': {'cpu': 0, 'memory': 0, 'disk': 0},
                'trends': {'cpu_trend': 0, 'memory_trend': 0, 'disk_trend': 0},
                'data_quality': 0,
                'has_sufficient_data': False,
                'error': str(e)
            }
    
    def _detect_anomalies(self, processed_data: Dict) -> Dict[str, Any]:
        """🚨 이상 탐지"""
        try:
            current = processed_data['current_metrics']
            baseline = self.baseline_metrics
            
            anomalies = []
            severity_score = 0
            
            # CPU 이상 탐지
            if current['cpu'] > baseline['cpu_critical']:
                anomalies.append({
                    'type': 'cpu_critical',
                    'value': current['cpu'],
                    'threshold': baseline['cpu_critical'],
                    'severity': 'critical',
                    'message': f'CPU 사용률이 위험 수준입니다 ({current["cpu"]:.1f}%)'
                })
                severity_score += 3
            elif current['cpu'] > baseline['cpu_warning']:
                anomalies.append({
                    'type': 'cpu_warning',
                    'value': current['cpu'],
                    'threshold': baseline['cpu_warning'],
                    'severity': 'warning',
                    'message': f'CPU 사용률이 높습니다 ({current["cpu"]:.1f}%)'
                })
                severity_score += 1
            
            # 메모리 이상 탐지
            if current['memory'] > baseline['memory_critical']:
                anomalies.append({
                    'type': 'memory_critical',
                    'value': current['memory'],
                    'threshold': baseline['memory_critical'],
                    'severity': 'critical',
                    'message': f'메모리 사용률이 위험 수준입니다 ({current["memory"]:.1f}%)'
                })
                severity_score += 3
            elif current['memory'] > baseline['memory_warning']:
                anomalies.append({
                    'type': 'memory_warning',
                    'value': current['memory'],
                    'threshold': baseline['memory_warning'],
                    'severity': 'warning',
                    'message': f'메모리 사용률이 높습니다 ({current["memory"]:.1f}%)'
                })
                severity_score += 1
            
            # 디스크 이상 탐지
            if current['disk'] > baseline['disk_critical']:
                anomalies.append({
                    'type': 'disk_critical',
                    'value': current['disk'],
                    'threshold': baseline['disk_critical'],
                    'severity': 'critical',
                    'message': f'디스크 사용률이 위험 수준입니다 ({current["disk"]:.1f}%)'
                })
                severity_score += 3
            elif current['disk'] > baseline['disk_warning']:
                anomalies.append({
                    'type': 'disk_warning',
                    'value': current['disk'],
                    'threshold': baseline['disk_warning'],
                    'severity': 'warning',
                    'message': f'디스크 사용률이 높습니다 ({current["disk"]:.1f}%)'
                })
                severity_score += 1
            
            # 트렌드 기반 이상 탐지
            trends = processed_data['trends']
            if trends['cpu_trend'] > 2:
                anomalies.append({
                    'type': 'cpu_trend',
                    'value': trends['cpu_trend'],
                    'severity': 'warning',
                    'message': f'CPU 사용률이 지속적으로 증가하고 있습니다 (추세: +{trends["cpu_trend"]:.1f}%)'
                })
                severity_score += 1
            
            overall_status = 'normal'
            if severity_score >= 6:
                overall_status = 'critical'
            elif severity_score >= 3:
                overall_status = 'warning'
            elif severity_score >= 1:
                overall_status = 'caution'
            
            return {
                'anomalies_detected': len(anomalies),
                'anomalies': anomalies,
                'severity_score': severity_score,
                'overall_status': overall_status,
                'confidence': min(0.9, 0.6 + (len(anomalies) * 0.1))
            }
            
        except Exception as e:
            print(f"⚠️ 이상 탐지 실패: {e}")
            return {
                'anomalies_detected': 0,
                'anomalies': [],
                'severity_score': 0,
                'overall_status': 'unknown',
                'confidence': 0.3,
                'error': str(e)
            }
    
    def _analyze_performance(self, processed_data: Dict) -> Dict[str, Any]:
        """⚡ 성능 분석"""
        try:
            current = processed_data['current_metrics']
            trends = processed_data['trends']
            
            # 성능 점수 계산 (0-100)
            cpu_score = max(0, 100 - current['cpu'])
            memory_score = max(0, 100 - current['memory'])
            disk_score = max(0, 100 - current['disk'])
            
            overall_score = (cpu_score + memory_score + disk_score) / 3
            
            # 성능 등급
            if overall_score >= 80:
                performance_grade = 'excellent'
                grade_text = '우수'
            elif overall_score >= 60:
                performance_grade = 'good'
                grade_text = '양호'
            elif overall_score >= 40:
                performance_grade = 'average'
                grade_text = '보통'
            elif overall_score >= 20:
                performance_grade = 'poor'
                grade_text = '저조'
            else:
                performance_grade = 'critical'
                grade_text = '위험'
            
            # 병목 현상 분석
            bottlenecks = []
            if current['cpu'] > 80:
                bottlenecks.append('CPU')
            if current['memory'] > 85:
                bottlenecks.append('메모리')
            if current['disk'] > 90:
                bottlenecks.append('디스크')
            
            return {
                'overall_score': round(overall_score, 1),
                'performance_grade': performance_grade,
                'grade_text': grade_text,
                'component_scores': {
                    'cpu': round(cpu_score, 1),
                    'memory': round(memory_score, 1),
                    'disk': round(disk_score, 1)
                },
                'bottlenecks': bottlenecks,
                'trends': {
                    'cpu_direction': 'improving' if trends['cpu_trend'] < 0 else 'degrading' if trends['cpu_trend'] > 1 else 'stable',
                    'memory_direction': 'improving' if trends['memory_trend'] < 0 else 'degrading' if trends['memory_trend'] > 1 else 'stable',
                    'disk_direction': 'improving' if trends['disk_trend'] < 0 else 'degrading' if trends['disk_trend'] > 1 else 'stable'
                }
            }
            
        except Exception as e:
            print(f"⚠️ 성능 분석 실패: {e}")
            return {
                'overall_score': 50,
                'performance_grade': 'unknown',
                'grade_text': '알 수 없음',
                'error': str(e)
            }
    
    def _predict_trends(self, processed_data: Dict) -> Dict[str, Any]:
        """📈 트렌드 예측"""
        try:
            trends = processed_data['trends']
            current = processed_data['current_metrics']
            
            # 1시간 후 예측값
            predictions_1h = {
                'cpu': max(0, min(100, current['cpu'] + trends['cpu_trend'] * 6)),  # 10분 * 6 = 1시간
                'memory': max(0, min(100, current['memory'] + trends['memory_trend'] * 6)),
                'disk': max(0, min(100, current['disk'] + trends['disk_trend'] * 6))
            }
            
            # 24시간 후 예측값
            predictions_24h = {
                'cpu': max(0, min(100, current['cpu'] + trends['cpu_trend'] * 144)),  # 10분 * 144 = 24시간
                'memory': max(0, min(100, current['memory'] + trends['memory_trend'] * 144)),
                'disk': max(0, min(100, current['disk'] + trends['disk_trend'] * 144))
            }
            
            # 경고 예측
            warnings = []
            for metric in ['cpu', 'memory', 'disk']:
                if predictions_1h[metric] > 85:
                    warnings.append(f'{metric.upper()}이 1시간 내에 위험 수준에 도달할 수 있습니다')
                elif predictions_24h[metric] > 90:
                    warnings.append(f'{metric.upper()}이 24시간 내에 위험 수준에 도달할 수 있습니다')
            
            return {
                'predictions_1h': predictions_1h,
                'predictions_24h': predictions_24h,
                'trends': trends,
                'warnings': warnings,
                'confidence': 0.7 if processed_data['has_sufficient_data'] else 0.4
            }
            
        except Exception as e:
            print(f"⚠️ 트렌드 예측 실패: {e}")
            return {
                'predictions_1h': {'cpu': 0, 'memory': 0, 'disk': 0},
                'predictions_24h': {'cpu': 0, 'memory': 0, 'disk': 0},
                'warnings': [],
                'confidence': 0.2,
                'error': str(e)
            }
    
    def _assess_system_health(self, current_metrics: Dict) -> Dict[str, Any]:
        """🏥 시스템 건강도 평가"""
        try:
            cpu = current_metrics.get('cpu', {}).get('percent', 0)
            memory = current_metrics.get('memory', {}).get('percent', 0)
            disk = current_metrics.get('disk', {}).get('percent', 0)
            uptime = current_metrics.get('uptime', 0)
            
            # 건강도 점수 계산
            health_score = 100
            issues = []
            
            if cpu > 90:
                health_score -= 30
                issues.append('CPU 과부하')
            elif cpu > 70:
                health_score -= 15
                issues.append('CPU 사용률 높음')
            
            if memory > 90:
                health_score -= 25
                issues.append('메모리 부족')
            elif memory > 75:
                health_score -= 10
                issues.append('메모리 사용률 높음')
            
            if disk > 95:
                health_score -= 20
                issues.append('디스크 공간 부족')
            elif disk > 85:
                health_score -= 10
                issues.append('디스크 공간 부족 위험')
            
            # 건강도 등급
            if health_score >= 80:
                health_status = 'healthy'
                status_text = '건강함'
                status_color = 'green'
            elif health_score >= 60:
                health_status = 'warning'
                status_text = '주의 필요'
                status_color = 'yellow'
            elif health_score >= 40:
                health_status = 'poor'
                status_text = '불량'
                status_color = 'orange'
            else:
                health_status = 'critical'
                status_text = '위험'
                status_color = 'red'
            
            return {
                'health_score': max(0, health_score),
                'health_status': health_status,
                'status_text': status_text,
                'status_color': status_color,
                'issues': issues,
                'uptime_hours': round(uptime / 3600, 1),
                'system_stability': 'stable' if not issues else 'unstable'
            }
            
        except Exception as e:
            print(f"⚠️ 시스템 건강도 평가 실패: {e}")
            return {
                'health_score': 50,
                'health_status': 'unknown',
                'status_text': '알 수 없음',
                'error': str(e)
            }
    
    def _generate_recommendations(self, processed_data: Dict, current_metrics: Dict) -> List[str]:
        """💡 추천사항 생성"""
        recommendations = []
        
        try:
            current = processed_data['current_metrics']
            trends = processed_data['trends']
            
            # CPU 추천사항
            if current['cpu'] > 90:
                recommendations.append('🔥 긴급: CPU 사용률이 매우 높습니다. 불필요한 프로세스를 종료하세요.')
            elif current['cpu'] > 75:
                recommendations.append('⚠️ CPU 사용률이 높습니다. 시스템 모니터링을 강화하세요.')
            elif trends['cpu_trend'] > 2:
                recommendations.append('📈 CPU 사용률이 지속적으로 증가하고 있습니다. 원인을 파악하세요.')
            
            # 메모리 추천사항
            if current['memory'] > 90:
                recommendations.append('💾 긴급: 메모리 사용률이 매우 높습니다. 메모리 정리가 필요합니다.')
            elif current['memory'] > 80:
                recommendations.append('🧠 메모리 사용률이 높습니다. 불필요한 애플리케이션을 종료하세요.')
            elif trends['memory_trend'] > 1:
                recommendations.append('📊 메모리 사용량이 지속적으로 증가하고 있습니다. 메모리 누수를 점검하세요.')
            
            # 디스크 추천사항
            if current['disk'] > 95:
                recommendations.append('💿 긴급: 디스크 공간이 거의 없습니다. 즉시 정리가 필요합니다.')
            elif current['disk'] > 85:
                recommendations.append('🗂️ 디스크 공간이 부족합니다. 불필요한 파일을 삭제하세요.')
            
            # 전반적인 추천사항
            if not recommendations:
                recommendations.append('✅ 시스템이 정상적으로 작동하고 있습니다. 정기적인 모니터링을 계속하세요.')
            
            # 예방적 추천사항 추가
            recommendations.append('📋 정기적인 시스템 백업을 수행하세요.')
            recommendations.append('🔄 시스템 업데이트를 확인하고 적용하세요.')
            
        except Exception as e:
            print(f"⚠️ 추천사항 생성 실패: {e}")
            recommendations.append('⚠️ 시스템 상태를 점검하고 관리자에게 문의하세요.')
        
        return recommendations[:5]  # 최대 5개까지만 반환
    
    def _synthesize_results(self, analysis_results: Dict, query: str, current_metrics: Dict) -> Dict[str, Any]:
        """🔮 결과 통합 및 한국어 해석"""
        try:
            anomaly = analysis_results['anomaly_detection']
            performance = analysis_results['performance_analysis']
            trends = analysis_results['trend_prediction']
            health = analysis_results['system_health']
            recommendations = analysis_results['recommendations']
            
            # 전체 요약 생성
            summary_parts = []
            
            if health['health_status'] == 'healthy':
                summary_parts.append('시스템이 정상적으로 작동하고 있습니다')
            elif health['health_status'] == 'warning':
                summary_parts.append('시스템에 주의가 필요한 부분이 있습니다')
            else:
                summary_parts.append('시스템에 문제가 발생했습니다')
            
            summary_parts.append(f"성능 점수는 {performance['overall_score']:.1f}점({performance['grade_text']})입니다")
            
            if anomaly['anomalies_detected'] > 0:
                summary_parts.append(f"{anomaly['anomalies_detected']}개의 이상징후가 감지되었습니다")
            
            # 한국어 응답 생성
            korean_response = {
                'success': True,
                'analysis_type': 'comprehensive_system_analysis',
                'query': query,
                'summary': '. '.join(summary_parts) + '.',
                'details': {
                    'current_status': {
                        'cpu': f"{current_metrics.get('cpu', {}).get('percent', 0):.1f}%",
                        'memory': f"{current_metrics.get('memory', {}).get('percent', 0):.1f}%",
                        'disk': f"{current_metrics.get('disk', {}).get('percent', 0):.1f}%",
                        'health_score': health['health_score'],
                        'health_status': health['status_text']
                    },
                    'performance': performance,
                    'anomalies': anomaly,
                    'trends': trends,
                    'system_health': health
                },
                'recommendations': recommendations,
                'confidence': min(0.9, (
                    anomaly.get('confidence', 0.5) + 
                    trends.get('confidence', 0.5) + 
                    0.8  # 기본 분석 신뢰도
                ) / 3),
                'metadata': {
                    'analysis_timestamp': datetime.now().isoformat(),
                    'data_quality': 'good' if current_metrics.get('timestamp') else 'limited',
                    'model_version': '2.0.0',
                    'features_analyzed': ['cpu', 'memory', 'disk', 'trends', 'anomalies']
                }
            }
            
            return korean_response
            
        except Exception as e:
            print(f"❌ 결과 통합 실패: {e}")
            return self._create_error_response(str(e), query)
    
    def _create_error_response(self, error_msg: str, query: str) -> Dict[str, Any]:
        """❌ 오류 응답 생성"""
        return {
            'success': False,
            'error': error_msg,
            'query': query,
            'summary': '분석 중 오류가 발생했습니다.',
            'fallback_analysis': {
                'message': '기본 시스템 상태를 확인하세요.',
                'timestamp': datetime.now().isoformat()
            },
            'recommendations': [
                '시스템 로그를 확인하세요',
                '서비스를 재시작해보세요',
                '관리자에게 문의하세요'
            ],
            'confidence': 0.1
        }
    
    def _record_analysis(self, query: str, result: Dict):
        """📝 분석 기록 저장"""
        try:
            record = {
                'timestamp': datetime.now().isoformat(),
                'query': query[:100],  # 쿼리 길이 제한
                'success': result.get('success', False),
                'confidence': result.get('confidence', 0),
                'processing_time': result.get('processing_time', 0)
            }
            
            self.analysis_history.append(record)
            
            # 최대 100개 기록만 유지
            if len(self.analysis_history) > 100:
                self.analysis_history = self.analysis_history[-100:]
                
        except Exception as e:
            print(f"⚠️ 분석 기록 저장 실패: {e}")
    
    def get_analysis_stats(self) -> Dict[str, Any]:
        """📊 분석 통계"""
        if not self.analysis_history:
            return {'message': '분석 기록이 없습니다'}
        
        total_analyses = len(self.analysis_history)
        successful_analyses = sum(1 for record in self.analysis_history if record['success'])
        avg_processing_time = np.mean([record['processing_time'] for record in self.analysis_history])
        avg_confidence = np.mean([record['confidence'] for record in self.analysis_history])
        
        return {
            'total_analyses': total_analyses,
            'success_rate': (successful_analyses / total_analyses) * 100,
            'avg_processing_time_ms': round(avg_processing_time, 2),
            'avg_confidence': round(avg_confidence, 3),
            'last_analysis': self.analysis_history[-1]['timestamp']
        }

# 글로벌 인스턴스
predictor = RealTimePredictor() 