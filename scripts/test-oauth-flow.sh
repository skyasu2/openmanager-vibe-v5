#!/bin/bash

# GitHub OAuth 로그인 플로우 테스트 스크립트
# 작성일: 2025-08-03

echo "🔐 OpenManager VIBE v5 OAuth 테스트 시작..."
echo "================================================"

BASE_URL="https://openmanager-vibe-v5.vercel.app"

# 1. 헬스체크
echo -e "\n1️⃣ 서버 헬스체크..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health")
echo "응답: $HEALTH_RESPONSE"

# 2. 메인 페이지 접속 (리다이렉트 확인)
echo -e "\n2️⃣ 메인 페이지 접속 테스트..."
MAIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL/")
echo "HTTP 상태 코드: $MAIN_RESPONSE"

# 3. 로그인 페이지 확인
echo -e "\n3️⃣ 로그인 페이지 접근성 확인..."
LOGIN_HEADERS=$(curl -s -I "$BASE_URL/login")
echo "로그인 페이지 헤더:"
echo "$LOGIN_HEADERS" | grep -E "HTTP|Set-Cookie|Location" | head -5

# 4. 쿠키 처리 테스트
echo -e "\n4️⃣ 쿠키 설정 테스트..."
COOKIE_TEST=$(curl -s -c cookies.txt -b cookies.txt "$BASE_URL/login")
if [ -f cookies.txt ]; then
    echo "쿠키 파일 생성됨:"
    cat cookies.txt | grep -E "vercel|sb-|auth" | head -5
    rm -f cookies.txt
fi

# 5. OAuth 엔드포인트 체크
echo -e "\n5️⃣ OAuth 관련 엔드포인트 상태..."
endpoints=(
    "/api/auth/test"
    "/auth/callback"
    "/auth/success"
    "/auth/error"
)

for endpoint in "${endpoints[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    echo "$endpoint: HTTP $status"
done

# 6. 리다이렉트 체인 분석
echo -e "\n6️⃣ 리다이렉트 체인 분석..."
echo "/ → /login 리다이렉트:"
curl -s -I -L --max-redirs 3 "$BASE_URL/" 2>&1 | grep -E "HTTP|Location" | head -10

# 7. HTTPS 및 보안 헤더 확인
echo -e "\n7️⃣ HTTPS 및 보안 헤더 확인..."
SECURITY_HEADERS=$(curl -s -I "$BASE_URL/")
echo "보안 관련 헤더:"
echo "$SECURITY_HEADERS" | grep -E "Strict-Transport-Security|X-Content-Type|X-Frame-Options" | head -5

# 8. 결과 요약
echo -e "\n📊 테스트 결과 요약"
echo "================================================"
echo "✅ 서버 상태: $(echo $HEALTH_RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
echo "✅ HTTPS 연결: $(echo $SECURITY_HEADERS | grep -q "HTTP/2" && echo "Yes" || echo "No")"
echo "✅ 로그인 리다이렉트: $([ "$MAIN_RESPONSE" = "200" ] && echo "작동 중" || echo "확인 필요")"
echo "================================================"

echo -e "\n💡 팁: 실제 OAuth 로그인 테스트는 브라우저에서 진행하세요."
echo "   URL: $BASE_URL"
echo "   가이드: docs/oauth-test-guide.md 참조"