/**
 * 🌍 환경 감지 및 설정 유틸리티
 */
import * as fs from 'fs';

export interface Environment {
  name: string;
  isProduction: boolean;
  isRender: boolean;
  isVercel: boolean;
  isLocal: boolean;
  platform: string;
  paths: {
    root: string;
    src: string;
    docs: string;
    data: string;
    actual: string; // 실제 현재 경로
  };
  limits: {
    memory: string;
    timeout: number;
    fileSize: string;
  };
}

/**
 * 현재 환경 감지
 */
export function detectEnvironment(): Environment {
  const isProduction = process.env.NODE_ENV === 'production';
  const isRender =
    process.env.RENDER === 'true' ||
    process.env.RENDER_SERVICE_ID !== undefined;
  const isVercel =
    process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
  const isLocal = !isRender && !isVercel;

  // 실제 현재 작업 디렉터리
  const actualPath = process.cwd();

  // 환경별 경로 설정
  let paths = {
    root: '.',
    src: './src',
    docs: './docs',
    data: './data',
    actual: actualPath,
  };

  if (isRender) {
    // Render 환경에서는 현재 작업 디렉터리가 실제 프로젝트 루트
    paths = {
      root: actualPath,
      src: `${actualPath}/src`,
      docs: `${actualPath}/docs`,
      data: `${actualPath}/data`,
      actual: actualPath,
    };
  } else if (isVercel) {
    paths = {
      root: '/var/task',
      src: '/var/task/src',
      docs: '/var/task/docs',
      data: '/tmp/data',
      actual: actualPath,
    };
  }

  // 환경별 제한사항
  const limits = {
    memory: isRender
      ? '--max-old-space-size=512'
      : isVercel
        ? '--max-old-space-size=256'
        : '--max-old-space-size=1024',
    timeout: isRender ? 30000 : isVercel ? 10000 : 60000,
    fileSize: isRender ? '10MB' : isVercel ? '5MB' : '50MB',
  };

  return {
    name: isRender ? 'render' : isVercel ? 'vercel' : 'local',
    isProduction,
    isRender,
    isVercel,
    isLocal,
    platform: process.platform,
    paths,
    limits,
  };
}

/**
 * 환경별 로깅
 */
export function envLog(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string
): void {
  const env = detectEnvironment();
  const timestamp = new Date().toISOString();
  const prefix = `[${env.name.toUpperCase()}]`;

  switch (level) {
    case 'info':
      console.log(`${timestamp} ${prefix} ℹ️  ${message}`);
      break;
    case 'warn':
      console.warn(`${timestamp} ${prefix} ⚠️  ${message}`);
      break;
    case 'error':
      console.error(`${timestamp} ${prefix} ❌ ${message}`);
      break;
    case 'debug':
      if (process.env.DEBUG === 'true') {
        console.debug(`${timestamp} ${prefix} 🐛 ${message}`);
      }
      break;
  }
}

/**
 * 경로 존재 여부 확인
 */
export function checkPaths(): void {
  const env = detectEnvironment();

  if (typeof window !== 'undefined') {
    console.log('🌐 브라우저 환경에서는 경로 확인을 건너뜁니다.');
    return;
  }

  try {
    console.log(`🔍 ${env.name.toUpperCase()} 환경 경로 확인:`);
    console.log(`📍 현재 작업 디렉터리: ${env.paths.actual}`);

    Object.entries(env.paths).forEach(([key, path]) => {
      if (key === 'actual') return;

      try {
        const exists = fs.existsSync(path);
        console.log(`  ${exists ? '✅' : '❌'} ${key}: ${path}`);

        if (exists && key === 'src') {
          // src 디렉터리 내 주요 폴더 확인
          const srcContents = fs.readdirSync(path);
          const importantFolders = ['services', 'components', 'app', 'utils'];
          const foundFolders = importantFolders.filter(folder =>
            srcContents.includes(folder)
          );
          console.log(`    📁 src 내용: ${foundFolders.join(', ')}`);
        }
      } catch (e) {
        console.log(`  ❌ ${key}: ${path} (확인 불가)`);
      }
    });
  } catch (error) {
    console.warn('⚠️ 경로 확인 중 오류:', error);
  }
}

/**
 * Render 전용 설정
 */
export function getRenderConfig() {
  const env = detectEnvironment();

  if (!env.isRender) {
    throw new Error('Render 환경이 아닙니다');
  }

  return {
    buildCommand:
      'npm ci && npm install @modelcontextprotocol/server-filesystem @smithery/cli canvas && npm run build',
    startCommand: 'npm start',
    healthCheckPath: '/api/health',
    envVars: {
      NODE_ENV: 'production',
      RENDER: 'true',
      NODE_OPTIONS: env.limits.memory,
      NEXT_TELEMETRY_DISABLED: '1',
    },
    paths: env.paths,
    scaling: {
      minInstances: 1,
      maxInstances: 2,
      memoryLimit: '512MB',
      cpuLimit: '0.5',
    },
  };
}

/**
 * MCP 환경별 설정
 */
export function getMCPConfig() {
  const env = detectEnvironment();

  return {
    filesystem: {
      enabled: true,
      paths: [env.paths.src, env.paths.docs],
      maxFileSize: env.limits.fileSize,
      timeout: env.limits.timeout,
    },
    github: {
      enabled: !!process.env.GITHUB_TOKEN,
      token:
        process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
      timeout: env.limits.timeout,
    },
    performance: {
      memoryLimit: env.limits.memory,
      requestTimeout: env.limits.timeout,
      maxConcurrentRequests: env.isRender ? 5 : env.isVercel ? 3 : 10,
    },
  };
}
