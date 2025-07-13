# Claude Monitor - Windows PowerShell & Python 통합 버전

## 🚀 빠른 시작

### Windows PowerShell (권장)
```powershell
# npm 스크립트로 실행
npm run cm           # 현재 사용량 요약
npm run cm:live      # 실시간 대시보드
npm run cm:active    # 활성 블록만
npm run cm:daily     # 일별 통계
npm run cm:session   # 세션 분석
```

### Python (크로스 플랫폼)
```bash
# Python으로 실행
python scripts/claude-monitor.py           # 현재 사용량
python scripts/claude-monitor.py --live    # 실시간 모니터링
python scripts/claude-monitor.py daily     # 일별 분석
```

## 📋 주요 기능

- ✅ Windows PowerShell 네이티브 지원
- ✅ Python 크로스 플랫폼 지원
- ✅ ccusage 자동 설치 및 실행
- ✅ 색상 코드로 사용량 시각화
- ✅ 실시간 대시보드 모드
- ✅ JSON 출력 지원

## 🔧 필수 요구사항

- Node.js 18.0+ (npm 포함)
- Python 3.8+ (Python 버전 사용 시)
- Windows PowerShell 5.0+ (Windows)

## 📊 사용량 표시

토큰 사용량에 따른 색상 표시:
- 🟢 0-60%: 안전 (녹색)
- 🟡 60-80%: 주의 (노란색)
- 🔴 80%+: 위험 (빨간색)

## 💡 활용 팁

1. **일일 체크**: 매일 `npm run cm`으로 사용량 확인
2. **실시간 모니터링**: 집중 작업 시 `npm run cm:live` 켜두기
3. **기간별 분석**: 특정 기간 사용량 확인
   ```powershell
   .\scripts\claude-monitor.ps1 blocks -Since 20250701 -Until 20250731
   ```

## 🛠️ 문제 해결

### Node.js가 설치되지 않음
- https://nodejs.org/ 에서 LTS 버전 다운로드 및 설치

### PowerShell 실행 정책 오류
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Python 버전 확인
```bash
python --version  # 또는 python3 --version
```

## 📚 관련 문서

- [CLAUDE.md](../CLAUDE.md) - Claude Code 프로젝트 가이드
- [ccusage 공식 문서](https://github.com/cline/ccusage)

---

💡 **Pro Tip**: VSCode 터미널에서 실행하면 더 나은 색상 표시와 포맷팅을 볼 수 있습니다!