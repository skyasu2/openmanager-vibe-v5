#!/bin/bash

echo "🔥 AI 시스템 웜업 및 온/오프 테스트 시작..."
echo "================================================"

# Python 서비스 URL
PYTHON_URL="https://openmanager-ai-engine.onrender.com"
LOCAL_URL="http://localhost:3000"

echo ""
echo "🔍 1. Python 서비스 상태 확인..."
response=$(curl -s -w "%{http_code}" -o /tmp/python_health "${PYTHON_URL}/health" || echo "000")
if [ "$response" = "200" ]; then
    echo "✅ Python 서비스 활성화됨"
    echo "   응답: $(cat /tmp/python_health | jq -r '.message' 2>/dev/null || cat /tmp/python_health)"
else
    echo "❌ Python 서비스 응답 없음 (HTTP: $response)"
fi

echo ""
echo "🔥 2. Python 서비스 웜업 테스트..."
echo "   콜드 스타트 테스트..."
start_time=$(date +%s%3N)
response=$(curl -s -w "%{http_code}" -o /tmp/python_warmup -X POST "${PYTHON_URL}/analyze" \
    -H "Content-Type: application/json" \
    -d '{"query":"warmup test","metrics":[{"timestamp":"'$(date -Iseconds)'","cpu":50,"memory":60,"disk":70,"networkIn":1000,"networkOut":2000}]}' || echo "000")
end_time=$(date +%s%3N)
cold_time=$((end_time - start_time))

if [ "$response" = "200" ]; then
    echo "✅ 콜드 스타트 완료 (${cold_time}ms)"
    
    echo "   웜 상태 테스트..."
    sleep 1
    start_time=$(date +%s%3N)
    response=$(curl -s -w "%{http_code}" -o /tmp/python_warmup2 -X POST "${PYTHON_URL}/analyze" \
        -H "Content-Type: application/json" \
        -d '{"query":"warmup test 2","metrics":[{"timestamp":"'$(date -Iseconds)'","cpu":55,"memory":65,"disk":75,"networkIn":1200,"networkOut":2200}]}' || echo "000")
    end_time=$(date +%s%3N)
    warm_time=$((end_time - start_time))
    
    if [ "$response" = "200" ]; then
        echo "✅ 웜 상태 완료 (${warm_time}ms)"
        improvement=$(( (cold_time - warm_time) * 100 / cold_time ))
        echo "   성능 개선: ${improvement}%"
    fi
else
    echo "❌ Python 웜업 테스트 실패 (HTTP: $response)"
fi

echo ""
echo "🧠 3. MCP 시스템 상태 확인..."
if command -v npm > /dev/null 2>&1; then
    if [ -f "package.json" ]; then
        echo "   Next.js 개발 서버가 실행 중인지 확인..."
        if curl -s "${LOCAL_URL}/api/health" > /tmp/local_health 2>/dev/null; then
            echo "✅ Next.js 서버 활성화됨"
            echo "   응답: $(cat /tmp/local_health | jq -r '.status' 2>/dev/null || cat /tmp/local_health)"
            
            echo "   MCP API 확인..."
            if curl -s "${LOCAL_URL}/api/ai/mcp?action=status" > /tmp/mcp_status 2>/dev/null; then
                echo "✅ MCP 시스템 활성화됨"
                echo "   상태: $(cat /tmp/mcp_status | jq -r '.status' 2>/dev/null || 'OK')"
            else
                echo "❌ MCP API 응답 없음"
            fi
        else
            echo "❌ Next.js 서버 응답 없음 (개발 서버가 실행되지 않았을 수 있음)"
            echo "   💡 'npm run dev'로 개발 서버를 시작하세요"
        fi
    else
        echo "❌ package.json을 찾을 수 없습니다"
    fi
else
    echo "❌ npm이 설치되지 않았습니다"
fi

echo ""
echo "📁 4. 파일 구조 확인..."
echo "   AI 시스템 파일들:"
if [ -f "src/services/ai/SimplifiedQueryEngine.ts" ]; then
    echo "   ✅ SimplifiedQueryEngine.ts"
else
    echo "   ❌ SimplifiedQueryEngine.ts 없음"
fi

if [ -f "src/services/ai/IntentClassifier.ts" ]; then
    echo "   ✅ IntentClassifier.ts"
else
    echo "   ❌ IntentClassifier.ts 없음"
fi

if [ -f "src/services/ml/MLDataManager.ts" ]; then
    echo "   ✅ MLDataManager.ts"
else
    echo "   ❌ MLDataManager.ts 없음"
fi

if [ -f "src/app/api/ai/mcp/route.ts" ]; then
    echo "   ✅ MCP API route.ts"
else
    echo "   ❌ MCP API route.ts 없음"
fi

if [ -f "src/hooks/useMCPAnalysis.ts" ]; then
    echo "   ✅ useMCPAnalysis.ts"
else
    echo "   ❌ useMCPAnalysis.ts 없음"
fi

echo ""
echo "📦 5. 의존성 확인..."
if [ -f "package.json" ]; then
    echo "   AI 라이브러리 의존성:"
    grep -E "tensorflow|transformers|onnx" package.json | sed 's/^/   /'
else
    echo "   ❌ package.json을 찾을 수 없습니다"
fi

echo ""
echo "🎯 6. Python 서비스 간단 분석 테스트..."
test_response=$(curl -s -X POST "${PYTHON_URL}/analyze" \
    -H "Content-Type: application/json" \
    -d '{
        "query": "서버 CPU 사용률이 높아지고 있어요",
        "metrics": [
            {"timestamp": "'$(date -Iseconds)'", "cpu": 85, "memory": 75, "disk": 60, "networkIn": 2000, "networkOut": 3000}
        ]
    }' 2>/dev/null)

if echo "$test_response" | jq . > /dev/null 2>&1; then
    echo "✅ Python 분석 테스트 성공"
    echo "   분석 결과: $(echo "$test_response" | jq -r '.analysis' 2>/dev/null || echo '분석 완료')"
else
    echo "❌ Python 분석 테스트 실패"
fi

echo ""
echo "================================================"
echo "🎉 AI 시스템 웜업 및 온/오프 테스트 완료!"
echo ""
echo "💡 추가 테스트를 원한다면:"
echo "   - 'npm run dev'로 개발 서버 시작 후 http://localhost:3000 접속"
echo "   - MCP API 테스트: http://localhost:3000/api/ai/mcp?action=status"
echo "   - Python 서비스: ${PYTHON_URL}/health"

# 임시 파일 정리
rm -f /tmp/python_health /tmp/python_warmup /tmp/python_warmup2 /tmp/local_health /tmp/mcp_status 