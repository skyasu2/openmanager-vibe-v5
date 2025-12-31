# 🧪 테스트 템플릿 모음

**신규 테스트 작성 시 참고용 템플릿들**

## 📋 **테스트 작성 전 체크리스트**

### **🤔 이 기능을 테스트해야 할까?**

```
□ 순수 함수인가? → ✅ Unit Test 작성
□ 유틸리티/헬퍼 함수인가? → ✅ Unit Test 작성
□ 타입 가드/검증 로직인가? → ✅ Unit Test 작성
□ 간단한 UI 컴포넌트인가? → ✅ Component Test 작성
□ 기본 API 엔드포인트인가? → ⚠️ 간단한 테스트만
□ 복잡한 AI/외부 서비스 통합인가? → ❌ Skip, 실제 환경 테스트
□ 데이터베이스 복잡 쿼리인가? → ❌ Skip, 실제 환경 테스트
```

### **📊 테스트 복잡도 판단 기준**

| 복잡도        | 특징                             | 권장 전략            |
| ------------- | -------------------------------- | -------------------- |
| **🟢 Low**    | 입력→출력 명확, 외부 의존성 없음 | **Unit Test 작성**   |
| **🟡 Medium** | 1-2개 의존성, Mock 간단          | **선택적 테스트**    |
| **🔴 High**   | 3개+ 의존성, Mock 복잡           | **Skip → 실제 환경** |

## 🟢 **Low Complexity Templates**

### **1. 순수 함수 테스트**

```typescript
// ✅ 권장: 순수 함수 테스트 템플릿
import { describe, it, expect } from 'vitest';
import { functionName } from '../path/to/function';

describe('functionName', () => {
  it('should handle normal case', () => {
    // Given
    const input = 'normal input';

    // When
    const result = functionName(input);

    // Then
    expect(result).toBe('expected output');
  });

  it('should handle edge case', () => {
    // Given
    const input = null;

    // When
    const result = functionName(input);

    // Then
    expect(result).toBe('fallback value');
  });

  it('should handle error case', () => {
    // Given
    const invalidInput = '';

    // When & Then
    expect(() => functionName(invalidInput)).toThrow('Expected error message');
  });
});
```

### **2. 타입 가드 테스트**

```typescript
// ✅ 권장: 타입 안전성 테스트 템플릿
import { describe, it, expect } from 'vitest';
import { isValidType, TypeSchema } from '../path/to/type-guard';

describe('isValidType', () => {
  it('should validate correct structure', () => {
    // Given
    const validData: TypeSchema = {
      id: 'test-id',
      name: 'test-name',
      value: 42,
    };

    // When
    const result = isValidType(validData);

    // Then
    expect(result).toBe(true);
  });

  it('should reject invalid structure', () => {
    // Given
    const invalidData = {
      invalidField: true,
    };

    // When
    const result = isValidType(invalidData);

    // Then
    expect(result).toBe(false);
  });

  it('should handle partial data', () => {
    // Given
    const partialData = {
      id: 'test-id',
      // missing required fields
    };

    // When
    const result = isValidType(partialData);

    // Then
    expect(result).toBe(false);
  });
});
```

### **3. 유틸리티 함수 테스트**

```typescript
// ✅ 권장: 유틸리티 함수 테스트 템플릿
import { describe, it, expect } from 'vitest';
import { formatDate, parseConfig, calculateValue } from '../utils/helpers';

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('should format Korean timestamp', () => {
      expect(formatDate('2024-09-24T10:00:00Z')).toBe('2024년 9월 24일 19:00');
    });

    it('should handle invalid date', () => {
      expect(formatDate('invalid')).toBe('Invalid Date');
    });
  });

  describe('parseConfig', () => {
    it('should parse valid JSON config', () => {
      const config = '{"timeout": 5000}';
      expect(parseConfig(config)).toEqual({ timeout: 5000 });
    });

    it('should return default on invalid JSON', () => {
      expect(parseConfig('invalid')).toEqual({});
    });
  });

  describe('calculateValue', () => {
    it('should calculate percentage correctly', () => {
      expect(calculateValue(50, 200)).toBe(25);
    });

    it('should handle zero divisor', () => {
      expect(calculateValue(50, 0)).toBe(0);
    });
  });
});
```

## 🟡 **Medium Complexity Templates**

### **4. React 컴포넌트 테스트**

```typescript
// ⚠️ 신중히: 기본 컴포넌트 테스트 템플릿
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('should render with required props', () => {
    // Given
    const props = {
      title: 'Test Title',
      value: 42
    };

    // When
    render(<ComponentName {...props} />);

    // Then
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    // Given
    const mockOnClick = vi.fn();
    render(<ComponentName onClick={mockOnClick} />);

    // When
    fireEvent.click(screen.getByRole('button'));

    // Then
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should show loading state', () => {
    // Given
    const props = { loading: true };

    // When
    render(<ComponentName {...props} />);

    // Then
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### **5. 간단한 API 테스트**

```typescript
// ⚠️ 신중히: 기본 API 테스트 템플릿 (복잡하지 않은 경우만)
import { describe, it, expect } from 'vitest';

describe('GET /api/simple-endpoint', () => {
  it('should return 200 with valid response', async () => {
    // When
    const response = await fetch('/api/simple-endpoint');

    // Then
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toMatchObject({
      status: 'success',
    });
  });

  it('should handle query parameters', async () => {
    // When
    const response = await fetch('/api/simple-endpoint?limit=10');

    // Then
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.items).toHaveLength(10);
  });

  it('should return 400 for invalid input', async () => {
    // When
    const response = await fetch('/api/simple-endpoint?invalid=true');

    // Then
    expect(response.status).toBe(400);
  });
});
```

### **6. 간단한 Mock 서비스 테스트**

```typescript
// ⚠️ 신중히: 간단한 Mock만 사용하는 경우
import { describe, it, expect, vi } from 'vitest';
import { ServiceClass } from '../ServiceClass';

// Mock 의존성 (1-2개까지만)
const mockDependency = {
  simpleMethod: vi.fn(),
};

describe('ServiceClass', () => {
  it('should call dependency with correct parameters', () => {
    // Given
    mockDependency.simpleMethod.mockReturnValue('mocked result');
    const service = new ServiceClass(mockDependency);

    // When
    const result = service.performAction('test input');

    // Then
    expect(mockDependency.simpleMethod).toHaveBeenCalledWith('test input');
    expect(result).toBe('processed: mocked result');
  });
});
```

## 🔴 **High Complexity - Skip Templates**

### **7. 복잡한 AI 서비스 (Skip 처리)**

```typescript
// ❌ Skip: 복잡한 AI 통합 테스트 템플릿
describe.skip('ComplexAIService Integration', () => {
  // 이런 테스트는 작성하지 말 것:
  // - AI 엔진 + RAG + 외부 API + 데이터베이스 Mock
  // - 3개 이상의 복잡한 의존성 체인
  // - 실제 환경과 완전히 다른 Mock 동작

  it.skip('should handle complex AI workflow', () => {
    // ❌ 복잡한 Mock 설정이 필요한 경우
    // → 실제 Vercel/Staging 환경에서 테스트
  });
});
```

### **8. 외부 서비스 통합 (Skip 처리)**

```typescript
// ❌ Skip: 외부 서비스 Mock 템플릿
describe.skip('External API Integration', () => {
  it.skip('should integrate with Google AI API', () => {
    // ❌ 외부 API Mock은 실제와 다름
    // → Google AI API 실제 연동 테스트 필요
  });

  it.skip('should handle Supabase complex queries', () => {
    // ❌ RLS Policy + Connection Pool Mock 복잡
    // → 실제 Supabase 환경에서 테스트
  });
});
```

## 🚀 **실제 환경 테스트 Templates**

### **9. Staging 환경 E2E 테스트**

```bash
#!/bin/bash
# 실제 환경 테스트 스크립트 템플릿

echo "🚀 Staging 환경 테스트 시작"

# 1. 배포 확인
vercel --prod
DEPLOYED_URL=$(vercel ls | grep -o 'https://[^[:space:]]*')

# 2. 기본 Health Check
curl -f "$DEPLOYED_URL/api/health" || exit 1

# 3. 핵심 API 테스트
curl -f -X POST "$DEPLOYED_URL/api/ai/query" \
  -H "Content-Type: application/json" \
  -d '{"query":"테스트 쿼리","engine":"LOCAL"}' || exit 1

# 4. E2E 테스트
npx playwright test --headed "$DEPLOYED_URL"

echo "✅ Staging 테스트 완료"
```

### **10. 프로덕션 스모크 테스트**

```typescript
// 프로덕션 환경 기본 검증 템플릿
describe('Production Smoke Tests', () => {
  const PROD_URL = 'https://your-app.vercel.app';

  it('should respond to health check', async () => {
    const response = await fetch(`${PROD_URL}/api/health`);
    expect(response.status).toBe(200);
  });

  it('should serve main page', async () => {
    const response = await fetch(PROD_URL);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
  });

  it('should have correct security headers', async () => {
    const response = await fetch(PROD_URL);
    expect(response.headers.get('x-frame-options')).toBeTruthy();
  });
});
```

## 📚 **테스트 헬퍼 Templates**

### **11. 테스트 데이터 빌더**

```typescript
// 테스트 데이터 생성 헬퍼 템플릿
export class TestDataBuilder {
  static createServer(overrides = {}) {
    return {
      id: 'test-server-1',
      name: 'Test Server',
      cpu: 50,
      memory: 60,
      disk: 40,
      status: 'healthy',
      lastUpdated: new Date().toISOString(),
      ...overrides,
    };
  }

  static createUser(overrides = {}) {
    return {
      id: 'test-user-1',
      email: 'test@example.com',
      role: 'user',
      ...overrides,
    };
  }

  static createAPIResponse<T>(data: T, overrides = {}) {
    return {
      success: true,
      data,
      timestamp: Date.now(),
      ...overrides,
    };
  }
}
```

### **12. Mock 헬퍼**

```typescript
// 간단한 Mock 헬퍼 템플릿
export const createMockFetch = (responses: Record<string, any>) => {
  return vi.fn().mockImplementation((url: string) => {
    const response = responses[url] || { status: 404 };
    return Promise.resolve({
      ok: response.status < 400,
      status: response.status,
      json: () => Promise.resolve(response.data),
      text: () => Promise.resolve(JSON.stringify(response.data)),
    });
  });
};

export const mockConsole = () => {
  const originalLog = console.log;
  const originalError = console.error;

  beforeEach(() => {
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
  });
};
```

## 🎯 **테스트 작성 시 권장사항**

### **✅ Do's (해야 할 것)**

- **명확한 테스트 이름** 작성 (`should return formatted date for valid input`)
- **Given-When-Then 패턴** 사용
- **Edge Case와 Error Case** 포함
- **테스트 데이터 빌더** 활용
- **간단하고 읽기 쉬운** 구조 유지

### **❌ Don'ts (하지 말아야 할 것)**

- **복잡한 Mock 체인** 구성 (3개 이상 의존성)
- **실제 환경과 다른 Mock** 동작
- **테스트를 위한 테스트** (의미 없는 100% 커버리지)
- **환경 의존적 테스트** (로컬에서만 통과)
- **한 테스트에서 여러 것** 검증

### **🏆 좋은 테스트의 특징**

1. **빠르다** (1초 이내)
2. **독립적이다** (다른 테스트에 영향 안받음)
3. **반복가능하다** (언제든 같은 결과)
4. **자가 검증한다** (통과/실패 명확)
5. **적시에 작성된다** (기능 구현과 함께)

---

## 🎯 **최종 권장사항**

**"테스트는 품질 보장의 도구, 목적은 안정적인 서비스"**

1. **간단한 것은 철저히** → Unit Tests로 빠른 피드백
2. **복잡한 것은 실제로** → Staging/Production 검증
3. **의미 있는 것만** → 유지보수 비용 고려
4. **실용적 접근** → 완벽한 커버리지보다 핵심 기능

**클라우드 네이티브 환경에서는 실제 환경 테스트가 Mock보다 더 신뢰할 수 있습니다** 🚀

---

_📅 작성일: 2025-09-24_
_📝 작성자: Claude Code AI_
_🔄 참조: [Test Strategy Guide](./test-strategy-guide.md)_
