/**
 * 🧩 TechStackAnalyzer Parser
 * 
 * Parsing and normalization functions:
 * - Tech string parsing with regex patterns
 * - Technology name normalization and aliasing
 * - Duplicate tech merging and consolidation
 */

import type { TechItem } from './TechStackAnalyzer.types';

/**
 * 기술 스택 문자열을 파싱하여 개별 기술들을 추출
 */
export function parseTechString(techString: string): string[] {
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
export function normalizeTechName(tech: string): string {
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
export function mergeDuplicateTechs(techItems: TechItem[]): TechItem[] {
  const techMap = new Map<string, TechItem>();

  techItems.forEach(item => {
    const key = item.name.toLowerCase();

    if (techMap.has(key)) {
      const existing = techMap.get(key);
      if (!existing) return; // undefined 체크
      
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