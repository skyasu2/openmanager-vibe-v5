# WSL AI CLI 도구들 설치 상태 요약

Write-Host "🤖 WSL AI CLI 도구들 설치 상태 요약" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan

# 1. 설치된 도구들 상태
Write-Host "`n📦 설치된 AI CLI 도구들:" -ForegroundColor Yellow

Write-Host "`n🤖 Claude Code:" -ForegroundColor Cyan
Write-Host "  ✅ 버전: 1.0.81" -ForegroundColor Green
Write-Host "  📍 실행: .\claude-wsl.bat" -ForegroundColor White
Write-Host "  🎯 기능: AI 코딩 어시스턴트, 대화형 모드" -ForegroundColor Gray

Write-Host "`n🔮 Google Gemini CLI:" -ForegroundColor Cyan
Write-Host "  ✅ 버전: 0.1.21" -ForegroundColor Green
Write-Host "  📍 실행: .\gemini-wsl.bat" -ForegroundColor White
Write-Host "  🎯 기능: Google Gemini AI, MCP 서버 관리" -ForegroundColor Gray

Write-Host "`n🧠 OpenAI CLI:" -ForegroundColor Cyan
Write-Host "  ✅ 설치됨 (migrate 명령어 지원)" -ForegroundColor Green
Write-Host "  📍 실행: .\openai-wsl.bat" -ForegroundColor White
Write-Host "  🎯 기능: OpenAI SDK 마이그레이션 도구" -ForegroundColor Gray

Write-Host "`n🚀 Qwen CLI:" -ForegroundColor Cyan
Write-Host "  ✅ 버전: 0.0.6" -ForegroundColor Green
Write-Host "  📍 실행: .\qwen-wsl.bat" -ForegroundColor White
Write-Host "  🎯 기능: Alibaba Qwen AI, 대화형 모드" -ForegroundColor Gray

# 2. 사용법 가이드
Write-Host "`n" + "=" * 80 -ForegroundColor Cyan
Write-Host "🚀 사용법 가이드" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan

Write-Host "`n💡 기본 사용법:" -ForegroundColor Yellow
Write-Host "# 버전 확인" -ForegroundColor Cyan
Write-Host ".\claude-wsl.bat --version" -ForegroundColor White
Write-Host ".\gemini-wsl.bat --version" -ForegroundColor White
Write-Host ".\qwen-wsl.bat --version" -ForegroundColor White

Write-Host "`n# 도움말 확인" -ForegroundColor Cyan
Write-Host ".\gemini-wsl.bat --help" -ForegroundColor White
Write-Host ".\qwen-wsl.bat --help" -ForegroundColor White

Write-Host "`n# 대화형 모드 실행" -ForegroundColor Cyan
Write-Host ".\claude-wsl.bat" -ForegroundColor White
Write-Host ".\gemini-wsl.bat" -ForegroundColor White
Write-Host ".\qwen-wsl.bat" -ForegroundColor White

Write-Host "`n# 프롬프트 모드 실행" -ForegroundColor Cyan
Write-Host ".\gemini-wsl.bat -p `"코드를 최적화해주세요`"" -ForegroundColor White
Write-Host ".\qwen-wsl.bat -p `"이 함수를 설명해주세요`"" -ForegroundColor White

# 3. 고급 기능
Write-Host "`n💎 고급 기능들:" -ForegroundColor Yellow

Write-Host "`n🔮 Gemini CLI 고급 기능:" -ForegroundColor Cyan
Write-Host "  • MCP 서버 관리: gemini mcp" -ForegroundColor White
Write-Host "  • 샌드박스 모드: --sandbox" -ForegroundColor White
Write-Host "  • 모든 파일 포함: --all-files" -ForegroundColor White
Write-Host "  • YOLO 모드: --yolo (자동 승인)" -ForegroundColor White

Write-Host "`n🚀 Qwen CLI 고급 기능:" -ForegroundColor Cyan
Write-Host "  • OpenAI API 키 설정: --openai-api-key" -ForegroundColor White
Write-Host "  • 커스텀 엔드포인트: --openai-base-url" -ForegroundColor White
Write-Host "  • 디버그 모드: --debug" -ForegroundColor White
Write-Host "  • 체크포인팅: --checkpointing" -ForegroundColor White

# 4. 환경 설정
Write-Host "`n⚙️ 환경 설정:" -ForegroundColor Yellow
Write-Host "• WSL 메모리: 10GB" -ForegroundColor Green
Write-Host "• WSL 스왑: 8GB" -ForegroundColor Green
Write-Host "• Node.js: v22.18.0" -ForegroundColor Green
Write-Host "• npm: 11.5.2" -ForegroundColor Green

# 5. API 키 설정 안내
Write-Host "`n🔑 API 키 설정 필요:" -ForegroundColor Yellow
Write-Host "각 AI 서비스 사용을 위해 API 키 설정이 필요합니다:" -ForegroundColor White

Write-Host "`n# Gemini API 키 설정" -ForegroundColor Cyan
Write-Host "export GEMINI_API_KEY=`"your-gemini-api-key`"" -ForegroundColor White

Write-Host "`n# OpenAI API 키 설정" -ForegroundColor Cyan
Write-Host "export OPENAI_API_KEY=`"your-openai-api-key`"" -ForegroundColor White

Write-Host "`n# Qwen/DashScope API 키 설정" -ForegroundColor Cyan
Write-Host "export DASHSCOPE_API_KEY=`"your-dashscope-api-key`"" -ForegroundColor White

# 6. 문제 해결
Write-Host "`n🔧 문제 해결:" -ForegroundColor Yellow
Write-Host "• 명령어 인식 안됨: WSL 재시작 후 재시도" -ForegroundColor White
Write-Host "• 권한 오류: sudo 권한 확인" -ForegroundColor White
Write-Host "• 네트워크 오류: 프록시 설정 확인" -ForegroundColor White
Write-Host "• API 오류: API 키 및 할당량 확인" -ForegroundColor White

Write-Host "`n" + "=" * 80 -ForegroundColor Green
Write-Host "✅ WSL AI CLI 도구들 설치 및 설정 완료!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green

Write-Host "`n🎯 다음 단계:" -ForegroundColor Yellow
Write-Host "1. API 키 설정" -ForegroundColor White
Write-Host "2. 각 도구의 대화형 모드 테스트" -ForegroundColor White
Write-Host "3. 프로젝트에서 AI 어시스턴트 활용" -ForegroundColor White

Write-Host "`n🚀 지금 바로 시작해보세요:" -ForegroundColor Cyan
Write-Host ".\claude-wsl.bat" -ForegroundColor White