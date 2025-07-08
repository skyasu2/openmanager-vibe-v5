#!/usr/bin/env node

/**
 * 📚 문서 자동 갱신 스크립트
 * 
 * 커밋 시 자동으로 실행되어 기존 문서를 우선 갱신하고,
 * 필요한 경우에만 새로운 문서를 생성합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 📁 문서 경로 설정
const DOCS_DIR = path.join(projectRoot, 'docs');
const CHANGELOG_PATH = path.join(projectRoot, 'CHANGELOG.md');
const README_PATH = path.join(projectRoot, 'README.md');

// 🎯 문서 갱신 정책
const DOC_UPDATE_POLICY = {
    // 기존 문서 우선 갱신 대상
    updateFirst: [
        'docs/ARCHITECTURE.md',
        'docs/API.md',
        'docs/environment/vercel.env.template',
        'docs/technical-specifications/system-architecture.md',
        'docs/technical-specifications/ai-engine-implementation.md'
    ],
    // 새 문서 생성 시 템플릿
    templates: {
        'system-config': 'docs/system-configuration-v{version}.md',
        'deployment': 'docs/deployment-guide-v{version}.md',
        'api-reference': 'docs/api-reference-v{version}.md'
    }
};

/**
 * 📊 현재 프로젝트 정보 수집
 */
function getProjectInfo() {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');

    // 최신 버전 추출
    const versionMatch = changelog.match(/## \[(\d+\.\d+\.\d+)\]/);
    const currentVersion = versionMatch ? versionMatch[1] : packageJson.version;

    return {
        name: packageJson.name,
        version: currentVersion,
        description: packageJson.description,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('ko-KR')
    };
}

/**
 * 🔄 서버 설정 정보 수집
 */
function getServerConfig() {
    try {
        const configPath = path.join(projectRoot, 'src/config/serverConfig.ts');
        const configContent = fs.readFileSync(configPath, 'utf8');

        // 설정값 추출
        const serverCountMatch = configContent.match(/DEFAULT_SERVER_COUNT = (\d+)/);
        const updateIntervalMatch = configContent.match(/updateInterval = (\d+)/);
        const warningPercentMatch = configContent.match(/warningPercent = (0\.\d+)/);
        const criticalPercentMatch = configContent.match(/criticalCount.*0\.(\d+)/);

        return {
            serverCount: serverCountMatch ? parseInt(serverCountMatch[1]) : 15,
            updateInterval: updateIntervalMatch ? parseInt(updateIntervalMatch[1]) : 30000,
            warningPercent: warningPercentMatch ? parseFloat(warningPercentMatch[1]) * 100 : 30,
            criticalPercent: criticalPercentMatch ? parseInt(criticalPercentMatch[1]) : 15
        };
    } catch (error) {
        console.warn('⚠️ 서버 설정 읽기 실패:', error.message);
        return {
            serverCount: 15,
            updateInterval: 30000,
            warningPercent: 30,
            criticalPercent: 15
        };
    }
}

/**
 * 📝 ARCHITECTURE.md 갱신
 */
function updateArchitectureDoc(projectInfo, serverConfig) {
    const archPath = path.join(DOCS_DIR, 'ARCHITECTURE.md');

    if (!fs.existsSync(archPath)) {
        console.log('📄 ARCHITECTURE.md 파일이 없어 새로 생성합니다.');
        createNewArchitectureDoc(archPath, projectInfo, serverConfig);
        return;
    }

    let content = fs.readFileSync(archPath, 'utf8');

    // 서버 설정 섹션 갱신
    const serverConfigSection = `
## 🎯 서버 데이터 생성 설정

### 현재 설정 (v${projectInfo.version})
- **총 서버 수**: ${serverConfig.serverCount}개 (로컬/Vercel 통일)
- **업데이트 간격**: ${serverConfig.updateInterval / 1000}초
- **심각 상태 비율**: ${serverConfig.criticalPercent}% (약 ${Math.floor(serverConfig.serverCount * serverConfig.criticalPercent / 100)}개)
- **경고 상태 비율**: ${serverConfig.warningPercent}% (약 ${Math.floor(serverConfig.serverCount * serverConfig.warningPercent / 100)}개)
- **오차 범위**: ±5%

### 아키텍처 특징
- **환경 통일**: 로컬과 Vercel 환경에서 동일한 설정 사용
- **중앙 설정**: \`src/config/serverConfig.ts\`에서 통합 관리
- **실시간 수집**: ${serverConfig.updateInterval / 1000}초마다 서버 상태 갱신
- **Redis 캐싱**: 배치 저장으로 성능 최적화

*마지막 갱신: ${projectInfo.date} (${projectInfo.version})*
`;

    // 기존 서버 설정 섹션 찾아서 교체
    const serverSectionRegex = /## 🎯 서버 데이터 생성 설정[\s\S]*?(?=##|$)/;

    if (serverSectionRegex.test(content)) {
        content = content.replace(serverSectionRegex, serverConfigSection.trim() + '\n\n');
        console.log('✅ ARCHITECTURE.md 서버 설정 섹션 갱신 완료');
    } else {
        // 서버 설정 섹션이 없으면 추가
        content += '\n' + serverConfigSection;
        console.log('✅ ARCHITECTURE.md에 서버 설정 섹션 추가 완료');
    }

    fs.writeFileSync(archPath, content);
}

/**
 * 📝 새로운 ARCHITECTURE.md 생성
 */
function createNewArchitectureDoc(archPath, projectInfo, serverConfig) {
    const content = `# ${projectInfo.name} 시스템 아키텍처

> 마지막 갱신: ${projectInfo.date} (v${projectInfo.version})

## 🎯 서버 데이터 생성 설정

### 현재 설정 (v${projectInfo.version})
- **총 서버 수**: ${serverConfig.serverCount}개 (로컬/Vercel 통일)
- **업데이트 간격**: ${serverConfig.updateInterval / 1000}초
- **심각 상태 비율**: ${serverConfig.criticalPercent}% (약 ${Math.floor(serverConfig.serverCount * serverConfig.criticalPercent / 100)}개)
- **경고 상태 비율**: ${serverConfig.warningPercent}% (약 ${Math.floor(serverConfig.serverCount * serverConfig.warningPercent / 100)}개)
- **오차 범위**: ±5%

### 아키텍처 특징
- **환경 통일**: 로컬과 Vercel 환경에서 동일한 설정 사용
- **중앙 설정**: \`src/config/serverConfig.ts\`에서 통합 관리
- **실시간 수집**: ${serverConfig.updateInterval / 1000}초마다 서버 상태 갱신
- **Redis 캐싱**: 배치 저장으로 성능 최적화

## 📊 데이터 플로우

\`\`\`
서버 생성(${serverConfig.serverCount}개) → 데이터 전처리 → Redis 저장 → API 엔드포인트 → 대시보드 UI
\`\`\`

## 🔧 환경별 최적화

### 로컬 개발 환경
- 서버 수: ${serverConfig.serverCount}개
- 업데이트: ${serverConfig.updateInterval / 1000}초 간격
- Redis: 실제 연결 또는 Mock

### Vercel 프로덕션 환경  
- 서버 수: ${serverConfig.serverCount}개 (동일)
- 업데이트: ${serverConfig.updateInterval / 1000}초 간격 (동일)
- Redis: Upstash 연결

*자동 생성: ${projectInfo.timestamp}*
`;

    fs.writeFileSync(archPath, content);
    console.log('✅ 새로운 ARCHITECTURE.md 생성 완료');
}

/**
 * 📝 API.md 갱신
 */
function updateApiDoc(projectInfo, serverConfig) {
    const apiPath = path.join(DOCS_DIR, 'API.md');

    if (!fs.existsSync(apiPath)) {
        console.log('📄 API.md 파일이 없어 새로 생성합니다.');
        createNewApiDoc(apiPath, projectInfo, serverConfig);
        return;
    }

    let content = fs.readFileSync(apiPath, 'utf8');

    // 서버 API 섹션 갱신
    const serverApiSection = `
## 🖥️ 서버 모니터링 API

### GET /api/servers/realtime
실시간 서버 데이터 조회

**설정 정보:**
- 총 서버 수: ${serverConfig.serverCount}개
- 업데이트 간격: ${serverConfig.updateInterval / 1000}초
- 심각 상태: ${serverConfig.criticalPercent}% (${Math.floor(serverConfig.serverCount * serverConfig.criticalPercent / 100)}개)
- 경고 상태: ${serverConfig.warningPercent}% (${Math.floor(serverConfig.serverCount * serverConfig.warningPercent / 100)}개)

**응답 예시:**
\`\`\`json
{
  "servers": [
    {
      "id": "server-1",
      "name": "웹서버-1",
      "status": "running",
      "cpu": 45.2,
      "memory": 67.8,
      "disk": 23.1,
      "network": 12.5
    }
  ],
  "summary": {
    "total": ${serverConfig.serverCount},
    "running": ${serverConfig.serverCount - Math.floor(serverConfig.serverCount * (serverConfig.criticalPercent + serverConfig.warningPercent) / 100)},
    "warning": ${Math.floor(serverConfig.serverCount * serverConfig.warningPercent / 100)},
    "critical": ${Math.floor(serverConfig.serverCount * serverConfig.criticalPercent / 100)}
  },
  "lastUpdated": "2025-07-02T10:30:00Z"
}
\`\`\`

*마지막 갱신: ${projectInfo.date} (${projectInfo.version})*
`;

    // 기존 서버 API 섹션 찾아서 교체
    const apiSectionRegex = /## 🖥️ 서버 모니터링 API[\s\S]*?(?=##|$)/;

    if (apiSectionRegex.test(content)) {
        content = content.replace(apiSectionRegex, serverApiSection.trim() + '\n\n');
        console.log('✅ API.md 서버 API 섹션 갱신 완료');
    } else {
        content += '\n' + serverApiSection;
        console.log('✅ API.md에 서버 API 섹션 추가 완료');
    }

    fs.writeFileSync(apiPath, content);
}

/**
 * 📝 새로운 API.md 생성
 */
function createNewApiDoc(apiPath, projectInfo, serverConfig) {
    const content = `# ${projectInfo.name} API 문서

> 마지막 갱신: ${projectInfo.date} (v${projectInfo.version})

## 🖥️ 서버 모니터링 API

### GET /api/servers/realtime
실시간 서버 데이터 조회

**설정 정보:**
- 총 서버 수: ${serverConfig.serverCount}개
- 업데이트 간격: ${serverConfig.updateInterval / 1000}초
- 심각 상태: ${serverConfig.criticalPercent}% (${Math.floor(serverConfig.serverCount * serverConfig.criticalPercent / 100)}개)
- 경고 상태: ${serverConfig.warningPercent}% (${Math.floor(serverConfig.serverCount * serverConfig.warningPercent / 100)}개)

**응답 예시:**
\`\`\`json
{
  "servers": [
    {
      "id": "server-1", 
      "name": "웹서버-1",
      "status": "running",
      "cpu": 45.2,
      "memory": 67.8,
      "disk": 23.1,
      "network": 12.5
    }
  ],
  "summary": {
    "total": ${serverConfig.serverCount},
    "running": ${serverConfig.serverCount - Math.floor(serverConfig.serverCount * (serverConfig.criticalPercent + serverConfig.warningPercent) / 100)},
    "warning": ${Math.floor(serverConfig.serverCount * serverConfig.warningPercent / 100)},
    "critical": ${Math.floor(serverConfig.serverCount * serverConfig.criticalPercent / 100)}
  },
  "lastUpdated": "2025-07-02T10:30:00Z"
}
\`\`\`

### GET /api/health
시스템 헬스체크

### GET /api/servers/{id}
특정 서버 상세 정보 조회

*자동 생성: ${projectInfo.timestamp}*
`;

    fs.writeFileSync(apiPath, content);
    console.log('✅ 새로운 API.md 생성 완료');
}

/**
 * 📝 환경 설정 템플릿 갱신
 */
function updateEnvTemplate(projectInfo, serverConfig) {
    const envPath = path.join(DOCS_DIR, 'environment/vercel.env.template');

    if (!fs.existsSync(envPath)) {
        console.log('⚠️ vercel.env.template 파일을 찾을 수 없습니다.');
        return;
    }

    let content = fs.readFileSync(envPath, 'utf8');

    // 주석 갱신
    const updatedComment = `# 데이터 생성기 최적화 (로컬/Vercel 통일 - v${projectInfo.version})
# 서버 수: ${serverConfig.serverCount}개, 간격: ${serverConfig.updateInterval / 1000}초, 심각: ${serverConfig.criticalPercent}%, 경고: ${serverConfig.warningPercent}%`;

    content = content.replace(
        /# 데이터 생성기 최적화.*$/m,
        updatedComment
    );

    fs.writeFileSync(envPath, content);
    console.log('✅ vercel.env.template 주석 갱신 완료');
}

/**
 * 🚀 메인 실행 함수
 */
async function main() {
    console.log('📚 문서 자동 갱신 시작...\n');

    try {
        // 프로젝트 정보 수집
        const projectInfo = getProjectInfo();
        const serverConfig = getServerConfig();

        console.log(`📊 프로젝트: ${projectInfo.name} v${projectInfo.version}`);
        console.log(`🎯 서버 설정: ${serverConfig.serverCount}개, ${serverConfig.updateInterval / 1000}초 간격\n`);

        // docs 디렉토리 확인
        if (!fs.existsSync(DOCS_DIR)) {
            fs.mkdirSync(DOCS_DIR, { recursive: true });
            console.log('📁 docs 디렉토리 생성 완료');
        }

        // 문서 갱신 실행
        updateArchitectureDoc(projectInfo, serverConfig);
        updateApiDoc(projectInfo, serverConfig);
        updateEnvTemplate(projectInfo, serverConfig);

        console.log('\n✅ 문서 자동 갱신 완료!');
        console.log('📝 갱신된 문서:');
        console.log('  - docs/ARCHITECTURE.md');
        console.log('  - docs/API.md');
        console.log('  - docs/environment/vercel.env.template');

    } catch (error) {
        console.error('❌ 문서 갱신 실패:', error.message);
        process.exit(1);
    }
}

// 스크립트 직접 실행 시에만 main 함수 호출
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { getProjectInfo, getServerConfig, main };

