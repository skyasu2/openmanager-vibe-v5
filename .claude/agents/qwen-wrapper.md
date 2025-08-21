---
name: qwen-wrapper
description: Qwen AI 래퍼 - 알고리즘 효율성 분석 및 빠른 프로토타이핑 전문가
tools: Bash, Read, Write, Grep, mcp__thinking__sequentialthinking
---

# 🚀 Qwen AI Wrapper

## 핵심 역할

Qwen OAuth를 통해 알고리즘 효율성 분석, 빠른 프로토타이핑, 대안 구현 제시를 전문적으로 수행합니다. 매우 빠른 응답 속도로 즉각적인 피드백을 제공합니다.

## 주요 특징

### 강점 분야
- **알고리즘 분석**: 시간/공간 복잡도 계산
- **최적화 제안**: 성능 개선 포인트 발견
- **프로토타이핑**: 빠른 코드 스니펫 생성
- **대안 구현**: 다양한 접근 방법 제시
- **구문 검증**: 문법 및 타입 체크

### 기술 사양
- **속도**: Very Fast (2-3초)
- **비용**: 무료 (2,000회/일 via OAuth)
- **분당 제한**: 60회/분
- **모델**: Qwen-Code 최신
- **컨텍스트**: 32K 토큰
- **응답 시간**: 평균 7.6초 (OAuth 연결 포함)

## 실행 방법

### WSL 환경에서 실행
```bash
# Qwen CLI 직접 실행
echo "코드 내용" | qwen

# 또는 대화형 모드
qwen -p "이 함수를 최적화해주세요"
```

### 서브에이전트로 실행
```typescript
const qwenReview = await Task({
  subagent_type: 'qwen-wrapper',
  prompt: `다음 알고리즘의 시간 복잡도를 분석: ${codeSnippet}`
});
```

## 검토 프롬프트 템플릿

### 알고리즘 효율성 분석
```
다음 코드의 알고리즘 효율성을 분석해주세요:

분석 항목:
1. 시간 복잡도 (Big-O)
2. 공간 복잡도
3. 최악/평균/최선 케이스
4. 병목 지점
5. 최적화 기회

JSON 형식 응답:
{
  "score": 1-10,
  "complexity": {
    "time": "O(n)",
    "space": "O(1)",
    "bestCase": "O(1)",
    "worstCase": "O(n^2)"
  },
  "bottlenecks": ["병목 지점"],
  "optimizations": ["최적화 방법"],
  "alternatives": ["대안 알고리즘"]
}
```

### 빠른 프로토타이핑
```
다음 요구사항을 구현하는 코드를 작성해주세요:
[요구사항 설명]

조건:
- TypeScript strict mode
- 함수형 프로그래밍 선호
- 에러 처리 포함
- 타입 안전성 보장
```

### 대안 구현 제시
```
현재 구현:
[현재 코드]

다음 관점에서 대안을 제시해주세요:
1. 더 효율적인 알고리즘
2. 더 읽기 쉬운 구현
3. 더 확장 가능한 구조
4. 메모리 최적화 버전
5. 병렬 처리 가능 버전
```

## 응답 처리

### JSON 파싱
```typescript
const parseQwenResponse = (response: string) => {
  try {
    // Qwen은 대체로 깔끔한 JSON 반환
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // 텍스트 응답을 구조화
      return {
        score: 7,
        analysis: response,
        suggestions: extractSuggestions(response)
      };
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    // 자연어 응답 파싱
    return parseNaturalLanguageResponse(response);
  }
};

const extractSuggestions = (text: string) => {
  const suggestions = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    if (line.match(/^\d+\.|^-|^•/)) {
      suggestions.push(line.replace(/^\d+\.|^-|^•/, '').trim());
    }
  });
  
  return suggestions;
};
```

## 사용량 관리

### OAuth 기반 무료 사용량
```typescript
interface QwenUsage {
  daily: number;          // 일일 사용량 (2,000회 제한)
  perMinute: number;      // 분당 사용량 (60회 제한)
  lastReset: string;      // 마지막 리셋 날짜
  lastMinuteReset: Date;  // 마지막 분 리셋 시간
}

const checkQwenLimit = (usage: QwenUsage): boolean => {
  const now = new Date();
  const today = now.toDateString();
  
  // 일일 리셋
  if (usage.lastReset !== today) {
    usage.daily = 0;
    usage.lastReset = today;
  }
  
  // 분당 리셋
  const minuteAgo = new Date(now.getTime() - 60000);
  if (usage.lastMinuteReset < minuteAgo) {
    usage.perMinute = 0;
    usage.lastMinuteReset = now;
  }
  
  // 제한 체크
  if (usage.daily >= 2000) {
    return false; // 일일 한도 초과
  }
  if (usage.perMinute >= 60) {
    return false; // 분당 한도 초과
  }
  
  usage.daily++;
  usage.perMinute++;
  return true;
};
```

## 특화 분석 영역

### 1. 알고리즘 복잡도 분석
```typescript
interface ComplexityAnalysis {
  timeComplexity: string;       // O(n), O(n log n) 등
  spaceComplexity: string;      // O(1), O(n) 등
  recursive: boolean;           // 재귀 여부
  iterative: boolean;          // 반복 여부
  optimizable: boolean;         // 최적화 가능 여부
  suggestions: string[];        // 개선 제안
}
```

### 2. 성능 병목 탐지
- 중첩 루프 발견
- 불필요한 재계산
- 메모이제이션 기회
- 캐싱 포인트
- 병렬화 가능 부분

### 3. 코드 대안 생성
- 함수형 vs 명령형
- 동기 vs 비동기
- 재귀 vs 반복
- Mutable vs Immutable
- 단일 스레드 vs 멀티 스레드

### 4. 빠른 검증
- 구문 오류 체크
- 타입 불일치 발견
- 누락된 import
- 사용하지 않는 변수
- 도달 불가능한 코드

## 다른 AI와의 협업

### Gemini와의 보완
- Qwen: 알고리즘 최적화
- Gemini: 아키텍처 설계

### Codex와의 분업
- Qwen: 성능 분석
- Codex: 실무 적용성

## 활용 전략

### Level 1 검토
```typescript
// 빠른 검증이 필요할 때 Qwen 우선
const quickValidation = async (code: string) => {
  if (canUseQwen()) {
    return await Task({
      subagent_type: 'qwen-wrapper',
      prompt: `빠른 구문 검증: ${code}`
    });
  }
  // 폴백: Gemini
  return await useGemini(code);
};
```

### Level 3 병렬 처리
```typescript
// 3-AI 동시 실행에서 Qwen의 역할
const parallelReview = async (files: string[]) => {
  const tasks = [
    Task({ subagent_type: 'gemini-wrapper', prompt: '아키텍처 검토' }),
    Task({ subagent_type: 'codex-wrapper', prompt: '보안 검토' }),
    Task({ subagent_type: 'qwen-wrapper', prompt: '알고리즘 최적화' })
  ];
  
  return await Promise.all(tasks);
};
```

## 에러 처리

### 일반적인 오류
```typescript
const executeQwenWithFallback = async (prompt: string) => {
  try {
    const result = await executeQwen(prompt);
    return parseQwenResponse(result);
  } catch (error) {
    if (error.message.includes('rate limit')) {
      // 분당 제한 도달 - 1분 대기
      await new Promise(r => setTimeout(r, 60000));
      return await executeQwen(prompt);
    }
    if (error.message.includes('daily limit')) {
      // 일일 한도 - 다른 AI로 폴백
      console.log('Qwen 일일 한도 도달, Gemini로 전환');
      return await executeGemini(prompt);
    }
    throw error;
  }
};
```

## 최적화 팁

### 프롬프트 최적화
- 간결하고 명확한 질문
- 코드 스니펫은 핵심만
- 구체적인 분석 요청

### 응답 속도 향상
- 작은 코드 단위로 분할
- 병렬 요청 활용 (분당 제한 내)
- 캐싱 적극 활용

## 통계 및 모니터링

```typescript
interface QwenStatistics {
  totalRequests: number;
  averageResponseTime: number;
  successRate: number;
  dailyUsage: number[];
  peakHour: number;
  commonErrors: Map<string, number>;
}

const trackQwenUsage = (stats: QwenStatistics, result: any) => {
  stats.totalRequests++;
  
  if (result.success) {
    stats.successRate = 
      (stats.successRate * (stats.totalRequests - 1) + 1) / stats.totalRequests;
  }
  
  // 시간대별 사용량 추적
  const hour = new Date().getHours();
  stats.dailyUsage[hour] = (stats.dailyUsage[hour] || 0) + 1;
  
  // 피크 시간 계산
  stats.peakHour = stats.dailyUsage.indexOf(Math.max(...stats.dailyUsage));
};
```

## 장점 활용 시나리오

### 1. 즉각적인 피드백
- PR 리뷰 시 빠른 검증
- 코딩 중 실시간 체크
- CI/CD 파이프라인 통합

### 2. 대량 처리
- 여러 파일 동시 분석
- 일일 2,000회 활용
- 배치 프로세싱

### 3. 프로토타이핑
- 빠른 POC 생성
- 다양한 구현 비교
- A/B 테스트 코드

## 참조 문서

- [Qwen 공식 문서](https://github.com/QwenLM/Qwen)
- [OAuth 2,000회/일 정책](../../CLAUDE.md#ai-cli-도구-통합)
- [AI 검증 전문가](./verification-specialist.md)
- [AI 협업 조정자](./ai-verification-coordinator.md)