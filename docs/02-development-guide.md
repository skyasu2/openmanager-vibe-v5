# ⚙️ OpenManager Vibe V5 개발 가이드

> 개발 환경 설정, 코딩 규칙, 컴포넌트 구조 완전 가이드

## 📋 목차

1. [개발 환경 설정](#개발-환경-설정)
2. [프로젝트 구조](#프로젝트-구조)
3. [코딩 규칙](#코딩-규칙)
4. [컴포넌트 가이드](#컴포넌트-가이드)
5. [상태 관리](#상태-관리)
6. [스타일링](#스타일링)
7. [성능 최적화](#성능-최적화)

---

## 🚀 개발 환경 설정

### 필수 요구사항

```bash
Node.js: 18.0.0+
npm: 9.0.0+
Git: 2.30.0+
VS Code/Cursor: 최신 버전
```

### 로컬 개발 환경 구축

#### 1. 저장소 클론 및 의존성 설치
```bash
# 저장소 클론
git clone https://github.com/skyasu2/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
```

#### 2. 환경 변수 설정
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

#### 3. 개발 서버 실행
```bash
# 개발 서버 시작
npm run dev

# 타입 검사
npm run type-check

# 린트 검사
npm run lint

# 빌드 테스트
npm run build
```

### 추천 VS Code 확장

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-json"
  ]
}
```

---

## 📁 프로젝트 구조

### 디렉토리 구조

```
src/
├── 📁 app/                    # Next.js App Router
│   ├── 📁 (routes)/
│   │   ├── 📁 demo/           # 데모 페이지
│   │   ├── 📁 dashboard/      # 대시보드
│   │   └── 📄 page.tsx        # 랜딩 페이지
│   ├── 📁 api/                # API 라우트
│   │   ├── 📁 servers/        # 서버 API
│   │   ├── 📁 alerts/         # 알림 API
│   │   └── 📁 health/         # 헬스 체크
│   ├── 📄 layout.tsx          # 루트 레이아웃
│   ├── 📄 globals.css         # 글로벌 스타일
│   └── 📄 not-found.tsx       # 404 페이지
├── 📁 components/             # UI 컴포넌트
│   ├── 📁 demo/               # 데모 전용 컴포넌트
│   │   ├── 📄 ServerCard.tsx
│   │   ├── 📄 AIChatPanel.tsx
│   │   └── 📄 AutoDemoScenario.tsx
│   ├── 📁 ui/                 # 공통 UI 컴포넌트
│   │   ├── 📄 Button.tsx
│   │   ├── 📄 Card.tsx
│   │   ├── 📄 Modal.tsx
│   │   └── 📄 Loading.tsx
│   └── 📁 charts/             # 차트 컴포넌트
├── 📁 stores/                 # 상태 관리 (Zustand)
│   ├── 📄 demoStore.ts        # 데모 상태
│   ├── 📄 serverStore.ts      # 서버 상태
│   └── 📄 authStore.ts        # 인증 상태
├── 📁 lib/                    # 유틸리티 & 설정
│   ├── 📄 supabase.ts         # Supabase 클라이언트
│   ├── 📄 redis.ts            # Redis 클라이언트
│   ├── 📄 utils.ts            # 공통 유틸리티
│   └── 📄 constants.ts        # 상수 정의
├── 📁 types/                  # TypeScript 타입
│   ├── 📄 demo.ts             # 데모 타입
│   ├── 📄 server.ts           # 서버 타입
│   └── 📄 global.ts           # 전역 타입
├── 📁 hooks/                  # 커스텀 훅
│   ├── 📄 useServerMetrics.ts
│   ├── 📄 useRealtime.ts
│   └── 📄 useLocalStorage.ts
└── 📁 styles/                 # CSS Modules
    ├── 📄 landing.module.css
    ├── 📄 demo.module.css
    └── 📄 components.module.css
```

### 파일 명명 규칙

#### 컴포넌트
```
✅ PascalCase
ServerCard.tsx
AIChatPanel.tsx
MetricChart.tsx

❌ 잘못된 예
serverCard.tsx
ai-chat-panel.tsx
metric_chart.tsx
```

#### 훅 & 유틸리티
```
✅ camelCase
useServerMetrics.ts
formatDateTime.ts
calculateUsage.ts

❌ 잘못된 예
UseServerMetrics.ts
format-date-time.ts
calculate_usage.ts
```

#### 타입 & 인터페이스
```
✅ PascalCase
interface ServerMetrics {}
type ServerStatus = 'healthy' | 'warning' | 'critical';

❌ 잘못된 예
interface serverMetrics {}
type server_status = string;
```

---

## 📐 코딩 규칙

### TypeScript 규칙

#### 1. 엄격한 타입 정의
```typescript
// ✅ 좋은 예: 명확한 타입 정의
interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: Date;
}

interface Server {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  metrics: ServerMetrics;
  uptime: number;
}

// ❌ 나쁜 예: any 타입 사용
const server: any = {
  id: 'server-1',
  metrics: {}
};
```

#### 2. 유니온 타입 활용
```typescript
// ✅ 좋은 예: 유니온 타입으로 가능한 값 제한
type ServerStatus = 'healthy' | 'warning' | 'critical';
type MetricType = 'cpu' | 'memory' | 'disk' | 'network';

// ❌ 나쁜 예: 문자열 타입으로 모든 값 허용
type ServerStatus = string;
```

#### 3. 제네릭 활용
```typescript
// ✅ 좋은 예: 재사용 가능한 제네릭 함수
function createApiClient<T>(baseUrl: string): ApiClient<T> {
  return new ApiClient<T>(baseUrl);
}

// 타입 안전한 API 호출
const serverApi = createApiClient<Server>('/api/servers');
```

### React 컴포넌트 규칙

#### 1. 함수 컴포넌트 + 타입 정의
```tsx
// ✅ 좋은 예: Props 인터페이스 정의
interface ServerCardProps {
  server: Server;
  isHighlighted?: boolean;
  onClick?: (server: Server) => void;
}

export default function ServerCard({ 
  server, 
  isHighlighted = false, 
  onClick 
}: ServerCardProps) {
  return (
    <div className={`card ${isHighlighted ? 'highlighted' : ''}`}>
      {/* 컴포넌트 내용 */}
    </div>
  );
}
```

#### 2. 이벤트 핸들러 명명
```tsx
// ✅ 좋은 예: handle + 동작 + 대상
const handleServerClick = (server: Server) => { /* ... */ };
const handleMetricUpdate = (metrics: ServerMetrics) => { /* ... */ };
const handleModalClose = () => { /* ... */ };

// ❌ 나쁜 예: 불명확한 이름
const onClick = () => { /* ... */ };
const updateStuff = () => { /* ... */ };
```

#### 3. 조건부 렌더링
```tsx
// ✅ 좋은 예: 명확한 조건부 렌더링
{server.status === 'critical' && (
  <AlertIcon className="text-red-500" />
)}

{servers.length > 0 ? (
  <ServerGrid servers={servers} />
) : (
  <EmptyState message="서버가 없습니다" />
)}

// ❌ 나쁜 예: 복잡한 삼항 연산자
{server ? server.status === 'critical' ? 
  <AlertIcon /> : server.status === 'warning' ? 
  <WarningIcon /> : <OkIcon /> : null}
```

### 성능 최적화 규칙

#### 1. React.memo 활용
```tsx
// ✅ 좋은 예: 메모이제이션으로 불필요한 리렌더링 방지
export default React.memo(function ServerCard({ server, isHighlighted }: ServerCardProps) {
  return (
    <div className={`card ${isHighlighted ? 'highlighted' : ''}`}>
      {/* ... */}
    </div>
  );
});
```

#### 2. useMemo & useCallback
```tsx
// ✅ 좋은 예: 비용이 높은 계산 메모이제이션
const sortedServers = useMemo(() => 
  servers.sort((a, b) => b.metrics.cpu - a.metrics.cpu),
  [servers]
);

const handleServerClick = useCallback((server: Server) => {
  setSelectedServer(server);
}, []);
```

---

## 🧩 컴포넌트 가이드

### 핵심 컴포넌트

#### 1. ServerCard 컴포넌트

```tsx
// src/components/demo/ServerCard.tsx
interface ServerCardProps {
  server: Server;
  isHighlighted?: boolean;
  onClick?: (server: Server) => void;
  className?: string;
}

export default function ServerCard({ 
  server, 
  isHighlighted = false, 
  onClick,
  className = ''
}: ServerCardProps) {
  const getStatusColor = (status: Server['status']) => {
    switch (status) {
      case 'healthy': return 'border-green-500 bg-green-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'critical': return 'border-red-500 bg-red-50';
    }
  };

  return (
    <motion.div
      className={`
        relative p-4 rounded-xl border-2 cursor-pointer transition-all
        ${isHighlighted ? 'border-blue-500 bg-blue-50' : getStatusColor(server.status)}
        ${className}
      `}
      onClick={() => onClick?.(server)}
      whileHover={{ scale: 1.02 }}
      animate={isHighlighted ? { scale: 1.05 } : { scale: 1 }}
    >
      {/* 서버 정보 렌더링 */}
    </motion.div>
  );
}
```

#### 2. AIChatPanel 컴포넌트

```tsx
// src/components/demo/AIChatPanel.tsx
interface AIChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isTyping?: boolean;
}

export default function AIChatPanel({ 
  messages, 
  onSendMessage, 
  isTyping = false 
}: AIChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 메시지 리스트 */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="서버에 대해 질문해보세요..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 공통 UI 컴포넌트

#### 1. Button 컴포넌트

```tsx
// src/components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2';
  
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}
```

#### 2. Modal 컴포넌트

```tsx
// src/components/ui/Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'md' 
}: ModalProps) {
  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* 배경 오버레이 */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* 모달 컨텐츠 */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            className={`
              relative w-full ${maxWidthStyles[maxWidth]} bg-white rounded-lg shadow-xl
            `}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            {/* 헤더 */}
            {title && (
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* 컨텐츠 */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 🗄️ 상태 관리

### Zustand Store 패턴

#### 1. 데모 스토어 구조

```typescript
// src/stores/demoStore.ts
interface DemoStore {
  // State
  servers: Server[];
  chatMessages: ChatMessage[];
  selectedServer: Server | null;
  highlightedServers: string[];
  isAutoDemo: boolean;
  isTyping: boolean;

  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  highlightServers: (serverIds: string[]) => void;
  clearHighlights: () => void;
  selectServer: (server: Server | null) => void;
  updateServerMetrics: (serverId: string, metrics: Partial<ServerMetrics>) => void;
  setAutoDemo: (isAuto: boolean) => void;
  resetDemo: () => void;
}

export const useDemoStore = create<DemoStore>((set, get) => ({
  // Initial state
  servers: generateServers(),
  chatMessages: [],
  selectedServer: null,
  highlightedServers: [],
  isAutoDemo: false,
  isTyping: false,

  // Actions
  addMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date()
    }]
  })),

  highlightServers: (serverIds) => set({ 
    highlightedServers: serverIds 
  }),

  clearHighlights: () => set({ 
    highlightedServers: [] 
  }),

  updateServerMetrics: (serverId, metrics) => set((state) => ({
    servers: state.servers.map(server =>
      server.id === serverId
        ? { ...server, metrics: { ...server.metrics, ...metrics } }
        : server
    )
  })),

  resetDemo: () => set({
    chatMessages: [],
    selectedServer: null,
    highlightedServers: [],
    isAutoDemo: false,
    isTyping: false
  })
}));
```

#### 2. 스토어 사용법

```tsx
// 컴포넌트에서 스토어 사용
export default function DemoPage() {
  const {
    servers,
    chatMessages,
    highlightedServers,
    addMessage,
    highlightServers,
    updateServerMetrics
  } = useDemoStore();

  // 선택적 구독 (성능 최적화)
  const isTyping = useDemoStore(state => state.isTyping);
  const selectedServer = useDemoStore(state => state.selectedServer);

  const handleSendMessage = (content: string) => {
    addMessage({
      type: 'user',
      content
    });

    // AI 응답 시뮬레이션
    setTimeout(() => {
      addMessage({
        type: 'ai',
        content: '분석 중입니다...'
      });
    }, 1000);
  };

  return (
    <div className="demo-container">
      {/* 컴포넌트 내용 */}
    </div>
  );
}
```

---

## 🎨 스타일링

### CSS Modules + Tailwind 조합

#### 1. CSS Modules 사용법

```css
/* src/styles/demo.module.css */
.demoContainer {
  @apply h-screen bg-gray-50 flex flex-col;
}

.chatPanel {
  @apply w-2/5 border-r border-gray-200;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.serverGrid {
  @apply flex-1 p-6 overflow-auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.serverCard {
  @apply p-4 rounded-xl border-2 cursor-pointer transition-all;
}

.serverCard.highlighted {
  @apply border-blue-500 bg-blue-50 shadow-xl;
  transform: scale(1.05);
}
```

```tsx
// 컴포넌트에서 사용
import styles from '@/styles/demo.module.css';

export default function DemoPage() {
  return (
    <div className={styles.demoContainer}>
      <div className={styles.chatPanel}>
        {/* AI 채팅 */}
      </div>
      <div className={styles.serverGrid}>
        {/* 서버 그리드 */}
      </div>
    </div>
  );
}
```

#### 2. 동적 스타일링

```tsx
// 조건부 클래스 적용
const getServerCardClass = (server: Server, isHighlighted: boolean) => {
  return `
    ${styles.serverCard}
    ${isHighlighted ? styles.highlighted : ''}
    ${server.status === 'critical' ? 'border-red-500' : ''}
    ${server.status === 'warning' ? 'border-yellow-500' : ''}
    ${server.status === 'healthy' ? 'border-green-500' : ''}
  `.trim();
};
```

### Framer Motion 애니메이션

#### 1. 기본 애니메이션

```tsx
// 페이드인 애니메이션
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {/* 컨텐츠 */}
</motion.div>

// 스케일 애니메이션
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 300 }}
>
  {/* 버튼 컨텐츠 */}
</motion.div>
```

#### 2. 복잡한 애니메이션

```tsx
// 서버 하이라이트 애니메이션
<motion.div
  animate={isHighlighted ? {
    scale: 1.05,
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)"
  } : {
    scale: 1,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  }}
  transition={{ duration: 0.2 }}
>
  {/* 서버 카드 */}
</motion.div>

// 펄스 효과
{isHighlighted && (
  <motion.div
    className="absolute -inset-1 rounded-xl bg-blue-500 opacity-20"
    animate={{
      opacity: [0.2, 0.5, 0.2],
      scale: [1, 1.02, 1]
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
)}
```

---

## 🚀 성능 최적화

### 렌더링 최적화

#### 1. React.memo 패턴

```tsx
// 서버 카드 메모이제이션
export default React.memo(function ServerCard({ 
  server, 
  isHighlighted, 
  onClick 
}: ServerCardProps) {
  return (
    <div className={`card ${isHighlighted ? 'highlighted' : ''}`}>
      {/* 컴포넌트 내용 */}
    </div>
  );
});

// 커스텀 비교 함수
export default React.memo(ServerCard, (prevProps, nextProps) => {
  return (
    prevProps.server.id === nextProps.server.id &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.server.metrics.cpu === nextProps.server.metrics.cpu
  );
});
```

#### 2. useMemo & useCallback

```tsx
export default function ServerList({ servers }: { servers: Server[] }) {
  // 비용이 높은 계산 메모이제이션
  const sortedServers = useMemo(() => 
    servers
      .filter(server => server.status !== 'healthy')
      .sort((a, b) => {
        const priorityMap = { critical: 3, warning: 2, healthy: 1 };
        return priorityMap[b.status] - priorityMap[a.status];
      }),
    [servers]
  );

  // 이벤트 핸들러 메모이제이션
  const handleServerClick = useCallback((server: Server) => {
    console.log('Server clicked:', server.name);
    // 서버 선택 로직
  }, []);

  return (
    <div className="server-list">
      {sortedServers.map(server => (
        <ServerCard
          key={server.id}
          server={server}
          onClick={handleServerClick}
        />
      ))}
    </div>
  );
}
```

### 번들 최적화

#### 1. 동적 임포트

```tsx
// 페이지 레벨 코드 분할
const DemoPage = dynamic(() => import('@/app/demo/page'), {
  loading: () => <Loading />,
  ssr: false
});

// 컴포넌트 레벨 코드 분할
const ChartComponent = dynamic(() => import('@/components/Chart'), {
  loading: () => <div>차트 로딩 중...</div>
});
```

#### 2. 이미지 최적화

```tsx
import Image from 'next/image';

// Next.js Image 컴포넌트 사용
<Image
  src="/logo.png"
  alt="OpenManager Logo"
  width={200}
  height={100}
  priority={true}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

---

**작성자**: 개인 프로젝트 (바이브 코딩)  
**문서 버전**: v5.1  
**마지막 업데이트**: 2024년 현재 