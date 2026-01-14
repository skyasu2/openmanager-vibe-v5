# AI 시스템 설계

> **프로젝트 버전**: v5.87.0 | **Last Updated**: 2026-01-14
> **Note**: Qwen 제거 (2026-01-07) - 2-AI 시스템으로 단순화

## 2-AI 교차검증 시스템

### AI 구성
- **Claude Code**: 메인 개발 (Max $200/월)
- **Codex CLI**: 코드 리뷰 Primary (Plus $20/월)
- **Gemini CLI**: 코드 리뷰 Secondary (무료)

### 2단계 검증 시스템
```typescript
// Level 1: Claude 단독 (50줄 미만)
interface QuickReview {
  complexity: 'low';
  ai_count: 1;
  time: '30s';
  confidence: 0.85;
}

// Level 2: Claude + 2-AI 순환 (50줄 이상)
interface StandardReview {
  complexity: 'medium' | 'high';
  ai_count: 2;
  time: '2-5min';
  confidence: 0.95;
  rotation: 'codex <-> gemini';
}
```

### 가중치 시스템
```typescript
const AI_WEIGHTS = {
  claude: 1.0,   // 메인 의사결정자
  codex: 0.99,   // 실무 경험
  gemini: 0.98   // 대규모 분석
};

// 합의 계산
const calculateConsensus = (scores: AiScore[]) => {
  const weightedSum = scores.reduce((sum, score) =>
    sum + (score.value * AI_WEIGHTS[score.ai]), 0
  );
  const totalWeight = scores.reduce((sum, score) =>
    sum + AI_WEIGHTS[score.ai], 0
  );
  return weightedSum / totalWeight;
};
```

### 자동 트리거 조건
```typescript
// 복잡도 기반 자동 선택
const getVerificationLevel = (codeLines: number) => {
  return codeLines < 50 ? 1 : 2;
};

// 2-AI 로테이션 (1:1 순환)
const selectReviewer = (lastReviewer: string) => {
  return lastReviewer === 'codex' ? 'gemini' : 'codex';
};
```

### 성과 지표
- **품질 향상**: 6.2/10 -> 9.0/10
- **버그 감소**: 90% 감소
- **개발 속도**: 4배 증가
- **비용 효율**: $220/월 (Claude Max + Codex Plus)
