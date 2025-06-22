/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 🧪 LocalRAG 테스트 데이터 생성 스크립트
 *
 * 기능:
 * - 8개 테스트 명령어 생성
 * - JSON 형식으로 저장
 * - 메타데이터 포함
 */

const fs = require('fs');
const path = require('path');

// LocalRAG 데이터 디렉토리 경로
const localRAGDataDir = path.join(__dirname, '..', 'src', 'data', 'local-rag');

// 테스트용 명령어 데이터
const testCommands = [
  {
    id: 'local-ls',
    command: 'ls -la',
    description: 'List all files and directories with detailed information',
    category: 'file-management',
    content:
      'The ls -la command shows all files and directories including hidden ones with detailed permissions, ownership, and timestamps',
  },
  {
    id: 'local-grep',
    command: 'grep -r "pattern" .',
    description: 'Search for text patterns recursively in files',
    category: 'search',
    content:
      'Grep is a powerful search tool that can find text patterns in files recursively through directory structures',
  },
  {
    id: 'local-top',
    command: 'top',
    description: 'Display running processes and system resource usage',
    category: 'monitoring',
    content:
      'The top command provides real-time view of running processes, CPU usage, memory consumption, and system load',
  },
  {
    id: 'local-docker-ps',
    command: 'docker ps -a',
    description: 'List all Docker containers',
    category: 'docker',
    content:
      'Docker ps shows all containers including stopped ones with their status, ports, and names',
  },
  {
    id: 'local-kubectl-get',
    command: 'kubectl get pods',
    description: 'List Kubernetes pods',
    category: 'kubernetes',
    content:
      'Kubectl get pods displays all pods in the current namespace with their status and readiness',
  },
  {
    id: 'local-systemctl',
    command: 'systemctl status service-name',
    description: 'Check service status',
    category: 'system',
    content:
      'Systemctl status shows detailed information about system services including their current state and recent logs',
  },
  {
    id: 'local-netstat',
    command: 'netstat -tulnp',
    description: 'Show network connections and listening ports',
    category: 'network',
    content:
      'Netstat displays active network connections, listening ports, and the processes using them',
  },
  {
    id: 'local-df',
    command: 'df -h',
    description: 'Display disk space usage in human readable format',
    category: 'disk',
    content:
      'The df command shows filesystem disk space usage with -h flag for human readable sizes',
  },
];

async function createLocalRAGData() {
  try {
    console.log('🔧 LocalRAG 테스트 데이터 생성 시작...');

    // 디렉토리 생성
    if (!fs.existsSync(localRAGDataDir)) {
      fs.mkdirSync(localRAGDataDir, { recursive: true });
      console.log(`📁 디렉토리 생성: ${localRAGDataDir}`);
    }

    // 명령어 데이터 파일 생성
    const commandsFile = path.join(localRAGDataDir, 'commands.json');
    fs.writeFileSync(commandsFile, JSON.stringify(testCommands, null, 2));
    console.log(`📄 명령어 데이터 파일 생성: ${commandsFile}`);

    // 메타데이터 파일 생성
    const metadataFile = path.join(localRAGDataDir, 'metadata.json');
    const metadata = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      totalDocuments: testCommands.length,
      categories: [...new Set(testCommands.map(cmd => cmd.category))],
      description: 'LocalRAG 테스트 데이터 - 하이브리드 RAG 폴백용',
    };
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    console.log(`📄 메타데이터 파일 생성: ${metadataFile}`);

    // 개별 문서 파일 생성
    const documentsDir = path.join(localRAGDataDir, 'documents');
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
    }

    testCommands.forEach(cmd => {
      const docFile = path.join(documentsDir, `${cmd.id}.json`);
      fs.writeFileSync(docFile, JSON.stringify(cmd, null, 2));
    });
    console.log(
      `📁 개별 문서 파일 생성: ${documentsDir} (${testCommands.length}개)`
    );

    console.log('✅ LocalRAG 테스트 데이터 생성 완료!');
    console.log('');
    console.log('📊 생성된 데이터:');
    console.log(`   - 총 문서: ${testCommands.length}개`);
    console.log(`   - 카테고리: ${metadata.categories.join(', ')}`);
    console.log(`   - 저장 위치: ${localRAGDataDir}`);
    console.log('');
    console.log('🔄 이제 하이브리드 RAG 테스트를 실행할 수 있습니다:');
    console.log(
      '   curl "http://localhost:3009/api/test-hybrid-rag?query=list%20files&forceLocal=true"'
    );
  } catch (error) {
    console.error('❌ LocalRAG 데이터 생성 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  createLocalRAGData();
}

module.exports = { createLocalRAGData, testCommands };
