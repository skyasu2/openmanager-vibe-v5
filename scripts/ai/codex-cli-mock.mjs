#!/usr/bin/env node

/**
 * 🤖 Codex CLI Mock Script
 * ChatGPT Codex CLI가 설치되지 않은 환경에서 사용할 수 있는 Mock 스크립트
 * 
 * @created 2025-08-20
 * @version 1.0.0
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Mock Codex CLI functionality
const mockCodexResponse = async (prompt) => {
  // 시뮬레이션된 분석 결과
  const responses = {
    security: {
      score: 8.5,
      issues: ["Potential XSS vulnerability in user input", "Missing input validation"],
      recommendations: ["Add input sanitization", "Implement CSP headers"],
      priority: "high"
    },
    performance: {
      score: 7.8,
      issues: ["Large bundle size", "Unoptimized images"],
      recommendations: ["Implement code splitting", "Add image optimization"],
      priority: "medium"
    },
    architecture: {
      score: 9.2,
      issues: ["Some components could be more modular"],
      recommendations: ["Extract reusable components", "Implement better separation of concerns"],
      priority: "low"
    }
  };

  // 프롬프트 분석하여 적절한 응답 선택
  let category = 'architecture';
  if (prompt.toLowerCase().includes('security') || prompt.toLowerCase().includes('보안')) {
    category = 'security';
  } else if (prompt.toLowerCase().includes('performance') || prompt.toLowerCase().includes('성능')) {
    category = 'performance';
  }

  return responses[category];
};

// CLI 인터페이스
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--version')) {
    process.stdout.write('Codex CLI Mock v1.0.0\n');
    process.exit(0);
  }

  if (args.includes('--help') || args.length === 0) {
    process.stdout.write(`🤖 Codex CLI Mock

Usage: codex-cli [options] "<prompt>"

Options:
  --version        Show version
  --help           Show help
  --json          Output as JSON
  --verbose       Verbose output

Examples:
  codex-cli "Analyze this code for security issues"
  codex-cli "Optimize the performance of this component"
  codex-cli "Review the architecture of this module"
`);
    process.exit(0);
  }

  // 프롬프트 추출
  const prompt = args.find(arg => !arg.startsWith('--')) || args.join(' ');
  const isJson = args.includes('--json');
  const isVerbose = args.includes('--verbose');

  if (isVerbose) {
    console.log('🔍 Mock Codex CLI analyzing prompt:', prompt);
  }

  try {
    // Mock 응답 생성
    const response = await mockCodexResponse(prompt);
    
    // 항상 JSON 출력으로 통일 (AI 검토 시스템 호환성)
    const result = {
      status: 'success',
      tool: 'codex-cli-mock',
      timestamp: new Date().toISOString(),
      analysis: response,
      prompt: prompt,
      score: response.score,
      issues: response.issues,
      recommendations: response.recommendations,
      priority: response.priority
    };
    
    // process.stdout.write로 출력하여 채팅창 출력 방지
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

main().catch(console.error);