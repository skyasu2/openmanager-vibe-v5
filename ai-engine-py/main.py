from fastapi import FastAPI, Request

app = FastAPI()

@app.post("/analyze")
async def analyze(request: Request):
    data = await request.json()
    return {
        "summary": "CPU 부하 증가로 인한 응답 지연 가능성",
        "confidence": 0.92,
        "recommendations": ["nginx 상태 확인", "DB 커넥션 수 점검"]
    }
