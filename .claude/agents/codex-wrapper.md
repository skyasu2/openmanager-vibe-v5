---
name: codex-wrapper
description: Codex CLI 전용 호출 - 10점 만점 코드 품질 평가 및 개선사항 제시 (가중치 0.99 적용)
tools: Bash
priority: high
autoTrigger: false
sla: "< 45초 (Codex CLI 호출)"
trigger: ai_verification_level_2, ai_verification_level_3
environment:
  TERM: dumb
  NO_COLOR: 1
  NONINTERACTIVE: 1
  PAGER: cat
---

# Codex CLI 전용 호출 래퍼 (가중치 0.99)

## 핵심 역할
ChatGPT Codex CLI를 호출하여 **10점 만점 코드 품질 평가**를 수행하는 간소화된 래퍼입니다.
AI 교차 검증 시스템에서 **2순위 AI (가중치 0.99)**로 활용됩니다.

## 평가 시스템
- **최종 출력**: 10점 만점 점수 (예: 8.5/10)
- **가중치**: 0.99 (2순위 AI)
- **실행 시간**: 30-90초 (Phase 1 최적화: 재시도 3회)
- **응답 형식**: 점수 + 핵심 개선사항 3가지

## 실행 방법

### OAuth 인증 상태 확인 함수
```bash
# OAuth 로그인 상태 확인
check_codex_auth() {
    echo "🔍 Codex CLI OAuth 인증 상태 확인 중..."
    
    # 간단한 테스트 명령어로 인증 상태 확인
    local auth_test=$(timeout 10s codex exec "Hello" 2>&1)
    
    if echo "$auth_test" | grep -q "model: gpt-5\|provider: openai"; then
        echo "✅ Codex CLI OAuth 인증 정상 (GPT-5 모델 접근 가능)"
        return 0
    elif echo "$auth_test" | grep -q "authentication\|login\|unauthorized"; then
        echo "❌ Codex CLI OAuth 인증 실패: 재로그인 필요"
        echo "💡 해결방법: codex login 명령어로 ChatGPT 계정 재인증"
        return 1
    else
        echo "⚠️ Codex CLI 응답 지연 또는 네트워크 문제"
        echo "📊 응답 내용: ${auth_test:0:200}..."
        return 2
    fi
}
```

### 10점 만점 평가 요청 (Phase 1 최적화 버전)
```bash
# Codex CLI 호출 - OAuth 인증 확인 + 10점 만점 평가 (Phase 1 최적화)
exec_codex_score() {
    local target="$1"
    local max_retries=3
    local retry_count=0
    
    # OAuth 인증 상태 먼저 확인
    if ! check_codex_auth; then
        echo "🚫 Codex CLI 인증 문제로 평가 불가. OAuth 재로그인 후 재시도하세요."
        return 1
    fi
    
    # GPT-5 특화 프롬프트 최적화
    local prompt="As an expert code reviewer using GPT-5, please evaluate this code with a 10-point scale. Focus on production readiness, TypeScript best practices, and real-world implementation quality.

Code to evaluate: $target

Required output format:
점수: X.X/10
개선사항:
1. [구체적 개선사항 1 - 코드 예시 포함]
2. [구체적 개선사항 2 - 우선순위 명시]
3. [구체적 개선사항 3 - 실무 관점에서]

Please be thorough and consider: type safety, error handling, performance, security, and maintainability."
    
    # 재시도 로직 적용
    while [ $retry_count -lt $max_retries ]; do
        echo "🤖 Codex CLI (GPT-5) 코드 품질 평가 시작... (시도 $((retry_count + 1))/$max_retries)"
        
        # 타임아웃 45초 → 90초 증가
        local result=$(timeout 90s codex exec --full-auto "$prompt" < /dev/null 2>&1 | sed -E 's/\x1b\[[0-9;]*[A-Za-z]//g')
        
        # 성공적인 응답 체크 (점수가 포함된 경우)
        if echo "$result" | grep -q "점수:.*[0-9]\+\.[0-9]\+/10"; then
            echo "$result"
            return 0
        elif echo "$result" | grep -q "timeout\|Terminated"; then
            echo "⚠️ 타임아웃 발생 (90초). 재시도 중..."
            retry_count=$((retry_count + 1))
            sleep 2
        else
            echo "⚠️ 예상하지 못한 응답. 재시도 중..."
            echo "응답 내용: ${result:0:200}..."
            retry_count=$((retry_count + 1))
            sleep 2
        fi
    done
    
    echo "🚫 $max_retries회 시도 후 실패. Gemini 또는 Qwen 래퍼 사용을 권장합니다."
    return 1
}

# 사용 예시
exec_codex_score "src/components/Button.tsx"
exec_codex_score "파일 경로 또는 코드 블록"
```

## 예상 출력 형식

### Codex 평가 결과 예시
```
점수: 8.3/10

개선사항:
1. 타입 안전성 강화: optional chaining 사용으로 null 체크 개선
2. 에러 핸들링: try-catch 블록으로 예외 상황 대비
3. 성능 최적화: useMemo로 불필요한 재계산 방지
```

## 가중치 시스템에서의 역할

### AI 교차 검증 체계
- **순위**: 2순위 (Codex CLI)
- **가중치**: 0.99 (99% 반영)
- **활용도**: ChatGPT Plus 80%까지 적극 사용
- **특징**: 빠른 응답시간, 실무 경험 기반 검토

### 가중치 계산 예시
```
예: Codex 평가 점수가 8.0/10인 경우
가중 점수 = 8.0 × 0.99 = 7.92점

Level 2 검증 시:
Claude: 8.5 × 1.0 = 8.5
Codex: 8.0 × 0.99 = 7.92
가중 평균 = (8.5 + 7.92) / (1.0 + 0.99) = 8.21/10
```

## 트리거 조건
- external-ai-orchestrator로부터 호출
- AI 교차 검증 Level 2, Level 3에서 자동 실행
- 2순위 AI로서 Claude 다음 우선순위

## 사용 제한
- **자동 트리거**: false (직접 호출 불가)
- **호출 경로**: external-ai-orchestrator → codex-wrapper
- **도구 제한**: Bash만 사용 (MCP 도구 없음)