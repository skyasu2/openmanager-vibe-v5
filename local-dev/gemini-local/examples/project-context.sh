#!/bin/bash

# Gemini CLI 프로젝트 컨텍스트 설정 스크립트
# 사용법: bash development/gemini-local/examples/project-context.sh

echo "🚀 OpenManager VIBE v5 프로젝트 컨텍스트 설정 중..."

# 기본 프로젝트 정보
gemini /memory add "프로젝트: OpenManager VIBE v5 - AI 기반 서버 모니터링 플랫폼"
gemini /memory add "기술 스택: Next.js 15, TypeScript, Tailwind CSS, Supabase"
gemini /memory add "배포: Vercel 무료 티어 (메모리 512MB, 실행시간 10초 제한)"

# 현재 작업 상황
gemini /memory add "현재 작업: Vercel 무료 티어 최적화 및 로그인 리다이렉션 문제 해결"
gemini /memory add "인증: Supabase Auth + Google OAuth 사용"
gemini /memory add "주요 경로: src/app (App Router), src/services (비즈니스 로직)"

# AI 시스템 구조
gemini /memory add "AI 엔진: UnifiedAIEngineRouter, Google AI, Supabase RAG, Korean NLP"
gemini /memory add "Edge Runtime 사용으로 성능 최적화"

# 개발 가이드
gemini /memory add "타임존: 한국 시간(KST) 사용 필수"
gemini /memory add "코드 스타일: TypeScript strict mode, ESLint 적용"
gemini /memory add "테스트: Vitest(단위), Playwright(E2E)"

echo "✅ 프로젝트 컨텍스트 설정 완료!"
echo ""
echo "📊 사용량 확인:"
gemini /stats
echo ""
echo "💡 다음 명령어로 작업 시작:"
echo "   cat src/app/page.tsx | gemini -p \"분석 요청\""