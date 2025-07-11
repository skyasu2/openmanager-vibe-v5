#!/bin/bash
# Claude Monitor 간단 출력 스크립트

echo "🎯 Claude Monitor - 토큰 사용량 확인 중..."
echo "============================================"

# ccusage 직접 실행하여 JSON 파싱
usage_data=$(ccusage)

# 현재 블록의 토큰 정보 추출
total_tokens=$(echo "$usage_data" | jq -r '.blocks[] | select(.isActive == true) | .totalTokens')
burn_rate=$(echo "$usage_data" | jq -r '.blocks[] | select(.isActive == true) | .burnRate.tokensPerMinute // 0')
end_time=$(echo "$usage_data" | jq -r '.blocks[] | select(.isActive == true) | .endTime')

# 시간 계산
current_time=$(date +%s)
end_timestamp=$(date -d "$end_time" +%s 2>/dev/null || echo $current_time)
time_remaining=$((($end_timestamp - $current_time) / 60))

echo ""
echo "📊 토큰 사용량: $total_tokens / ~880,000"
echo "🔥 Burn Rate: $(printf "%.1f" $burn_rate) tokens/min"
echo "⏰ 리셋까지: ${time_remaining}분"
echo ""
echo "자세한 정보: npm run cm (Windows Terminal 권장)"