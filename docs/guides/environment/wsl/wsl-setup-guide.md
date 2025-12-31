# WSL 개발 환경 및 네트워크 설정 가이드

본 문서는 Windows Subsystem for Linux (WSL) 환경에서 프로젝트를 개발하면서, Windows 호스트의 브라우저에서 원활하게 접속하고 테스트하기 위한 설정과 가이드를 다룹니다.

## 🖥️ 실행 환경 구조

현재 프로젝트의 개발 환경은 다음과 같이 구성됩니다.

```ascii
┌─────────────────────────────────────────────────────────┐
│  Windows (Host)                                         │
│  ┌──────────────────┐    ┌────────────────────────┐    │
│  │ IDE (Cursor,     │    │ 브라우저               │    │
│  │ Antigravity 등)  │    │ http://localhost:3000  │    │
│  └────────┬─────────┘    └───────────┬────────────┘    │
│           │                          │                  │
│  ─────────┴──────────────────────────┴─────────────────│
│                    WSL2 네트워크 브릿지                  │
│  ─────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  WSL2 (Ubuntu)                                   │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │  Next.js Dev Server (포트 3000)          │    │   │
│  │  │  npm run dev:network                     │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 🚀 개발 서버 실행 방법

반드시 **WSL 터미널**에서 다음 명령어를 사용해야 합니다.

```bash
# Windows 브라우저 접속 허용 모드 (권장)
npm run dev:network
```

이 명령어는 내부적으로 `next dev -H 0.0.0.0`을 실행하여 외부(Windows 호스트) 접속을 허용합니다.

### 접속 방법

| 접속 경로 | URL | 비고 |
|:---:|:---:|:---|
| **Localhost** | `http://localhost:3000` | WSL2의 자동 포트 포워딩 기능 활용 |
| **WSL IP** | `http://[WSL-IP]:3000` | 예: `http://192.168.x.x:3000`. 모바일/외부 기기 테스트 시 유용 |

## ⚠️ 주의사항: PowerShell 직접 실행 금지

Windows PowerShell에서 `npm run dev`를 직접 실행하는 것은 **비권장**됩니다.

1. **스크립트 호환성**: 프로젝트의 많은 자동화 스크립트(`scripts/*.sh`)가 Bash 기반이므로 Windows에서 작동하지 않습니다.
2. **바이너리 문제**: `node_modules`에 설치된 패키지(예: `sharp`, `esbuild`)가 Linux용으로 컴파일된 경우, Windows Node.js에서 실행 시 오류가 발생합니다.
3. **경로 문제**: Linux의 대소문자 구분 파일 시스템과 Windows의 파일 시스템 차이로 인해 예기치 않은 버그가 발생할 수 있습니다.

## ⚙️ 설정 파일 변경 사항

이 환경을 지원하기 위해 다음 설정이 적용되었습니다.

### 1. `package.json`
```json
"scripts": {
  "dev:network": "cross-env NODE_OPTIONS='--max-old-space-size=4096' next dev -p 3000 --hostname 0.0.0.0"
}
```

### 2. `next.config.mjs`
Windows 호스트에서의 접속을 허용하기 위해 `allowedDevOrigins` 설정이 추가되었습니다.

```javascript
allowedDevOrigins: [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://192.168.0.68:3000', // WSL IP (필요시 수정)
  'http://host.docker.internal:3000',
],
```

## 📝 문제 해결

**Q: `localhost:3000`으로 접속이 안 됩니다.**
A: WSL2 터미널에서 `npm run dev:network`로 실행했는지 확인하세요. 일반 `npm run dev`는 `localhost`(127.0.0.1)에만 바인딩되어 Windows에서 접근하지 못할 수 있습니다.

**Q: "Binary not found" 에러가 발생합니다.**
A: `node_modules`가 리눅스용으로 설치된 상태에서 Windows Node.js로 실행하려고 할 때 발생합니다. 반드시 WSL 내에서 `npm` 명령을 사용하세요.

## 🧪 검증 및 유지보수 (Verification Matrix)

프로젝트 안정성을 위해 각 환경별 검증 범위를 다음과 같이 정의합니다. **주 개발 및 검증은 반드시 WSL에서 수행**해야 합니다.

| 환경 | 검증 범위 | 실행 가능 작업 | 비고 |
|:---:|:---|:---|:---|
| **WSL (메인)** | Tests + Build + Lint + TypeScript | `npm run test`, `npm run build` | **모든 CI/CD 검증의 기준 환경** |
| **Windows** | TypeScript + Lint only | `git push`, 간단한 수정 | 빌드/테스트 시 바이너리 호환성 문제 발생 가능 |

### 권장 워크플로우
1. **코드 작성/수정**: IDE (Windows) + WSL Terminal
2. **로컬 테스트**: WSL Terminal (`npm run dev:network`)
3. **커밋/푸시**: 
   - **WSL Git 권장**: pre-push 훅의 모든 검증(테스트, 빌드)을 통과할 수 있음
   - **Windows Git**: 바이너리 문제 시 `HUSKY=0 git push` 또는 `QUICK_PUSH=true git push` 사용 (일부 검증 스킵)
