#!/bin/bash

# OpenManager VIBE v5 - 프로젝트 메트릭 자동 집계 스크립트
# 용도: 코드-설계도 정합성 검증을 위한 실시간 메트릭 수집

set -e

PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
cd "$PROJECT_ROOT"

echo "🔍 OpenManager VIBE v5 프로젝트 메트릭 수집"
echo "==================================================="

# 1. 기본 정보
echo "📊 기본 정보:"
echo "  프로젝트 버전: $(jq -r .version package.json)"
echo "  Node.js 버전: $(node --version)"
echo "  Next.js 버전: $(jq -r '.dependencies["next"]' package.json)"
echo "  TypeScript 버전: $(jq -r '.devDependencies["typescript"]' package.json)"

# 2. 코드베이스 메트릭
echo ""
echo "📁 코드베이스 메트릭:"

# TypeScript 파일 수
TS_FILES=$(find src -name "*.ts" -o -name "*.tsx" | wc -l)
echo "  TypeScript 파일: ${TS_FILES}개"

# 총 코드 라인 수
TOTAL_LINES=$(find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1 | awk '{print $1}')
echo "  총 코드 라인: ${TOTAL_LINES}줄"

# API 엔드포인트 수
API_ROUTES=$(find src/app/api -name "route.ts" | wc -l)
echo "  API 엔드포인트: ${API_ROUTES}개"

# 컴포넌트 수
COMPONENTS=$(find src/components -name "*.tsx" 2>/dev/null | wc -l)
echo "  React 컴포넌트: ${COMPONENTS}개"

# 3. 품질 지표
echo ""
echo "✅ 품질 지표:"

# TypeScript 에러 검사
echo "  TypeScript 검사 중..."
if npx tsc --noEmit > /dev/null 2>&1; then
    echo "  TypeScript 에러: 0개 ✅"
    TS_STATUS="PASS"
else
    TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
    echo "  TypeScript 에러: ${TS_ERRORS}개 ❌"
    TS_STATUS="FAIL"
fi

# 4. 아키텍처 메트릭
echo ""
echo "🏗️ 아키텍처 메트릭:"

# 폴더별 파일 분포
echo "  src/app: $(find src/app -name "*.ts" -o -name "*.tsx" | wc -l)개"
echo "  src/components: $(find src/components -name "*.tsx" 2>/dev/null | wc -l)개"
echo "  src/lib: $(find src/lib -name "*.ts" 2>/dev/null | wc -l)개"
echo "  src/hooks: $(find src/hooks -name "*.ts" 2>/dev/null | wc -l)개"

# 5. 설계도 비교
echo ""
echo "📋 설계도 정합성:"

# 설계도에서 기대하는 값들과 비교
EXPECTED_TS_FILES="880"
EXPECTED_API_ROUTES="76"
EXPECTED_LINES="229000"

echo "  TypeScript 파일: ${TS_FILES}/${EXPECTED_TS_FILES} ($(( (TS_FILES * 100) / EXPECTED_TS_FILES ))%)"
echo "  API 엔드포인트: ${API_ROUTES}/${EXPECTED_API_ROUTES} ($(( (API_ROUTES * 100) / EXPECTED_API_ROUTES ))%)"
echo "  코드 라인 수: ${TOTAL_LINES}/${EXPECTED_LINES} ($(( (TOTAL_LINES * 100) / EXPECTED_LINES ))%)"

# 6. 종합 점수 계산
echo ""
echo "🎯 정합성 점수:"

# 각 지표별 점수 계산 (100점 만점)
TS_FILES_SCORE=$(( (TS_FILES * 100) / EXPECTED_TS_FILES ))
API_SCORE=$(( (API_ROUTES * 100) / EXPECTED_API_ROUTES ))
LINES_SCORE=$(( (TOTAL_LINES * 100) / EXPECTED_LINES ))

# TypeScript 에러 점수
if [ "$TS_STATUS" = "PASS" ]; then
    TS_ERROR_SCORE=100
else
    TS_ERROR_SCORE=0
fi

# 평균 점수
OVERALL_SCORE=$(( (TS_FILES_SCORE + API_SCORE + LINES_SCORE + TS_ERROR_SCORE) / 4 ))

echo "  TypeScript 파일 정합성: ${TS_FILES_SCORE}점"
echo "  API 엔드포인트 정합성: ${API_SCORE}점"  
echo "  코드 라인 정합성: ${LINES_SCORE}점"
echo "  TypeScript 품질: ${TS_ERROR_SCORE}점"
echo ""
echo "🏆 종합 정합성 점수: ${OVERALL_SCORE}/100점"

# 7. JSON 출력 (자동화용)
cat > metrics-report.json << EOF
{
  "timestamp": "$(date -Iseconds)",
  "version": "$(jq -r .version package.json)",
  "metrics": {
    "typescript_files": ${TS_FILES},
    "api_endpoints": ${API_ROUTES},
    "total_lines": ${TOTAL_LINES},
    "components": ${COMPONENTS},
    "typescript_errors": 0,
    "typescript_status": "${TS_STATUS}"
  },
  "expected": {
    "typescript_files": ${EXPECTED_TS_FILES},
    "api_endpoints": ${EXPECTED_API_ROUTES},
    "total_lines": ${EXPECTED_LINES}
  },
  "scores": {
    "typescript_files": ${TS_FILES_SCORE},
    "api_endpoints": ${API_SCORE},
    "code_lines": ${LINES_SCORE},
    "typescript_quality": ${TS_ERROR_SCORE},
    "overall": ${OVERALL_SCORE}
  }
}
EOF

echo ""
echo "📄 상세 리포트: $(pwd)/metrics-report.json"
echo "==================================================="