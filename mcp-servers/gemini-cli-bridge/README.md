# Gemini CLI Bridge for PowerShell (v4.0.0)

단순화된 PowerShell 전용 Gemini CLI MCP 브릿지입니다.

## 🚀 주요 개선사항

### v4.0.0 - 코드 단순화
- ✨ 복잡한 컨텍스트 감지 제거
- 🎯 PowerShell 직접 실행만 지원
- 📦 코드 크기 70% 감소
- ⚡ 더 빠른 응답 속도

## 특징

- PowerShell 네이티브 실행
- 최소한의 오버헤드
- 불필요한 의존성 제거
- 직관적인 코드 구조

## 파일 구조

```
gemini-cli-bridge/
├── src/
│   ├── index.js                    # MCP 서버 엔트리포인트
│   └── simple-powershell-bridge.js # PowerShell 브릿지 구현
├── archive/                        # 이전 버전 백업
├── package.json
└── README.md
```

## 사용 방법

Claude Code에서 자동으로 로드됩니다:
- "2+2는 얼마야?"
- "Python 리스트 정렬 방법은?"

## 지원 기능

### gemini_chat
Gemini와 대화합니다.
```
프롬프트: "안녕하세요"
응답: Gemini의 답변
```

### gemini_stats
API 모드에서는 제한적인 정보만 제공됩니다.

### gemini_context_info
현재 실행 환경 정보를 표시합니다.

## 환경 변수

- `GEMINI_TIMEOUT`: 타임아웃 (기본: 30000ms)
- `GEMINI_DEBUG`: 디버그 모드 (true/false)

## 문제 해결

### Gemini CLI를 찾을 수 없는 경우
```powershell
# Gemini CLI 설치 확인
gemini --version

# PowerShell에서 직접 테스트
gemini --prompt "테스트"
```

### Claude Code 재시작 필요
설정 변경 후에는 Claude Code를 재시작해야 합니다:
1. Ctrl+C로 종료
2. `claude` 명령으로 재시작

## 버전 히스토리

- **v4.0.0**: PowerShell 전용 단순화 버전
- v3.0.0: 자동 모델 선택, 폴백 체인 (archive)
- v2.0.0: 컨텍스트 감지 시스템 (archive)
- v1.0.0: 초기 버전 (archive)

## 라이선스

MIT