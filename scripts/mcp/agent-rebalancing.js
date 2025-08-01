#!/usr/bin/env node

/**
 * ===============================================
 * MCP 서버 에이전트 재배치 최적화 스크립트
 * OpenManager VIBE v5 - Agent Coordinator
 * ===============================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 설정
const CONFIG = {
    agentsDir: '.claude/agents',
    backupDir: '.claude/agents/backup',
    logFile: `mcp_rebalancing_${new Date().toISOString().split('T')[0]}.log`,
    dryRun: process.argv.includes('--dry-run'),
    verbose: process.argv.includes('--verbose'),
};

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    purple: '\x1b[35m',
    cyan: '\x1b[36m',
};

// 로그 함수
const log = {
    info: (msg) => {
        const timestamp = new Date().toISOString();
        const logMsg = `[INFO ${timestamp}] ${msg}`;
        console.log(`${colors.blue}${logMsg}${colors.reset}`);
        fs.appendFileSync(CONFIG.logFile, logMsg + '\n');
    },
    success: (msg) => {
        const timestamp = new Date().toISOString();
        const logMsg = `[SUCCESS ${timestamp}] ${msg}`;
        console.log(`${colors.green}${logMsg}${colors.reset}`);
        fs.appendFileSync(CONFIG.logFile, logMsg + '\n');
    },
    warning: (msg) => {
        const timestamp = new Date().toISOString();
        const logMsg = `[WARNING ${timestamp}] ${msg}`;
        console.log(`${colors.yellow}${logMsg}${colors.reset}`);
        fs.appendFileSync(CONFIG.logFile, logMsg + '\n');
    },
    error: (msg) => {
        const timestamp = new Date().toISOString();
        const logMsg = `[ERROR ${timestamp}] ${msg}`;
        console.log(`${colors.red}${logMsg}${colors.reset}`);
        fs.appendFileSync(CONFIG.logFile, logMsg + '\n');
    },
    metric: (msg) => {
        const timestamp = new Date().toISOString();
        const logMsg = `[METRIC ${timestamp}] ${msg}`;
        console.log(`${colors.cyan}${logMsg}${colors.reset}`);
        fs.appendFileSync(CONFIG.logFile, logMsg + '\n');
    },
};

// 현재 에이전트-MCP 매핑 (최적화 전)
const currentMapping = {
    'filesystem': [
        'doc-writer-researcher',
        'mcp-server-admin', 
        'test-automation-specialist',
        'doc-structure-guardian',
        'security-auditor',
        'debugger-specialist',
        'backend-gcp-specialist',
        'agent-coordinator',
        'execution-tracker',
        'code-review-specialist'
    ],
    'memory': [
        'mcp-server-admin',
        'test-automation-specialist', 
        'agent-coordinator',
        'execution-tracker',
        'ai-systems-engineer',
        'gemini-cli-collaborator'
    ],
    'github': [
        'doc-writer-researcher',
        'security-auditor',
        'debugger-specialist',
        'backend-gcp-specialist',
        'git-cicd-specialist'
    ],
    'supabase': [
        'database-administrator'
    ],
    'tavily-mcp': [
        'doc-writer-researcher',
        'vercel-monitor',
        'backend-gcp-specialist'
    ],
    'context7': [
        'doc-writer-researcher',
        'test-automation-specialist',
        'doc-structure-guardian',
        'ux-performance-optimizer',
        'backend-gcp-specialist',
        'database-administrator',
        'ai-systems-engineer'
    ],
    'sequential-thinking': [
        'mcp-server-admin',
        'debugger-specialist',
        'agent-coordinator'
    ],
    'playwright': [
        'test-automation-specialist',
        'ux-performance-optimizer'
    ],
    'time': [
        'vercel-monitor',
        'doc-writer-researcher',
        'doc-structure-guardian',
        'execution-tracker',
        'debugger-specialist',
        'database-administrator'
    ],
    'serena': [
        'test-automation-specialist',
        'ux-performance-optimizer',
        'debugger-specialist',
        'ai-systems-engineer'
    ]
};

// 최적화된 에이전트-MCP 매핑 (목표)
const optimizedMapping = {
    'filesystem': [
        'doc-writer-researcher',
        'mcp-server-admin',
        'test-automation-specialist', 
        'backend-gcp-specialist',
        'debugger-specialist',
        'code-review-specialist'
    ],
    'memory': [
        'mcp-server-admin',
        'test-automation-specialist',
        'agent-coordinator', // 캐싱 지원
        'execution-tracker',
        'ai-systems-engineer',
        'gemini-cli-collaborator',
        'security-auditor' // 스캔 결과 캐싱
    ],
    'github': [
        'doc-writer-researcher',
        'security-auditor', // PR 연동 강화
        'debugger-specialist',
        'backend-gcp-specialist',
        'git-cicd-specialist',
        'agent-coordinator' // 협업 로그
    ],
    'supabase': [
        'database-administrator',
        'execution-tracker', // 성능 메트릭 저장
        'agent-coordinator', // 에이전트 상태 관리
        'security-auditor', // 보안 스캔 결과 저장
        'doc-structure-guardian' // 문서 메타데이터
    ],
    'tavily-mcp': [
        'doc-writer-researcher',
        'vercel-monitor',
        'backend-gcp-specialist'
    ],
    'context7': [
        'doc-writer-researcher',
        'test-automation-specialist',
        'doc-structure-guardian',
        'ux-performance-optimizer',
        'backend-gcp-specialist',
        'database-administrator',
        'ai-systems-engineer',
        'serena-fallback' // serena 폴백 지원
    ],
    'sequential-thinking': [
        'mcp-server-admin',
        'debugger-specialist',
        'agent-coordinator'
    ],
    'playwright': [
        'test-automation-specialist',
        'ux-performance-optimizer'  
    ],
    'time': [
        'vercel-monitor',
        'doc-writer-researcher',
        'doc-structure-guardian',
        'execution-tracker',
        'debugger-specialist',
        'database-administrator'
    ],
    'serena': [
        'test-automation-specialist',
        'ux-performance-optimizer',
        'debugger-specialist', 
        'ai-systems-engineer'
    ]
};

// MCP 서버별 성능 가중치
const serverWeights = {
    'filesystem': 1.0,    // 기본 파일 I/O
    'memory': 0.8,        // 빠른 메모리 캐싱
    'github': 1.2,        // API 호출 오버헤드
    'supabase': 0.9,      // 데이터베이스 최적화
    'tavily-mcp': 1.5,    // 웹 검색 지연
    'context7': 1.1,      // 라이브러리 문서 검색
    'sequential-thinking': 0.7, // 로컬 처리
    'playwright': 1.3,    // 브라우저 오버헤드
    'time': 0.5,          // 단순 시간 계산
    'serena': 1.4         // Git 의존성 불안정
};

// 에이전트별 복잡도 점수
const agentComplexity = {
    'central-supervisor': 10,
    'vercel-monitor': 7,
    'ux-performance-optimizer': 8,
    'test-automation-specialist': 9,
    'security-auditor': 6,
    'mcp-server-admin': 5,
    'git-cicd-specialist': 7,
    'gemini-cli-collaborator': 4,
    'doc-writer-researcher': 8,
    'doc-structure-guardian': 6,
    'debugger-specialist': 9,
    'code-review-specialist': 7,
    'database-administrator': 8,
    'backend-gcp-specialist': 9,
    'ai-systems-engineer': 10,
    'agent-coordinator': 8,
    'execution-tracker': 5
};

// 부하 분산 분석
function analyzeLoadDistribution(mapping) {
    const distribution = {};
    let totalLoad = 0;
    
    for (const [server, agents] of Object.entries(mapping)) {
        const agentLoad = agents.reduce((sum, agent) => {
            return sum + (agentComplexity[agent] || 5);
        }, 0);
        
        const serverWeight = serverWeights[server] || 1.0;
        const weightedLoad = agentLoad * serverWeight;
        
        distribution[server] = {
            agentCount: agents.length,
            agentLoad,
            serverWeight,
            weightedLoad,
            agents
        };
        
        totalLoad += weightedLoad;
        
        if (CONFIG.verbose) {
            log.metric(`${server}: ${agents.length}개 에이전트, 가중 부하 ${weightedLoad.toFixed(1)}`);
        }
    }
    
    // 부하 균형 점수 계산 (표준편차 기반)
    const loads = Object.values(distribution).map(d => d.weightedLoad);
    const avgLoad = totalLoad / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / loads.length;
    const standardDeviation = Math.sqrt(variance);
    const balanceScore = Math.max(0, 100 - (standardDeviation / avgLoad) * 100);
    
    return {
        distribution,
        totalLoad,
        avgLoad,
        balanceScore: balanceScore.toFixed(1)
    };
}

// 마이그레이션 계획 생성
function generateMigrationPlan() {
    log.info('🎯 에이전트 마이그레이션 계획 생성 중...');
    
    const migrations = [];
    
    // 현재 매핑에서 최적화된 매핑으로의 변경 사항 분석
    for (const [server, agents] of Object.entries(optimizedMapping)) {
        const currentAgents = currentMapping[server] || [];
        
        // 새로 추가될 에이전트
        const newAgents = agents.filter(agent => !currentAgents.includes(agent));
        
        // 제거될 에이전트  
        const removedAgents = currentAgents.filter(agent => !agents.includes(agent));
        
        for (const agent of newAgents) {
            // 원래 서버 찾기
            const originServer = Object.keys(currentMapping).find(s => 
                currentMapping[s].includes(agent)
            );
            
            if (originServer && originServer !== server) {
                migrations.push({
                    agent,
                    from: originServer,
                    to: server,
                    reason: getMigrationReason(agent, originServer, server),
                    priority: getMigrationPriority(agent, originServer, server),
                    complexity: agentComplexity[agent] || 5
                });
            }
        }
    }
    
    // 우선순위별 정렬
    migrations.sort((a, b) => b.priority - a.priority);
    
    return migrations;
}

// 마이그레이션 이유 생성
function getMigrationReason(agent, from, to) {
    const reasons = {
        'execution-tracker': {
            'filesystem->supabase': '실행 메트릭은 시계열 데이터베이스 저장이 최적'
        },
        'agent-coordinator': {
            'filesystem->supabase': '에이전트 상태 관리는 관계형 DB + 캐싱 조합 필요'
        },
        'security-auditor': {
            'filesystem->supabase': '보안 스캔 결과 축적 및 트렌드 분석',
            'filesystem->github': 'PR 연동 및 자동 보안 알림 강화'
        },
        'doc-structure-guardian': {
            'filesystem->supabase': '문서 메타데이터 관리는 관계형 DB가 적합'
        }
    };
    
    const key = `${from}->${to}`;
    return reasons[agent]?.[key] || `${to} MCP 서버 최적화를 위한 재배치`;
}

// 마이그레이션 우선순위 계산
function getMigrationPriority(agent, from, to) {
    let priority = 50; // 기본값
    
    // filesystem 과부하 해결이 최우선
    if (from === 'filesystem') priority += 30;
    
    // supabase 활용도 증대가 중요
    if (to === 'supabase') priority += 20;
    
    // 핵심 에이전트일수록 높은 우선순위
    const coreAgents = ['agent-coordinator', 'execution-tracker', 'security-auditor'];
    if (coreAgents.includes(agent)) priority += 15;
    
    // 복잡도가 높은 에이전트는 우선 처리
    priority += (agentComplexity[agent] || 5);
    
    return priority;
}

// 에이전트 설정 파일 백업
function backupAgentConfigs() {
    log.info('📁 에이전트 설정 파일 백업 중...');
    
    if (!fs.existsSync(CONFIG.backupDir)) {
        fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(CONFIG.backupDir, `backup_${timestamp}`);
    fs.mkdirSync(backupPath, { recursive: true });
    
    let backedUpCount = 0;
    
    if (fs.existsSync(CONFIG.agentsDir)) {
        const files = fs.readdirSync(CONFIG.agentsDir);
        
        for (const file of files) {
            if (file.endsWith('.md')) {
                const sourcePath = path.join(CONFIG.agentsDir, file);
                const backupFilePath = path.join(backupPath, file);
                
                try {
                    fs.copyFileSync(sourcePath, backupFilePath);
                    backedUpCount++;
                    
                    if (CONFIG.verbose) {
                        log.info(`백업: ${file}`);
                    }
                } catch (error) {
                    log.error(`백업 실패: ${file} - ${error.message}`);
                }
            }
        }
    }
    
    log.success(`${backedUpCount}개 에이전트 설정 파일 백업 완료: ${backupPath}`);
    return backupPath;
}

// 에이전트 설정 파일 업데이트
function updateAgentConfig(agent, migrations) {
    const configFile = path.join(CONFIG.agentsDir, `${agent}.md`);
    
    if (!fs.existsSync(configFile)) {
        log.warning(`에이전트 설정 파일 없음: ${configFile}`);
        return false;
    }
    
    try {
        let content = fs.readFileSync(configFile, 'utf8');
        
        // 마이그레이션 정보 추출
        const agentMigrations = migrations.filter(m => m.agent === agent);
        
        if (agentMigrations.length === 0) {
            return true; // 변경사항 없음
        }
        
        // MCP 도구 사용 섹션 업데이트
        const mcpToolsRegex = /## 🔧 MCP Tools\s*([\s\S]*?)(?=\n## |$)/;
        const match = content.match(mcpToolsRegex);
        
        if (match) {
            let toolsSection = match[1];
            
            // 새로운 MCP 서버 도구 추가
            for (const migration of agentMigrations) {
                const newServerTools = getServerTools(migration.to);
                
                if (newServerTools.length > 0) {
                    const toolsList = newServerTools.map(tool => `- \`${tool}\``).join('\n');
                    toolsSection += `\n\n### ${migration.to} MCP 도구\n${toolsList}`;
                }
            }
            
            content = content.replace(mcpToolsRegex, `## 🔧 MCP Tools\n${toolsSection}`);
        }
        
        // 마이그레이션 히스토리 추가
        const migrationHistory = agentMigrations.map(m => 
            `- **${new Date().toISOString().split('T')[0]}**: ${m.from} → ${m.to} (${m.reason})`
        ).join('\n');
        
        content += `\n\n## 📝 마이그레이션 히스토리\n\n${migrationHistory}\n`;
        
        if (!CONFIG.dryRun) {
            fs.writeFileSync(configFile, content);
            log.success(`에이전트 설정 업데이트: ${agent}`);
        } else {
            log.info(`[DRY RUN] 에이전트 설정 업데이트 예정: ${agent}`);
        }
        
        return true;
    } catch (error) {
        log.error(`에이전트 설정 업데이트 실패: ${agent} - ${error.message}`);
        return false;
    }
}

// MCP 서버별 주요 도구 목록
function getServerTools(serverName) {
    const serverTools = {
        'filesystem': ['read_file', 'write_file', 'list_directory', 'search_files'],
        'memory': ['create_entities', 'search_nodes', 'add_observations'],
        'github': ['get_file_contents', 'create_pull_request', 'search_code'],
        'supabase': ['execute_sql', 'apply_migration', 'get_advisors'],
        'tavily-mcp': ['tavily-search', 'tavily-extract'],
        'context7': ['resolve-library-id', 'get-library-docs'],
        'sequential-thinking': ['sequentialthinking'],
        'playwright': ['browser_navigate', 'browser_click', 'browser_snapshot'],
        'time': ['get_current_time', 'convert_time'],
        'serena': ['find_symbol', 'replace_symbol_body', 'search_for_pattern']
    };
    
    return serverTools[serverName] || [];
}

// 마이그레이션 실행
function executeMigrations(migrations) {
    log.info(`🚀 ${migrations.length}개 에이전트 마이그레이션 실행 중...`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // 단계별 마이그레이션 (우선순위 기반)
    for (let i = 0; i < migrations.length; i++) {
        const migration = migrations[i];
        
        log.info(`진행 (${i + 1}/${migrations.length}): ${migration.agent} (${migration.from} → ${migration.to})`);
        log.info(`  이유: ${migration.reason}`);
        
        if (updateAgentConfig(migration.agent, [migration])) {
            successCount++;
            log.success(`✅ ${migration.agent} 마이그레이션 완료`);
        } else {
            failureCount++;
            log.error(`❌ ${migration.agent} 마이그레이션 실패`);
        }
        
        // 배치 처리 간 잠시 대기
        if ((i + 1) % 5 === 0) {
            log.info('배치 처리 완료, 잠시 대기...');
            if (!CONFIG.dryRun) {
                // 실제 환경에서는 대기
                setTimeout(() => {}, 1000);
            }
        }
    }
    
    log.metric(`마이그레이션 결과: 성공 ${successCount}개, 실패 ${failureCount}개`);
    
    return { successCount, failureCount };
}

// 최적화 효과 검증
function validateOptimization() {
    log.info('✅ 최적화 효과 검증 중...');
    
    const beforeAnalysis = analyzeLoadDistribution(currentMapping);
    const afterAnalysis = analyzeLoadDistribution(optimizedMapping);
    
    log.metric('=== 최적화 전후 비교 ===');
    log.metric(`부하 균형 점수: ${beforeAnalysis.balanceScore} → ${afterAnalysis.balanceScore}`);
    log.metric(`평균 부하: ${beforeAnalysis.avgLoad.toFixed(1)} → ${afterAnalysis.avgLoad.toFixed(1)}`);
    
    // 서버별 상세 비교
    const improvements = [];
    
    for (const server of Object.keys(beforeAnalysis.distribution)) {
        const before = beforeAnalysis.distribution[server];
        const after = afterAnalysis.distribution[server];
        
        const agentChange = after.agentCount - before.agentCount;
        const loadChange = after.weightedLoad - before.weightedLoad;
        
        log.metric(`${server}: ${before.agentCount}→${after.agentCount} 에이전트 (${agentChange >= 0 ? '+' : ''}${agentChange})`);
        
        if (server === 'filesystem' && agentChange < 0) {
            improvements.push(`filesystem 과부하 ${Math.abs(agentChange)}개 에이전트 감소`);
        }
        
        if (server === 'supabase' && agentChange > 0) {
            improvements.push(`supabase 활용도 ${agentChange}개 에이전트 증가`);
        }
    }
    
    log.success('🎯 최적화 효과:');
    improvements.forEach(improvement => log.success(`  - ${improvement}`));
    
    return {
        beforeScore: parseFloat(beforeAnalysis.balanceScore),
        afterScore: parseFloat(afterAnalysis.balanceScore),
        improvements
    };
}

// 마이그레이션 리포트 생성
function generateMigrationReport(migrations, results, validation) {
    const reportFile = `mcp_migration_report_${new Date().toISOString().split('T')[0]}.md`;
    
    const reportContent = `# MCP 에이전트 재배치 리포트

**실행일시**: ${new Date().toISOString()}
**실행 모드**: ${CONFIG.dryRun ? 'DRY RUN (시뮬레이션)' : 'PRODUCTION'}
**총 마이그레이션**: ${migrations.length}개

## 📊 최적화 효과

### 부하 균형 개선
- **최적화 전**: ${validation.beforeScore}점
- **최적화 후**: ${validation.afterScore}점  
- **개선율**: ${((validation.afterScore - validation.beforeScore) / validation.beforeScore * 100).toFixed(1)}%

### 주요 개선사항
${validation.improvements.map(imp => `- ${imp}`).join('\n')}

## 🔄 마이그레이션 세부사항

### 성공한 마이그레이션 (${results.successCount}개)
${migrations.slice(0, results.successCount).map(m => 
    `- **${m.agent}**: ${m.from} → ${m.to}\n  - 이유: ${m.reason}\n  - 우선순위: ${m.priority}`
).join('\n')}

### 실패한 마이그레이션 (${results.failureCount}개)
${migrations.slice(results.successCount).map(m => 
    `- **${m.agent}**: ${m.from} → ${m.to} (설정 파일 업데이트 실패)`
).join('\n')}

## 📈 서버별 에이전트 분배 (최적화 후)

${Object.entries(optimizedMapping).map(([server, agents]) => 
    `### ${server} MCP (${agents.length}개 에이전트)\n${agents.map(a => `- ${a}`).join('\n')}`
).join('\n\n')}

## 🔧 후속 작업

1. **즉시 실행 필요**
   - MCP 서버 재시작: \`claude api restart\`
   - 성능 모니터링 시작: \`./scripts/mcp/monitor-performance.sh\`

2. **24시간 내 검증**
   - 에이전트별 응답시간 측정
   - 에러율 모니터링  
   - 부하 분산 효과 확인

3. **1주일 내 최적화**
   - 성능 데이터 기반 미세 조정
   - 추가 최적화 여부 결정

## 📞 문제 해결

마이그레이션 후 문제 발생 시:
\`\`\`bash
# 백업에서 복원
cp -r .claude/agents/backup/backup_* .claude/agents/

# 자동 복구 실행
./scripts/mcp/auto-recovery.sh

# 전체 MCP 재설정
./scripts/mcp/reset.sh
\`\`\`

## 📁 생성된 파일

- 마이그레이션 로그: \`${CONFIG.logFile}\`
- 백업 디렉토리: \`${CONFIG.backupDir}\`
- 최적화 리포트: \`${reportFile}\`
`;

    fs.writeFileSync(reportFile, reportContent);
    log.success(`마이그레이션 리포트 생성: ${reportFile}`);
    
    return reportFile;
}

// 메인 실행 함수
async function main() {
    console.log('==================================================================');
    console.log('🤖 MCP 서버 에이전트 재배치 최적화');
    console.log('OpenManager VIBE v5 - Agent Coordinator');
    console.log('==================================================================');
    
    if (CONFIG.dryRun) {
        log.warning('🧪 DRY RUN 모드: 실제 변경사항 없이 시뮬레이션만 수행');
    }
    
    try {
        // 1단계: 현재 부하 분산 분석
        log.info('1단계: 현재 MCP 서버 부하 분산 분석');
        const currentAnalysis = analyzeLoadDistribution(currentMapping);
        log.metric(`현재 부하 균형 점수: ${currentAnalysis.balanceScore}`);
        
        // 2단계: 마이그레이션 계획 생성
        log.info('2단계: 에이전트 마이그레이션 계획 생성');
        const migrations = generateMigrationPlan();
        log.info(`총 ${migrations.length}개 에이전트 마이그레이션 계획`);
        
        // 3단계: 설정 파일 백업
        log.info('3단계: 에이전트 설정 파일 백업');
        const backupPath = backupAgentConfigs();
        
        // 4단계: 마이그레이션 실행
        log.info('4단계: 에이전트 마이그레이션 실행');
        const results = executeMigrations(migrations);
        
        // 5단계: 최적화 효과 검증
        log.info('5단계: 최적화 효과 검증');
        const validation = validateOptimization();
        
        // 6단계: 리포트 생성
        log.info('6단계: 마이그레이션 리포트 생성');
        const reportFile = generateMigrationReport(migrations, results, validation);
        
        // 최종 결과
        console.log('==================================================================');
        log.success('🎉 MCP 에이전트 재배치 최적화 완료!');
        console.log('==================================================================');
        
        log.success(`✅ 성공: ${results.successCount}개 에이전트`);
        if (results.failureCount > 0) {
            log.warning(`⚠️ 실패: ${results.failureCount}개 에이전트`);
        }
        log.success(`📊 부하 균형 개선: ${validation.beforeScore} → ${validation.afterScore}점`);
        log.success(`📁 백업 위치: ${backupPath}`);
        log.success(`📋 리포트: ${reportFile}`);
        
        if (!CONFIG.dryRun) {
            log.info('🔄 다음 단계: claude api restart 실행 후 성능 모니터링 시작');
        } else {
            log.info('🧪 DRY RUN 완료: --dry-run 플래그 제거 후 실제 실행 가능');
        }
        
    } catch (error) {
        log.error(`마이그레이션 실행 중 오류: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// 도움말 표시
function showHelp() {
    console.log(`
MCP 에이전트 재배치 최적화 스크립트

사용법: node ${path.basename(__filename)} [옵션]

옵션:
  --dry-run     실제 변경 없이 시뮬레이션만 수행
  --verbose     상세 로그 출력
  --help        도움말 표시

예시:
  node ${path.basename(__filename)}                # 실제 마이그레이션 실행
  node ${path.basename(__filename)} --dry-run      # 시뮬레이션만
  node ${path.basename(__filename)} --verbose      # 상세 로그와 함께 실행

기능:
  - filesystem MCP 과부하 해결 (10개 → 6개 에이전트)
  - supabase MCP 활용도 증대 (1개 → 5개 에이전트)  
  - 서버별 부하 균형 최적화
  - 자동 백업 및 복구 지원
  - 상세한 마이그레이션 리포트 생성
`);
}

// 스크립트 실행
if (process.argv.includes('--help')) {
    showHelp();
    process.exit(0);
}

main().catch(console.error);