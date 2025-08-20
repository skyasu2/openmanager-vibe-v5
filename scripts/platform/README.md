# Windows 지원 스크립트

> 이 디렉토리는 WSL 기반 개발 환경을 보조하는 Windows 스크립트를 포함합니다.

## 📁 구조

```
windows-support/
├── README.md           # 이 문서
├── env-setup/         # 환경 설정 스크립트
│   ├── quick-dev-start.ps1     # 빠른 개발 환경 시작
│   └── setup-wsl.ps1           # WSL 환경 설정
├── utils/            # 유틸리티 스크립트
│   ├── port-forward.ps1        # 포트 포워딩
│   └── fix-clock.ps1           # 시간 동기화
└── wsl-bridge/       # WSL-Windows 연동
    ├── run-windows-script.sh   # WSL → Windows 실행
    └── run-wsl-script.ps1      # Windows → WSL 실행
```

## 🎯 용도

이 스크립트들은 다음 상황에서만 사용됩니다:

1. WSL에서 실행할 수 없는 Windows 전용 작업
2. Windows-WSL 간 연동이 필요한 작업
3. Windows에서 프로젝트를 긴급하게 실행해야 하는 경우

## 💡 사용 원칙

1. **WSL 우선**: 가능한 모든 작업은 WSL에서 실행
2. **보조적 사용**: Windows 스크립트는 보조 수단으로만 사용
3. **격리된 관리**: Windows 관련 스크립트는 이 디렉토리에만 배치
4. **문서화**: 각 스크립트의 목적과 사용법을 명확히 문서화

## 📝 스크립트 목록

### 환경 설정 (env-setup)

- `quick-dev-start.ps1`: Windows에서 개발 환경 빠른 시작
  ```powershell
  ./env-setup/quick-dev-start.ps1 [-Fast] [-Full] [-NoCache]
  ```

### 유틸리티 (utils)

- `port-forward.ps1`: 로컬 포트 포워딩
  ```powershell
  ./utils/port-forward.ps1 -Port 3000
  ```

### WSL 브릿지 (wsl-bridge)

- `run-windows-script.sh`: WSL에서 Windows 스크립트 실행
  ```bash
  ./wsl-bridge/run-windows-script.sh ../utils/port-forward.ps1
  ```

## 🚫 제한 사항

1. 새로운 기능은 가능한 WSL 스크립트로 작성
2. Windows 스크립트는 꼭 필요한 경우에만 추가
3. 모든 Windows 스크립트는 이 디렉토리에만 위치

## ⚠️ 주의 사항

1. PowerShell 실행 정책 설정 필요:

   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```

2. WSL 기본 경로 설정 확인:
   ```powershell
   wsl --list --verbose
   ```
