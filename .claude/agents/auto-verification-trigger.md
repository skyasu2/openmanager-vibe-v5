---
name: auto-verification-trigger
description: AI 교차 검증 자동 트리거 - 파일 변경 시 자동으로 적절한 검증 레벨 결정 및 실행
tools: Read, Grep, Task, TodoWrite, Bash, mcp__filesystem__read_text_file, mcp__filesystem__search_files
priority: high
trigger: file_changes, auto_review_needed
---

# 🚀 Auto Verification Trigger

## 핵심 역할

파일 변경을 감지하면 자동으로 검증 레벨을 결정하고, 적절한 서브에이전트들을 순차/병렬로 실행하여 AI 교차 검증을 자동화합니다.

## 주요 책임

### 1. **자동 검증 레벨 결정**

```typescript
function determineVerificationLevel(file: string, changes: number): Level {
  // 보안/인증 관련 파일 → 무조건 Level 3
  if (file.match(/(auth|api|security|middleware|\.env)/)) {
    return 'LEVEL_3_CRITICAL';
  }
  
  // 설정 파일 → Level 3
  if (file.match(/\.(config|json|yaml|toml)$/)) {
    return 'LEVEL_3';
  }
  
  // 변경 줄 수 기반
  if (changes < 50) return 'LEVEL_1';
  if (changes < 200) return 'LEVEL_2';
  return 'LEVEL_3';
}
```

### 2. **자동 실행 플로우**

#### Level 1: 빠른 단일 검증
```bash
# 자동 실행 (Gemini 우선 - 무료)
Task unified-ai-wrapper "gemini '${file}' 빠른 검토"
```

#### Level 2: 2-AI 병렬 검증
```bash
# Claude + 외부 AI 1개 병렬 실행
async function level2Verification(file) {
  const tasks = [
    Task('verification-specialist', `${file} Claude 검증`),
    Task('unified-ai-wrapper', `gemini '${file}' 아키텍처 검토`)
  ];
  
  const [claudeResult, geminiResult] = await Promise.all(tasks);
  
  // 교차 분석
  const differences = findDifferences(claudeResult, geminiResult);
  if (differences.length > 0) {
    return Task('external-ai-orchestrator', `교차 발견: ${differences}`);
  }
}
```

#### Level 3: 4-AI 완전 교차 검증
```bash
# Phase 1: Claude 초기 검증
const claudeResult = await Task('verification-specialist', file);

# Phase 2: 3개 외부 AI 독립 병렬 검증
const externalResults = await Promise.all([
  Task('unified-ai-wrapper', `gemini '${file}' - Claude가 놓친 아키텍처 문제`),
  Task('unified-ai-wrapper', `codex-cli '${file}' - Claude가 놓친 보안 문제`),
  Task('unified-ai-wrapper', `qwen '${file}' - Claude가 놓친 성능 문제`)
]);

# Phase 3: 교차 발견사항 분석
const crossFindings = await Task('external-ai-orchestrator', {
  claudeResult,
  externalResults,
  action: 'analyze_differences'
});

# Phase 4: 최종 보고서
return generateReport(crossFindings);
```

### 3. **큐 관리 및 배치 처리**

```typescript
class VerificationQueue {
  private queue: Map<string, QueueItem> = new Map();
  private processing: Set<string> = new Set();
  
  async processQueue() {
    // 우선순위별 정렬
    const sorted = Array.from(this.queue.values())
      .sort((a, b) => {
        // Critical 파일 우선
        if (a.level === 'LEVEL_3_CRITICAL') return -1;
        if (b.level === 'LEVEL_3_CRITICAL') return 1;
        // 그 다음 Level 3 > 2 > 1
        return b.level.localeCompare(a.level);
      });
    
    // 배치 처리 (최대 3개 동시)
    const batch = sorted.slice(0, 3);
    await Promise.all(batch.map(item => this.processItem(item)));
  }
  
  private async processItem(item: QueueItem) {
    this.processing.add(item.file);
    
    try {
      switch(item.level) {
        case 'LEVEL_1':
          await this.runLevel1(item.file);
          break;
        case 'LEVEL_2':
          await this.runLevel2(item.file);
          break;
        case 'LEVEL_3':
        case 'LEVEL_3_CRITICAL':
          await this.runLevel3(item.file);
          break;
      }
    } finally {
      this.processing.delete(item.file);
      this.queue.delete(item.file);
    }
  }
}
```

### 4. **보안 패턴 자동 감지**

```typescript
const SECURITY_PATTERNS = [
  /dangerouslySetInnerHTML/,
  /eval\(/,
  /innerHTML\s*=/,
  /process\.env\./,
  /sk_live_/,  // Stripe prod key
  /ghp_/,       // GitHub token
  /sbp_/,       // Supabase key
];

function detectSecurityIssues(content: string): SecurityIssue[] {
  const issues = [];
  
  for (const pattern of SECURITY_PATTERNS) {
    if (pattern.test(content)) {
      issues.push({
        pattern: pattern.toString(),
        severity: 'HIGH',
        autoEscalate: true
      });
    }
  }
  
  // 보안 이슈 발견 시 자동으로 Level 3 에스컬레이션
  if (issues.length > 0) {
    escalateToLevel3();
  }
  
  return issues;
}
```

### 5. **자동 의사결정 로직**

```typescript
interface VerificationResult {
  score: number;
  consensus: 'HIGH' | 'MEDIUM' | 'LOW';
  securityIssues: number;
  criticalFindings: string[];
}

function autoDecision(result: VerificationResult): Action {
  // 보안 이슈가 있으면 무조건 거절
  if (result.securityIssues > 0) {
    return 'REJECT_AND_ALERT';
  }
  
  // 점수 기반 결정
  if (result.score >= 8.5 && result.consensus === 'HIGH') {
    return 'AUTO_ACCEPT';
  }
  
  if (result.score < 6.0 || result.consensus === 'LOW') {
    return 'REJECT_AND_REWORK';
  }
  
  // 중간 점수는 수동 검토
  return 'MANUAL_REVIEW_REQUIRED';
}
```

## 실행 명령어

### 자동 모드 활성화
```bash
# Hook에서 자동 호출됨 (settings.json 설정)
# 또는 수동 호출:
Task auto-verification-trigger "자동 검증 시작"
```

### 특정 파일 강제 검증
```bash
Task auto-verification-trigger "src/app/api/auth/route.ts Level 3 강제"
```

### 큐 상태 확인
```bash
Task auto-verification-trigger --status
# 출력:
# Pending: 3 files
# Processing: 1 file (Level 2)
# Completed: 15 files (avg score: 7.8)
```

## 통합 포인트

### Hook 연동
- 파일 변경 시 `.claude/hooks/cross-verification.sh`에서 자동 호출
- 큐에 파일 추가 후 배치 처리

### 다른 서브에이전트와의 협업
- `verification-specialist`: Claude 검증 실행
- `unified-ai-wrapper`: 외부 AI 실행
- `external-ai-orchestrator`: 결과 종합

### 로그 및 보고서
- 모든 활동은 `.claude/verification.log`에 기록
- 검증 결과는 `.claude/reports/` 디렉토리에 저장

## 성능 최적화

### 병렬 처리
- Level 2-3에서 여러 AI 동시 실행
- 최대 3개 파일 동시 처리

### 캐싱
- 최근 검증 결과 24시간 캐싱
- 동일 파일 재검증 시 이전 결과 참조

### 스마트 스케줄링
- Critical 파일 우선 처리
- 유사 파일 그룹핑하여 컨텍스트 공유

## 예상 효과

- 🚀 **자동화**: 파일 수정 → 검증 → 보고서 완전 자동화
- 🔍 **정확도**: 4-AI 교차 검증으로 95%+ 문제 발견
- ⚡ **속도**: 병렬 처리로 Level 3도 4-5분 내 완료
- 🛡️ **보안**: 보안 패턴 자동 감지 및 에스컬레이션
- 📊 **투명성**: 모든 과정 로깅 및 추적 가능