# 📊 Statusline 최적화 가이드 (공식 가이드 기반)

## 개요

Claude Code statusline 기능의 공식 설정 방법 및 최적화 가이드입니다.
[공식 문서](https://ccusage.com/guide/statusline) 기반으로 작성되었습니다.

## 🔍 Statusline 기능 이해

⚠️ **중요**: ccusage는 Claude Code 유료 플랜에서 **실제 API 사용량 기반 비용**을 표시합니다. 실제 사용량 분석 결과 3일간 $708.90 (약 ₩950,000) 소모를 확인했습니다.

### 표시 정보
- 💬 **현재 세션 추정치** - 활성 대화 세션의 API 기준 계산값
- 💰 **오늘 총 추정치** - 현재 날짜 누적 API 기준 계산값  
- 🚀 **현재 세션 블록** - 활성 5시간 블록의 API 기준 계산값 및 남은 시간
- 🔥 **소모율** - 시각적 표시기가 있는 토큰 소비율
- 🤖 **활성 모델** - 현재 사용 중인 Claude 모델
- 🧠 **컨텍스트 사용량** - 입력 토큰 및 컨텍스트 한계 백분율

### 출력 형식 예시
```
🤖 Claude 3.5 Sonnet | 💰 $0.23 session / $1.23 today / $0.45 block (2h 45m left) | 🔥 $0.12/hr | 🧠 25,000 (12%)
```

## ✅ 공식 설정 방법

### 1. 기본 설정 (권장)
```json
{
  "statusLine": {
    "type": "command",
    "command": "ccusage statusline",
    "padding": 0
  }
}
```

### 2. 성능 최적화 옵션
- **기본**: 오프라인 모드 (캐시된 가격 데이터 사용)
- **온라인 모드**: `--no-offline` 플래그로 최신 가격 데이터 사용

```json
{
  "statusLine": {
    "type": "command", 
    "command": "ccusage statusline --no-offline",
    "padding": 0
  }
}
```

## 🚀 고급 설정 옵션

### 1. Bun 런타임 사용 (더 빠른 실행)
```json
{
  "statusLine": {
    "type": "command",
    "command": "bun x ccusage statusline",
    "padding": 0
  }
}
```

### 2. NPM 사용 (패키지 매니저 선호 시)
```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y ccusage statusline",
    "padding": 0
  }
}
```

### 3. 환경변수 커스터마이징
컨텍스트 사용량 색상 임계값 설정:

```bash
# 환경변수 설정
export CCUSAGE_CONTEXT_LOW_THRESHOLD=60    # 녹색: < 60%
export CCUSAGE_CONTEXT_MEDIUM_THRESHOLD=90 # 노란색: 60-90%, 빨간색: > 90%
```

**색상 표시 규칙:**
- **녹색**: 정상 사용량 (기본 < 50%)
- **노란색**: 중간 사용량 (기본 50-80%)  
- **빨간색**: 높은 사용량 (기본 > 80%)

### 4. 소모율 표시기
- **녹색**: 정상 (< 2,000 토큰/분)
- **노란색**: 보통 (2,000-5,000 토큰/분)
- **빨간색**: 높음 (> 5,000 토큰/분)

## 📊 실시간 모니터링 대안

### 1. 별도 터미널에서 실시간 모니터링
```bash
# 실시간 블록 모니터링 (권장)
ccusage blocks --live

# 세션별 사용량 추적
ccusage session

# 일일 사용량 모니터링  
ccusage daily
```

### 2. JSON 출력으로 커스텀 처리
```bash
# JSON 형태로 데이터 출력
ccusage blocks --json

# jq와 함께 사용하여 특정 데이터 추출
ccusage daily --json | jq '.[] | select(.cost > 10)'
```

### 3. MCP 서버 활용
```bash
# MCP 서버로 실시간 데이터 제공
ccusage mcp --port 3001
```

## 🔧 트러블슈팅

### 문제: Statusline이 표시되지 않음
1. **ccusage 설치 확인**
   ```bash
   ccusage --version
   ```

2. **PATH 환경변수 확인**
   ```bash
   which ccusage  # Linux/Mac
   where ccusage  # Windows
   ```

3. **Claude Code 로그 확인**
   - Claude Code IDE에서 로그 패널 확인
   - 에러 메시지가 있는지 검토

4. **사용량 데이터 확인**
   ```bash
   # 사용량 데이터가 있는지 확인
   ccusage daily
   ```

### 문제: 비용이 부정확함
- `ccusage daily` 또는 `ccusage blocks`로 상세 분석 비교
- 동일한 비용 계산 로직 사용하므로 일관성 있어야 함

### 문제: 성능이 느림
1. **오프라인 모드 사용** (기본값)
   ```json
   {
     "statusLine": {
       "command": "ccusage statusline"  // 기본적으로 오프라인 모드
     }
   }
   ```

2. **전역 설치 확인**
   ```bash
   npm install -g ccusage
   ```

### 문제: JSON 입력 에러
- Claude Code IDE 외부에서 직접 실행 시 발생
- IDE 내에서만 정상 작동하도록 설계됨

### 문제: N/A session 표시
- **원인**: Claude Code IDE와 ccusage 간 세션 동기화 지연
- **해결**: IDE 재시작, 캐시 정리, 세션 동기화 대기
- **스크립트**: `./scripts/fix-statusline-session.ps1` 실행
- **참고**: 일일/블록 비용은 정상 표시되므로 실질적 문제 없음

## 📈 성능 벤치마크

| 방식 | 실행 시간 | 정확도 | 네트워크 의존성 | 추천도 |
|-----|----------|--------|----------------|--------|
| `ccusage statusline` (오프라인) | <100ms | 캐시된 가격 | 없음 | ⭐⭐⭐⭐⭐ |
| `ccusage statusline --no-offline` | 200-500ms | 최신 가격 | 있음 | ⭐⭐⭐⭐ |
| `bun x ccusage statusline` | <50ms | 캐시된 가격 | 없음 | ⭐⭐⭐⭐ |
| `npx -y ccusage statusline` | 1-2초 | 캐시된 가격 | 패키지 다운로드 | ⭐⭐⭐ |

## 💡 권장사항

### 🎯 일반 사용자
1. **기본 설정**: `ccusage statusline` (오프라인 모드)
2. **전역 설치**: `npm install -g ccusage`로 성능 최적화
3. **설정 위치**: `~/.claude/settings.json`

### 🚀 고급 사용자  
1. **Bun 사용**: `bun x ccusage statusline`로 더 빠른 실행
2. **환경변수**: 컨텍스트 임계값 커스터마이징
3. **실시간 모니터링**: 별도 터미널에서 `ccusage blocks --live`

### 🔧 개발자
1. **JSON 출력**: `ccusage blocks --json`으로 데이터 처리
2. **MCP 서버**: `ccusage mcp`로 API 제공
3. **디버깅**: `ccusage daily --debug`로 상세 분석

## 🆕 Beta 기능 (향후 추가 예정)

- 커스텀 형식 템플릿
- 설정 가능한 소모율 임계값  
- 추가 메트릭 표시 옵션
- 세션별 비용 추적

## 📝 참고사항

- **공식 문서**: https://ccusage.com/guide/statusline
- **GitHub**: https://github.com/ryoppippi/ccusage
- **최신 버전**: ccusage v15.9.4+
- **테스트 환경**: Windows 11, Claude Code IDE

---

**업데이트**: 2025년 8월 14일 (공식 가이드 기반 개선)
**작성자**: Claude Code + 공식 문서
## 🔧 Claude Code 설정 초기화 (2025-08-14)

### 📋 .claude/settings.json (최적화 완료)
```json
{
  "statusLine": {
    "type": "command",
    "command": "ccusage statusline", 
    "padding": 0
  },
  "locale": "ko-KR",
  "timezone": "Asia/Seoul",
  "currency": "KRW",
  "permissions": {
    "allow": [
      "Bash(node:*)", "Bash(npm:*)", "Bash(git:*)", 
      "Bash(claude:*)", "Bash(ccusage:*)",
      "mcp__*"
    ],
    "deny": ["Bash(rm -rf:*)", "Bash(sudo rm:*)"]
  }
}
```

### 🌏 환경변수 설정 (Windows)
```bash
set CCUSAGE_CONTEXT_LOW_THRESHOLD=60   # 60% 이상 주의
set CCUSAGE_CONTEXT_MEDIUM_THRESHOLD=85 # 85% 이상 경고
set TZ=Asia/Seoul
```

### ⚡ 빠른 사용량 확인
```bash
ccusage blocks --active    # 현재 블록 상태
ccusage blocks --recent    # 최근 3일 요약
ccusage --version          # 버전: v15.9.4
```

### 💰 비용 이해하기 (중요!)

**Claude Code Max 20x 플랜 ($200/월 정액제)**:
- ✅ **실제 비용**: $200/월 고정 (추가 결제 없음)
- ❌ **ccusage 표시**: API 기준 추정치 (실제 결제 금액 아님)

```bash
ccusage blocks --active
# → $88.07 표시 = "API로 사용했다면"의 가상 비용
# → 실제 결제 = $0 (정액제 플랜이므로)
```

### 🎯 사용량 최적화 팁
1. **Rate Limit 관리**: 주간 제한 내에서 효율적 사용
2. **모델 선택**: Opus 4 → Sonnet 4 (50% 도달 시 자동 전환)  
3. **프로젝트 크기**: 대형 코드베이스에 최적화된 플랜
4. **모니터링 목적**: 사용 패턴 분석용 (비용 절약 목적 아님)