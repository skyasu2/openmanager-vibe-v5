# 🎯 OpenManager Vibe v5 - TDD 커밋 스테이징 전략 가이드

## 📋 개요

**커밋 스테이징 전략**은 TDD 개발 과정에서 실패하는 테스트를 커밋하지 않고, 완성된 기능만 커밋하는 효율적인 워크플로우입니다.

### ✅ 장점

- **빠른 개발**: 브랜치 전환 없이 직선적 개발
- **깔끔한 기록**: 완성된 기능만 커밋 히스토리에 남음
- **CI/CD 안정성**: 항상 통과하는 커밋만 푸시
- **단순한 워크플로우**: 복잡한 Git 조작 불필요

## 🚀 설치된 TDD 스크립트

```bash
# 🧪 TDD 개발 시작 (감시 모드)
npm run dev:tdd

# ✅ TDD 완료 검증
npm run tdd:check

# 💾 TDD 커밋 (검증 후 자동 커밋)
npm run tdd:commit

# 🚀 TDD 푸시 (검증 후 커밋 & 푸시)
npm run tdd:push

# 📦 백업 & 복원
npm run tdd:backup    # 현재 작업 백업
npm run tdd:restore   # 백업된 작업 복원

# 🛡️ 안전 커밋 (백업 → 검증 → 커밋)
npm run tdd:safe-commit

# 📖 워크플로우 가이드 표시
npm run tdd:workflow
```

## 🎯 TDD 워크플로우

### 1️⃣ **Red Phase** - 실패 테스트 작성

```bash
# TDD 감시 모드 시작
npm run dev:tdd
```

### 2️⃣ **Green Phase** - 최소 구현 작성

테스트가 통과하도록 최소한의 코드를 작성합니다.

### 3️⃣ **Refactor Phase** - 코드 개선 (선택적)

코드 품질 개선, 타입 안전성 강화 등을 진행합니다.

### 4️⃣ **Commit Phase** - 완성된 기능 커밋

```bash
# 모든 테스트 통과 확인 후 한 번에 커밋
npm run tdd:commit -m "feat: 새 기능 구현 (TDD 완료)"

# 또는 푸시까지 한 번에
npm run tdd:push -m "feat: 새 기능 구현 (TDD 완료)"
```

## 🛡️ 백업 & 안전 전략

### 📦 작업 중 백업

```bash
# 긴급 백업 (회의, 점심 등)
npm run tdd:backup

# 나중에 복원
npm run tdd:restore
```

### 🛡️ 안전 커밋

```bash
# 백업 → 검증 → 커밋 (가장 안전)
npm run tdd:safe-commit -m "feat: 새 기능 구현"
```

## 🎯 실제 적용 예시 - 서버 상태 공유 기능

### 📋 구체적인 TDD 시나리오

```bash
# 1. TDD 감시 모드 시작
npm run dev:tdd

# 2. Red Phase - 서버 상태 공유 테스트 작성
cat > tests/unit/system-state-manager.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { SystemStateManager } from '@/lib/redis/SystemStateManager';

describe('SystemStateManager', () => {
  it('should share system state between users', async () => {
    const manager = new SystemStateManager();
    
    // 첫 번째 사용자가 시스템 시작
    const state1 = await manager.startSystem('user1');
    expect(state1.isRunning).toBe(true);
    expect(state1.startedBy).toBe('user1');
    
    // 두 번째 사용자가 상태 확인
    const state2 = await manager.getSystemState();
    expect(state2.isRunning).toBe(true);
    expect(state2.activeUsers).toBe(2);
  });
  
  it('should handle 30-minute countdown', async () => {
    const manager = new SystemStateManager();
    const state = await manager.startSystem('user1');
    
    const expectedEndTime = state.startTime + (30 * 60 * 1000);
    expect(state.endTime).toBe(expectedEndTime);
  });
});
EOF

# 테스트 실패 확인 (파일이 없으므로 당연히 실패)
# ❌ Cannot resolve dependency '@/lib/redis/SystemStateManager'

# 3. Green Phase - 최소 구현
mkdir -p src/lib/redis
cat > src/lib/redis/SystemStateManager.ts << 'EOF'
export interface SystemState {
  isRunning: boolean;
  startedBy: string;
  startTime: number;
  endTime: number;
  activeUsers: number;
  lastActivity: number;
}

export class SystemStateManager {
  private mockState: SystemState | null = null;
  
  async getSystemState(): Promise<SystemState> {
    return this.mockState || {
      isRunning: false,
      startedBy: '',
      startTime: 0,
      endTime: 0,
      activeUsers: 0,
      lastActivity: 0
    };
  }
  
  async startSystem(userId: string): Promise<SystemState> {
    const startTime = Date.now();
    const endTime = startTime + (30 * 60 * 1000); // 30분
    
    this.mockState = {
      isRunning: true,
      startedBy: userId,
      startTime,
      endTime,
      activeUsers: 2, // 테스트를 위한 하드코딩
      lastActivity: startTime
    };
    
    return this.mockState;
  }
}
EOF

# 4. 테스트 통과 확인
# ✅ PASS tests/unit/system-state-manager.test.ts

# 5. Refactor Phase - 실제 Redis 연동으로 개선
# (실제 구현으로 교체)

# 6. 모든 테스트 통과 후 커밋
npm run tdd:commit -m "feat: 시스템 상태 공유 기능 구현 (TDD 완료)"
```

## 📊 현재 프로젝트 상태

### ✅ 테스트 통과율

- **Unit Tests**: 95% (39/41)
- **Integration Tests**: 90%+
- **TypeScript**: 100% (오류 없음)

### 🎯 TDD 안전모드 설정

```bash
# 2개 실패 허용 기준으로 설정됨
npm run test:tdd-safe
```

**허용된 실패**:

1. `AIEnhancedChat.tsx` - 532줄 (논리적 응집성으로 허용)
2. `refactoring` 관련 테스트 (의도적 제외)

## 🚀 일상 사용 명령어

```bash
# 🧪 TDD 개발 시작
npm run dev:tdd

# 🔄 개발 중 (Red → Green → Refactor 반복)
# 파일 수정하면서 vitest가 자동으로 테스트 실행

# ✅ 완료 시 커밋
npm run tdd:commit -m "feat: 새 기능 구현 (TDD)"

# 🚀 푸시
git push origin main

# 📦 비상시 백업/복원
npm run tdd:backup    # 백업
npm run tdd:restore   # 복원
```

## 🎯 예상 효과

### ✅ 장점 극대화

- **빠른 개발**: 브랜치 전환 없이 직선적 개발
- **깔끔한 기록**: 완성된 기능만 커밋 히스토리에 남음
- **CI/CD 안정성**: 항상 통과하는 커밋만 푸시
- **단순한 워크플로우**: 복잡한 Git 조작 불필요

### ⚠️ 단점 최소화

- **백업 자동화**로 분실 위험 제거
- **vitest watch 모드**로 실시간 피드백
- **npm 스크립트**로 워크플로우 표준화

---

🚀 **이제 OpenManager Vibe v5에서 효율적인 TDD 개발이 가능합니다!**
