"""
ML Analytics Engine (Cloud Run / Cloud Functions Compatible) - Lightweight Edition
Features:
- Pure NumPy Implementation (No Pandas/Scikit-learn)
- Fast Cold Start (< 0.5s)
- Low Memory Footprint (< 150MB)
- Z-Score Anomaly Detection
- Linear Trend Forecasting
- Simple K-Means Clustering

Version: 4.0.0 (Numpy Pure Optimization)
"""

import os
import time
import asyncio
import numpy as np
import orjson
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from flask import Flask, request, jsonify
import structlog
import warnings

# Suppress warnings
warnings.filterwarnings('ignore')

# Configure logging
logger = structlog.get_logger()

# Flask app
app = Flask(__name__)

# --- Data Structures ---

@dataclass
class AnomalyResult:
    is_anomaly: bool
    severity: str  # 'low', 'medium', 'high'
    confidence: float
    timestamp: str
    value: float
    expected_range: Tuple[float, float]

@dataclass
class TrendAnalysis:
    direction: str  # 'increasing', 'decreasing', 'stable'
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

# --- Utilities (NumPy based) ---

def parse_iso8601(date_string: str) -> float:
    """Convert ISO8601 string to timestamp (float) efficiently"""
    try:
        # Fast path for common format "YYYY-MM-DDTHH:MM:SS.mmmmmm"
        return datetime.fromisoformat(date_string.replace('Z', '+00:00')).timestamp()
    except:
        return time.time() # Fallback

# --- Lightweight Algorithms ---

class SimpleKMeans:
    """Lightweight 1D K-Means for clustering servers based on normalized metrics"""
    def __init__(self, n_clusters=3):
        self.n_clusters = n_clusters
        self.centroids = None

    def fit_predict(self, X: np.ndarray) -> np.ndarray:
        """
        X: shape (n_samples, n_features)
        Returns: labels array of shape (n_samples,)
        """
        n_samples = X.shape[0]
        if n_samples < self.n_clusters:
            return np.zeros(n_samples, dtype=int)

        # Simple random initialization
        # Use first k points as centroids for deterministic behavior in this simplified version
        self.centroids = X[:self.n_clusters].copy()
        
        for _ in range(10): # Fixed 10 iterations is enough for heuristics
            # Calculate all distances: (n_samples, n_clusters)
            # Dist = sqrt(sum((X - center)^2))
            distances = np.sqrt(((X[:, np.newaxis, :] - self.centroids[np.newaxis, :, :]) ** 2).sum(axis=2))
            
            # Assign clusters
            labels = np.argmin(distances, axis=1)
            
            # Update centroids
            new_centroids = np.array([X[labels == k].mean(axis=0) if np.sum(labels == k) > 0 else self.centroids[k] 
                                    for k in range(self.n_clusters)])
            
            if np.allclose(self.centroids, new_centroids):
                break
                
            self.centroids = new_centroids
            
        return labels

class MLAnalyticsEngine:
    """High-performance Lightweight ML analytics"""
    
    def __init__(self):
        pass
        
    async def analyze_metrics(self, metrics: List[Dict[str, Any]], context: Optional[Dict] = None) -> MLAnalysisResult:
        start_time = time.time()
        
        if not metrics:
            return self._create_empty_result(start_time)

        # 1. Data Parsing (To NumPy)
        # Structure: {'cpu': {'timestamps': [], 'values': [], 'server_ids': []}, ...}
        parsed_data = self._parse_to_numpy(metrics)
        
        if not parsed_data:
             return self._create_empty_result(start_time)

        # 2. Trend Analysis (Linear Regression on Aggregated Data)
        trend = self._analyze_trend(parsed_data)
        
        # 3. Anomaly Detection (Z-Score)
        anomalies = self._detect_anomalies(parsed_data)
        
        # 4. Health Scoring
        health_scores = self._calculate_health_scores(parsed_data)
        
        # 5. Clustering
        clusters = self._cluster_servers(parsed_data)
        
        # 6. Patterns & Recommendations
        patterns = self._find_patterns(parsed_data)
        recommendations = self._generate_recommendations(anomalies, trend, health_scores)
        
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
    
    def _parse_to_numpy(self, metrics: List[Dict[str, Any]]) -> Dict[str, Dict]:
        """Group metrics by type and convert to numpy arrays"""
        grouped = {}
        for m in metrics:
            m_type = m.get('metric_type', 'unknown')
            if m_type not in grouped:
                grouped[m_type] = {'timestamps': [], 'values': [], 'server_ids': [], 'raw_dates': []}
            
            try:
                val = float(m.get('value', 0))
                ts_str = m.get('timestamp', '')
                ts = parse_iso8601(ts_str)
                sid = m.get('server_id', 'unknown')
                
                grouped[m_type]['values'].append(val)
                grouped[m_type]['timestamps'].append(ts)
                grouped[m_type]['server_ids'].append(sid)
                grouped[m_type]['raw_dates'].append(ts_str)
            except:
                continue
                
        # Convert lists to NumPy arrays
        result = {}
        for k, v in grouped.items():
            if v['values']:
                result[k] = {
                    'values': np.array(v['values'], dtype=np.float32),
                    'timestamps': np.array(v['timestamps'], dtype=np.float64),
                    'server_ids': np.array(v['server_ids']),
                    'raw_dates': np.array(v['raw_dates'])
                }
        return result

    def _create_empty_result(self, start_time: float) -> MLAnalysisResult:
        return MLAnalysisResult([], TrendAnalysis('stable', 0, 0, 0, False, 'None'), [], 
                              ["데이터가 부족합니다."], [], {}, (time.time() - start_time) * 1000)

    def _detect_anomalies(self, data: Dict[str, Dict]) -> List[AnomalyResult]:
        """Z-Score Anomaly Detection using NumPy"""
        anomalies = []
        
        for m_type, d in data.items():
            values = d['values']
            if len(values) < 5: continue
            
            mean = np.mean(values)
            std = np.std(values)
            
            if std == 0: continue
            
            z_scores = (values - mean) / std
            outlier_indices = np.where(np.abs(z_scores) > 3)[0]
            
            for idx in outlier_indices:
                score = abs(z_scores[idx])
                severity = 'high' if score > 5 else 'medium'
                anomalies.append(AnomalyResult(
                    is_anomaly=True,
                    severity=severity,
                    confidence=0.9,
                    timestamp=d['raw_dates'][idx],
                    value=float(values[idx]),
                    expected_range=(float(mean - 3*std), float(mean + 3*std))
                ))
        return anomalies

    def _analyze_trend(self, data: Dict[str, Dict]) -> TrendAnalysis:
        """Linear Regression for Trend Analysis"""
        # Aggregate all values by timestamp to find global trend (simplified)
        # Just pick the most common metric type usually 'cpu'
        target_metric = 'cpu' if 'cpu' in data else list(data.keys())[0]
        
        d = data[target_metric]
        values = d['values']
        timestamps = d['timestamps']
        
        if len(values) < 2:
            return TrendAnalysis('stable', 0, 0, 0, False, 'Insufficient Data')

        # Sort by timestamp
        sorted_indices = np.argsort(timestamps)
        sorted_y = values[sorted_indices]
        sorted_x = timestamps[sorted_indices]
        
        # Normalize Time (0 to N) to avoid huge numbers
        x_norm = sorted_x - sorted_x[0]
        
        # Simple Linear Regression: y = mx + c
        # m = (N*sum(xy) - sum(x)*sum(y)) / (N*sum(x^2) - (sum(x))^2)
        N = len(values)
        sum_x = np.sum(x_norm)
        sum_y = np.sum(sorted_y)
        sum_xy = np.sum(x_norm * sorted_y)
        sum_xx = np.sum(x_norm * x_norm)
        
        denominator = (N * sum_xx - sum_x * sum_x)
        if denominator == 0:
            slope = 0
        else:
            slope = (N * sum_xy - sum_x * sum_y) / denominator

        # Calculate logical slope (change per hour)
        # x_norm is in seconds. Slope is change per second.
        hourly_slope = slope * 3600
        
        direction = 'stable'
        if hourly_slope > 0.5: direction = 'increasing'
        elif hourly_slope < -0.5: direction = 'decreasing'
        
        last_val = sorted_y[-1]
        prediction_24h = last_val + (slope * 3600 * 24)
        rate = (prediction_24h - last_val) / last_val if last_val != 0 else 0
        
        return TrendAnalysis(
            direction=direction,
            rate_of_change=float(rate),
            prediction_24h=float(prediction_24h),
            confidence=0.7,
            seasonality_detected=False,
            forecast_model='Linear (NumPy)'
        )

    def _calculate_health_scores(self, data: Dict[str, Dict]) -> List[ServerHealthScore]:
        scores_map = {} # server_id -> {score, issues}
        
        # Collect all server IDs
        all_servers = set()
        for d in data.values():
            all_servers.update(d['server_ids'])
            
        for sid in all_servers:
            scores_map[sid] = {'score': 100.0, 'issues': []}
            
        # Analysis per metric type
        # CPU
        if 'cpu' in data:
            d = data['cpu']
            for i, sid in enumerate(d['server_ids']):
                val = d['values'][i]
                if val > 80:
                    scores_map[sid]['score'] -= 10 # Cumulative penalty? 
                    # Simpler: Average CPU per server first
                    
        # Improved: Aggregate per server first
        # Extract features per server
        server_features = {} # sid -> {'cpu': [], 'memory': []}
        
        for m_type, d in data.items():
            for i, sid in enumerate(d['server_ids']):
                if sid not in server_features: server_features[sid] = {}
                if m_type not in server_features[sid]: server_features[sid][m_type] = []
                server_features[sid][m_type].append(d['values'][i])
                
        results = []
        for sid, feats in server_features.items():
            score = 100.0
            issues = []
            
            # Avg CPU
            if 'cpu' in feats:
                avg_cpu = np.mean(feats['cpu'])
                if avg_cpu > 80:
                    score -= 30
                    issues.append("High CPU Load")
                elif avg_cpu > 60:
                    score -= 10
                    
            # Avg Memory
            if 'memory' in feats:
                avg_mem = np.mean(feats['memory'])
                if avg_mem > 90:
                    score -= 40
                    issues.append("Critical Memory")
                elif avg_mem > 75:
                    score -= 20
            
            score = max(0.0, score)
            status = 'Healthy'
            if score < 60: status = 'Critical'
            elif score < 80: status = 'Warning'
            
            results.append(ServerHealthScore(sid, round(score, 1), status, issues[0] if issues else None))
            
        return results

    def _cluster_servers(self, data: Dict[str, Dict]) -> Dict[str, List[str]]:
        """Group servers using Simple K-Means on normalized CPU/Memory"""
        # Prepare feature matrix: N servers x 2 features (CPU, Memory)
        server_stats = {} # sid -> [avg_cpu, avg_mem]
        
        all_sids = set()
        for d in data.values(): all_sids.update(d['server_ids'])
        
        server_list = list(all_sids)
        if len(server_list) < 3: return {"default": server_list}
        
        # Build Matrix
        X = np.zeros((len(server_list), 2)) # Assume 2 features
        
        for idx, sid in enumerate(server_list):
            cpu_val = 0
            mem_val = 0
            
            if 'cpu' in data:
                # Find indices for this server
                mask = data['cpu']['server_ids'] == sid
                if np.any(mask): cpu_val = np.mean(data['cpu']['values'][mask])
                
            if 'memory' in data:
                mask = data['memory']['server_ids'] == sid
                if np.any(mask): mem_val = np.mean(data['memory']['values'][mask])
                
            X[idx] = [cpu_val, mem_val]
            
        # Normalize (Min-Max manually or just Z-score)
        # Simple Max devision for normalization (0-100 scale assumed)
        X_norm = X / 100.0
        
        kmeans = SimpleKMeans(n_clusters=min(3, len(server_list)))
        labels = kmeans.fit_predict(X_norm)
        
        clusters = {}
        for i, label in enumerate(labels):
            l_str = f"Cluster_{label}"
            if l_str not in clusters: clusters[l_str] = []
            clusters[l_str].append(server_list[i])
            
        return clusters

    def _find_patterns(self, data: Dict[str, Dict]) -> List[Dict[str, Any]]:
        patterns = []
        # Peak Hour Analysis (Manual without Pandas dt accessor)
        # Need to parse timestamps to hours
        if 'cpu' in data:
            timestamps = data['cpu']['timestamps']
            values = data['cpu']['values']
            if len(values) == 0: return patterns
            
            # Convert timestamps to hours (UTC)
            hours = np.array([datetime.fromtimestamp(ts).hour for ts in timestamps])
            
            # Sum per hour (0-23)
            hour_counts = np.zeros(24)
            hour_sums = np.zeros(24)
            
            np.add.at(hour_counts, hours, 1)
            np.add.at(hour_sums, hours, values)
            
            # Avg per hour
            with np.errstate(divide='ignore', invalid='ignore'):
                hour_avgs = hour_sums / hour_counts
                hour_avgs = np.nan_to_num(hour_avgs)
                
            peak_hour = np.argmax(hour_avgs)
            if hour_avgs[peak_hour] > 0:
                patterns.append({
                    'type': 'peak_hour',
                    'description': f'Peak usage typically occurs at {peak_hour}:00',
                    'confidence': 0.8,
                    'details': {'peak_hour': int(peak_hour), 'avg_value': float(hour_avgs[peak_hour])}
                })
                
        return patterns

    def _generate_recommendations(self, anomalies, trend, health_scores) -> List[str]:
        recommendations = []
        
        crit = [h for h in health_scores if h.status == 'Critical']
        if crit:
            sids = ", ".join([h.server_id for h in crit])
            recommendations.append(f"🚨 Critical Health Alert: Servers {sids} need attention.")
            
        if trend.direction == 'increasing':
             recommendations.append(f"📈 Trend increasing. Expected load: {trend.prediction_24h:.1f}")
             
        if anomalies:
             recommendations.append(f"⚠️ {len(anomalies)} anomalies detected.")
             
        return recommendations[:5]

# --- Flask Entry Point ---

ml_engine = MLAnalyticsEngine()

@app.route('/', methods=['GET', 'POST', 'OPTIONS'])
@app.route('/analyze', methods=['GET', 'POST', 'OPTIONS'])
def entry_point():
    if request.method == 'OPTIONS':
        return '', 204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
        
    if request.method == 'GET':
        return jsonify({
            'status': 'healthy',
            'service': 'ml-analytics-engine-light',
            'version': '4.0.0',
            'timestamp': datetime.now().isoformat()
        })
        
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
             return jsonify({'error': 'Invalid JSON'}), 400
             
        metrics = data.get('metrics', [])
        context = data.get('context', {})
        
        result = asyncio.run(ml_engine.analyze_metrics(metrics, context))
        
        # Serialize dataclass to dict
        resp_data = asdict(result)
        
        return jsonify({
            'success': True,
            'data': resp_data,
            'service': 'ml-analytics-engine-light',
            'version': '4.0.0',
            'performance': {'processing_time_ms': result.processing_time_ms}
        })

    except Exception as e:
        logger.error("Error", error=str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)