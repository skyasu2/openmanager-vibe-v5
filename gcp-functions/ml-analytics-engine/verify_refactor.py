
import asyncio
import json
import numpy as np
from main import MLAnalyticsEngine
from datetime import datetime, timedelta

async def verify_engine():
    print("🚀 Starting Verification of Lightweight ML Engine...")
    
    # 1. Generate Sample Data
    print("Generating sample data...")
    now = datetime.now()
    metrics = []
    
    # Generate 50 points of CPU data
    for i in range(50):
        ts = now - timedelta(hours=50-i)
        val = 40 + np.random.normal(0, 5) # Normal
        if i == 45: val = 95 # Anomaly
        
        metrics.append({
            'timestamp': ts.isoformat(),
            'value': val,
            'metric_type': 'cpu',
            'server_id': 'server-01'
        })
        
    # Generate Memory data for another server
    for i in range(50):
        ts = now - timedelta(hours=50-i)
        val = 60 + np.sin(i/5) * 10
        metrics.append({
            'timestamp': ts.isoformat(),
            'value': val,
            'metric_type': 'memory',
            'server_id': 'server-02'
        })

    # 2. Initialize Engine
    engine = MLAnalyticsEngine()
    
    # 3. Run Analysis
    print("Running analysis...")
    start_t = datetime.now()
    result = await engine.analyze_metrics(metrics)
    end_t = datetime.now()
    
    duration = (end_t - start_t).total_seconds() * 1000
    print(f"✅ Analysis complete in {duration:.2f}ms")
    
    # 4. Check Results
    print("\n--- Results ---")
    print(f"Anomalies Detected: {len(result.anomalies)}")
    for a in result.anomalies:
        print(f"  - [{a.severity}] {a.value:.1f} at {a.timestamp}")
        
    print(f"\nTrend: {result.trend.direction} (Model: {result.trend.forecast_model})")
    print(f"Prediction 24h: {result.trend.prediction_24h:.1f}")
    
    print(f"\nHealth Scores:")
    for h in result.health_scores:
        print(f"  - {h.server_id}: {h.score} ({h.status})")
        
    print(f"\nClusters: {result.clusters}")
    
    # 5. Assertions
    if len(result.anomalies) > 0: print("✅ Anomaly detection working")
    else: print("❌ Anomaly detection might be too strict or failed")
    
    if result.trend.forecast_model == 'Linear (NumPy)': print("✅ Trend model confirmed")
    else: print("❌ Wrong trend model")
    
    print("\n Verification Complete!")

if __name__ == "__main__":
    asyncio.run(verify_engine())
