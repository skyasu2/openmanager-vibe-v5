/**
 * 🧩 TechStackAnalyzer Categories
 * 
 * Category definitions for technology classification:
 * - Frontend & UI categories
 * - Backend & Data categories  
 * - AI & Development categories
 * - Infrastructure & Deployment categories
 */

import type { TechCategory } from './TechStackAnalyzer.types';

export const CATEGORIES: Record<string, Omit<TechCategory, 'items'>> = {
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