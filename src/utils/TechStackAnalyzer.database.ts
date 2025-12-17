/**
 * 🧩 TechStackAnalyzer Database
 *
 * Technology database with detailed information:
 * - Frontend frameworks and libraries
 * - Backend and database technologies
 * - AI/ML tools and engines
 * - Development and deployment tools
 * - Project-specific custom components
 */

import type { TechItem } from './TechStackAnalyzer.types';

export const TECH_DATABASE: Record<string, Omit<TechItem, 'usage'>> = {
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
  'vibe-coding': {
    name: 'Vibe Coding',
    version: 'v4.0 (Agentic Era)',
    role: 'AI 개발 워크플로우',
    category: 'ai-development',
    importance: 'critical',
    description: 'Claude Code 주도, Multi-CLI 협업 개발 방식',
    isCore: true,
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
  windsurf: {
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
    description:
      '파일시스템 분석, 웹 검색, 단계별 사고 - 3개 도구 통합 (Cursor와 분리)',
    isCore: true,
  },
  'vibe-coding-results': {
    name: 'Vibe Coding 성과',
    version: 'v5.66.27',
    role: 'Claude Code 메인 + Gemini CLI 보조 + AWS Kiro/Windsurf 번갈아 활용',
    category: 'ai-development',
    importance: 'showcase',
    description:
      '현재 워크플로우: Claude Code (Opus 4 + Sonnet 4) 70% + Gemini CLI 20% + 기타 AI IDE 10%',
  },
  vm: {
    name: 'VM',
    category: 'Infrastructure',
    description: '가상머신 기반 서버 관리 및 모니터링',
    importance: 'medium',
  },
};
