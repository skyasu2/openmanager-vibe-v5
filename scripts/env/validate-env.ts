#!/usr/bin/env tsx

/**
 * 환경변수 검증 스크립트 - OpenManager VIBE v5 (TypeScript 버전)
 * 프로덕션 배포 전 필수 환경변수 검증
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// 색상 출력을 위한 ANSI 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
} as const;

console.log(`${colors.cyan}${colors.bright}
🔍 OpenManager VIBE v5 - 환경변수 검증
======================================${colors.reset}\n`);

// 타입 정의
interface EnvConfig {
  description: string;
  example: string;
  required: boolean;
  category: string;
}

interface ValidationResult {
  key: string;
  status: 'success' | 'warning' | 'error' | 'unknown';
  message: string;
  category: string;
}

interface CategoryItem {
  key: string;
  config: EnvConfig;
  result: ValidationResult;
  value: string;
}

interface Categories {
  [key: string]: CategoryItem[];
}

interface EnvVars {
  [key: string]: string | undefined;
}

// 필수 환경변수 정의
const requiredEnvVars: Record<string, EnvConfig> = {
  // Next.js & Vercel 설정
  'NEXT_PUBLIC_APP_URL': {
    description: 'Next.js 애플리케이션 URL',
    example: 'https://your-app.vercel.app',
    required: true,
    category: 'Next.js/Vercel'
  },
  'NEXTAUTH_SECRET': {
    description: 'NextAuth.js 시크릿 키',
    example: 'your-nextauth-secret-key-here',
    required: true,
    category: 'Next.js/Vercel'
  },
  'NEXTAUTH_URL': {
    description: 'NextAuth.js 콜백 URL',
    example: 'https://your-app.vercel.app',
    required: true,
    category: 'Next.js/Vercel'
  },

  // Supabase 설정
  'NEXT_PUBLIC_SUPABASE_URL': {
    description: 'Supabase 프로젝트 URL',
    example: 'https://your-project.supabase.co',
    required: true,
    category: 'Supabase'
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    description: 'Supabase Anonymous Key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
    category: 'Supabase'
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    description: 'Supabase Service Role Key (서버 전용)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
    category: 'Supabase'
  },

  // GitHub OAuth
  'GITHUB_CLIENT_ID': {
    description: 'GitHub OAuth App Client ID',
    example: 'your-github-client-id',
    required: true,
    category: 'GitHub OAuth'
  },
  'GITHUB_CLIENT_SECRET': {
    description: 'GitHub OAuth App Client Secret',
    example: 'your-github-client-secret',
    required: true,
    category: 'GitHub OAuth'
  },

  // Cloud Run AI (Mistral via Cloud Run)
  'CLOUD_RUN_AI_URL': {
    description: 'Cloud Run AI Engine URL',
    example: 'https://ai-engine-xxx.asia-northeast1.run.app',
    required: false,
    category: 'Cloud Run AI'
  },

  // GCP Functions
  'GCP_KOREAN_NLP_ENDPOINT': {
    description: 'GCP Korean NLP Cloud Run URL',
    example: 'https://enhanced-korean-nlp-xxxxx-xx.a.run.app',
    required: false,
    category: 'GCP Functions'
  },
  'GCP_ML_ANALYTICS_ENDPOINT': {
    description: 'GCP ML Analytics Cloud Run URL',
    example: 'https://ml-analytics-engine-xxxxx-xx.a.run.app',
    required: false,
    category: 'GCP Functions'
  },
  'GCP_AI_PROCESSOR_ENDPOINT': {
    description: 'GCP AI Processor Cloud Run URL',
    example: 'https://unified-ai-processor-xxxxx-xx.a.run.app',
    required: false,
    category: 'GCP Functions'
  },
  'GROQ_API_KEY': {
    description: 'Groq API Key (for fast routing & fallback)',
    example: 'gsk_...',
    required: false,
    category: 'Groq AI'
  }
};

// 환경변수 로드 함수
function loadEnvironmentVariables(): EnvVars {
  const envFiles = ['.env.local', '.env.production', '.env'];
  const envVars: EnvVars = { ...process.env };

  for (const file of envFiles) {
    const filePath = join(process.cwd(), file);
    if (existsSync(filePath)) {
      console.log(`📄 ${file} 파일 발견 - 로딩 중...`);
      
      try {
        const content = readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            envVars[key.trim()] = value.trim();
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`⚠️  ${file} 읽기 실패:`, errorMessage);
      }
    }
  }

  return envVars;
}

// 환경변수 검증 함수
function validateEnvironmentVariable(key: string, config: EnvConfig, value?: string): ValidationResult {
  const result: ValidationResult = {
    key,
    status: 'unknown',
    message: '',
    category: config.category
  };

  if (!value || value.trim() === '') {
    result.status = config.required ? 'error' : 'warning';
    result.message = config.required ? '필수 환경변수가 설정되지 않았습니다' : '선택적 환경변수가 설정되지 않았습니다';
    return result;
  }

  // 기본 유효성 검사
  if (value.includes('your-') || value.includes('example') || value.includes('placeholder')) {
    result.status = 'warning';
    result.message = '플레이스홀더 값으로 보입니다 - 실제 값으로 변경하세요';
    return result;
  }

  // 특정 환경변수별 검증
  if (key.includes('URL') && !value.startsWith('http')) {
    result.status = 'error';
    result.message = 'URL은 http:// 또는 https://로 시작해야 합니다';
    return result;
  }

  if (key.includes('SUPABASE_URL') && !value.includes('supabase.co')) {
    result.status = 'warning';
    result.message = 'Supabase URL 형식이 아닌 것 같습니다';
    return result;
  }

  if (key.includes('CLOUD_RUN_AI_URL') && !value.includes('run.app')) {
    result.status = 'warning';
    result.message = 'Cloud Run URL 형식이 아닌 것 같습니다';
    return result;
  }

  if (key.includes('GROQ_API_KEY') && !value.startsWith('gsk_')) {
    result.status = 'warning';
    result.message = 'Groq API 키 형식이 아닌 것 같습니다 (gsk_로 시작해야 함)';
    return result;
  }

  if (key.includes('GITHUB_CLIENT_ID') && value.length < 20) {
    result.status = 'warning';
    result.message = 'GitHub Client ID가 너무 짧습니다';
    return result;
  }

  // JWT 토큰 길이 검사
  if ((key.includes('KEY') || key.includes('SECRET')) && key.includes('SUPABASE') && value.length < 100) {
    result.status = 'warning';
    result.message = 'Supabase 키가 너무 짧습니다';
    return result;
  }

  result.status = 'success';
  result.message = '✓ 올바르게 설정됨';
  return result;
}

// 메인 검증 함수
function validateEnvironment(): void {
  console.log('환경변수 로딩 중...\n');
  const envVars = loadEnvironmentVariables();
  
  console.log('검증 시작...\n');
  
  let totalChecks = 0;
  let successCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  
  // 카테고리별로 그룹화
  const categories: Categories = {};
  
  for (const [key, config] of Object.entries(requiredEnvVars)) {
    if (!categories[config.category]) {
      categories[config.category] = [];
    }
    
    const value = envVars[key];
    const result = validateEnvironmentVariable(key, config, value);
    
    categories[config.category].push({
      key,
      config,
      result,
      value: value ? '***' + value.slice(-4) : '(없음)'
    });
    
    totalChecks++;
    if (result.status === 'success') successCount++;
    else if (result.status === 'warning') warningCount++;
    else if (result.status === 'error') errorCount++;
  }
  
  // 결과 출력
  for (const [category, items] of Object.entries(categories)) {
    console.log(`${colors.bright}📦 ${category}${colors.reset}`);
    console.log('─'.repeat(50));
    
    for (const item of items) {
      let statusIcon: string;
      let statusColor: string;
      
      switch (item.result.status) {
        case 'success':
          statusIcon = '✅';
          statusColor = colors.green;
          break;
        case 'warning':
          statusIcon = '⚠️ ';
          statusColor = colors.yellow;
          break;
        case 'error':
          statusIcon = '❌';
          statusColor = colors.red;
          break;
        default:
          statusIcon = '❓';
          statusColor = colors.reset;
      }
      
      console.log(`${statusIcon} ${colors.bright}${item.key}${colors.reset}`);
      console.log(`   ${statusColor}${item.result.message}${colors.reset}`);
      console.log(`   값: ${item.value}`);
      
      if (item.result.status !== 'success') {
        console.log(`   ${colors.blue}예시: ${item.config.example}${colors.reset}`);
      }
      
      console.log('');
    }
  }
  
  // 요약 리포트
  console.log(`${colors.bright}📊 검증 결과 요약${colors.reset}`);
  console.log('═'.repeat(50));
  console.log(`총 검사 항목: ${totalChecks}`);
  console.log(`${colors.green}✅ 성공: ${successCount}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  경고: ${warningCount}${colors.reset}`);
  console.log(`${colors.red}❌ 에러: ${errorCount}${colors.reset}`);
  
  const successRate = Math.round((successCount / totalChecks) * 100);
  console.log(`\n성공률: ${successRate}%`);
  
  // 권장사항
  console.log(`\n${colors.bright}💡 권장사항${colors.reset}`);
  console.log('─'.repeat(50));
  
  if (errorCount > 0) {
    console.log(`${colors.red}🚫 ${errorCount}개의 필수 환경변수가 누락되었습니다. 배포 전에 반드시 설정하세요.${colors.reset}`);
  }
  
  if (warningCount > 0) {
    console.log(`${colors.yellow}⚠️  ${warningCount}개의 환경변수에 문제가 있을 수 있습니다. 확인해보세요.${colors.reset}`);
  }
  
  if (errorCount === 0 && warningCount <= 2) {
    console.log(`${colors.green}🎉 환경변수 설정이 양호합니다! 배포를 진행하셔도 됩니다.${colors.reset}`);
  }
  
  console.log(`\n${colors.blue}📚 자세한 설정 방법은 .env.local.template 파일을 참조하세요.${colors.reset}`);
  
  // 종료 코드 설정
  process.exit(errorCount > 0 ? 1 : 0);
}

// 메인 실행
if (require.main === module) {
  try {
    validateEnvironment();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${colors.red}❌ 환경변수 검증 중 오류 발생:${colors.reset}`, errorMessage);
    process.exit(1);
  }
}

export { validateEnvironment, loadEnvironmentVariables };