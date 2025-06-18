# 🛠️ OpenManager Vibe v5.44.0 - 개발 가이드

> **📅 최종 업데이트**: 2025년 6월 15일  
> **🎯 버전**: v5.44.0  
> **✅ 상태**: 개발 환경 완료  
> **📝 통합 문서**: developer-guide.md, DEV-WORKFLOW-GUIDE.md, DEVELOPMENT-METHODOLOGY-COMPARISON.md 내용 통합

OpenManager Vibe v5.44.0의 **개발자 완전 가이드**입니다.

## 🚀 개발 환경 설정

### 필수 요구사항

- Node.js 18+ (권장: 20.x LTS)
- npm 9+ 또는 yarn 1.22+
- Git 최신 버전
- IDE: VS Code (권장) 또는 Cursor IDE

### 프로젝트 클론 및 설치

```bash
# 프로젝트 클론
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 개발 환경 설정
cp vercel.env.template .env.local
```

## 📁 프로젝트 구조

```
openmanager-vibe-v5/
├── src/                    # 소스 코드
│   ├── app/               # Next.js App Router
│   ├── components/        # React 컴포넌트
│   ├── hooks/            # React 훅
│   ├── lib/              # 유틸리티 라이브러리
│   ├── services/         # 비즈니스 로직
│   ├── stores/           # 상태 관리
│   └── types/            # TypeScript 타입
├── docs/                  # 문서
├── development/           # 개발 도구
├── infra/                 # 인프라 설정
└── tests/                 # 테스트 코드
```

## 🔧 개발 명령어

### 기본 명령어

```bash
# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 실행
npm run start

# 타입 체크
npm run type-check

# 린트 검사
npm run lint

# 테스트 실행
npm run test
```

### 검증 명령어

```bash
# 빠른 검증 (5분)
npm run validate:quick

# 전체 검증 (15분)
npm run validate:all

# 특정 검증
npm run validate:types    # TypeScript
npm run validate:lint     # ESLint
npm run validate:test     # Jest
npm run validate:build    # Build
```

## 🧪 테스트 전략

### 테스트 유형

1. **단위 테스트** (`tests/unit/`)

   - React 컴포넌트 테스트
   - 유틸리티 함수 테스트
   - 서비스 로직 테스트

2. **통합 테스트** (`tests/integration/`)

   - API 엔드포인트 테스트
   - 데이터베이스 연동 테스트
   - AI 엔진 통합 테스트

3. **E2E 테스트** (`e2e/`)
   - 사용자 시나리오 테스트
   - 브라우저 자동화 테스트

### 테스트 실행

```bash
# 단위 테스트
npm run test:unit

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e

# 커버리지 포함 테스트
npm run test:coverage

# 워치 모드
npm run test:watch
```

## 🎯 개발 워크플로우

### 1️⃣ 기능 개발 프로세스

```bash
# 1. 새 브랜치 생성
git checkout -b feature/amazing-feature

# 2. 개발 서버 시작
npm run dev

# 3. 변경사항 개발
# - 코드 작성
# - 테스트 작성
# - 문서 업데이트

# 4. 검증 실행
npm run validate:quick

# 5. 커밋
git add .
git commit -m "feat: add amazing feature"

# 6. 푸시 및 PR 생성
git push origin feature/amazing-feature
```

### 2️⃣ 코드 품질 관리

#### ESLint 설정

```json
// eslint.config.mjs
export default [
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'prefer-const': 'error'
    }
  }
];
```

#### Prettier 설정

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 3️⃣ TypeScript 개발

#### 타입 정의

```typescript
// src/types/server.ts
export interface Server {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  metrics: ServerMetrics;
}

export interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: NetworkMetrics;
}
```

#### 훅 사용

```typescript
// src/hooks/useServerData.ts
export function useServerData(serverId: string) {
  const [data, setData] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServerData(serverId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [serverId]);

  return { data, loading };
}
```

## 🎨 UI 개발

### Tailwind CSS 사용

```typescript
// 컴포넌트 스타일링
export function ServerCard({ server }: { server: Server }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900">
        {server.name}
      </h3>
      <div className="mt-4 flex items-center">
        <StatusIndicator status={server.status} />
        <span className="ml-2 text-sm text-gray-600">
          {server.status}
        </span>
      </div>
    </div>
  );
}
```

### Shadcn/ui 컴포넌트

```bash
# 컴포넌트 설치
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog

# 사용 예시
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
```

## 🤖 AI 기능 개발

### AI 서비스 사용

```typescript
// src/services/ai/analysis.ts
import { GoogleAIService } from './google-ai';

export class ServerAnalysisService {
  private aiService = new GoogleAIService();

  async analyzeServer(serverData: ServerMetrics): Promise<AnalysisResult> {
    const prompt = `
      다음 서버 메트릭을 분석해주세요:
      CPU: ${serverData.cpu}%
      Memory: ${serverData.memory}%
      Disk: ${serverData.disk}%
    `;

    const response = await this.aiService.generate(prompt);
    return this.parseAnalysisResult(response);
  }
}
```

### MCP 통합

```typescript
// src/services/mcp/client.ts
export class MCPClient {
  async queryContext(query: string): Promise<ContextResult> {
    const response = await fetch('/api/mcp/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    return response.json();
  }
}
```

## 📊 상태 관리

### Zustand Store 사용

```typescript
// src/stores/useServerStore.ts
import { create } from 'zustand';

interface ServerStore {
  servers: Server[];
  selectedServer: Server | null;
  loading: boolean;
  fetchServers: () => Promise<void>;
  selectServer: (server: Server) => void;
}

export const useServerStore = create<ServerStore>((set, get) => ({
  servers: [],
  selectedServer: null,
  loading: false,

  fetchServers: async () => {
    set({ loading: true });
    const servers = await fetchServerList();
    set({ servers, loading: false });
  },

  selectServer: server => set({ selectedServer: server }),
}));
```

## 🔄 실시간 데이터

### WebSocket 연결

```typescript
// src/hooks/useRealTimeData.ts
export function useRealTimeData<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3000${endpoint}`);

    ws.onopen = () => setConnected(true);
    ws.onmessage = event => setData(JSON.parse(event.data));
    ws.onclose = () => setConnected(false);

    return () => ws.close();
  }, [endpoint]);

  return { data, connected };
}
```

## 🛡️ 에러 처리

### Error Boundary

```typescript
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

### API 에러 처리

```typescript
// src/lib/api-client.ts
export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }

    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

## 🚀 성능 최적화

### React 최적화

```typescript
// React.memo 사용
export const ServerCard = React.memo(({ server }: Props) => {
  return <div>{/* 컴포넌트 내용 */}</div>;
});

// useMemo 사용
export function ServerList({ servers }: Props) {
  const filteredServers = useMemo(
    () => servers.filter(server => server.status === 'online'),
    [servers]
  );

  return <div>{/* 목록 렌더링 */}</div>;
}

// useCallback 사용
export function ServerManager() {
  const handleServerSelect = useCallback((server: Server) => {
    // 서버 선택 로직
  }, []);

  return <ServerList onSelect={handleServerSelect} />;
}
```

### 번들 최적화

```typescript
// Dynamic import 사용
const AdminPanel = lazy(() => import('./AdminPanel'));

// 코드 분할
export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminPanel />
    </Suspense>
  );
}
```

## 📚 디버깅 및 도구

### 개발자 도구

```bash
# React DevTools
npm install -g react-devtools

# Bundle Analyzer
npm run analyze

# Lighthouse 성능 측정
npm run lighthouse
```

### 로깅

```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
  },
};
```

## 🔗 유용한 링크

### 개발 도구

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com/)

### 프로젝트 관련

- [API 문서](API.md)
- [아키텍처 가이드](ARCHITECTURE.md)
- [배포 가이드](DEPLOYMENT.md)
- [테스트 가이드](TESTING.md)

## 🆘 문제 해결

개발 중 문제가 발생하면:

1. [GitHub Issues](https://github.com/your-username/openmanager-vibe-v5/issues)
2. [개발자 Discord](https://discord.gg/openmanager-dev)
3. [Stack Overflow](https://stackoverflow.com/questions/tagged/openmanager)

## 📋 체크리스트

개발 완료 전 확인사항:

- [ ] TypeScript 에러 없음
- [ ] ESLint 경고 없음
- [ ] 테스트 통과
- [ ] 성능 최적화 완료
- [ ] 문서 업데이트
- [ ] 코드 리뷰 완료
