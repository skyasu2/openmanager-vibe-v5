from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from predictor import predictor

app = FastAPI(title="AI Analysis Engine", version="1.0.0")

class AnalysisRequest(BaseModel):
    query: Optional[str] = None
    metrics: Optional[List[Dict[str, Any]]] = None
    data: Optional[Dict[str, Any]] = None

@app.get("/")
async def root():
    return {
        "service": "AI Analysis Engine",
        "version": "1.0.0",
        "status": "운영 중",
        "endpoints": ["/analyze", "/health"],
        "features": [
            "CPU/메모리/디스크 메트릭 분석",
            "쿼리 기반 시스템 진단",
            "실시간 성능 모니터링",
            "한국어 분석 결과 제공"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "message": "AI 엔진이 정상 동작 중입니다",
        "predictor_status": "활성화됨",
        "supported_analysis": [
            "cpu_performance",
            "memory_optimization", 
            "disk_performance",
            "network_analysis"
        ]
    }

@app.post("/analyze")
async def analyze(request: AnalysisRequest):
    try:
        # predictor를 사용하여 분석 수행
        analysis_result = predictor.analyze_metrics(
            query=request.query,
            metrics=request.metrics,
            data=request.data
        )
        
        return analysis_result
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"분석 중 오류 발생: {str(e)}"
        )
