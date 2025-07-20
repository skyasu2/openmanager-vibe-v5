#!/bin/bash

# 🏃 GCP Functions 성능 벤치마크 스크립트
# JavaScript (Vercel) vs Python (GCP Functions) 성능 비교

echo "🏃 GCP Functions 성능 벤치마크 시작..."
echo "=================================================="
echo ""

# 테스트 설정
ITERATIONS=10
KOREAN_NLP_URL="https://us-central1-openmanager-free-tier.cloudfunctions.net/enhanced-korean-nlp"
UNIFIED_AI_URL="https://us-central1-openmanager-free-tier.cloudfunctions.net/unified-ai-processor"
ML_ANALYTICS_URL="https://us-central1-openmanager-free-tier.cloudfunctions.net/ml-analytics-engine"

# 결과 저장 디렉토리
RESULTS_DIR="benchmark-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p $RESULTS_DIR

echo "📊 테스트 설정:"
echo "  반복 횟수: $ITERATIONS"
echo "  결과 저장: $RESULTS_DIR"
echo ""

# 1. Korean NLP 벤치마크
echo "🇰🇷 1. Enhanced Korean NLP 벤치마크"
echo "--------------------------------"

total_time=0
for i in $(seq 1 $ITERATIONS); do
    echo -n "  테스트 $i/$ITERATIONS: "
    
    start=$(date +%s%N)
    response=$(curl -s -w "\n%{time_total}" -X POST $KOREAN_NLP_URL \
        -H "Content-Type: application/json" \
        -d '{"query": "웹서버 CPU 사용률이 90%를 넘었습니다. 메모리는 정상입니다."}')
    
    # 응답 시간 추출 (초 단위)
    response_time=$(echo "$response" | tail -n 1)
    response_ms=$(echo "$response_time * 1000" | bc)
    
    echo "${response_ms}ms"
    total_time=$(echo "$total_time + $response_ms" | bc)
    
    # 응답 저장
    echo "$response" | head -n -1 > "$RESULTS_DIR/korean-nlp-$i.json"
done

avg_time=$(echo "scale=2; $total_time / $ITERATIONS" | bc)
echo "  평균 응답 시간: ${avg_time}ms"
echo ""

# 2. Unified AI Processor 벤치마크
echo "🤖 2. Unified AI Processor 벤치마크"
echo "--------------------------------"

total_time=0
for i in $(seq 1 $ITERATIONS); do
    echo -n "  테스트 $i/$ITERATIONS: "
    
    response=$(curl -s -w "\n%{time_total}" -X POST $UNIFIED_AI_URL \
        -H "Content-Type: application/json" \
        -d '{
            "query": "서버 성능 분석",
            "processors": ["korean_nlp"],
            "context": {}
        }')
    
    response_time=$(echo "$response" | tail -n 1)
    response_ms=$(echo "$response_time * 1000" | bc)
    
    echo "${response_ms}ms"
    total_time=$(echo "$total_time + $response_ms" | bc)
    
    echo "$response" | head -n -1 > "$RESULTS_DIR/unified-ai-$i.json"
done

avg_time=$(echo "scale=2; $total_time / $ITERATIONS" | bc)
echo "  평균 응답 시간: ${avg_time}ms"
echo ""

# 3. ML Analytics Engine 벤치마크
echo "🧠 3. ML Analytics Engine 벤치마크"
echo "--------------------------------"

# 테스트 데이터 생성
test_metrics='{"metrics": ['
for j in $(seq 1 50); do
    timestamp=$(date -d "-$j hours" --iso-8601=seconds)
    value=$(echo "50 + $RANDOM % 40" | bc)
    test_metrics="$test_metrics{\"timestamp\": \"$timestamp\", \"value\": $value, \"server_id\": \"test-001\", \"metric_type\": \"cpu\"}"
    if [ $j -lt 50 ]; then
        test_metrics="$test_metrics,"
    fi
done
test_metrics="$test_metrics]}"

total_time=0
for i in $(seq 1 $ITERATIONS); do
    echo -n "  테스트 $i/$ITERATIONS: "
    
    response=$(curl -s -w "\n%{time_total}" -X POST $ML_ANALYTICS_URL \
        -H "Content-Type: application/json" \
        -d "$test_metrics")
    
    response_time=$(echo "$response" | tail -n 1)
    response_ms=$(echo "$response_time * 1000" | bc)
    
    echo "${response_ms}ms"
    total_time=$(echo "$total_time + $response_ms" | bc)
    
    echo "$response" | head -n -1 > "$RESULTS_DIR/ml-analytics-$i.json"
done

avg_time=$(echo "scale=2; $total_time / $ITERATIONS" | bc)
echo "  평균 응답 시간: ${avg_time}ms"
echo ""

# 결과 요약
echo "📈 벤치마크 결과 요약"
echo "=================================================="
echo ""

# 기존 JavaScript 성능 (참고용)
echo "🔸 JavaScript (Vercel Edge) 기준 성능:"
echo "  - Korean NLP: ~500-1000ms"
echo "  - Unified AI: ~1500-2000ms"
echo "  - ML Analytics: ~800-1200ms"
echo ""

echo "🔸 Python (GCP Functions) 실측 성능:"
echo "  - 위 테스트 결과 참조"
echo ""

# 처리 시간 분석
echo "🔸 처리 시간 분석:"
first_response=$(cat "$RESULTS_DIR/korean-nlp-1.json" | grep -o '"processing_time_ms":[0-9.]*' | cut -d: -f2)
if [ -n "$first_response" ]; then
    echo "  - 실제 처리 시간 (Korean NLP): ${first_response}ms"
fi

echo ""
echo "✅ 벤치마크 완료!"
echo "📁 상세 결과: $RESULTS_DIR/"