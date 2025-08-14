# 📊 Claude Code Statusline Integration (Beta) 🚀

## 개요
Claude Code IDE 하단에 실시간 사용량 통계를 표시하는 statusline 기능 설정 가이드입니다.

표시 정보:
- 💬 현재 세션 비용 - 활성 대화 세션의 비용
- 💰 오늘 총 비용 - 당일 누적 지출
- 🚀 현재 세션 블록 - 5시간 청구 블록의 비용 및 남은 시간
- 🔥 소모율 - 토큰 소비 속도 (시각적 지시기 포함)
- 🤖 활성 모델 - 현재 사용 중인 Claude 모델
- 🧠 컨텍스트 사용량 - 입력 토큰과 컨텍스트 한계 대비 백분율

## 🚀 설정

### 1. ccusage 설치
```bash
npm install -g ccusage
# 또는 더 빠른 실행을 위해
npm install -g bun
```

### 2. settings.json 설정
`~/.claude/settings.json` 또는 `~/.config/claude/settings.json`에 추가:

**기본 설정 (권장 - 오프라인 모드)**:
```json
{
  "statusLine": {
    "type": "command",
    "command": "ccusage statusline",
    "padding": 0
  }
}
```

**Bun 사용시 (더 빠른 실행)**:
```json
{
  "statusLine": {
    "type": "command", 
    "command": "bun x ccusage statusline",
    "padding": 0
  }
}
```

**온라인 모드 (최신 가격 데이터)**:
```json
{
  "statusLine": {
    "type": "command",
    "command": "ccusage statusline --no-offline",
    "padding": 0
  }
}
```

### 3. 환경변수 설정 (컨텍스트 임계값 커스터마이징)
```powershell
# PowerShell에서 영구 설정
[System.Environment]::SetEnvironmentVariable('CCUSAGE_CONTEXT_LOW_THRESHOLD', '60', 'User')
[System.Environment]::SetEnvironmentVariable('CCUSAGE_CONTEXT_MEDIUM_THRESHOLD', '85', 'User')
```

임계값 설정:
- **GREEN**: < 60% (저사용량)
- **YELLOW**: 60-85% (중간 사용량) 
- **RED**: > 85% (높은 사용량)

### 4. 자동 설정 스크립트
```bash
./scripts/setup-claude-korea.ps1
```

## 📊 출력 형식

statusline은 한 줄로 압축된 요약 정보를 표시합니다:

### 정상 표시 예시
```
🤖 Opus | 💰 $0.23 session / $1.23 today / $0.45 block (2h 45m left) | 🔥 $0.12/hr | 🧠 25,000 (12%)
```

### 활성 블록이 없는 경우
```
🤖 Opus | 💰 $0.00 session / $0.00 today / No active block
```

### N/A Session 표시 (동기화 지연시)
```
🤖 Opus | 💰 N/A session / $1.23 today / $0.45 block (2h 45m left) | 🔥 $0.12/hr
```

## 📝 구성 요소 설명

- **🤖 Opus**: 현재 활성 Claude 모델
- **💰 $0.23 session**: 현재 대화 세션 비용
- **$1.23 today**: 당일 총 비용 (모든 세션)
- **$0.45 block (2h 45m left)**: 현재 5시간 블록 비용과 남은 시간
- **🔥 $0.12/hr**: 시간당 소모율 (색상 코드 포함)
  - 🟢 초록: 정상 (< 2,000 tokens/min)
  - 🟡 노랑: 보통 (2,000-5,000 tokens/min)  
  - 🔴 빨강: 높음 (> 5,000 tokens/min)
- **🧠 25,000 (12%)**: 입력 토큰과 컨텍스트 한계 백분율
  - 🟢 초록: 낮은 사용량 (< 60% 기본값)
  - 🟡 노랑: 중간 사용량 (60-85% 기본값)
  - 🔴 빨강: 높은 사용량 (> 85% 기본값)

## 🔧 기술적 세부사항

statusline 명령어는:
- stdin에서 세션 정보를 읽음 (Claude Code hooks 제공)
- 활성 5시간 청구 블록을 식별
- 실시간 소모율과 예측을 계산
- 상태 표시줄 디스플레이에 적합한 한 줄 출력
- 네트워크 의존성 없이 즉시 응답하는 오프라인 모드 기본 사용
- `--no-offline`으로 최신 가격 데이터를 위한 온라인 모드 설정 가능

## 🔧 문제 해결

### 출력이 표시되지 않는 경우
1. ccusage가 PATH에 있는지 확인: `ccusage --version`
2. Claude Code 로그에서 오류 확인
3. Claude 데이터 디렉토리에 유효한 사용량 데이터가 있는지 확인
4. Claude Code IDE 재시작

### N/A Session 문제
- **원인**: IDE와 ccusage 간 세션 동기화 지연 (베타 기능의 알려진 제한사항)
- **해결**: 새로운 대화 세션 시작 또는 IDE 재시작
- **참고**: 일일/블록 비용은 정상 표시됨

### 비용이 잘못 표시되는 경우
- 동일한 비용 계산을 다른 ccusage 명령어와 공유
- `ccusage daily` 또는 `ccusage blocks`로 상세 내역 확인

### 유효하지 않은 환경변수 설정 예시
```bash
# 다음은 모두 기본값(50/80)으로 되돌아감
export CCUSAGE_CONTEXT_LOW_THRESHOLD=invalid   # 숫자가 아님
export CCUSAGE_CONTEXT_MEDIUM_THRESHOLD=150    # 100으로 제한된 후 순서로 인해 리셋
export CCUSAGE_CONTEXT_LOW_THRESHOLD=90        # MEDIUM(80) 이상이므로 둘 다 리셋
export CCUSAGE_CONTEXT_MEDIUM_THRESHOLD=30     # LOW(50) 이하이므로 둘 다 리셋
```

## ⚠️ 베타 알림

이 기능은 현재 베타 버전입니다. 곧 추가될 기능들:
- 커스텀 형식 템플릿
- 설정 가능한 소모율 임계값
- 추가 메트릭 표시 옵션
- 세션별 비용 추적

## 📚 관련 명령어

- `ccusage blocks` - 상세 5시간 청구 블록 분석
- `ccusage daily` - 일일 사용량 보고서
- `ccusage session` - 세션 기반 사용량 분석

---
**참고**: [ccusage 공식 문서](https://ccusage.com/guide/statusline) | [트러블슈팅](../statusline-optimization-guide.md)