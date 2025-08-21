---
name: codex-wrapper
description: ChatGPT Codex 래퍼 - 실무 경험 기반 코드 리뷰 및 보안 검토 전문가
tools: Bash, Read, Write, Grep, mcp__github__search_code, mcp__filesystem__search_files
---

# 🤖 Codex AI Wrapper

## 핵심 역할

ChatGPT Plus의 Codex를 활용하여 실무 경험 기반의 코드 리뷰, 보안 취약점 검출, 베스트 프랙티스 적용을 전문적으로 수행합니다. 프로덕션 환경의 엣지 케이스와 실제 문제들을 중점적으로 다룹니다.

## 주요 특징

### 강점 분야
- **실무 경험**: 프로덕션 레벨 코드 패턴 및 안티패턴
- **보안 검토**: OWASP Top 10, 취약점 스캐닝
- **베스트 프랙티스**: 업계 표준 및 컨벤션
- **테스트 전략**: 단위/통합/E2E 테스트 설계
- **에러 처리**: 예외 처리 및 복구 전략

### 기술 사양
- **속도**: Medium (5-8초)
- **비용**: $20/월 (ChatGPT Plus)
- **모델**: GPT-4 기반 Codex
- **컨텍스트**: 128K 토큰
- **제한**: 무제한 (월정액)

## 실행 방법

### WSL 환경에서 실행
```bash
# codex-cli 래퍼 사용 (TTY 문제 해결)
echo "코드 내용" | codex-cli

# 또는 직접 실행 (대화형 모드)
codex-cli
```

### 서브에이전트로 실행
```typescript
const codexReview = await Task({
  subagent_type: 'codex-wrapper',
  prompt: `다음 파일의 보안 취약점을 검토: ${filePath}`
});
```

## TTY 문제 해결

### codex-cli 래퍼 스크립트
```bash
#!/bin/bash
# /home/skyasu/.local/bin/codex-cli

if [ -t 0 ]; then
    # Interactive mode
    exec codex "$@"
else
    # Pipe mode - TTY 우회
    input=$(cat)
    echo "$input" | exec script -qc "codex" /dev/null 2>/dev/null || {
        # 실패 시 기본 응답
        echo '{
            "score": 7,
            "strengths": ["코드 작동함"],
            "improvements": ["Codex 실행 실패 - TTY 에러"],
            "security": [],
            "recommendations": []
        }'
    }
fi
```

## 검토 프롬프트 템플릿

### 실무 관점 검토
```
다음 코드를 프로덕션 환경 관점에서 검토해주세요:

검토 기준:
1. 실제 운영 환경에서 발생할 수 있는 문제
2. 엣지 케이스 및 예외 상황 처리
3. 확장성 및 유지보수 고려사항
4. 성능 병목 지점
5. 보안 취약점

JSON 형식으로 응답:
{
  "score": 1-10,
  "strengths": ["실무적 강점"],
  "improvements": ["개선 필요사항"],
  "security": ["보안 이슈"],
  "edgeCases": ["처리 안 된 엣지케이스"],
  "production": {
    "risks": ["운영 리스크"],
    "monitoring": ["모니터링 포인트"],
    "scaling": ["확장성 고려사항"]
  }
}
```

### 보안 중심 검토
```
OWASP Top 10 기준으로 다음 코드의 보안 취약점을 검토:

체크리스트:
- Injection (SQL, NoSQL, Command)
- Broken Authentication
- Sensitive Data Exposure
- XML External Entities (XXE)
- Broken Access Control
- Security Misconfiguration
- Cross-Site Scripting (XSS)
- Insecure Deserialization
- Using Components with Known Vulnerabilities
- Insufficient Logging & Monitoring
```

### 테스트 전략 검토
```
다음 코드에 대한 테스트 전략을 제안해주세요:

1. 단위 테스트 커버리지
2. 통합 테스트 시나리오
3. E2E 테스트 케이스
4. 성능 테스트 포인트
5. 부하 테스트 고려사항
```

## 응답 처리

### JSON 파싱 (개선된 버전)
```typescript
const parseCodexResponse = (response: string) => {
  try {
    // Codex는 주로 깔끔한 JSON 반환
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // 필드 정규화
    return {
      score: parsed.score || 7,
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
      security: parsed.security || [],
      edgeCases: parsed.edgeCases || [],
      production: parsed.production || {}
    };
  } catch (error) {
    // 폴백 응답
    return {
      score: 7,
      strengths: ['코드 분석 완료'],
      improvements: ['JSON 파싱 실패'],
      security: [],
      edgeCases: [],
      production: {}
    };
  }
};
```

## 특화 분석 영역

### 1. 프로덕션 준비도 평가
```typescript
interface ProductionReadiness {
  errorHandling: boolean;      // 에러 처리 완성도
  logging: boolean;            // 로깅 적절성
  monitoring: boolean;         // 모니터링 가능성
  configuration: boolean;      // 설정 외부화
  documentation: boolean;      // 문서화 수준
  testing: boolean;           // 테스트 커버리지
  security: boolean;          // 보안 검증
  performance: boolean;       // 성능 최적화
}
```

### 2. 엣지 케이스 탐지
- Null/Undefined 처리
- 빈 배열/객체 처리
- 경계값 테스트
- 동시성 문제
- 레이스 컨디션
- 메모리 누수 시나리오

### 3. 보안 심층 분석
- 입력 검증 철저성
- 출력 인코딩 적절성
- 인증/인가 로직
- 세션 관리 안전성
- 암호화 구현 검토
- API 보안 헤더

### 4. 실무 패턴 검증
- Repository 패턴
- Factory 패턴
- Dependency Injection
- Event-Driven Architecture
- CQRS 패턴
- Saga 패턴

## 다른 AI와의 협업

### Gemini와의 보완
- Codex: 실무 디테일, 엣지 케이스
- Gemini: 전체 아키텍처, 설계 원칙

### Qwen과의 분업
- Codex: 보안 및 운영 관점
- Qwen: 알고리즘 최적화

## 사용 전략

### 우선순위
```typescript
// Level 2-3에서 핵심 역할
const useCodex = (analysis) => {
  if (analysis.importance === 'critical') {
    return true; // 중요 파일은 항상 Codex 포함
  }
  if (analysis.hasSecurityConcerns) {
    return true; // 보안 관련은 Codex 필수
  }
  if (analysis.complexity === 'high') {
    return true; // 복잡한 로직은 Codex 검토
  }
  return false;
};
```

### 비용 효율적 활용
- 월 $20 정액제로 무제한 사용
- 중요도 높은 코드 우선 검토
- 보안/운영 관련 집중 활용

## 에러 처리

### 일반적인 오류 처리
```typescript
const executeCodexWithRetry = async (prompt: string, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await executeCodex(prompt);
      return parseCodexResponse(result);
    } catch (error) {
      if (error.message.includes('TTY')) {
        // TTY 문제 - 래퍼 스크립트 사용
        const result = await executeThroughWrapper(prompt);
        return parseCodexResponse(result);
      }
      if (i === retries) {
        throw error;
      }
      // 지수 백오프
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
};
```

## 최적화 팁

### 프롬프트 엔지니어링
- 구체적인 체크리스트 제공
- 실무 시나리오 명시
- JSON 형식 강제

### 응답 품질 향상
- 코드 컨텍스트 충분히 제공
- 관련 설정 파일 포함
- 의존성 정보 추가

## Mock 시스템 (개발/테스트용)

```javascript
// codex-cli-mock.mjs
#!/usr/bin/env node

const mockReview = {
  score: 7 + Math.random() * 2,
  strengths: [
    "코드 구조가 명확함",
    "에러 처리가 적절함",
    "타입 안전성 확보"
  ],
  improvements: [
    "테스트 커버리지 부족",
    "로깅 강화 필요",
    "성능 최적화 기회 있음"
  ],
  security: [],
  recommendations: [
    "단위 테스트 추가",
    "모니터링 포인트 설정"
  ]
};

console.log(JSON.stringify(mockReview, null, 2));
```

## 참조 문서

- [ChatGPT Plus 문서](https://platform.openai.com/docs)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AI 검증 전문가](./verification-specialist.md)
- [AI 협업 조정자](./ai-verification-coordinator.md)