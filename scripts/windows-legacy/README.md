# Windows 레거시 스크립트

이 폴더에는 Windows 환경에서 Claude Code를 실행하기 위해 작성된 레거시 스크립트들이 보관되어 있습니다.

## 배경

2025년 8월 15일, 개발 환경을 Windows PowerShell에서 WSL 2로 전환하면서 다음과 같은 문제들이 해결되었습니다:

### Windows 환경 문제점

- Raw mode stdin 문제로 Claude Code 대화형 모드 실행 불가
- 환경변수 해석 오류 (:USERPROFILE 문제)
- PowerShell 별칭 충돌 (cp 명령어)
- 신뢰 대화상자 자동 처리 어려움

### WSL 환경 장점

- 완전한 Linux 환경에서 모든 AI CLI 도구 정상 작동
- Raw mode 문제 완전 해결
- sudo 비밀번호 없이 사용 가능
- 10GB 메모리, 8GB 스왑으로 최적화

## 레거시 스크립트 목록

### Claude Code 문제 해결

- ix-claude-path-error.ps1 - 경로 오류 수정
- ix-claude-cli-permanently.ps1 - 영구 수정
- claude-ultimate-solution.ps1 - 종합 해결책
- claude-trust-complete-fix.ps1 - 신뢰 설정 수정

### PowerShell 환경 수정

- ix-powershell-alias-conflict.ps1 - 별칭 충돌 해결
- ix-alias-final.ps1 - 최종 별칭 수정

### Windows CLI 도구 정리

- cleanup-windows-cli-tools.ps1 - Windows CLI 도구 제거
- windows-cleanup-verification.ps1 - 정리 상태 확인
- inal-cleanup.ps1 - 최종 정리
- inal-status-report.ps1 - 최종 상태 보고

## 현재 상태

**✅ 해결 완료**: 모든 AI CLI 도구가 WSL에서 완벽하게 작동
**🗂️ 보관**: 이 스크립트들은 참고용으로 보관됨
**🚀 현재 사용**: WSL 실행 래퍼들 (claude-wsl-optimized.bat 등)

## 사용법 (참고용)

이 스크립트들은 더 이상 사용되지 않지만, Windows 환경에서 Claude Code 문제 해결이 필요한 경우 참고할 수 있습니다.

`powershell

# 예시 (사용하지 마세요)

.\fix-claude-cli-permanently.ps1
.\cleanup-windows-cli-tools.ps1
`

**권장**: WSL 환경 사용
`ash

# 현재 권장 방법

.\claude-wsl-optimized.bat
`

---

생성일: 2025-08-15 15:10:28
