# 🛠️ OpenManager AI 개발 가이드

## 📋 **목차**
1. [개발 환경 설정](#개발-환경-설정)
2. [프로젝트 구조](#프로젝트-구조)
3. [컴포넌트 개발](#컴포넌트-개발)
4. [MCP 엔진 확장](#mcp-엔진-확장)
5. [스타일 가이드](#스타일-가이드)
6. [테스트](#테스트)
7. [배포](#배포)

---

## 🔧 **개발 환경 설정**

### **필수 요구사항**
- **Node.js** 18.0+
- **npm** 9.0+
- **Git** 2.30+
- **VS Code** (권장)

### **권장 VS Code 확장**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

### **개발 서버 실행**
```bash
# 개발 서버 시작
npm run dev

# 타입 체크
npm run type-check

# 린팅
npm run lint

# 빌드
npm run build
```

---

## 🏗️ **프로젝트 구조**

### **디렉터리 구조**
```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 랜딩 페이지
│   ├── dashboard/         # 대시보드 라우트
│   └── api/               # API 라우트
├── components/            # React 컴포넌트
│   ├── dashboard/         # 서버 모니터링 UI
│   ├── ai/               # AI 에이전트 UI
│   └── ui/               # 공통 UI 컴포넌트
├── modules/              # 비즈니스 로직 모듈
│   └── mcp/             # MCP 엔진
├── services/            # 서비스 레이어
├── types/              # TypeScript 타입 정의
├── hooks/              # 커스텀 React Hooks
├── lib/                # 유틸리티 함수
└── styles/             # 글로벌 스타일
```

### **파일 명명 규칙**
- **컴포넌트**: PascalCase (`ServerCard.tsx`)
- **유틸리티**: camelCase (`formatDate.ts`)
- **타입**: PascalCase (`ServerTypes.ts`)
- **상수**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

---

## ⚛️ **컴포넌트 개발**

### **컴포넌트 템플릿**
```typescript
'use client';

import { useState } from 'react';

interface ComponentNameProps {
  // props 정의
}

export default function ComponentName({ }: ComponentNameProps) {
  const [state, setState] = useState();

  return (
    <div className="">
      {/* JSX */}
    </div>
  );
}
```

### **Props 인터페이스 패턴**
```typescript
// 기본 Props
interface BaseProps {
  children?: React.ReactNode;
  className?: string;
}

// 이벤트 핸들러
interface EventProps {
  onClick?: () => void;
  onSubmit?: (data: FormData) => void;
}

// 데이터 Props
interface DataProps {
  server: Server;
  isLoading: boolean;
}
```

### **상태 관리 패턴**
```typescript
// 로컬 상태
const [isOpen, setIsOpen] = useState(false);

// 복잡한 상태
const [state, setState] = useState({
  data: null,
  loading: false,
  error: null
});

// Effect 훅
useEffect(() => {
  // 부수 효과
}, [dependencies]);
```

---

## 🧠 **MCP 엔진 확장**

### **새로운 인텐트 추가**
```typescript
// src/modules/mcp/index.ts
private initializePatterns() {
  // 기존 패턴...
  
  // 새로운 인텐트 추가
  this.intentPatterns.set('custom_intent', [
    /커스텀.*패턴/i,
    /새로운.*키워드/i
  ]);
}

// 응답 생성기 추가
private generateCustomIntentResponse(entities: any, serverData?: any): string {
  return `커스텀 응답 로직`;
}
```

### **엔티티 추출 확장**
```typescript
private extractEntities(query: string): Record<string, any> {
  const entities: Record<string, any> = {};
  
  // 기존 추출 로직...
  
  // 새로운 엔티티 추가
  const customMatch = query.match(/새로운패턴/gi);
  if (customMatch) {
    entities.customEntity = customMatch[0];
  }
  
  return entities;
}
```

---

## 🎨 **스타일 가이드**

### **Tailwind CSS 클래스 순서**
```typescript
// 1. Layout
"flex grid w-full h-full"

// 2. Spacing
"p-4 m-2 gap-3"

// 3. Typography
"text-lg font-bold"

// 4. Colors
"bg-white text-gray-900 border-gray-200"

// 5. Effects
"shadow-lg rounded-xl opacity-90"

// 6. Interactions
"hover:shadow-xl transition-all"
```

### **컬러 팔레트**
```typescript
// Primary Colors
"bg-purple-600"   // AI 브랜드 컬러
"bg-blue-600"     // 보조 컬러
"bg-gray-50"      // 배경 컬러

// Status Colors
"bg-green-500"    // 성공/온라인
"bg-yellow-500"   // 경고
"bg-red-500"      // 에러/오프라인

// Glassmorphism
"bg-white/95 backdrop-blur-sm"
```

### **애니메이션 패턴**
```typescript
// Transitions
"transition-all duration-300"

// Hover Effects
"hover:shadow-xl hover:-translate-y-1"

// Loading
"animate-bounce animate-spin animate-pulse"
```

---

## 📊 **타입 정의**

### **서버 관련 타입**
```typescript
// src/types/server.ts
export interface Server {
  id: string;
  name: string;
  status: ServerStatus;
  metrics: ServerMetrics;
  // ...
}

export type ServerStatus = 'online' | 'offline' | 'warning';
```

### **AI 관련 타입**
```typescript
// src/types/ai.ts
export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  serverId?: string;
}

export interface MCPIntent {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  context: string[];
}
```

---

## 🧪 **테스트**

### **단위 테스트 예시**
```typescript
// __tests__/components/ServerCard.test.tsx
import { render, screen } from '@testing-library/react';
import ServerCard from '@/components/dashboard/ServerCard';

describe('ServerCard', () => {
  it('renders server information correctly', () => {
    const mockServer = {
      id: 'test-1',
      name: 'Test Server',
      status: 'online' as const,
      // ...
    };

    render(<ServerCard server={mockServer} onClick={() => {}} />);
    
    expect(screen.getByText('Test Server')).toBeInTheDocument();
  });
});
```

### **MCP 엔진 테스트**
```typescript
// __tests__/modules/mcp.test.ts
import { MCPProcessor } from '@/modules/mcp';

describe('MCPProcessor', () => {
  it('classifies server status intent correctly', async () => {
    const processor = MCPProcessor.getInstance();
    const result = await processor.processQuery('서버 상태를 알려주세요');
    
    expect(result.intent.intent).toBe('server_status');
    expect(result.intent.confidence).toBeGreaterThan(0.5);
  });
});
```

---

## 🚀 **배포**

### **Vercel 배포**
```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포
vercel --prod
```

### **환경 변수 설정**
```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### **빌드 최적화**
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    domains: ['your-domain.com'],
  },
};
```

---

## 🔧 **개발 팁**

### **디버깅**
```typescript
// 개발 모드에서만 로그
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// 조건부 렌더링 디버그
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-0 right-0 bg-red-500 text-white p-2">
    Debug Panel
  </div>
)}
```

### **성능 최적화**
```typescript
// React.memo 사용
export default React.memo(function Component({ data }) {
  // 컴포넌트 로직
});

// useMemo로 비싼 계산 캐싱
const expensiveValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// useCallback으로 함수 메모이제이션
const handleClick = useCallback(() => {
  // 핸들러 로직
}, [dependencies]);
```

---

## 📞 **개발 지원**

### **문제 해결**
1. **개발 서버 문제**: 포트 충돌 시 `npm run dev -- -p 3001`
2. **타입 에러**: `npm run type-check`로 확인
3. **스타일 문제**: Tailwind CSS 클래스 순서 확인

### **커뮤니티**
- **GitHub Issues**: 버그 리포트 및 기능 요청
- **Discord**: 실시간 개발자 채팅
- **Documentation**: 상세 API 문서

---

<div align="center">
  <h3>🛠️ 효율적인 개발을 위한 가이드라인을 따라 개발해주세요! 🚀</h3>
</div> 