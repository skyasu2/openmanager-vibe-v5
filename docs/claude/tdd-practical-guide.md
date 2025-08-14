# 🧪 TDD (Test-Driven Development) 실전 가이드

## 📌 TDD 핵심 원칙

**"테스트가 설계를 주도한다"** - 구현보다 테스트를 먼저 작성하여 더 나은 설계를 유도합니다.

## 🔄 Red-Green-Refactor 사이클

### 1. 🔴 RED: 실패하는 테스트 작성
```typescript
// @tdd-red @created-date: 2025-01-14
describe('ShoppingCart', () => {
  it('should calculate total price with discount', () => {
    const cart = new ShoppingCart();
    cart.addItem({ id: '1', price: 100, quantity: 2 });
    cart.applyDiscount(10); // 10% 할인
    
    expect(cart.getTotal()).toBe(180); // 실패: ShoppingCart 미구현
  });
});
```

### 2. 🟢 GREEN: 최소한의 구현
```typescript
class ShoppingCart {
  private items: CartItem[] = [];
  private discount = 0;

  addItem(item: CartItem): void {
    this.items.push(item);
  }

  applyDiscount(percentage: number): void {
    this.discount = percentage;
  }

  getTotal(): number {
    const subtotal = this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    return subtotal * (1 - this.discount / 100);
  }
}
```

### 3. ♻️ REFACTOR: 코드 개선
```typescript
class ShoppingCart {
  private items = new Map<string, CartItem>();
  private discountPercentage = 0;

  addItem(item: CartItem): void {
    const existing = this.items.get(item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.set(item.id, { ...item });
    }
  }

  applyDiscount(percentage: number): void {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Invalid discount percentage');
    }
    this.discountPercentage = percentage;
  }

  getTotal(): number {
    const subtotal = this.calculateSubtotal();
    return this.applyDiscountToAmount(subtotal);
  }

  private calculateSubtotal(): number {
    return Array.from(this.items.values()).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  private applyDiscountToAmount(amount: number): number {
    return amount * (1 - this.discountPercentage / 100);
  }
}
```

## 🎯 TDD 패턴과 전략

### 1. Arrange-Act-Assert (AAA) 패턴
```typescript
describe('UserService', () => {
  it('should create user with hashed password', async () => {
    // Arrange: 준비
    const userService = new UserService();
    const userData = {
      email: 'test@example.com',
      password: 'plaintext123',
    };

    // Act: 실행
    const user = await userService.createUser(userData);

    // Assert: 검증
    expect(user.email).toBe(userData.email);
    expect(user.password).not.toBe(userData.password); // 해시되어야 함
    expect(await bcrypt.compare(userData.password, user.password)).toBe(true);
  });
});
```

### 2. Given-When-Then (BDD 스타일)
```typescript
describe('Authentication', () => {
  describe('Given a valid user', () => {
    let user: User;

    beforeEach(async () => {
      user = await createTestUser();
    });

    describe('When login with correct credentials', () => {
      it('Then should return access token', async () => {
        const result = await auth.login(user.email, 'correct-password');
        
        expect(result.success).toBe(true);
        expect(result.token).toBeDefined();
        expect(result.token).toMatch(/^eyJ/); // JWT 토큰 형식
      });
    });

    describe('When login with incorrect password', () => {
      it('Then should return error', async () => {
        const result = await auth.login(user.email, 'wrong-password');
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
      });
    });
  });
});
```

### 3. 테스트 더블 (Test Doubles)
```typescript
// Mock: 행동 검증
describe('EmailService', () => {
  it('should send welcome email on user registration', async () => {
    const mockMailer = jest.fn();
    const userService = new UserService({ mailer: mockMailer });

    await userService.register({
      email: 'new@example.com',
      name: 'John',
    });

    expect(mockMailer).toHaveBeenCalledWith({
      to: 'new@example.com',
      subject: 'Welcome John!',
      template: 'welcome',
    });
  });
});

// Stub: 미리 정의된 응답
describe('PaymentService', () => {
  it('should process payment with external gateway', async () => {
    const stubGateway = {
      charge: jest.fn().mockResolvedValue({
        success: true,
        transactionId: 'tx-123',
      }),
    };

    const payment = new PaymentService(stubGateway);
    const result = await payment.processPayment(100, 'card-token');

    expect(result.transactionId).toBe('tx-123');
  });
});

// Spy: 실제 구현 + 호출 추적
describe('CacheService', () => {
  it('should cache database queries', async () => {
    const dbSpy = jest.spyOn(database, 'query');
    const service = new DataService();

    await service.getUserById('123'); // 첫 번째 호출
    await service.getUserById('123'); // 두 번째 호출 (캐시됨)

    expect(dbSpy).toHaveBeenCalledTimes(1); // DB는 한 번만 호출
  });
});
```

## 📊 테스트 구조화

### 1. 테스트 파일 구조
```
src/
├── services/
│   ├── user.service.ts
│   └── user.service.test.ts
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── Button.stories.tsx
└── __tests__/
    ├── integration/
    │   └── auth-flow.test.ts
    └── e2e/
        └── user-journey.test.ts
```

### 2. 테스트 카테고리
```typescript
// 단위 테스트 (Unit Test)
describe('Calculator', () => {
  it('should add two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});

// 통합 테스트 (Integration Test)
describe('API /users', () => {
  it('should create and retrieve user', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name: 'Test User' });
    
    expect(response.status).toBe(201);
    
    const getResponse = await request(app)
      .get(`/users/${response.body.id}`);
    
    expect(getResponse.body.name).toBe('Test User');
  });
});

// E2E 테스트 (End-to-End Test)
describe('User Registration Flow', () => {
  it('should complete full registration process', async () => {
    await page.goto('/register');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome');
  });
});
```

## 🔧 TDD 도구와 설정

### 1. Vitest 설정 (빠른 테스트)
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'test'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    include: ['**/*.{test,spec}.{js,ts,tsx}'],
    watchExclude: ['**/node_modules/**', '**/dist/**'],
  },
});
```

### 2. 테스트 헬퍼 유틸리티
```typescript
// test/helpers/database.ts
export async function setupTestDatabase() {
  await db.migrate.latest();
  await db.seed.run();
}

export async function cleanupDatabase() {
  await db.raw('TRUNCATE TABLE users, posts, comments CASCADE');
}

// test/helpers/fixtures.ts
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: faker.datatype.uuid(),
    email: faker.internet.email(),
    name: faker.name.fullName(),
    createdAt: new Date(),
    ...overrides,
  };
}

// test/helpers/assertions.ts
export function assertApiError(
  response: Response,
  expectedStatus: number,
  expectedMessage?: string
) {
  expect(response.status).toBe(expectedStatus);
  if (expectedMessage) {
    expect(response.body.error).toContain(expectedMessage);
  }
}
```

## 🎮 TDD 자동화

### 1. @tdd-red 태그 관리
```typescript
// scripts/tdd-manager.ts
async function findTddRedTests() {
  const testFiles = await glob('**/*.test.ts');
  const redTests: TddTest[] = [];

  for (const file of testFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const matches = content.matchAll(/@tdd-red.*\n.*it\(['"`](.*?)['"`]/g);
    
    for (const match of matches) {
      redTests.push({
        file,
        testName: match[1],
        line: getLineNumber(content, match.index),
      });
    }
  }

  return redTests;
}

async function checkTestStatus(test: TddTest): Promise<TestStatus> {
  const result = await exec(
    `npm test -- "${test.file}" -t "${test.testName}" --reporter=json`
  );
  
  return JSON.parse(result).status;
}

async function cleanupPassingTests() {
  const redTests = await findTddRedTests();
  
  for (const test of redTests) {
    const status = await checkTestStatus(test);
    
    if (status === 'passed') {
      await removeTddRedTag(test);
      console.log(`✅ Cleaned up: ${test.testName}`);
    }
  }
}
```

### 2. 테스트 감시 모드
```json
// package.json
{
  "scripts": {
    "test:watch": "vitest --watch",
    "test:watch:tdd": "vitest --watch --reporter=tdd-reporter",
    "test:coverage:watch": "vitest --watch --coverage",
    "tdd": "concurrently \"npm run test:watch\" \"npm run tdd:monitor\"",
    "tdd:monitor": "nodemon --watch src --exec 'npm run tdd:check'",
    "tdd:check": "tsx scripts/tdd-manager.ts check",
    "tdd:cleanup": "tsx scripts/tdd-manager.ts cleanup"
  }
}
```

## 📈 테스트 커버리지 전략

### 1. 커버리지 목표
```typescript
// 핵심 비즈니스 로직: 90%+
describe('PricingCalculator', () => {
  // 모든 엣지 케이스 포함
  test.each([
    [100, 0, 100],
    [100, 10, 90],
    [100, 100, 0],
    [0, 10, 0],
  ])('calculates price %i with discount %i% = %i', (price, discount, expected) => {
    expect(calculatePrice(price, discount)).toBe(expected);
  });
});

// 유틸리티 함수: 80%+
describe('StringUtils', () => {
  // 주요 케이스 위주
  it('should capitalize first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('HELLO')).toBe('HELLO');
    expect(capitalize('')).toBe('');
  });
});

// UI 컴포넌트: 70%+
describe('Button', () => {
  // 주요 인터랙션 위주
  it('should handle click', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### 2. 커버리지 리포트 활용
```bash
# 커버리지 생성
npm run test:coverage

# 커버리지 확인
open coverage/index.html

# CI/CD 통합
- name: Test Coverage
  run: |
    npm run test:coverage
    npx codecov
```

## 🚨 TDD 안티패턴 피하기

### 1. ❌ 테스트 없는 구현
```typescript
// 나쁜 예: 구현 먼저
function calculateTax(amount: number): number {
  return amount * 0.1;
}

// 나중에 테스트 추가 (TDD 아님)
test('calculates tax', () => {
  expect(calculateTax(100)).toBe(10);
});
```

### 2. ❌ 과도한 Mock
```typescript
// 나쁜 예: 모든 것을 Mock
test('should process order', () => {
  const mockDb = jest.fn();
  const mockEmail = jest.fn();
  const mockPayment = jest.fn();
  const mockInventory = jest.fn();
  // ... 실제 로직이 거의 없음
});

// 좋은 예: 필요한 것만 Mock
test('should process order', () => {
  const mockPaymentGateway = jest.fn(); // 외부 서비스만 Mock
  const service = new OrderService({ paymentGateway: mockPaymentGateway });
  // ... 실제 비즈니스 로직 테스트
});
```

### 3. ❌ 깨지기 쉬운 테스트
```typescript
// 나쁜 예: 구현 세부사항에 의존
test('should call internal method', () => {
  const spy = jest.spyOn(service, '_internalMethod');
  service.publicMethod();
  expect(spy).toHaveBeenCalled(); // 내부 구현 변경 시 깨짐
});

// 좋은 예: 행동과 결과에 집중
test('should return processed data', () => {
  const result = service.publicMethod(input);
  expect(result).toEqual(expectedOutput); // 구현과 무관
});
```

## 📚 추가 자료

- [TDD by Example - Kent Beck](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Growing Object-Oriented Software, Guided by Tests](https://www.amazon.com/Growing-Object-Oriented-Software-Guided-Tests/dp/0321503627)
- [Testing JavaScript Applications](https://www.manning.com/books/testing-javascript-applications)
- [Vitest 공식 문서](https://vitest.dev/)