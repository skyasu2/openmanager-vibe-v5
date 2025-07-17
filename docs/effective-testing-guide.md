# 🧪 효과적인 테스트 작성 가이드

> **최종 업데이트**: 2025년 7월 17일  
> **적용 버전**: v5.46.42  
> **목표**: 실제 문제를 검사하는 의미있는 테스트 작성

## 📋 현재 테스트 현황 분석

### 🚫 문제가 있는 테스트 패턴

#### 1. 테스트 내부에 로직 정의
```typescript
// ❌ 나쁜 예: tests/unit/api/health-logic.test.ts
describe('Health Check Logic', () => {
  it('should calculate health score correctly', () => {
    // 테스트 내부에 로직 정의 - 실제 코드를 테스트하지 않음
    const calculateHealthScore = (cpu, memory, errorRate) => {
      const cpuScore = Math.max(0, 100 - cpu);
      // ...
    };
    
    expect(calculateHealthScore(30, 40, 0.01)).toBeGreaterThan(70);
  });
});
```

#### 2. 과도한 모킹
```typescript
// ❌ 나쁜 예: tests/unit/components/ai-sidebar/AISidebarV2.test.tsx
vi.mock('@/stores/useAISidebarStore', () => ({
  useAISidebarStore: () => ({
    setOpen: vi.fn(),
    // 모든 것이 모킹됨 - 실제 동작 검증 불가
  }),
}));
```

#### 3. 파일 크기만 확인하는 테스트
```typescript
// ❌ 나쁜 예: 파일 라인 수만 세는 테스트
it('should have manageable file size (< 500 lines)', () => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lineCount = content.split('\n').length;
  expect(lineCount).toBeLessThan(1500);
});
```

### ✅ 좋은 테스트 패턴

#### 1. 실제 서비스 테스트
```typescript
// ✅ 좋은 예: tests/unit/crypto/UnifiedEnvCryptoManager.test.ts
import { UnifiedEnvCryptoManager } from '@/services/crypto/UnifiedEnvCryptoManager';

describe('UnifiedEnvCryptoManager', () => {
  it('should encrypt and decrypt data correctly', async () => {
    const manager = UnifiedEnvCryptoManager.getInstance();
    const originalData = 'sensitive-data';
    
    const encrypted = await manager.encrypt(originalData);
    const decrypted = await manager.decrypt(encrypted);
    
    expect(decrypted).toBe(originalData);
    expect(encrypted).not.toBe(originalData);
  });
});
```

#### 2. 사용자 시나리오 테스트
```typescript
// ✅ 좋은 예: tests/components/profile/ProfileDropdown.test.tsx
it('should show sign out button for authenticated users', async () => {
  render(<ProfileDropdown user={mockUser} />);
  
  const trigger = screen.getByRole('button');
  await userEvent.click(trigger);
  
  const signOutButton = screen.getByText('Sign Out');
  expect(signOutButton).toBeInTheDocument();
});
```

## 🎯 효과적인 테스트 작성 원칙

### 1. AAA 패턴 사용
```typescript
describe('서비스 테스트', () => {
  it('should handle error gracefully', async () => {
    // Arrange: 준비
    const service = new MyService();
    const invalidInput = null;
    
    // Act: 실행
    const result = await service.process(invalidInput);
    
    // Assert: 검증
    expect(result.error).toBeDefined();
    expect(result.status).toBe('error');
  });
});
```

### 2. 실제 시나리오 테스트
```typescript
describe('인증 플로우', () => {
  it('should redirect to main page after successful login', async () => {
    // 실제 로그인 플로우 시뮬레이션
    const { router } = render(<LoginPage />);
    
    // 사용자 행동 시뮬레이션
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    // 실제 결과 검증
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/main');
    });
  });
});
```

### 3. 엣지 케이스 테스트
```typescript
describe('데이터 처리', () => {
  it.each([
    [null, 'N/A'],
    [undefined, 'N/A'],
    ['', 'N/A'],
    [0, '0'],
    [-1, 'N/A'],
    [NaN, 'N/A'],
  ])('should handle edge case: %s', (input, expected) => {
    expect(formatValue(input)).toBe(expected);
  });
});
```

## 🔧 개선이 필요한 테스트 목록

### 높은 우선순위
1. **health-logic.test.ts**
   - 실제 health check 서비스 import
   - 실제 API 응답 시뮬레이션
   - 다양한 장애 시나리오 테스트

2. **system-metrics.test.ts**
   - 실제 메트릭 수집 서비스 테스트
   - 시계열 데이터 처리 검증
   - 성능 임계값 테스트

3. **AISidebarV2.test.tsx**
   - 실제 사용자 상호작용 테스트
   - AI 응답 시뮬레이션
   - 에러 처리 시나리오

### 중간 우선순위
4. **AI 엔진 통합 테스트**
   - 실제 AI 요청/응답 플로우
   - 폴백 전략 검증
   - 타임아웃 처리

5. **인증 플로우 E2E 테스트**
   - Google OAuth 플로우
   - 세션 관리
   - 권한 검증

## 📝 TDD 프로세스 적용

### 1. Red: 실패하는 테스트 먼저 작성
```typescript
// 새 기능: 서버 상태 알림
describe('ServerStatusNotifier', () => {
  it('should notify when server goes down', async () => {
    const notifier = new ServerStatusNotifier();
    const mockCallback = vi.fn();
    
    notifier.onStatusChange(mockCallback);
    await notifier.updateStatus('server-1', 'down');
    
    expect(mockCallback).toHaveBeenCalledWith({
      serverId: 'server-1',
      status: 'down',
      timestamp: expect.any(Date),
    });
  });
});
```

### 2. Green: 최소한의 구현
```typescript
export class ServerStatusNotifier {
  private callbacks: Array<(status: any) => void> = [];
  
  onStatusChange(callback: (status: any) => void) {
    this.callbacks.push(callback);
  }
  
  async updateStatus(serverId: string, status: string) {
    const update = {
      serverId,
      status,
      timestamp: new Date(),
    };
    
    this.callbacks.forEach(cb => cb(update));
  }
}
```

### 3. Refactor: 테스트가 보장된 상태에서 개선
```typescript
// 타입 추가, 에러 처리, 최적화 등
export interface ServerStatus {
  serverId: string;
  status: 'up' | 'down' | 'maintenance';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class ServerStatusNotifier {
  // 개선된 구현...
}
```

## 🚀 Husky 훅 테스트 전략

### Pre-commit: 빠른 검증
- TypeScript 타입 체크
- ESLint 린트
- 변경된 파일의 단위 테스트만

### Pre-push: 전체 검증
```bash
#!/bin/sh
# .husky/pre-push

echo "🚀 Pre-push 검증 시작..."

# 1. 타입 체크
npm run type-check || exit 1

# 2. 린트
npm run lint || exit 1

# 3. 단위 테스트 (빠른 실행)
npm run test:unit || exit 1

# 4. 통합 테스트 (중요 플로우만)
npm run test:integration -- --testNamePattern="critical" || exit 1

echo "✅ 모든 검증 통과!"
```

## 📊 테스트 품질 지표

### 측정 기준
1. **코드 커버리지**: 70% 이상
2. **실제 로직 테스트 비율**: 80% 이상
3. **모킹 비율**: 20% 이하
4. **테스트 실행 시간**: 30초 이내

### 모니터링 스크립트
```json
{
  "scripts": {
    "test:quality": "vitest run --coverage && npm run test:analyze",
    "test:analyze": "node scripts/analyze-test-quality.js"
  }
}
```

## 🔗 관련 문서
- [TDD 개발 프로세스](./tdd-process.md)
- [Husky Hooks 가이드](./husky-hooks-guide.md)
- [CI/CD 파이프라인](./ci-cd-pipeline.md)