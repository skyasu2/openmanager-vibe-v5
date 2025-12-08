"""
ML Analytics Engine Module (Extracted from ml-analytics-engine)
For use by Unified AI Processor - No internal HTTP calls
"""

import time
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import warnings

warnings.filterwarnings('ignore')


@dataclass
class MetricData:
    timestamp: datetime
    value: float
    server_id: str
    metric_type: str


@dataclass
class AnomalyResult:
    is_anomaly: bool
    severity: str
    confidence: float
    timestamp: datetime
    value: float
    expected_range: Tuple[float, float]


@dataclass
class TrendAnalysis:
    direction: str
    rate_of_change: float
    prediction_24h: float
    confidence: float
    seasonality_detected: bool
    forecast_model: str


@dataclass
class ServerHealthScore:
    server_id: str
    score: float
    status: str
    primary_issue: Optional[str]


@dataclass
class MLAnalysisResult:
    anomalies: List[AnomalyResult]
    trend: TrendAnalysis
    patterns: List[Dict[str, Any]]
    recommendations: List[str]
    health_scores: List[ServerHealthScore]
    clusters: Dict[str, List[str]]
    processing_time_ms: float


class MLAnalyticsEngine:
    """High-performance ML analytics for server monitoring"""

    def __init__(self):
        self.scaler = StandardScaler()

    async def analyze_metrics(self,
                            metrics: List[Dict[str, Any]],
                            context: Optional[Dict] = None) -> MLAnalysisResult:
        """Analyze server metrics using advanced ML algorithms"""
        start_time = time.time()

        df = self._prepare_dataframe(metrics)

        if df.empty:
            return self._create_empty_result(start_time)

        trend = await self._analyze_trend_advanced(df)
        anomalies = await self._detect_anomalies(df)
        health_scores = self._calculate_health_scores(df)
        clusters = self._cluster_servers(df)
        patterns = await self._find_patterns(df)
        recommendations = self._generate_recommendations(anomalies, trend, patterns, health_scores)

        processing_time = (time.time() - start_time) * 1000

        return MLAnalysisResult(
            anomalies=anomalies,
            trend=trend,
            patterns=patterns,
            recommendations=recommendations,
            health_scores=health_scores,
            clusters=clusters,
            processing_time_ms=processing_time
        )

    def _prepare_dataframe(self, metrics: List[Dict[str, Any]]) -> pd.DataFrame:
        """Convert raw metrics to Pandas DataFrame"""
        try:
            df = pd.DataFrame(metrics)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['value'] = pd.to_numeric(df['value'], errors='coerce')
            df = df.dropna(subset=['value', 'timestamp'])
            return df
        except Exception:
            return pd.DataFrame()

    def _create_empty_result(self, start_time: float) -> MLAnalysisResult:
        return MLAnalysisResult(
            anomalies=[],
            trend=TrendAnalysis('stable', 0, 0, 0, False, 'None'),
            patterns=[],
            recommendations=["데이터가 부족하여 분석할 수 없습니다."],
            health_scores=[],
            clusters={},
            processing_time_ms=(time.time() - start_time) * 1000
        )

    async def _detect_anomalies(self, df: pd.DataFrame) -> List[AnomalyResult]:
        """Detect anomalies using Z-Score method"""
        anomalies = []

        for metric_type in df['metric_type'].unique():
            type_df = df[df['metric_type'] == metric_type].copy()

            if len(type_df) < 5:
                continue

            mean = type_df['value'].mean()
            std = type_df['value'].std()

            if std == 0:
                continue

            type_df['z_score'] = (type_df['value'] - mean) / std
            outliers = type_df[abs(type_df['z_score']) > 3]

            for _, row in outliers.iterrows():
                severity = 'high' if abs(row['z_score']) > 5 else 'medium'
                anomalies.append(AnomalyResult(
                    is_anomaly=True,
                    severity=severity,
                    confidence=0.9,
                    timestamp=row['timestamp'],
                    value=row['value'],
                    expected_range=(mean - 3*std, mean + 3*std)
                ))

        return anomalies

    async def _analyze_trend_advanced(self, df: pd.DataFrame) -> TrendAnalysis:
        """Analyze trend using Holt-Winters Exponential Smoothing"""
        if df.empty:
            return TrendAnalysis('stable', 0, 0, 0, False, 'None')

        main_metric = df['metric_type'].mode()[0]
        ts_data = df[df['metric_type'] == main_metric].set_index('timestamp').sort_index()['value']
        ts_resampled = ts_data.resample('h').mean().interpolate()

        if len(ts_resampled) < 24:
            return self._analyze_trend_linear(ts_data.values)

        try:
            model = ExponentialSmoothing(
                ts_resampled,
                seasonal_periods=24,
                trend='add',
                seasonal='add',
                initialization_method="estimated"
            ).fit()

            forecast = model.forecast(24)
            prediction_24h = forecast.iloc[-1]

            current_value = ts_resampled.iloc[-1]
            rate_of_change = (prediction_24h - current_value) / current_value if current_value != 0 else 0

            direction = 'stable'
            if rate_of_change > 0.1:
                direction = 'increasing'
            elif rate_of_change < -0.1:
                direction = 'decreasing'

            return TrendAnalysis(
                direction=direction,
                rate_of_change=rate_of_change,
                prediction_24h=prediction_24h,
                confidence=0.85,
                seasonality_detected=True,
                forecast_model='Holt-Winters'
            )

        except Exception:
            return self._analyze_trend_linear(ts_data.values)

    def _analyze_trend_linear(self, values: np.ndarray) -> TrendAnalysis:
        """Simple linear regression fallback"""
        if len(values) < 2:
            return TrendAnalysis('stable', 0, 0, 0, False, 'Insufficient Data')

        x = np.arange(len(values))
        slope = np.polyfit(x, values, 1)[0]

        direction = 'stable'
        if slope > 0.1:
            direction = 'increasing'
        elif slope < -0.1:
            direction = 'decreasing'

        return TrendAnalysis(
            direction=direction,
            rate_of_change=float(slope),
            prediction_24h=float(values[-1] + slope * 24),
            confidence=0.6,
            seasonality_detected=False,
            forecast_model='Linear Regression'
        )

    def _calculate_health_scores(self, df: pd.DataFrame) -> List[ServerHealthScore]:
        """Calculate health score for each server"""
        scores = []

        for server_id in df['server_id'].unique():
            server_df = df[df['server_id'] == server_id]

            score = 100.0
            issues = []

            cpu_data = server_df[server_df['metric_type'] == 'cpu']
            if not cpu_data.empty:
                avg_cpu = cpu_data['value'].mean()
                if avg_cpu > 80:
                    score -= 30
                    issues.append("High CPU Load")
                elif avg_cpu > 60:
                    score -= 10

            mem_data = server_df[server_df['metric_type'] == 'memory']
            if not mem_data.empty:
                avg_mem = mem_data['value'].mean()
                if avg_mem > 90:
                    score -= 40
                    issues.append("Critical Memory Usage")
                elif avg_mem > 75:
                    score -= 20

            if not cpu_data.empty:
                cpu_std = cpu_data['value'].std()
                if cpu_std > 20:
                    score -= 10
                    issues.append("Unstable CPU Performance")

            score = max(0.0, score)

            status = 'Healthy'
            if score < 60:
                status = 'Critical'
            elif score < 80:
                status = 'Warning'

            scores.append(ServerHealthScore(
                server_id=server_id,
                score=round(score, 1),
                status=status,
                primary_issue=issues[0] if issues else None
            ))

        return scores

    def _cluster_servers(self, df: pd.DataFrame) -> Dict[str, List[str]]:
        """Group servers by behavior using K-Means Clustering"""
        features = df.pivot_table(index='server_id', columns='metric_type', values='value', aggfunc='mean')
        features = features.fillna(0)

        if len(features) < 3:
            return {"default": features.index.tolist()}

        try:
            scaled_features = self.scaler.fit_transform(features)
            n_clusters = min(3, len(features))
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            labels = kmeans.fit_predict(scaled_features)

            clusters = {}
            for server_id, label in zip(features.index, labels):
                label_str = f"Cluster_{label}"
                if label_str not in clusters:
                    clusters[label_str] = []
                clusters[label_str].append(server_id)

            return clusters
        except Exception:
            return {"default": features.index.tolist()}

    async def _find_patterns(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Find patterns using Pandas aggregations"""
        patterns = []

        if df.empty:
            return patterns

        df['hour'] = df['timestamp'].dt.hour
        hourly_avg = df.groupby('hour')['value'].mean()
        peak_hour = hourly_avg.idxmax()

        patterns.append({
            'type': 'peak_hour',
            'description': f'Peak usage typically occurs at {peak_hour}:00',
            'confidence': 0.8,
            'details': {'peak_hour': int(peak_hour), 'avg_value': float(hourly_avg[peak_hour])}
        })

        return patterns

    def _generate_recommendations(self,
                                anomalies: List[AnomalyResult],
                                trend: TrendAnalysis,
                                patterns: List[Dict[str, Any]],
                                health_scores: List[ServerHealthScore]) -> List[str]:
        """Generate recommendations"""
        recommendations = []

        critical_servers = [s for s in health_scores if s.status == 'Critical']
        if critical_servers:
            server_names = ", ".join([s.server_id for s in critical_servers])
            recommendations.append(f"🚨 Critical Health Alert: Servers {server_names} require immediate attention.")

        if trend.forecast_model == 'Holt-Winters':
            if trend.direction == 'increasing':
                recommendations.append(f"📈 Advanced forecasting predicts load increase to {trend.prediction_24h:.1f} in 24h.")

        if anomalies:
            recommendations.append(f"⚠️ Detected {len(anomalies)} anomalies in metric patterns.")

        return recommendations[:5]
