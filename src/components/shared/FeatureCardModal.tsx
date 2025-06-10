'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  CheckCircle,
  Zap,
  TrendingUp,
  Code,
  Users,
  Globe,
  Shield,
  Rocket,
  Brain,
  Database,
  Settings,
  Monitor,
  Cpu,
  Activity,
  GitBranch,
  Cloud,
  Lock,
  Search,
  BarChart3,
  Network,
  Clock,
} from 'lucide-react';

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  gradient: string;
  detailedContent: {
    overview: string;
    features: string[];
    technologies: string[];
  };
  requiresAI: boolean;
  isAICard?: boolean;
  isSpecial?: boolean;
  isVibeCard?: boolean;
}

interface FeatureCardModalProps {
  selectedCard: FeatureCard | null | undefined;
  onClose: () => void;
  renderTextWithAIGradient: (text: string) => React.ReactNode;
  modalRef: React.RefObject<HTMLDivElement | null>;
  variant?: 'home' | 'landing';
}

interface DetailCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  tag: string;
  highlights: string[];
  codeExample?: string;
  accentColor: string;
}

// 개선된 카드 컴포넌트 - 수치 제거, 실용적 정보 강화
const DetailCard = React.memo(
  ({
    title,
    description,
    icon,
    tag,
    highlights,
    codeExample,
    accentColor,
  }: DetailCardProps) => {
    const getTagStyle = (tagName: string) => {
      const styles: { [key: string]: string } = {
        프레임워크: 'bg-blue-100 text-blue-700 border-blue-200',
        언어: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        스타일링: 'bg-cyan-100 text-cyan-700 border-cyan-200',
        데이터베이스: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        개발도구: 'bg-purple-100 text-purple-700 border-purple-200',
        'AI 모델': 'bg-pink-100 text-pink-700 border-pink-200',
        자동화: 'bg-violet-100 text-violet-700 border-violet-200',
        배포: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
        'AI 엔진': 'bg-green-100 text-green-700 border-green-200',
        프로토콜: 'bg-teal-100 text-teal-700 border-teal-200',
        백업: 'bg-lime-100 text-lime-700 border-lime-200',
        언어처리: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        최적화: 'bg-orange-100 text-orange-700 border-orange-200',
        관리: 'bg-red-100 text-red-700 border-red-200',
        캐싱: 'bg-amber-100 text-amber-700 border-amber-200',
        시뮬레이션: 'bg-rose-100 text-rose-700 border-rose-200',
      };
      return styles[tagName] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const getAccentColorClass = (color: string) => {
      const colors: { [key: string]: string } = {
        blue: 'text-blue-600',
        purple: 'text-purple-600',
        green: 'text-green-600',
        orange: 'text-orange-600',
      };
      return colors[color] || 'text-gray-600';
    };

    const getIconBgClass = (color: string) => {
      const colors: { [key: string]: string } = {
        blue: 'bg-blue-50 border-blue-200',
        purple: 'bg-purple-50 border-purple-200',
        green: 'bg-green-50 border-green-200',
        orange: 'bg-orange-50 border-orange-200',
      };
      return colors[color] || 'bg-gray-50 border-gray-200';
    };

    return (
      <motion.div
        whileHover={{ y: -2, scale: 1.02 }}
        className='bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden'
      >
        <div className='p-6'>
          {/* 헤더 */}
          <div className='flex items-start justify-between mb-4'>
            <div
              className={`p-3 rounded-lg border ${getIconBgClass(accentColor)}`}
            >
              {icon}
            </div>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full border ${getTagStyle(tag)}`}
            >
              {tag}
            </span>
          </div>

          {/* 제목과 설명 */}
          <h3
            className={`text-lg font-bold mb-2 ${getAccentColorClass(accentColor)}`}
          >
            {title}
          </h3>
          <p className='text-gray-600 text-sm leading-relaxed mb-4'>
            {description}
          </p>

          {/* 주요 특징 */}
          <div className='space-y-2 mb-4'>
            {highlights.map((highlight, index) => (
              <div key={index} className='flex items-start gap-2'>
                <CheckCircle className='h-4 w-4 text-green-500 mt-0.5 flex-shrink-0' />
                <span className='text-sm text-gray-700'>{highlight}</span>
              </div>
            ))}
          </div>

          {/* 코드 예시 (있는 경우) */}
          {codeExample && (
            <div className='bg-gray-50 rounded-lg p-3 border'>
              <div className='flex items-center gap-2 mb-2'>
                <Code className='h-4 w-4 text-gray-500' />
                <span className='text-xs font-medium text-gray-600'>
                  사용 예시
                </span>
              </div>
              <pre className='text-xs text-gray-700 font-mono leading-relaxed overflow-x-auto'>
                {codeExample}
              </pre>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

DetailCard.displayName = 'DetailCard';

// 대폭 강화된 카드 데이터 - 수치 제거, 실용적 정보 추가
const cardConfigs = {
  'tech-stack': {
    title: '🛠️ 핵심 웹 기술',
    description:
      '현대적이고 안정적인 웹 기술 스택으로 최고의 개발자 경험과 성능을 제공',
    data: [
      {
        title: 'Next.js 15',
        description:
          'React 기반 풀스택 프레임워크로 서버 사이드 렌더링, 정적 생성, Edge Functions을 완벽 지원합니다.',
        icon: <Zap className='w-5 h-5 text-blue-600' />,
        tag: '프레임워크',
        highlights: [
          'App Router로 최신 React 기능 완벽 활용',
          '자동 코드 분할로 번들 크기 최적화',
          'Streaming SSR로 빠른 초기 로딩',
          'Vercel과 완벽 통합된 배포 환경',
        ],
        codeExample: `// app/layout.tsx - App Router 구조
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}`,
        accentColor: 'blue',
      },
      {
        title: 'TypeScript',
        description:
          '완전한 타입 안전성을 제공하는 JavaScript 상위집합으로 개발 생산성과 코드 품질을 동시에 향상시킵니다.',
        icon: <Shield className='w-5 h-5 text-blue-600' />,
        tag: '언어',
        highlights: [
          '컴파일 타임 오류 검출로 런타임 버그 방지',
          'IntelliSense 자동완성으로 개발 속도 향상',
          '엄격한 타입 설정으로 코드 품질 보장',
          '모든 컴포넌트와 API에 타입 정의 적용',
        ],
        codeExample: `// 타입 안전한 API 응답 처리
interface ServerMetrics {
  id: string;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
}

const fetchServers = async (): Promise<ServerMetrics[]> => {
  const response = await fetch('/api/servers');
  return response.json();
};`,
        accentColor: 'blue',
      },
      {
        title: 'TailwindCSS',
        description:
          '유틸리티 퍼스트 CSS 프레임워크로 일관된 디자인 시스템과 빠른 개발 속도를 제공합니다.',
        icon: <Star className='w-5 h-5 text-cyan-600' />,
        tag: '스타일링',
        highlights: [
          '모바일 퍼스트 반응형 디자인',
          '다크모드 완벽 지원',
          '커스텀 디자인 토큰과 컴포넌트 시스템',
          'PurgeCSS로 프로덕션 번들 최적화',
        ],
        codeExample: `<!-- 반응형 카드 컴포넌트 -->
<div class="bg-white dark:bg-gray-800 
           rounded-xl shadow-lg p-6
           hover:scale-105 transition-transform
           md:max-w-sm lg:max-w-md">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
    서버 상태
  </h3>
</div>`,
        accentColor: 'blue',
      },
      {
        title: 'Supabase',
        description:
          'PostgreSQL 기반 오픈소스 Firebase 대안으로 실시간 데이터베이스, 인증, 스토리지를 모두 제공합니다.',
        icon: <Database className='w-5 h-5 text-emerald-600' />,
        tag: '데이터베이스',
        highlights: [
          '실시간 구독으로 라이브 데이터 업데이트',
          'Row Level Security로 데이터 보안 강화',
          '자동 백업과 Point-in-time Recovery',
          'pgvector 확장으로 AI 벡터 검색 지원',
        ],
        codeExample: `// 실시간 서버 상태 구독
const { data, error } = await supabase
  .from('servers')
  .select('*')
  .eq('status', 'active')

// 실시간 변경사항 감지
supabase
  .channel('servers')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'servers' 
  }, (payload) => {
    console.log('서버 상태 변경:', payload)
  })
  .subscribe()`,
        accentColor: 'blue',
      },
    ],
  },

  'vibe-coding': {
    title: '⚡ Vibe Coding 워크플로우',
    description:
      'AI 기반 차세대 개발 환경으로 개발 생산성을 혁신적으로 향상시키는 통합 워크플로우',
    data: [
      {
        title: 'Cursor AI Editor',
        description:
          'Claude 4 Sonnet이 통합된 차세대 AI 코딩 환경으로 자연어로 코드를 생성하고 편집할 수 있습니다.',
        icon: <Brain className='w-5 h-5 text-purple-600' />,
        tag: '개발도구',
        highlights: [
          '200K 토큰 컨텍스트로 대규모 코드베이스 이해',
          '자연어 명령으로 즉시 코드 생성 및 리팩토링',
          '실시간 코드 리뷰와 최적화 제안',
          'Git과 완벽 통합된 AI 기반 커밋 메시지',
        ],
        codeExample: `// AI가 생성한 서버 모니터링 컴포넌트
"서버 CPU 사용률을 보여주는 차트 컴포넌트를 만들어줘"

→ AI가 자동으로 생성:
export function CPUChart({ data }: { data: ServerMetrics[] }) {
  return (
    <Chart>
      <Line dataKey="cpuUsage" stroke="#8884d8" />
    </Chart>
  );
}`,
        accentColor: 'purple',
      },
      {
        title: 'Claude 4 Sonnet',
        description:
          '최대 컨텍스트 AI 모델로 복잡한 아키텍처 설계부터 디버깅까지 모든 개발 과정을 지원합니다.',
        icon: <Cpu className='w-5 h-5 text-purple-600' />,
        tag: 'AI 모델',
        highlights: [
          '전체 프로젝트 구조를 한번에 이해',
          '복잡한 로직의 단계별 설명과 구현',
          '버그 패턴 분석과 자동 수정 제안',
          '코드 리뷰와 성능 최적화 조언',
        ],
        codeExample: `// Claude와의 개발 대화 예시
Q: "이 API의 응답 시간을 개선하고 싶어"

Claude: "현재 코드를 분석해보니 3가지 개선점이 있습니다:
1. 데이터베이스 쿼리 최적화 (인덱스 추가)
2. Redis 캐싱 레이어 도입
3. 병렬 처리로 외부 API 호출 최적화

각각의 구현 방법을 알려드릴까요?"`,
        accentColor: 'purple',
      },
      {
        title: 'MCP Tools',
        description:
          'Model Context Protocol 도구들로 파일시스템, 웹 검색, 순차적 사고를 AI와 완벽 통합합니다.',
        icon: <Settings className='w-5 h-5 text-purple-600' />,
        tag: '자동화',
        highlights: [
          '파일시스템 자동 탐색과 구조 분석',
          '실시간 웹 검색으로 최신 문서 참조',
          '단계별 문제 해결과 검증',
          'Git 연동으로 자동 커밋과 브랜치 관리',
        ],
        codeExample: `// MCP 도구 사용 예시
<filesystem_tool>
  src/components/를 분석해서 사용하지 않는 컴포넌트 찾아줘
</filesystem_tool>

<web_search>
  Next.js 15 App Router 최신 베스트 프랙티스
</web_search>

<sequential_thinking>
  1. 문제 분석: API 응답 시간 느림
  2. 원인 조사: DB 쿼리 N+1 문제
  3. 해결책: include 최적화
  4. 검증: 성능 테스트
</sequential_thinking>`,
        accentColor: 'purple',
      },
      {
        title: 'GitHub Actions',
        description:
          '완전 자동화된 CI/CD 파이프라인으로 코드 품질 검사부터 배포까지 모든 과정을 자동화합니다.',
        icon: <GitBranch className='w-5 h-5 text-purple-600' />,
        tag: '배포',
        highlights: [
          'TypeScript 타입 체크와 ESLint 자동 실행',
          'Vitest 단위 테스트와 E2E 테스트 자동화',
          'Vercel과 Render에 동시 배포',
          '실패 시 자동 롤백과 알림',
        ],
        codeExample: `# .github/workflows/deploy.yml
name: 🚀 Deploy
on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: 📝 Type Check
        run: npm run type-check
      - name: 🧪 Run Tests  
        run: npm run test
      - name: 🚀 Deploy to Vercel
        uses: vercel/action@v1`,
        accentColor: 'purple',
      },
    ],
  },

  'mcp-ai-engine': {
    title: '🧠 서버 모니터링 AI 엔진',
    description:
      '지능형 서버 분석과 실시간 모니터링을 위한 완전 자동화된 AI 시스템',
    data: [
      {
        title: 'UnifiedAIEngine',
        description:
          '모든 AI 기능을 통합 관리하는 중앙 엔진으로 폴백 시스템과 성능 최적화를 제공합니다.',
        icon: <Brain className='w-5 h-5 text-green-600' />,
        tag: 'AI 엔진',
        highlights: [
          'Google AI → MCP → RAG → Direct Analysis 순차 폴백',
          '실시간 성능 모니터링과 자동 최적화',
          '한국어 자연어 처리로 국내 환경 최적화',
          '스마트 캐싱으로 응답 속도 대폭 향상',
        ],
        codeExample: `// AI 엔진 사용 예시
const aiEngine = new UnifiedAIEngine();

// 자연어로 서버 상태 질의
const response = await aiEngine.query(
  "CPU 사용률이 80% 이상인 서버들의 상태를 분석해줘"
);

// 자동 폴백 시스템
// Google AI 실패 → MCP 시도 → RAG 백업 → 기본 분석`,
        accentColor: 'green',
      },
      {
        title: 'MCP Protocol',
        description:
          'Model Context Protocol로 AI 서비스 간 표준화된 통신과 컨텍스트 공유를 담당합니다.',
        icon: <Network className='w-5 h-5 text-teal-600' />,
        tag: '프로토콜',
        highlights: [
          'Render 클라우드에서 24/7 안정적 운영',
          '실시간 서버 데이터 스트리밍',
          '표준 프로토콜로 확장성 보장',
          '장애 시 자동 복구와 상태 보고',
        ],
        codeExample: `// MCP 서버 연동
const mcpClient = new MCPClient({
  serverUrl: 'https://mcp-server.render.com',
  tools: ['filesystem', 'github', 'monitoring']
});

// 서버 분석 요청
const analysis = await mcpClient.analyzeServers({
  query: "최근 1시간 내 이상 패턴 분석",
  includeRecommendations: true
});`,
        accentColor: 'green',
      },
      {
        title: 'RAG Engine',
        description:
          '벡터 데이터베이스 기반 검색 증강 생성으로 정확하고 맥락적인 AI 응답을 제공합니다.',
        icon: <Search className='w-5 h-5 text-lime-600' />,
        tag: '백업',
        highlights: [
          'Supabase pgvector로 고속 벡터 검색',
          'TensorFlow.js 기반 브라우저 임베딩',
          '문서 인덱싱과 실시간 업데이트',
          '컨텍스트 기반 정확한 답변 생성',
        ],
        codeExample: `// RAG 검색 시스템
const ragEngine = new LocalRAGEngine();

// 문서 인덱싱
await ragEngine.addDocument({
  id: 'server-guide',
  content: '서버 모니터링 가이드...',
  metadata: { type: 'guide', category: 'monitoring' }
});

// 벡터 검색 기반 답변
const answer = await ragEngine.query(
  "CPU 과부하 시 대응 방법"
);`,
        accentColor: 'green',
      },
      {
        title: 'Korean NLP',
        description:
          '한국어 자연어 처리 엔진으로 국내 서버 환경에 특화된 로그 분석과 명령 처리를 수행합니다.',
        icon: <Globe className='w-5 h-5 text-yellow-600' />,
        tag: '언어처리',
        highlights: [
          'hangul-js로 한글 형태소 분석',
          'korean-utils로 한국어 패턴 인식',
          '국내 서버 운영 용어와 로그 패턴 학습',
          '자연어 명령의 정확한 의도 파악',
        ],
        codeExample: `// 한국어 NLP 처리
import { korean } from '@/utils/korean-nlp';

// 한국어 명령 분석
const intent = korean.parseIntent(
  "웹서버 CPU 사용률이 높아서 걱정이에요"
);
// → { type: 'monitoring', target: 'cpu', emotion: 'worry' }

// 서버 로그 분석
const logAnalysis = korean.analyzeLog(
  "2024-01-10 14:30:15 [ERROR] 데이터베이스 연결 실패"
);`,
        accentColor: 'green',
      },
    ],
  },

  'data-generator': {
    title: '📊 실시간 데이터 생성기',
    description:
      '지능형 서버 데이터 시뮬레이션과 최적화된 성능 관리를 위한 차세대 생성 시스템',
    data: [
      {
        title: 'OptimizedGenerator',
        description:
          '24시간 베이스라인 패턴과 실시간 델타 방식으로 현실적인 서버 데이터를 생성하고 최적화합니다.',
        icon: <TrendingUp className='w-5 h-5 text-orange-600' />,
        tag: '최적화',
        highlights: [
          '환경별 자동 모드: Local(50서버) → Premium(20서버) → Basic(6서버)',
          '24시간 베이스라인 미리 생성으로 CPU 75% 절약',
          '실시간은 델타만 계산하여 메모리 97%→75% 최적화',
          '현실적 패턴: 업무시간 높음, 야간/주말 낮음',
        ],
        codeExample: `// 최적화된 데이터 생성
const generator = new OptimizedDataGenerator({
  environment: 'auto', // 자동 환경 감지
  serverCount: 'adaptive', // 환경별 자동 조정
  updateInterval: 'smart' // 스마트 간격 조정
});

// 베이스라인 + 델타 방식
const metrics = generator.generateMetrics({
  baseline: precomputedBaseline, // 미리 계산된 24시간 데이터
  deltaOnly: true, // 변화량만 계산
  timestamp: Date.now()
});`,
        accentColor: 'orange',
      },
      {
        title: 'TimerManager',
        description:
          '모든 시스템 타이머를 통합 관리하여 타이머 충돌을 방지하고 CPU 사용량을 최적화합니다.',
        icon: <Clock className='w-5 h-5 text-red-600' />,
        tag: '관리',
        highlights: [
          '통합 타이머 풀로 중복 타이머 방지',
          '우선순위 기반 스케줄링',
          '자동 리소스 정리와 메모리 누수 방지',
          '브라우저 탭 비활성화 시 자동 최적화',
        ],
        codeExample: `// 타이머 통합 관리
const timerManager = TimerManager.getInstance();

// 기존: 여러 setInterval로 충돌
// setInterval(updateServers, 5000);
// setInterval(updateMetrics, 3000);

// 개선: 통합 관리
timerManager.register('servers', updateServers, {
  interval: 5000,
  priority: 'high',
  autoCleanup: true
});`,
        accentColor: 'orange',
      },
      {
        title: 'SmartCache',
        description:
          '지능형 캐싱 시스템으로 자주 사용되는 데이터를 예측하고 사전 로딩하여 성능을 극대화합니다.',
        icon: <Database className='w-5 h-5 text-amber-600' />,
        tag: '캐싱',
        highlights: [
          'LRU + TTL 하이브리드 캐시 전략',
          '패턴 학습으로 사전 로딩 최적화',
          'Redis 연동으로 지속성 보장',
          '자동 압축과 메모리 관리',
        ],
        codeExample: `// 스마트 캐싱 시스템
const cache = new SmartCache({
  strategy: 'hybrid', // LRU + TTL
  predictiveLoading: true,
  compression: true,
  redis: redisClient
});

// 패턴 기반 사전 로딩
cache.preload('dashboard-metrics', {
  pattern: 'workday-morning', // 업무일 아침 패턴
  prefetchCount: 10,
  ttl: 300000 // 5분
});`,
        accentColor: 'orange',
      },
      {
        title: 'RealisticData',
        description:
          '실제 서버 환경과 동일한 패턴과 시나리오를 시뮬레이션하여 현실적인 테스트 데이터를 제공합니다.',
        icon: <Activity className='w-5 h-5 text-rose-600' />,
        tag: '시뮬레이션',
        highlights: [
          '5가지 시나리오: Normal, HighLoad, Maintenance, Incident, Scaling',
          '4가지 아키텍처: Single, Master-Slave, Load-Balanced, Microservices',
          '시간대별 현실적 패턴 (출근시간 스파이크, 점심시간 감소)',
          '무작위 장애 시나리오와 복구 패턴',
        ],
        codeExample: `// 현실적 시나리오 생성
const scenario = new RealisticDataScenario({
  type: 'incident', // 장애 시나리오
  architecture: 'microservices',
  duration: '2hours',
  severity: 'moderate'
});

// 시간대별 패턴
const pattern = scenario.generateTimePattern({
  workdayMultiplier: 1.5, // 업무일 1.5배 높음
  lunchTimeReduction: 0.7, // 점심시간 30% 감소
  weekendReduction: 0.3 // 주말 70% 감소
});`,
        accentColor: 'orange',
      },
    ],
  },
};

export default function FeatureCardModal({
  selectedCard,
  onClose,
  renderTextWithAIGradient,
  modalRef,
  variant = 'home',
}: FeatureCardModalProps) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // 키보드 네비게이션
  useEffect(() => {
    if (!selectedCard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCard, onClose]);

  if (!selectedCard) return null;

  const currentConfig =
    cardConfigs[selectedCard.id as keyof typeof cardConfigs];
  if (!currentConfig) return null;

  // 모달 애니메이션
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
        duration: 0.4,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2 },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <AnimatePresence mode='wait'>
      {/* 깔끔한 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          variants={modalVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
          onClick={e => e.stopPropagation()}
          className='relative w-full max-w-7xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden'
        >
          {/* 헤더 */}
          <div className='flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white'>
            <div className='flex items-center gap-4'>
              <div
                className={`p-3 bg-gradient-to-br ${selectedCard.gradient} rounded-xl`}
              >
                <selectedCard.icon className='w-8 h-8 text-white' />
              </div>
              <div>
                <h2 className='text-2xl font-bold text-gray-900 mb-1'>
                  {currentConfig.title}
                </h2>
                <p className='text-gray-600'>{currentConfig.description}</p>
              </div>
            </div>

            <motion.button
              onClick={onClose}
              className='w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label='모달 닫기'
            >
              <X className='w-5 h-5 text-gray-600' />
            </motion.button>
          </div>

          {/* 콘텐츠 영역 - 2x2 그리드 */}
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            className='p-6 overflow-y-auto max-h-[calc(85vh-120px)]'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {currentConfig.data.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onHoverStart={() => setHoveredCard(index)}
                  onHoverEnd={() => setHoveredCard(null)}
                >
                  <DetailCard {...item} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
