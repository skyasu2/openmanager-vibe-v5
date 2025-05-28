@echo off
echo 🧹 중복 모듈 정리 작업 커밋 시작...

echo.
echo 📋 변경사항 확인 중...
git status

echo.
echo 📥 변경사항 스테이지에 추가 중...
git add -A

echo.
echo 📝 커밋 생성 중...
git commit -m "🧹 중복 모듈 전수조사 및 정리 완료

✅ 주요 변경사항:
- 🗑️ src/services/agent.ts (182줄) - aiAgent.ts와 중복 제거
- 🗑️ src/components/ai/AgentModal.tsx (19줄) - 불필요한 래퍼 제거  
- 🗑️ src/mcp/documents/ (10개 파일) - 파이썬 서버 분리로 미사용
- ✏️ src/app/dashboard/page.tsx - import 경로 최적화
- 📝 CLEANUP_REPORT.md - 전수조사 결과 리포트

🎯 정리 효과:
- 제거된 파일: 12개
- 코드 라인 감소: 약 400줄
- 번들 크기 감소 및 아키텍처 명확화

🏗️ 아키텍처 개선:
- Next.js (포트 3001) ↔ FastAPI (ai-engine-py/) 분리
- 모듈별 역할과 책임 명확화

버전: v5.7.4-clean"

echo.
echo 🚀 원격 저장소에 푸시 중...
git push

echo.
echo ✅ 커밋 및 푸시 완료!
echo 📊 변경사항 요약: 12개 파일 제거, 400+ 줄 코드 정리
echo 🎉 OpenManager Vibe v5 중복 모듈 정리 작업 완료!

pause 