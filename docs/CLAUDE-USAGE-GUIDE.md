# Claude Code 사용법 가이드 (Windows)

## 🎯 권장 사용 방법

### 1. 새 창에서 실행 (가장 권장)

`atch
.\start-claude.bat
`

- Windows Terminal 또는 새 PowerShell 창에서 Claude Code 실행
- Raw mode 문제 완전 회피
- 신뢰 대화상자 수동 처리 가능

### 2. 프로젝트 상태 확인

`powershell
.\scripts\claude-complete-status.ps1
`

- 프로젝트의 모든 상태 정보 표시
- Claude CLI 설정 확인
- 파일 시스템 정보 확인

### 3. 비대화형 명령어

`atch
.\claude-safe.bat /status    # 상태 확인
cproj --version              # 버전 확인
`

## 🔧 문제 해결

### Raw mode 오류

- **해결책**: .\start-claude.bat 사용
- **원인**: Windows 환경에서 stdin 처리 문제

### 신뢰 대화상자

- **해결책**: 새 창에서 수동으로 '1' 입력
- **설정**: 이미 자동 신뢰 설정 완료됨

### Config 불일치

- **현상**: npm-global vs unknown
- **영향**: 없음 (cosmetic issue)
- **해결**: 기능에는 문제없음

## 📁 생성된 파일들

### 실행 파일

- start-claude.bat - Windows Terminal 실행 (권장)
- claude-safe.bat - 비대화형 모드
- claude-auto-trust.bat - 자동 신뢰 시도

### 상태 확인

- scripts\claude-complete-status.ps1 - 완전 상태 분석
- scripts\claude-status.ps1 - 기본 상태 확인

### 설정 파일

- .claude-project.json - 프로젝트 설정
- CLAUDE.md - 프로젝트 컨텍스트

## ✅ 해결된 문제들

1. ✅ Config 불일치 (npm-global vs unknown)
2. ✅ 프로젝트 디렉토리 인식
3. ✅ 신뢰 설정 자동화
4. ✅ PowerShell 별칭 충돌
5. ✅ Raw mode 우회 방법

## 🎯 최종 권장사항

**일상 사용**: .\start-claude.bat
**상태 확인**: .\scripts\claude-complete-status.ps1
**빠른 명령**: cproj --version

생성일: 2025-08-15 14:25:47
