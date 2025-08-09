/**
 * 🛠️ CloudContextLoader Utilities - Helper Functions
 * 
 * Utility functions for CloudContextLoader:
 * - Path extraction and filtering
 * - Query hash generation
 * - Context optimization
 * - NLP path mapping
 * - Bundle type mapping
 * - Checksum generation
 */

import type { NLPType, BundleType } from './CloudContextLoader.types';

/**
 * 🔍 쿼리에서 관련 파일 경로 추출
 */
export function extractRelevantPaths(
  query: string,
  pathFilters: string[] = []
): string[] {
  const basePaths = [
    'src/app/dashboard',
    'src/components/dashboard',
    'src/services',
    'src/core/ai',
    'src/lib',
    'README.md',
    'package.json',
  ];

  // 쿼리 키워드 기반 경로 필터링
  const keywords = query.toLowerCase().split(' ');
  const relevantPaths = basePaths.filter((path) => {
    return keywords.some(
      (keyword) =>
        path.toLowerCase().includes(keyword) ||
        getPathKeywords(path).some((pathKeyword) =>
          pathKeyword.includes(keyword)
        )
    );
  });

  // 사용자 정의 필터 적용
  if (pathFilters.length > 0) {
    relevantPaths.push(...pathFilters);
  }

  return [...new Set(relevantPaths)]; // 중복 제거
}

/**
 * 🏷️ 경로에서 키워드 추출
 */
export function getPathKeywords(path: string): string[] {
  return path.split('/').concat(path.split('-')).concat(path.split('_'));
}

/**
 * 🧠 NLP 타입별 관련 경로 반환
 */
export function getNLPRelevantPaths(nlpType: string): string[] {
  const pathMap: Record<string, string[]> = {
    intent_analysis: ['src/core/ai', 'src/services/ai'],
    entity_extraction: ['src/lib', 'src/utils'],
    sentiment_analysis: ['src/components', 'src/app'],
    command_parsing: ['src/services', 'scripts'],
  };

  return pathMap[nlpType] || [];
}

/**
 * 📚 NLP 타입별 관련 번들 반환
 */
export function getBundlesForNLP(nlpType: string): BundleType[] {
  const bundleMap: Record<string, BundleType[]> = {
    intent_analysis: ['base', 'advanced'],
    entity_extraction: ['base'],
    sentiment_analysis: ['advanced'],
    command_parsing: ['base', 'custom'],
  };

  return bundleMap[nlpType] || ['base'];
}

/**
 * 🔑 쿼리 해시 생성
 */
export function generateQueryHash(query: string): string {
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    const char = query.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * 🔑 컨텍스트 ID 생성
 */
export function generateContextId(bundleType: string, clientId?: string): string {
  return clientId && bundleType === 'custom'
    ? `${bundleType}-${clientId}`
    : bundleType;
}

/**
 * 🔐 체크섬 생성
 */
export function generateChecksum(data: Record<string, unknown>): string {
  // 간단한 해시 생성 (실제로는 crypto 라이브러리 사용 권장)
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit 정수로 변환
  }
  return Math.abs(hash).toString(16);
}

/**
 * ✂️ 컨텍스트 길이 최적화
 */
export function optimizeContextLength(context: string): string {
  return context.length > 2000
    ? context.substring(0, 2000) + '...[더 많은 컨텍스트 사용 가능]'
    : context;
}

/**
 * 📝 MCP 컨텍스트 포맷팅 (NLP용)
 */
export function formatMCPContextForNLP(mcpContext: {
  files: Array<{ path: string; content: string }>;
}): string {
  return `[MCP 컨텍스트]\n${mcpContext.files
    .map((f) => `파일: ${f.path}\n내용: ${f.content.substring(0, 200)}...`)
    .join('\n')}\n\n`;
}

/**
 * 📝 로컬 컨텍스트 포맷팅 (NLP용)
 */
export function formatLocalContextForNLP(localContext: Array<{
  bundleType: string;
  documents: { markdown: Record<string, string> };
}>): string {
  let formatted = '';
  for (const context of localContext) {
    const markdownContent = Object.values(context.documents.markdown).join('\n');
    formatted += `[로컬 컨텍스트: ${context.bundleType}]\n${markdownContent.substring(0, 300)}...\n\n`;
  }
  return formatted;
}

/**
 * 🎯 기본 설정 생성
 */
export function createDefaultConfig(): {
  enableMemoryCache: boolean;
  enableFirestore: boolean;
  enableMCPIntegration: boolean;
  enableRAGIntegration: boolean;
  memoryPrefix: string;
  memoryTTL: number;
  maxCacheSize: number;
  compressionEnabled: boolean;
  mcpServerUrl: string;
  mcpHealthCheckInterval: number;
} {
  return {
    enableMemoryCache: true,
    enableFirestore: true,
    enableMCPIntegration: true,
    enableRAGIntegration: true,
    memoryPrefix: 'openmanager:context:',
    memoryTTL: 3600, // 1시간
    maxCacheSize: 50, // 최대 50개 컨텍스트 캐싱
    compressionEnabled: true,
    mcpServerUrl:
      process.env.GCP_MCP_SERVER_URL ||
      `http://${process.env.GCP_VM_IP || '104.154.205.25'}:${process.env.GCP_AI_BACKEND_PORT || '10000'}`, // Google Cloud VM AI 백엔드 (MCP와 무관)
    mcpHealthCheckInterval: 30000, // 30초
  };
}