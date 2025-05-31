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
  importance: 'high' | 'medium' | 'low';
  isCore?: boolean;
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
    isCore: true
  },
  'react': {
    name: 'React 19',
    category: 'frontend-framework', 
    description: '선언적 사용자 인터페이스 라이브러리',
    importance: 'high',
    isCore: true
  },
  'typescript': {
    name: 'TypeScript',
    category: 'frontend-framework',
    description: '정적 타입 시스템으로 개발 안정성 확보',
    importance: 'high',
    isCore: true
  },

  // Styling & UI
  'tailwindcss': {
    name: 'Tailwind CSS 3.x',
    category: 'ui-styling',
    description: '유틸리티 우선 CSS 프레임워크',
    importance: 'high'
  },
  'framer-motion': {
    name: 'Framer Motion',
    category: 'ui-styling',
    description: 'React용 강력한 애니메이션 라이브러리',
    importance: 'medium'
  },
  'lucide-react': {
    name: 'Lucide React',
    category: 'ui-styling',
    description: '깔끔한 SVG 아이콘 컬렉션',
    importance: 'low'
  },
  'clsx': {
    name: 'clsx',
    category: 'ui-styling',
    description: '조건부 클래스명 결합 유틸리티',
    importance: 'low'
  },
  '@radix-ui/react-tabs': {
    name: 'Radix UI',
    category: 'ui-styling',
    description: '접근성 우선 headless UI 컴포넌트',
    importance: 'medium'
  },

  // State Management
  'zustand': {
    name: 'Zustand',
    category: 'state-management',
    description: '가벼운 전역 상태 관리 + 로컬 저장소',
    importance: 'high'
  },
  '@tanstack/react-query': {
    name: 'TanStack Query',
    category: 'state-management',
    description: '서버 상태 관리 및 캐싱 라이브러리',
    importance: 'high'
  },
  'react-query': {
    name: 'React Query',
    category: 'state-management',
    description: '서버 상태 관리 및 데이터 동기화',
    importance: 'high'
  },

  // Database & Backend
  '@supabase/supabase-js': {
    name: 'Supabase',
    category: 'database-backend',
    description: 'PostgreSQL 기반 BaaS (실시간 DB)',
    importance: 'high'
  },
  'supabase': {
    name: 'Supabase',
    category: 'database-backend',
    description: 'PostgreSQL 기반 실시간 데이터베이스',
    importance: 'high'
  },
  'ioredis': {
    name: 'Upstash for Redis (IORedis)',
    category: 'database-backend',
    description: 'Upstash Redis 전용 Node.js 클라이언트 라이브러리',
    importance: 'high',
    isCore: true
  },
  'redis': {
    name: 'Upstash for Redis',
    category: 'database-backend',
    description: '서버리스 환경을 위한 고성능 클라우드 Redis 서비스',
    importance: 'high',
    isCore: true
  },
  'upstash': {
    name: 'Upstash for Redis',
    category: 'database-backend',
    description: 'Vercel과 완벽 호환되는 서버리스 Redis 키-값 스토어',
    importance: 'high',
    isCore: true
  },
  '@vercel/kv': {
    name: 'Vercel KV',
    category: 'database-backend',
    description: 'Vercel의 Redis 호환 키-값 스토어',
    importance: 'medium'
  },

  // AI & Machine Learning
  '@modelcontextprotocol/server-filesystem': {
    name: 'Model Context Protocol',
    category: 'ai-ml',
    description: 'AI 에이전트 간 통신 표준 프로토콜',
    importance: 'high',
    isCore: true
  },
  'openmanager-mcp': {
    name: 'OpenManager MCP',
    category: 'ai-ml',
    description: '커스텀 MCP 서버 구현체',
    importance: 'high'
  },
  'scikit-learn': {
    name: 'Scikit-learn',
    category: 'ai-ml',
    description: 'Python 머신러닝 라이브러리 (이상 탐지)',
    importance: 'high'
  },
  'prophet': {
    name: 'Prophet',
    category: 'ai-ml',
    description: 'Facebook의 시계열 예측 라이브러리',
    importance: 'medium'
  },
  '@tensorflow/tfjs': {
    name: 'TensorFlow.js',
    category: 'ai-ml',
    description: '브라우저 및 Node.js용 ML 라이브러리',
    importance: 'medium'
  },
  '@xenova/transformers': {
    name: 'Transformers.js',
    category: 'ai-ml',
    description: '브라우저용 Hugging Face 트랜스포머',
    importance: 'medium'
  },

  // Monitoring & Analytics
  'prom-client': {
    name: 'Prometheus Client',
    category: 'monitoring-analytics',
    description: 'Prometheus 메트릭 수집 클라이언트',
    importance: 'high'
  },
  'prometheus': {
    name: 'Prometheus',
    category: 'monitoring-analytics',
    description: '시계열 데이터베이스 및 모니터링',
    importance: 'high'
  },
  'simple-statistics': {
    name: 'Simple Statistics',
    category: 'monitoring-analytics',
    description: '통계 계산을 위한 JavaScript 라이브러리',
    importance: 'medium'
  },

  // Charts & Visualization
  'recharts': {
    name: 'Recharts',
    category: 'visualization',
    description: 'React 기반 차트 라이브러리',
    importance: 'high'
  },
  'chart.js': {
    name: 'Chart.js',
    category: 'visualization',
    description: '유연한 차트 생성 라이브러리',
    importance: 'medium'
  },
  'react-chartjs-2': {
    name: 'React Chart.js 2',
    category: 'visualization',
    description: 'Chart.js의 React 래퍼',
    importance: 'medium'
  },
  'd3': {
    name: 'D3.js',
    category: 'visualization',
    description: '데이터 기반 문서 조작 라이브러리',
    importance: 'medium'
  },

  // Real-time & Networking
  'socket.io': {
    name: 'Socket.IO',
    category: 'realtime-networking',
    description: '실시간 양방향 통신 라이브러리',
    importance: 'high'
  },
  'socket.io-client': {
    name: 'Socket.IO Client',
    category: 'realtime-networking',
    description: 'Socket.IO 클라이언트 라이브러리',
    importance: 'medium'
  },
  'ws': {
    name: 'WebSocket',
    category: 'realtime-networking',
    description: '경량 WebSocket 구현체',
    importance: 'medium'
  },
  'sse': {
    name: 'Server-Sent Events',
    category: 'realtime-networking',
    description: '서버에서 클라이언트로 실시간 스트리밍',
    importance: 'medium'
  },

  // Testing & Development
  'vitest': {
    name: 'Vitest',
    category: 'testing-dev',
    description: 'Vite 기반 빠른 단위 테스트 프레임워크',
    importance: 'medium'
  },
  '@playwright/test': {
    name: 'Playwright',
    category: 'testing-dev',
    description: '크로스 브라우저 E2E 테스트 도구',
    importance: 'medium'
  },
  'storybook': {
    name: 'Storybook',
    category: 'testing-dev',
    description: 'UI 컴포넌트 개발 및 테스트 도구',
    importance: 'low'
  },

  // Utilities & Data Processing
  '@faker-js/faker': {
    name: 'Faker.js',
    category: 'utilities',
    description: '테스트용 가짜 데이터 생성 라이브러리',
    importance: 'low'
  },
  'faker.js': {
    name: 'Faker.js',
    category: 'utilities',
    description: '시뮬레이션용 가짜 데이터 생성',
    importance: 'low'
  },
  'date-fns': {
    name: 'date-fns',
    category: 'utilities',
    description: '모던 JavaScript 날짜 유틸리티',
    importance: 'low'
  },
  'zod': {
    name: 'Zod',
    category: 'utilities',
    description: 'TypeScript 우선 스키마 유효성 검사',
    importance: 'medium'
  },
  'delta-compression': {
    name: 'Delta Compression',
    category: 'utilities',
    description: '데이터 차분 압축으로 대역폭 최적화',
    importance: 'low'
  },

  // Deployment & Infrastructure
  'vercel': {
    name: 'Vercel',
    category: 'deployment',
    description: 'Next.js 최적화 서버리스 배포 플랫폼',
    importance: 'high'
  },
  'github-actions': {
    name: 'GitHub Actions',
    category: 'deployment',
    description: 'CI/CD 자동화 워크플로우',
    importance: 'medium'
  },
  'docker': {
    name: 'Docker',
    category: 'deployment',
    description: '컨테이너 기반 배포 및 개발 환경',
    importance: 'medium'
  },

  // AI Development Tools
  'cursor-ai': {
    name: 'Cursor AI',
    category: 'ai-development',
    description: 'AI 기반 코드 에디터 및 개발 도구',
    importance: 'high',
    isCore: true
  },
  'claude': {
    name: 'Claude AI',
    category: 'ai-development',
    description: 'Anthropic의 대화형 AI 어시스턴트',
    importance: 'high'
  },
  'auto-doc-generator.js': {
    name: 'Auto Doc Generator',
    category: 'ai-development',
    description: '자동 문서 생성 스크립트',
    importance: 'low'
  },
  'testing-mcp-server.js': {
    name: 'MCP Testing Server',
    category: 'ai-development',
    description: 'MCP 프로토콜 테스트 서버',
    importance: 'low'
  }
};

// 카테고리 정의
const CATEGORIES: Record<string, Omit<TechCategory, 'items'>> = {
  'frontend-framework': {
    id: 'frontend-framework',
    name: '프론트엔드 코어',
    icon: '⚛️',
    color: 'blue',
    description: '사용자 인터페이스 구성의 핵심 기술'
  },
  'ui-styling': {
    id: 'ui-styling',
    name: 'UI & 스타일링',
    icon: '🎨',
    color: 'pink',
    description: '시각적 디자인 및 사용자 경험'
  },
  'state-management': {
    id: 'state-management',
    name: '상태 관리',
    icon: '💾',
    color: 'green',
    description: '애플리케이션 상태 및 데이터 플로우'
  },
  'database-backend': {
    id: 'database-backend',
    name: '데이터베이스 & 백엔드',
    icon: '🗄️',
    color: 'purple',
    description: '데이터 저장 및 서버 사이드 로직'
  },
  'ai-ml': {
    id: 'ai-ml',
    name: 'AI & 머신러닝',
    icon: '🤖',
    color: 'cyan',
    description: '인공지능 및 예측 분석 기능'
  },
  'monitoring-analytics': {
    id: 'monitoring-analytics',
    name: '모니터링 & 분석',
    icon: '📊',
    color: 'orange',
    description: '시스템 성능 추적 및 메트릭 수집'
  },
  'visualization': {
    id: 'visualization',
    name: '데이터 시각화',
    icon: '📈',
    color: 'emerald',
    description: '차트 및 그래프 렌더링'
  },
  'realtime-networking': {
    id: 'realtime-networking',
    name: '실시간 통신',
    icon: '🌐',
    color: 'indigo',
    description: '실시간 데이터 동기화 및 네트워킹'
  },
  'testing-dev': {
    id: 'testing-dev',
    name: '테스팅 & 개발도구',
    icon: '🧪',
    color: 'gray',
    description: '품질 보증 및 개발 생산성 도구'
  },
  'utilities': {
    id: 'utilities',
    name: '유틸리티',
    icon: '🔧',
    color: 'slate',
    description: '개발 편의성 및 보조 기능'
  },
  'deployment': {
    id: 'deployment',
    name: '배포 & 인프라',
    icon: '🚀',
    color: 'red',
    description: '배포 자동화 및 클라우드 인프라'
  },
  'ai-development': {
    id: 'ai-development',
    name: 'AI 개발도구',
    icon: '✨',
    color: 'amber',
    description: 'AI 기반 개발 워크플로우 및 도구'
  }
};

/**
 * 기술 스택 문자열을 파싱하여 개별 기술들을 추출
 */
function parseTechString(techString: string): string[] {
  return techString
    .split(/[,\s]+/)
    .map(tech => tech.trim().toLowerCase())
    .filter(tech => tech.length > 0)
    .filter(tech => !['and', 'with', 'using', '+', '&'].includes(tech));
}

/**
 * 기술명을 정규화 (별칭 처리)
 */
function normalizeTechName(tech: string): string {
  const normalizeMap: Record<string, string> = {
    'nextjs': 'next.js',
    'react.js': 'react',
    'tailwind': 'tailwindcss',
    'react-query': '@tanstack/react-query',
    'mcp': '@modelcontextprotocol/server-filesystem',
    'sklearn': 'scikit-learn',
    'tf.js': '@tensorflow/tfjs',
    'socketio': 'socket.io',
    'faker': '@faker-js/faker',
    'playwright': '@playwright/test'
  };

  return normalizeMap[tech] || tech;
}

/**
 * 특정 기능 카드의 기술 스택을 분석
 */
export function analyzeTechStack(technologies: string[]): TechCategory[] {
  const techItems: TechItem[] = [];
  const categoryMap = new Map<string, TechItem[]>();

  // 각 기술 문자열을 파싱하고 분석
  technologies.forEach(techString => {
    const parsedTechs = parseTechString(techString);
    
    parsedTechs.forEach(tech => {
      const normalizedTech = normalizeTechName(tech);
      const techInfo = TECH_DATABASE[normalizedTech];
      
      if (techInfo) {
        const techItem: TechItem = {
          ...techInfo,
          usage: `${techString.slice(0, 50)}${techString.length > 50 ? '...' : ''}`
        };
        
        techItems.push(techItem);
        
        if (!categoryMap.has(techInfo.category)) {
          categoryMap.set(techInfo.category, []);
        }
        categoryMap.get(techInfo.category)!.push(techItem);
      }
    });
  });

  // 카테고리별로 정리하고 정렬
  const categories: TechCategory[] = [];
  
  categoryMap.forEach((items, categoryId) => {
    const categoryInfo = CATEGORIES[categoryId];
    if (categoryInfo) {
      // 중요도 순으로 정렬
      const sortedItems = items.sort((a, b) => {
        const importanceOrder = { high: 3, medium: 2, low: 1 };
        return importanceOrder[b.importance] - importanceOrder[a.importance];
      });

      categories.push({
        ...categoryInfo,
        items: sortedItems
      });
    }
  });

  // 카테고리를 중요도와 코어 기술 기준으로 정렬
  return categories.sort((a, b) => {
    const aHasCore = a.items.some(item => item.isCore);
    const bHasCore = b.items.some(item => item.isCore);
    
    if (aHasCore && !bHasCore) return -1;
    if (!aHasCore && bHasCore) return 1;
    
    const aHighImportance = a.items.filter(item => item.importance === 'high').length;
    const bHighImportance = b.items.filter(item => item.importance === 'high').length;
    
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
  const coreCount = categories.reduce((sum, cat) => 
    sum + cat.items.filter(item => item.isCore).length, 0
  );
  
  const topCategories = categories
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, 3)
    .map(cat => cat.name);

  return {
    totalTechs,
    coreCount,
    categoryCount: categories.length,
    topCategories
  };
} 