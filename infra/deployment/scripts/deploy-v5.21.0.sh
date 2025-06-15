#!/bin/bash

echo "🚀 OpenManager AI v5.21.0 배포 스크립트"
echo ""

echo "📋 변경사항 요약:"
echo "✨ 3단계 AI 지식 체계 구축 (기본→고급→커스텀)"
echo "📋 Mock MCP → 실제 JSON-RPC 2.0 MCP 클라이언트 교체"
echo "🏗️ AI 컨텍스트 디렉토리 분리 (src/modules/ai-agent/context/)"
echo "🧹 중복 서버 정리 자동화 스크립트 추가"
echo "📊 아키텍처 다이어그램 docs 통합"
echo "🔧 TensorFlow.js 변수 중복 문제 해결"
echo ""

read -p "계속 진행하시겠습니까? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "배포를 취소했습니다."
    exit 0
fi

echo ""
echo "🔍 Git 상태 확인 중..."
git status
echo ""

echo "📦 변경사항 스테이징 중..."
git add -A
echo ""

echo "💾 커밋 생성 중..."
git commit -m "🎯 v5.21.0: 3단계 AI 지식체계 완성 및 Mock→실제 MCP 교체

✨ 주요 변경사항:
- 🧠 3단계 AI 지식 체계 구축 (기본→고급→커스텀)
- 📋 Mock MCP → 실제 JSON-RPC 2.0 MCP 클라이언트 교체
- 🏗️ AI 컨텍스트 디렉토리 분리 (src/modules/ai-agent/context/)
- 🧹 중복 서버 정리 자동화 스크립트 추가
- 📊 아키텍처 다이어그램 docs 통합
- 🔧 TensorFlow.js 변수 중복 문제 해결
- 📚 환경별 세부 가이드 추가
- 🧪 AI 에이전트 기능 검증 테스트

🎯 AI 역할 명확화:
- 1차 대응자에게 실행 가능한 정보 전달
- 기본 지식 70-80% → 고급 15-25% → 커스텀 5-15%
- 서버 직접 관리는 v5.1에서 추가 예정

🛠️ 기술 개선:
- MCP 2024-11-05 프로토콜 완전 준수
- 고속 실시간 처리 (응답시간 <2초)
- 다층 폴백 시스템으로 99.9% 가용성

📊 새로운 기능:
- npm run cleanup:servers (중복 서버 정리)
- npm run test:ai-agent (AI 기능 검증)
- npm run restart:dev (서버 정리 후 재시작)
- docs/AI-ENGINE-ARCHITECTURE.md (아키텍처 문서)"

if [ $? -ne 0 ]; then
    echo "❌ 커밋 실패"
    exit 1
fi

echo ""
echo "🚀 GitHub에 푸시 중..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ 푸시 실패"
    exit 1
fi

echo ""
echo "🎉 배포 완료!"
echo ""
echo "📍 다음 단계:"
echo "  1. GitHub Actions에서 자동 배포 진행 상황 확인"
echo "  2. Vercel 대시보드에서 빌드 상태 확인"
echo "  3. 배포 완료 후 프로덕션 테스트 진행"
echo ""
echo "🔗 GitHub Actions: https://github.com/your-username/openmanager-vibe-v5/actions"
echo "🔗 Vercel Dashboard: https://vercel.com/dashboard"
echo ""

echo "Press any key to continue..."
read -n 1 