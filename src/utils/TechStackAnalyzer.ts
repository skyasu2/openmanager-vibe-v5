/**
 * 🧩 TechStackAnalyzer - 기술 스택 자동 분석 유틸리티
 *
 * 각 기능 카드에서 사용된 기술들을 자동으로 분석하고 역할별로 분류합니다.
 */

export interface TechItem {
  name: string;
  category: string;
  description: string;
  usage: string;
  importance: 'critical' | 'high' | 'medium' | 'low' | 'showcase';
  version?: string;
  role?: string;
  isCore?: boolean;
  usageCount?: number;
  categories?: string[];
}

export interface TechCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  items: TechItem[];
}

// 기술 데이터베이스 - 실제 사용되는 기술들의 정보
const TECH_DATABASE: Record<string, Omit<TechItem, 'usage'>> = {
  // Frontend Framework & Core
  'next.js': {
    name: 'Next.js 15',
    category: 'frontend-framework',
    description: 'React 기반 풀스택 프레임워크 (App Router)',
    importance: 'high',
    isCore: true,
  },
  react: {
    name: 'React 19',
    category: 'frontend-framework',
    description: '선언적 사용자 인터페이스 라이브러리',
    importance: 'high',
    isCore: true,
  },
  typescript: {
    name: 'TypeScript',
    category: 'frontend-framework',
    description: '정적 타입 시스템으로 개발 안정성 확보',
    importance: 'high',
    isCore: true,
  },

  // Styling & UI
  tailwindcss: {
    name: 'Tailwind CSS 3.x',
    category: 'ui-styling',
    description: '유틸리티 우선 CSS 프레임워크',
    importance: 'high',
  },
  'framer-motion': {
    name: 'Framer Motion',
    category: 'ui-styling',
    description: 'React용 강력한 애니메이션 라이브러리',
    importance: 'medium',
  },
  'lucide-react': {
    name: 'Lucide React',
    category: 'ui-styling',
    description: '깔끔한 SVG 아이콘 컬렉션',
    importance: 'low',
  },
  clsx: {
    name: 'clsx',
    category: 'ui-styling',
    description: '조건부 클래스명 결합 유틸리티',
    importance: 'low',
  },
  '@radix-ui/react-tabs': {
    name: 'Radix UI',
    category: 'ui-styling',
    description: '접근성 우선 headless UI 컴포넌트',
    importance: 'medium',
  },

  // State Management
  zustand: {
    name: 'Zustand',
    category: 'state-management',
    description: '가벼운 전역 상태 관리 + 로컬 저장소',
    importance: 'high',
  },
  '@tanstack/react-query': {
    name: 'TanStack Query',
    category: 'state-management',
    description: '서버 상태 관리 및 캐싱 라이브러리',
    importance: 'high',
  },
  'react-query': {
    name: 'React Query',
    category: 'state-management',
    description: '서버 상태 관리 및 데이터 동기화',
    importance: 'high',
  },

  // Database & Backend
  '@supabase/supabase-js': {
    name: 'Supabase',
    category: 'database-backend',
    description: 'PostgreSQL 기반 BaaS (실시간 DB)',
    importance: 'high',
  },
  supabase: {
    name: 'Supabase',
    category: 'database-backend',
    description: 'PostgreSQL 기반 실시간 데이터베이스',
    importance: 'high',
  },
  ioredis: {
    name: 'Upstash for Redis (IORedis)',
    category: 'database-backend',
    description: 'Upstash Redis 전용 Node.js 클라이언트 라이브러리',
    importance: 'high',
    isCore: true,
  },
  redis: {
    name: 'Upstash for Redis',
    category: 'database-backend',
    description: '서버리스 환경을 위한 고성능 클라우드 Redis 서비스',
    importance: 'high',
    isCore: true,
  },
  upstash: {
    name: 'Upstash for Redis',
    category: 'database-backend',
    description: 'Vercel과 완벽 호환되는 서버리스 Redis 키-값 스토어',
    importance: 'high',
    isCore: true,
  },
  '@vercel/kv': {
    name: 'Vercel KV',
    category: 'database-backend',
    description: 'Vercel의 Redis 호환 키-값 스토어',
    importance: 'medium',
  },

  // AI & Machine Learning Core
  '@modelcontextprotocol/server-filesystem': {
    name: 'Model Context Protocol',
    category: 'mcp-engine',
    description: 'AI 에이전트 간 통신 표준 프로토콜 - 컨텍스트 공유 혁신',
    importance: 'high',
    isCore: true,
  },
  '@modelcontextprotocol/sdk': {
    name: 'MCP SDK',
    category: 'mcp-engine',
    description: 'Model Context Protocol 표준 구현 - AI 에이전트 통신',
    importance: 'high',
    isCore: true,
  },
  '@modelcontextprotocol/server-memory': {
    name: 'MCP Memory Server',
    category: 'mcp-engine',
    description: '메모리 기반 상태 관리 MCP 서버',
    importance: 'high',
    isCore: true,
  },
  'mcp-ai-server': {
    name: 'MCP AI Server',
    category: 'mcp-engine',
    description: 'Model Context Protocol 기반 컨텍스트 추론 엔진',
    importance: 'high',
    isCore: true,
  },

  'claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    category: 'ai-development',
    description:
      '현재 메인 AI 모델 - 200K+ 토큰 컨텍스트, 복잡한 로직 구현 특화',
    importance: 'high',
    isCore: true,
  },

  // TensorFlow.js RAG 백업 엔진
  '@tensorflow/tfjs': {
    name: 'TensorFlow.js',
    version: '4.22.0',
    category: 'ai-ml',
    description: 'LSTM 예측, 오토인코더 이상 탐지, RAG 백업 엔진',
    importance: 'high',
    isCore: true,
  },
  '@tensorflow/tfjs-node': {
    name: 'TensorFlow.js Node',
    version: '4.22.0',
    category: 'ai-ml',
    description: 'Node.js TensorFlow 런타임 - 고성능 ML 연산',
    importance: 'high',
    isCore: true,
  },
  'ml-matrix': {
    name: 'ML Matrix',
    version: '6.12.1',
    category: 'ai-ml',
    description: '고속 매트릭스 연산 - 벡터 유사도, 차원 축소',
    importance: 'high',
    isCore: true,
  },
  compromise: {
    name: 'Compromise',
    version: '14.14.4',
    category: 'ai-ml',
    description: '개체명 인식 - 서버명, 로그 엔티티 추출',
    importance: 'medium',
  },

  // AI 엔진 통합 시스템
  'master-ai-engine': {
    name: 'Master AI Engine v4.0',
    category: 'ai-ml',
    description:
      '14개 통합 AI 컴포넌트 관리 - 85% 신뢰도, 4중 폴백 시스템, 100% 가용성 보장',
    importance: 'high',
    isCore: true,
  },
  'mcp-query-engine': {
    name: 'MCP Query Engine',
    category: 'ai-ml',
    description: '핵심 AI 통신 엔진 - 200ms 응답, 85% 신뢰도, 스마트 라우팅',
    importance: 'high',
    isCore: true,
  },
  'tensorflow-js-ai': {
    name: 'TensorFlow.js v4.22',
    category: 'ai-ml',
    description: 'LSTM 장애 예측, 오토인코더 이상 탐지, WebGL 가속 브라우저 ML',
    importance: 'high',
  },
  'simple-statistics-ai': {
    name: 'Simple-Statistics v7.8',
    category: 'ai-ml',
    description:
      '10,000+/초 통계 계산, 95% 정확도 Z-score 분석, 고속 통계 엔진',
    importance: 'high',
  },
  'korean-nlp-ai': {
    name: 'Korean NLP Suite',
    category: 'ai-ml',
    description:
      '한국어 특화 AI - 자체 개발 형태소 분석, 조사 처리, 90% 의도 분류',
    importance: 'high',
  },

  // Server Data Generator Technologies
  mocksystem: {
    name: 'Mock System',
    category: 'data-generation',
    description: 'Mock 데이터를 통한 시스템 시뮬레이션',
    importance: 'high',
    isCore: true,
  },
  baselineoptimizer: {
    name: 'BaselineOptimizer',
    category: 'data-generation',
    description: '시간대별 패턴 엔진 + 서버 타입별 프로파일링',
    importance: 'high',
    isCore: true,
  },
  gcprealdata: {
    name: 'GCPRealDataService',
    category: 'data-generation',
    description: '환경별(개발/프로덕션) 서버 생성 + 클러스터 관리',
    importance: 'high',
    isCore: true,
  },
  timermanager: {
    name: 'TimerManager',
    category: 'data-generation',
    description: '효율적인 타이머 관리로 CPU 75% 절약',
    importance: 'medium',
  },
  memoryoptimizer: {
    name: 'MemoryOptimizer',
    category: 'data-generation',
    description: '메모리 최적화 및 가비지 컬렉션 관리',
    importance: 'medium',
  },
  smartcache: {
    name: 'SmartCache',
    category: 'data-generation',
    description: '지능형 캐싱으로 응답시간 50% 단축',
    importance: 'medium',
  },
  'delta-compression': {
    name: 'Delta Compression',
    category: 'data-generation',
    description: '델타 압축으로 데이터 전송량 65% 감소',
    importance: 'medium',
  },
  'scikit-learn': {
    name: 'Scikit-learn',
    category: 'ai-ml',
    description: 'Python 머신러닝 라이브러리 (이상 탐지)',
    importance: 'high',
  },
  prophet: {
    name: 'Prophet',
    category: 'ai-ml',
    description: 'Facebook의 시계열 예측 라이브러리',
    importance: 'medium',
  },
  natural: {
    name: 'Natural NLP',
    version: '8.1.0',
    category: 'ai-ml',
    description: 'RAG 백업 엔진 - 한국어 토크나이징, 의도 분류',
    importance: 'medium',
  },
  'fuse.js': {
    name: 'Fuse.js',
    version: '7.1.0',
    category: 'ai-ml',
    description: 'RAG 백업 엔진 - 퍼지 문서 검색, 임베딩 매칭',
    importance: 'medium',
  },
  '@xenova/transformers': {
    name: 'Transformers.js',
    category: 'ai-ml',
    description: '브라우저용 Hugging Face 트랜스포머 모델',
    importance: 'medium',
  },

  // Monitoring & Analytics
  'prom-client': {
    name: 'Prometheus Client',
    category: 'monitoring-analytics',
    description: 'Prometheus 메트릭 수집 클라이언트',
    importance: 'high',
  },
  prometheus: {
    name: 'Prometheus',
    category: 'monitoring-analytics',
    description: '시계열 데이터베이스 및 모니터링',
    importance: 'high',
  },
  'simple-statistics': {
    name: 'Simple Statistics',
    version: '7.8.8',
    category: 'ai-ml',
    description: 'Z-score 이상 탐지, 10,000+ 계산/초',
    importance: 'high',
  },

  // Charts & Visualization
  recharts: {
    name: 'Recharts',
    category: 'visualization',
    description: 'React 기반 차트 라이브러리',
    importance: 'high',
  },
  'chart.js': {
    name: 'Chart.js',
    category: 'visualization',
    description: '유연한 차트 생성 라이브러리',
    importance: 'medium',
  },
  'react-chartjs-2': {
    name: 'React Chart.js 2',
    category: 'visualization',
    description: 'Chart.js의 React 래퍼',
    importance: 'medium',
  },
  d3: {
    name: 'D3.js',
    category: 'visualization',
    description: '데이터 기반 문서 조작 라이브러리',
    importance: 'medium',
  },

  // Real-time & Networking
  'socket.io': {
    name: 'Socket.IO',
    category: 'realtime-networking',
    description: '실시간 양방향 통신 라이브러리',
    importance: 'high',
  },
  'socket.io-client': {
    name: 'Socket.IO Client',
    category: 'realtime-networking',
    description: 'Socket.IO 클라이언트 라이브러리',
    importance: 'medium',
  },
  ws: {
    name: 'WebSocket',
    category: 'realtime-networking',
    description: '경량 WebSocket 구현체',
    importance: 'medium',
  },
  sse: {
    name: 'Server-Sent Events',
    category: 'realtime-networking',
    description: '서버에서 클라이언트로 실시간 스트리밍',
    importance: 'medium',
  },

  // Testing & Development
  vitest: {
    name: 'Vitest',
    category: 'testing-dev',
    description: 'Vite 기반 빠른 단위 테스트 프레임워크',
    importance: 'medium',
  },
  '@playwright/test': {
    name: 'Playwright',
    category: 'testing-dev',
    description: '크로스 브라우저 E2E 테스트 도구',
    importance: 'medium',
  },
  storybook: {
    name: 'Storybook',
    category: 'testing-dev',
    description: 'UI 컴포넌트 개발 및 테스트 도구',
    importance: 'low',
  },

  // Utilities & Data Processing
  '@faker-js/faker': {
    name: 'Faker.js',
    category: 'utilities',
    description: '테스트용 가짜 데이터 생성 라이브러리',
    importance: 'low',
  },
  'faker.js': {
    name: 'Faker.js',
    category: 'utilities',
    description: '시뮬레이션용 가짜 데이터 생성',
    importance: 'low',
  },
  'date-fns': {
    name: 'date-fns',
    category: 'utilities',
    description: '모던 JavaScript 날짜 유틸리티',
    importance: 'low',
  },
  zod: {
    name: 'Zod',
    category: 'utilities',
    description: 'TypeScript 우선 스키마 유효성 검사',
    importance: 'medium',
  },

  // Deployment & Infrastructure
  vercel: {
    name: 'Vercel',
    category: 'deployment',
    description: 'Next.js 최적화 서버리스 배포 플랫폼',
    importance: 'high',
  },
  'github-actions': {
    name: 'GitHub Actions',
    category: 'deployment',
    description: 'CI/CD 자동화 워크플로우',
    importance: 'medium',
  },

  // AI Development Tools - Vibe Coding Tech Stack (현재 사용 중)
  'cursor-ai': {
    name: 'Cursor AI',
    version: 'latest',
    role: '이전 메인 AI IDE (현재 미사용)',
    category: 'ai-development',
    importance: 'medium',
    description: '이전에 사용했던 AI IDE, 현재는 Claude Code로 전환',
    isCore: false,
  },
  'claude-code': {
    name: 'Claude Code',
    version: 'Opus 4 + Sonnet 4',
    role: '메인 AI 코딩 도구 (70% 사용)',
    category: 'ai-development',
    importance: 'critical',
    description:
      'Anthropic Claude Opus 4 & Sonnet 4, 복잡한 로직 구현, 대규모 리팩터링',
    isCore: true,
  },
  'gemini-cli': {
    name: 'Gemini CLI',
    version: '2.0 Flash',
    role: '보조 AI 도구 (20% 사용)',
    category: 'ai-development',
    importance: 'high',
    description: '빠른 코드 생성, 간단한 스크립트 작성, CLI 기반 워크플로우',
    isCore: true,
  },
  'aws-kiro': {
    name: 'AWS Kiro',
    version: 'latest',
    role: 'AI IDE 도구 (5% 사용)',
    category: 'ai-development',
    importance: 'medium',
    description: 'AWS 기반 AI 개발 환경, 클라우드 통합 개발',
  },
  'windsurf': {
    name: 'Windsurf',
    version: 'latest',
    role: 'AI IDE 도구 (5% 사용)',
    category: 'ai-development',
    importance: 'medium',
    description: '차세대 AI 코딩 에디터, 실시간 협업 기능',
  },
  'mcp-tools': {
    name: 'MCP Tools',
    version: '2025.3.28',
    role: '독립 도구 (filesystem, search, thinking)',
    category: 'ai-development',
    importance: 'high',
    description: '파일시스템 분석, 웹 검색, 단계별 사고 - 3개 도구 통합 (Cursor와 분리)',
    isCore: true,
  },
  'vibe-coding-results': {
    name: 'Vibe Coding 성과',
    version: 'v5.66.27',
    role: 'Claude Code 메인 + Gemini CLI 보조 + AWS Kiro/Windsurf 번갈아 활용',
    category: 'ai-development',
    importance: 'showcase',
    description: '현재 워크플로우: Claude Code (Opus 4 + Sonnet 4) 70% + Gemini CLI 20% + 기타 AI IDE 10%',
  },
  vm: {
    name: 'VM',
    category: 'Infrastructure',
    description: '가상머신 기반 서버 관리 및 모니터링',
    importance: 'medium',
  },
};

// 카테고리 정의
const CATEGORIES: Record<string, Omit<TechCategory, 'items'>> = {
  'frontend-framework': {
    id: 'frontend-framework',
    name: '프론트엔드 코어',
    icon: '⚛️',
    color: 'blue',
    description: '사용자 인터페이스 구성의 핵심 기술',
  },
  'ui-styling': {
    id: 'ui-styling',
    name: 'UI & 스타일링',
    icon: '🎨',
    color: 'pink',
    description: '시각적 디자인 및 사용자 경험',
  },
  'state-management': {
    id: 'state-management',
    name: '상태 관리',
    icon: '💾',
    color: 'green',
    description: '애플리케이션 상태 및 데이터 플로우',
  },
  'database-backend': {
    id: 'database-backend',
    name: '데이터베이스 & 백엔드',
    icon: '🗄️',
    color: 'purple',
    description: '데이터 저장 및 서버 사이드 로직',
  },
  'ai-ml': {
    id: 'ai-ml',
    name: 'AI & 머신러닝',
    icon: '🤖',
    color: 'cyan',
    description: '인공지능 및 예측 분석 기능',
  },
  'monitoring-analytics': {
    id: 'monitoring-analytics',
    name: '모니터링 & 분석',
    icon: '📊',
    color: 'orange',
    description: '시스템 성능 추적 및 메트릭 수집',
  },
  visualization: {
    id: 'visualization',
    name: '데이터 시각화',
    icon: '📈',
    color: 'emerald',
    description: '차트 및 그래프 렌더링',
  },
  'realtime-networking': {
    id: 'realtime-networking',
    name: '실시간 통신',
    icon: '🌐',
    color: 'indigo',
    description: '실시간 데이터 동기화 및 네트워킹',
  },
  'testing-dev': {
    id: 'testing-dev',
    name: '테스팅 & 개발도구',
    icon: '🧪',
    color: 'gray',
    description: '품질 보증 및 개발 생산성 도구',
  },
  utilities: {
    id: 'utilities',
    name: '유틸리티',
    icon: '🔧',
    color: 'slate',
    description: '개발 편의성 및 보조 기능',
  },
  deployment: {
    id: 'deployment',
    name: '배포 & 인프라',
    icon: '🚀',
    color: 'red',
    description: '배포 자동화 및 클라우드 인프라',
  },
  'ai-development': {
    id: 'ai-development',
    name: '🎯 AI 개발 도구',
    icon: '🤖',
    color: 'amber',
    description:
      'Vibe Coding AI 워크플로우 - Claude Code (Opus 4 + Sonnet 4) 70% + Gemini CLI 20% + AWS Kiro/Windsurf 10%',
  },
  'data-generation': {
    id: 'data-generation',
    name: '서버 데이터 생성',
    icon: '🔢',
    color: 'teal',
    description: '고성능 서버 시뮬레이션 및 메트릭 생성',
  },
  'mcp-engine': {
    id: 'mcp-engine',
    name: 'MCP AI 엔진',
    icon: '🤖',
    color: 'blue',
    description: 'Model Context Protocol 기반 독립 AI 시스템',
  },
  'ml-analysis': {
    id: 'ml-analysis',
    name: '머신러닝 분석',
    icon: '📊',
    color: 'purple',
    description: '통계 분석 및 시계열 예측 엔진',
  },
  'nlp-processing': {
    id: 'nlp-processing',
    name: '자연어 처리',
    icon: '🗣️',
    color: 'emerald',
    description: '한국어 특화 NLP 및 개체명 인식',
  },
  'web-frontend': {
    id: 'web-frontend',
    name: '웹 프론트엔드',
    icon: '⚛️',
    color: 'cyan',
    description: 'React 생태계 기반 현대적 프론트엔드',
  },
  'web-backend': {
    id: 'web-backend',
    name: '웹 백엔드',
    icon: '🗄️',
    color: 'violet',
    description: 'Next.js API Routes와 서버사이드 기술',
  },
  'web-state': {
    id: 'web-state',
    name: '상태관리',
    icon: '📦',
    color: 'blue',
    description: '경량 상태관리와 서버 데이터 캐싱',
  },
  'web-styling': {
    id: 'web-styling',
    name: 'UI/UX 스타일링',
    icon: '🎨',
    color: 'pink',
    description: '유틸리티 CSS와 애니메이션 시스템',
  },
  'web-quality': {
    id: 'web-quality',
    name: '품질보증',
    icon: '🧪',
    color: 'green',
    description: '테스팅과 코드 품질 자동화',
  },
};

/**
 * 기술 스택 문자열을 파싱하여 개별 기술들을 추출
 */
function parseTechString(techString: string): string[] {
  // 기술 스택 문자열에서 특정 패턴들을 추출
  const patterns = [
    // 이모지 뒤의 기술명 패턴
    /[🎯🧠🔍🌐🤖🔄💭]\s*([^:,-]+?)(?:[:,-]|$)/gu,
    // 버전 정보가 있는 패턴
    /(\w+(?:\.\w+)*)\s*v?\d+\.\d+/g,
    // 일반적인 기술명 패턴
    /\b([A-Za-z][A-Za-z0-9\-._]*(?:\s+[A-Za-z][A-Za-z0-9\-._]*)*)\b/g,
  ];

  const techs = new Set<string>();

  // 각 패턴으로 기술명 추출
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(techString)) !== null) {
      const tech = match[1].trim().toLowerCase();
      if (
        tech.length > 2 &&
        !['and', 'with', 'using', 'based', 'for'].includes(tech)
      ) {
        techs.add(tech);
      }
    }
  });

  // 기본 분할 방식도 추가
  const basicSplit = techString
    .split(/[,+&]/)
    .map(tech =>
      tech
        .replace(/[🎯🧠🔍🌐🤖🔄💭]/gu, '')
        .trim()
        .toLowerCase()
    )
    .filter(tech => tech.length > 2)
    .filter(tech => !['and', 'with', 'using', 'based', 'for'].includes(tech));

  basicSplit.forEach(tech => techs.add(tech));

  return Array.from(techs);
}

/**
 * 기술명을 정규화 (별칭 처리)
 */
function normalizeTechName(tech: string): string {
  const normalizeMap: Record<string, string> = {
    nextjs: 'next.js',
    'react.js': 'react',
    tailwind: 'tailwindcss',
    'react-query': '@tanstack/react-query',
    mcp: '@modelcontextprotocol/server-filesystem',
    sklearn: 'scikit-learn',
    'tf.js': '@tensorflow/tfjs',
    socketio: 'socket.io',
    faker: '@faker-js/faker',
    playwright: '@playwright/test',
    // Vibe Coding mappings (Updated - 현재 사용 도구)
    cursor: 'cursor-ai',
    'cursor ai': 'cursor-ai',
    'cursor ai editor': 'cursor-ai',
    claude: 'claude-code',
    'claude code': 'claude-code',
    'claude opus': 'claude-code',
    'claude opus 4': 'claude-code',
    'claude sonnet': 'claude-code',
    'claude sonnet 4': 'claude-code',
    'opus 4': 'claude-code',
    'sonnet 4': 'claude-code',
    chatgpt: 'chatgpt',
    'chatgpt-4': 'chatgpt',
    'chat gpt': 'chatgpt',
    'gpt-4': 'chatgpt',
    codex: 'chatgpt',
    jules: 'google-jules',
    'google jules': 'google-jules',
    gemini: 'gemini-cli',
    'gemini cli': 'gemini-cli',
    'gemini 2.0': 'gemini-cli',
    'gemini 2.0 flash': 'gemini-cli',
    'aws kiro': 'aws-kiro',
    kiro: 'aws-kiro',
    windsurf: 'windsurf',
    'windsurf ai': 'windsurf',
    'mcp tools': 'mcp-tools',
    'mcp filesystem': 'mcp-tools',
    'mcp search': 'mcp-tools',
    'mcp thinking': 'mcp-tools',
    'mcp integration': 'mcp-tools',
    filesystem: 'mcp-tools',
    'duckduckgo-search': 'mcp-tools',
    duckduckgo: 'mcp-tools',
    search: 'mcp-tools',
    'sequential-thinking': 'mcp-tools',
    thinking: 'mcp-tools',
    'vibe coding': 'vibe-coding-results',
    'vibe-coding': 'vibe-coding-results',
    'coding results': 'vibe-coding-results',
    sequential: 'mcp-sequential-thinking',
    hybrid: 'vibe-coding-results',
    vibe: 'vibe-coding-results',
    coding: 'vibe-coding-results',
    strategy: 'vibe-coding-results',
    // Server Data Generator mappings
    'optimized data generator': 'optimizeddatagenerator',
    'baseline optimizer': 'baselineoptimizer',
    'real server data generator': 'gcprealdata',
    'timer manager': 'timermanager',
    'memory optimizer': 'memoryoptimizer',
    'smart cache': 'smartcache',
    // AI Engine mappings
    masteraiengine: '@tensorflow/tfjs',
    'mcp sdk': '@modelcontextprotocol/server-filesystem',
    'tensorflow.js': '@tensorflow/tfjs',
    'transformers.js': 'transformers.js',
    'simple-statistics': 'simple-statistics',
    'ml-matrix': 'ml-matrix',
    'ml-regression': 'ml-regression',
    natural: 'natural',
    'custom-korean-ai': 'Custom Korean AI',
    compromise: 'compromise',
    'hangul-js': 'hangul-js',
    'fuse.js': 'fuse.js',
    'fuzzyset.js': 'fuzzyset.js',
    // Web Technology mappings
    'next.js': 'next.js',
    react: 'react',
    tailwindcss: 'tailwindcss',
    typescript: 'typescript',
    zustand: 'zustand',
    'tanstack query': '@tanstack/react-query',
    'framer motion': 'framer-motion',
    'supabase postgresql': 'supabase',
    'upstash redis': 'redis',
    'prisma orm': 'prisma',
    vitest: 'vitest',
    eslint: 'eslint',
    prettier: 'prettier',
    storybook: '@storybook/react',
  };

  return normalizeMap[tech] || tech;
}

/**
 * 중복된 기술 항목을 병합하는 함수
 */
function mergeDuplicateTechs(techItems: TechItem[]): TechItem[] {
  const techMap = new Map<string, TechItem>();

  techItems.forEach(item => {
    const key = item.name.toLowerCase();

    if (techMap.has(key)) {
      const existing = techMap.get(key)!;
      // 중복된 경우 병합
      existing.usageCount = (existing.usageCount || 1) + 1;
      existing.categories = existing.categories || [existing.category];

      // 다른 카테고리에서 사용된 경우 추가
      if (!existing.categories.includes(item.category)) {
        existing.categories.push(item.category);
      }

      // 더 높은 중요도로 업데이트
      const importanceOrder: Record<TechItem['importance'], number> = {
        critical: 5,
        high: 4,
        showcase: 3,
        medium: 2,
        low: 1,
      };
      if (
        importanceOrder[item.importance] > importanceOrder[existing.importance]
      ) {
        existing.importance = item.importance;
      }

      // 코어 기술인 경우 우선
      if (item.isCore) {
        existing.isCore = true;
      }

      // usage 정보 병합
      if (!existing.usage.includes(item.usage)) {
        existing.usage += `, ${item.usage}`;
      }
    } else {
      // 새로운 기술
      techMap.set(key, {
        ...item,
        usageCount: 1,
        categories: [item.category],
      });
    }
  });

  return Array.from(techMap.values());
}

/**
 * 특정 기능 카드의 기술 스택을 분석 (중복 제거 적용)
 */
export function analyzeTechStack(technologies: string[]): TechCategory[] {
  const techItems: TechItem[] = [];

  // 각 기술 문자열을 파싱하고 분석
  technologies.forEach(techString => {
    const parsedTechs = parseTechString(techString);

    parsedTechs.forEach(tech => {
      const normalizedTech = normalizeTechName(tech);
      const techInfo = TECH_DATABASE[normalizedTech];

      if (techInfo) {
        const techItem: TechItem = {
          ...techInfo,
          usage: `${techString.slice(0, 50)}${techString.length > 50 ? '...' : ''}`,
        };

        techItems.push(techItem);
      } else {
        // 디버깅: 인식되지 않은 기술 로그
        console.log(`미인식 기술: ${tech} -> ${normalizedTech}`, techString);
      }
    });
  });

  // 중복 제거 및 병합
  const mergedTechs = mergeDuplicateTechs(techItems);

  // 카테고리별로 분류
  const categoryMap = new Map<string, TechItem[]>();

  mergedTechs.forEach(techItem => {
    // 메인 카테고리 사용
    const mainCategory = techItem.category;

    if (!categoryMap.has(mainCategory)) {
      categoryMap.set(mainCategory, []);
    }
    categoryMap.get(mainCategory)!.push(techItem);
  });

  // 카테고리별로 정리하고 정렬
  const categories: TechCategory[] = [];

  categoryMap.forEach((items, categoryId) => {
    const categoryInfo = CATEGORIES[categoryId];
    if (categoryInfo) {
      // 중요도 순으로 정렬
      const sortedItems = items.sort((a, b) => {
        const importanceOrder: Record<TechItem['importance'], number> = {
          critical: 5,
          high: 4,
          showcase: 3,
          medium: 2,
          low: 1,
        };
        return importanceOrder[b.importance] - importanceOrder[a.importance];
      });

      categories.push({
        ...categoryInfo,
        items: sortedItems,
      });
    }
  });

  // 카테고리를 중요도와 코어 기술 기준으로 정렬
  return categories.sort((a, b) => {
    const aHasCore = a.items.some(item => item.isCore);
    const bHasCore = b.items.some(item => item.isCore);

    if (aHasCore && !bHasCore) return -1;
    if (!aHasCore && bHasCore) return 1;

    const aHighImportance = a.items.filter(
      item => item.importance === 'high'
    ).length;
    const bHighImportance = b.items.filter(
      item => item.importance === 'high'
    ).length;

    return bHighImportance - aHighImportance;
  });
}

/**
 * 전체 프로젝트의 기술 스택 요약 생성
 */
export function generateTechStackSummary(categories: TechCategory[]): {
  totalTechs: number;
  coreCount: number;
  categoryCount: number;
  topCategories: string[];
} {
  const totalTechs = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const coreCount = categories.reduce(
    (sum, cat) => sum + cat.items.filter(item => item.isCore).length,
    0
  );

  const topCategories = categories
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, 3)
    .map(cat => cat.name);

  return {
    totalTechs,
    coreCount,
    categoryCount: categories.length,
    topCategories,
  };
}
