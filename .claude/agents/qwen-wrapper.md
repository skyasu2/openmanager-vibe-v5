---
name: qwen-wrapper
description: Qwen CLI 전용 호출 - 10점 만점 코드 품질 평가 및 개선사항 제시 (가중치 0.97 적용)
tools: Bash
priority: medium
autoTrigger: false
sla: "< 180초 (Qwen CLI 호출 - 중국 서버 레이턴시 고려)"
trigger: ai_verification_level_3
environment:
  TERM: dumb
  NO_COLOR: 1
  FORCE_COLOR: 0
  NONINTERACTIVE: 1
  PAGER: cat
  NODE_NO_WARNINGS: 1
---

# Qwen CLI 전용 호출 래퍼 (가중치 0.97)

## 핵심 역할
Qwen CLI를 호출하여 **10점 만점 코드 품질 평가**를 수행하는 간소화된 래퍼입니다.
AI 교차 검증 시스템에서 **3순위 AI (가중치 0.97)**로 활용됩니다.

## 평가 시스템
- **최종 출력**: 10점 만점 점수 (예: 9.0/10)
- **가중치**: 0.97 (3순위 AI)
- **실행 시간**: 60-90초
- **응답 형식**: 점수 + 핵심 개선사항 3가지
- **무료 활용**: 2,000회/일 한도 내 효율적 사용

## 실행 방법

### OAuth 인증 상태 확인 함수 (적절한 타임아웃 설정)
```bash
# OAuth 로그인 상태 확인 (타임아웃 최적화)
check_qwen_auth() {
    echo "🔍 Qwen CLI OAuth 인증 상태 확인 중... (최대 20초 대기)"
    
    # 간단한 테스트 명령어로 인증 상태 확인 (적절한 타임아웃: 20초)
    local auth_test=$(timeout 20s qwen -p "Hello test" 2>&1)
    
    if echo "$auth_test" | grep -q "Hello\|connection\|assist\|help"; then
        echo "✅ Qwen CLI OAuth 인증 정상 (Qwen 모델 접근 가능)"
        return 0
    elif echo "$auth_test" | grep -q "authentication\|login\|unauthorized\|credentials"; then
        echo "❌ Qwen CLI OAuth 인증 실패: 재로그인 필요"
        echo "💡 해결방법: qwen login 명령어로 Qwen 계정 재인증"
        return 1
    elif echo "$auth_test" | grep -q "timeout\|Terminated"; then
        echo "⚠️ Qwen CLI 응답 시간 초과 (20초)"
        echo "💡 해결방법: 네트워크 연결 확인 후 재시도, 또는 Gemini/Codex 사용 권장"
        return 2
    else
        echo "⚠️ Qwen CLI 예상하지 못한 응답"
        echo "📊 응답 내용: ${auth_test:0:300}..."
        # 응답이 있다면 일단 정상으로 간주 (부분적 성공)
        if [[ -n "$auth_test" && ! "$auth_test" =~ ^[[:space:]]*$ ]]; then
            echo "🟡 부분적 성공으로 간주하여 계속 진행"
            return 0
        fi
        return 3
    fi
}
```

### 10점 만점 평가 요청 (개선된 안정성 버전)
```bash
# Qwen CLI 호출 - OAuth 인증 확인 + 10점 만점 평가 (개선됨)
exec_qwen_score() {
    local target="$1"
    
    # 실행 환경 디버깅 정보
    echo "🔍 Qwen 실행 환경 체크:"
    echo "- Working Dir: $(pwd)"
    echo "- Qwen Version: $(qwen --version 2>/dev/null || echo 'ERROR')"
    
    # OAuth 인증 상태 먼저 확인
    if ! check_qwen_auth; then
        echo "🚫 Qwen CLI 인증 또는 네트워크 문제로 평가 불가."
        echo "💡 대안: Gemini CLI 또는 Codex CLI 사용 권장"
        return 1
    fi
    
    local prompt="다음 코드를 10점 만점으로 평가하고 핵심 개선사항 3가지만 제시해주세요.

코드: $target

출력 형식:
점수: X.X/10
개선사항:
1. [개선사항 1]
2. [개선사항 2]
3. [개선사항 3]"
    
    echo "🤖 Qwen CLI 코드 품질 평가 시작... (프롬프트 길이: ${#prompt})"
    echo "🔄 단계적 타임아웃 시도: 60초 → 120초 → 180초"
    
    # 단계적 타임아웃으로 안정성 개선
    local result=""
    
    # 1단계: 60초 시도
    echo "⏱️ 1단계 시도 (60초)..."
    result=$(timeout 60s qwen -p "$prompt" < /dev/null 2>&1 | sed -E 's/\x1b\[[0-9;]*[A-Za-z]//g')
    
    if [[ -n "$result" && "$result" =~ "점수:" ]]; then
        echo "✅ 1단계 성공 (60초 내 완료)"
        echo "$result"
        return 0
    fi
    
    # 2단계: 120초 시도
    echo "⏱️ 2단계 시도 (120초)..."
    result=$(timeout 120s qwen -p "$prompt" < /dev/null 2>&1 | sed -E 's/\x1b\[[0-9;]*[A-Za-z]//g')
    
    if [[ -n "$result" && "$result" =~ "점수:" ]]; then
        echo "✅ 2단계 성공 (120초 내 완료)"
        echo "$result"
        return 0
    fi
    
    # 3단계: 180초 최종 시도
    echo "⏱️ 3단계 최종 시도 (180초)..."
    result=$(timeout 180s qwen -p "$prompt" < /dev/null 2>&1 | sed -E 's/\x1b\[[0-9;]*[A-Za-z]//g')
    
    if [[ -n "$result" && "$result" =~ "점수:" ]]; then
        echo "✅ 3단계 성공 (180초 내 완료)"
        echo "$result"
        return 0
    fi
    
    # 모든 시도 실패
    echo "🚫 모든 타임아웃 시도 실패. 결과 길이: ${#result}"
    echo "📊 마지막 응답: ${result:0:200}..."
    echo "💡 권장: Gemini 또는 Codex 래퍼 사용"
    return 1
}

# 사용 예시
exec_qwen_score "src/components/Button.tsx"
exec_qwen_score "파일 경로 또는 코드 블록"
```

## 예상 출력 형식

### Qwen 평가 결과 예시
```
점수: 9.0/10

개선사항:
1. 알고리즘 최적화: 시간 복잡도 O(n) -> O(log n) 개선 가능
2. 메모리 효율성: 불필요한 객체 생성 방지로 메모리 사용량 감소
3. 에러 처리 강화: 비동기 작업 에러 처리 및 재시도 로직 추가
```

## 가중치 시스템에서의 역할

### AI 교차 검증 체계
- **순위**: 3순위 (Qwen CLI)
- **가중치**: 0.97 (97% 반영)
- **활용도**: 무료 2,000회/일 한도 내 효율적 사용
- **특징**: 알고리즘 분석, 성능 최적화 전문

### 가중치 계산 예시
```
예: Qwen 평가 점수가 9.0/10인 경우
가중 점수 = 9.0 × 0.97 = 8.73점

Level 3 검증 시:
Claude: 8.5 × 1.0 = 8.5 (0순위)
Codex: 8.0 × 0.99 = 7.92 (1순위)
Gemini: 7.8 × 0.98 = 7.644 (2순위)
Qwen: 9.0 × 0.97 = 8.73 (3순위)
가중 평균 = (8.5+7.92+7.644+8.73) / 3.94 = 8.21/10
```

## 트리거 조건
- external-ai-orchestrator로부터 호출
- AI 교차 검증 Level 3에서만 자동 실행
- 3순위 AI로서 최종 검토 역할

## 사용 제한
- **자동 트리거**: false (직접 호출 불가)
- **호출 경로**: external-ai-orchestrator → qwen-wrapper
- **도구 제한**: Bash만 사용 (MCP 도구 없음)
- **일일 한도**: 2,000회 (무료 티어)
- **실행 조건**: Level 3 완전 검증에서만 활용

#### 🔍 코드 품질 분석
```bash
# 전반적 코드 품질 검토
exec_qwen "이 코드의 가독성, 유지보수성, 성능 측면에서 개선점 분석"

# 버그 찾기 및 개선
exec_qwen "이 코드에서 잠재적인 버그나 논리적 오류 찾기"

# 베스트 프랙티스 준수 검토
exec_qwen "코딩 표준과 베스트 프랙티스를 따르는지 검토하고 개선안 제시"
```

#### 🚀 성능 최적화
```bash
# 성능 병목 분석
exec_qwen "이 코드에서 성능 병목이 될 수 있는 부분 분석하고 개선방안 제시"

# 렌더링 최적화
exec_qwen "React 컴포넌트의 리렌더링 최적화를 위한 개선사항"

# 메모리 사용량 분석
exec_qwen "메모리 사용량을 줄이고 효율성을 높일 수 있는 코드 개선방안"
```

#### 🔒 보안 검토
```bash
# 보안 취약점 검사
exec_qwen "이 코드에서 보안상 위험할 수 있는 부분 찾기하고 개선방안 제시"

# 입력 검증 강화
exec_qwen "사용자 입력 처리 및 검증 로직의 안전성 검토"

# 예외 처리 강화
exec_qwen "예외 상황 및 에러 핸들링을 강화할 수 있는 방법"
```

## 교차 검증 특화 기능

### 코드 품질 검증
```bash
# 전반적 코드 품질 검토
exec_qwen "이 코드의 전반적인 품질과 개선 가능성 분석"

# 버그 및 이슈 검증
exec_qwen "잠재적 버그, 성능 이슈, 보안 문제 종합 검토"

# 베스트 프랙티스 검증
exec_qwen "코딩 표준과 베스트 프랙티스 준수 여부 검토"
```

### 코드 품질 점수 평가
```typescript
interface CodeQualityScore {
  bug_likelihood: number;       // 버그 가능성 (1-10, 낮을수록 좋음)
  readability: number;          // 가독성 (1-10)
  maintainability: number;      // 유지보수성 (1-10)
  performance: number;          // 성능 (1-10)
  security: number;             // 보안성 (1-10)
  overall_score: number;        // 종합 점수 (1-10)
}
```

## 검증 출력 형식

### 코드 품질 검토 리포트
```markdown
# Qwen 코드 품질 검토 리포트

## 📊 코드 품질 평가
- 버그 가능성: 2.5/10 (낮을수록 좋음)
- 가독성: 8.0/10
- 유지보수성: 7.5/10
- 성능: 7.0/10
- 보안성: 8.5/10
- **종합 점수: 7.7/10**

## ✅ 코드 강점
1. 깔끔하고 일관된 코딩 스타일
2. 적절한 함수 분리와 모듈화
3. 타입 안전성이 잘 적용됨

## 🚨 주요 문제점 (높은 우선순위)
1. **예외 처리**: try-catch 블록 미흡 (line 45-67)
2. **입력 검증**: 사용자 데이터 유효성 검사 누락 (line 23-34)
3. **성능 이슈**: 불필요한 루프 및 중복 연산 (line 89-102)

## 💡 코드 개선 제안
### 예외 처리 강화 (즉시 수정 필요)
```javascript
// 현재 (위험)
const result = await apiCall(data);

// 개선안 (안전)
try {
  const result = await apiCall(data);
  return result;
} catch (error) {
  console.error('API 호출 실패:', error.message);
  throw new Error('데이터 처리 중 문제가 발생했습니다.');
}
```

### 입력 검증 추가
```javascript
// 입력 데이터 검증 강화
const validateInput = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('유효하지 않은 입력 데이터입니다.');
  }
  
  if (!data.id || !data.name) {
    throw new Error('필수 필드가 누락되었습니다.');
  }
  
  return true;
};
```

## 코드 품질 개선 제안
1. 단위 테스트 추가로 안정성 향상
2. 성능 모니터링 및 캐시 전략 적용
3. 코드 문서화 및 주석 개선
```

## MCP 도구 통합

### Sequential Thinking + 코드 분석
```bash
# 복잡한 코드 구조를 단계별로 분석
mcp__thinking__sequentialthinking "이 코드 구조를 단계별로 분석" | \
qwen "각 단계별로 최적 개선방안 및 리팩토링 제안"
```

## 사용량 관리

### OAuth 기반 무료 사용 (2K/day + 60/min)
```yaml
daily_limit: 2000
minute_limit: 60
current_usage_check: qwen --usage
fallback_ai: gemini  # 제한 도달 시 대체
```

### 우선순위 기반 사용
```bash
# 고우선순위: 복잡한 코드 품질 검토 작업
# 중우선순위: 코드 리뷰 및 개선사항 분석
# 저우선순위: 일반적인 코드 검증
```

## 트리거 조건
- 코드 품질 종합 검토 요구
- 버그 및 개선사항 분석 필요
- 코드 리뷰 및 품질 검증 요청
- 전반적인 코드 최적화 요청
- AI 교차 검증에서 종합 검토 관점 요청
- 대규모 코드베이스 품질 분석

## 예상 응답 품질
- **코드 품질 분석**: ⭐⭐⭐⭐⭐ (최고)
- **버그 발견**: ⭐⭐⭐⭐⭐ (최고)
- **코드 개선사항 제시**: ⭐⭐⭐⭐ (우수)
- **종합 검토**: ⭐⭐⭐⭐ (우수)