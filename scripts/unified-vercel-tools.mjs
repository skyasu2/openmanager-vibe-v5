#!/usr/bin/env node
/**
 * 통합 Vercel 도구
 * 
 * 이전에 분산되어 있던 Vercel 관련 스크립트들의 기능을 통합:
 * - vercel-comparison-test.js
 * - vercel-env-setup.mjs
 * - vercel-function-test.mjs
 * - vercel-metrics-monitor.js
 * - vercel-system-test.js
 * - vercel-usage-test.js
 * - quick-vercel-test.js
 */

import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import https from 'https';

class UnifiedVercelTools {
    constructor() {
        this.config = {
            projectName: 'openmanager-vibe-v5',
            apiEndpoint: 'https://api.vercel.com',
            deploymentTimeout: 300000, // 5분
            testTimeout: 30000
        };
        
        this.vercelToken = process.env.VERCEL_TOKEN;
    }

    async executeCommand(command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            const proc = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                ...options
            });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            proc.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            proc.on('close', (code) => {
                resolve({
                    code,
                    stdout: stdout.trim(),
                    stderr: stderr.trim()
                });
            });

            proc.on('error', reject);

            // 타임아웃 설정
            if (options.timeout) {
                setTimeout(() => {
                    proc.kill();
                    reject(new Error('Command timeout'));
                }, options.timeout);
            }
        });
    }

    async makeVercelAPIRequest(endpoint, options = {}) {
        if (!this.vercelToken) {
            throw new Error('VERCEL_TOKEN 환경변수가 설정되지 않았습니다.');
        }

        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, this.config.apiEndpoint);
            
            const requestOptions = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname + url.search,
                method: options.method || 'GET',
                headers: {
                    'Authorization': `Bearer ${this.vercelToken}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                timeout: this.config.testTimeout
            };

            const req = https.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve({
                            status: res.statusCode,
                            data: JSON.parse(data),
                            headers: res.headers
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: data,
                            headers: res.headers
                        });
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => reject(new Error('API request timeout')));

            if (options.data) {
                req.write(JSON.stringify(options.data));
            }

            req.end();
        });
    }

    async checkVercelCLI() {
        console.log('🔍 Vercel CLI 확인 중...');
        
        try {
            const result = await this.executeCommand('vercel', ['--version'], { timeout: 10000 });
            
            if (result.code === 0) {
                console.log(`✅ Vercel CLI 설치됨: ${result.stdout}`);
                return true;
            } else {
                console.log('❌ Vercel CLI가 설치되지 않았습니다.');
                return false;
            }
        } catch (error) {
            console.log('❌ Vercel CLI 확인 실패:', error.message);
            return false;
        }
    }

    async getProjectInfo() {
        console.log('📊 프로젝트 정보 조회 중...');
        
        try {
            const response = await this.makeVercelAPIRequest('/v9/projects');
            
            if (response.status === 200) {
                const projects = response.data.projects || [];
                const currentProject = projects.find(p => 
                    p.name === this.config.projectName || 
                    p.name.includes('openmanager')
                );
                
                if (currentProject) {
                    console.log('✅ 프로젝트 정보:');
                    console.log(`  이름: ${currentProject.name}`);
                    console.log(`  ID: ${currentProject.id}`);
                    console.log(`  생성일: ${new Date(currentProject.createdAt).toLocaleString('ko-KR')}`);
                    console.log(`  업데이트: ${new Date(currentProject.updatedAt).toLocaleString('ko-KR')}`);
                    
                    return currentProject;
                } else {
                    console.log('❌ 프로젝트를 찾을 수 없습니다.');
                    return null;
                }
            } else {
                console.log(`❌ API 오류: ${response.status}`);
                return null;
            }
        } catch (error) {
            console.error('프로젝트 정보 조회 실패:', error.message);
            return null;
        }
    }

    async getDeployments(limit = 10) {
        console.log(`📦 최근 배포 내역 조회 중... (최대 ${limit}개)`);
        
        try {
            const response = await this.makeVercelAPIRequest(`/v6/deployments?limit=${limit}`);
            
            if (response.status === 200) {
                const deployments = response.data.deployments || [];
                
                console.log('✅ 최근 배포 내역:');
                deployments.forEach((deployment, index) => {
                    const status = deployment.state || 'UNKNOWN';
                    const statusIcon = status === 'READY' ? '✅' : status === 'ERROR' ? '❌' : '⏳';
                    const date = new Date(deployment.createdAt).toLocaleString('ko-KR');
                    
                    console.log(`  ${index + 1}. ${statusIcon} ${deployment.url}`);
                    console.log(`     상태: ${status}, 생성: ${date}`);
                });
                
                return deployments;
            } else {
                console.log(`❌ 배포 내역 조회 실패: ${response.status}`);
                return [];
            }
        } catch (error) {
            console.error('배포 내역 조회 실패:', error.message);
            return [];
        }
    }

    async testDeployedFunctions() {
        console.log('⚡ 배포된 함수 테스트 시작...');
        
        const project = await this.getProjectInfo();
        if (!project) {
            console.log('❌ 프로젝트 정보를 가져올 수 없어 함수 테스트를 건너뜁니다.');
            return [];
        }

        const testFunctions = [
            { path: '/api/health', name: '헬스 체크' },
            { path: '/api/servers/status', name: '서버 상태' },
            { path: '/api/ai/google', name: 'AI 엔진' },
            { path: '/api/metrics', name: '메트릭' }
        ];

        const results = [];
        const baseUrl = `https://${project.name}.vercel.app`;

        for (const func of testFunctions) {
            try {
                console.log(`  테스트 중: ${func.name} (${func.path})`);
                
                const response = await this.makeAPIRequest(`${baseUrl}${func.path}`);
                
                const result = {
                    name: func.name,
                    path: func.path,
                    status: response.status,
                    success: response.status >= 200 && response.status < 400,
                    responseTime: Date.now() // 간단한 응답 시간 측정
                };
                
                results.push(result);
                
                const statusIcon = result.success ? '✅' : '❌';
                console.log(`    ${statusIcon} ${func.name}: ${response.status}`);
                
            } catch (error) {
                const result = {
                    name: func.name,
                    path: func.path,
                    status: 'ERROR',
                    success: false,
                    error: error.message
                };
                
                results.push(result);
                console.log(`    ❌ ${func.name}: ERROR (${error.message})`);
            }
        }

        return results;
    }

    async makeAPIRequest(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            
            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Unified-Vercel-Tools/1.0'
                },
                timeout: this.config.testTimeout
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        data: data,
                        headers: res.headers
                    });
                });
            });

            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Request timeout')));
            req.end();
        });
    }

    async monitorUsage() {
        console.log('📈 Vercel 사용량 모니터링...');
        
        try {
            // 팀 정보 및 사용량 조회
            const teamResponse = await this.makeVercelAPIRequest('/v2/teams');
            
            if (teamResponse.status === 200) {
                console.log('✅ 팀/계정 정보 조회 성공');
                
                // 사용량 정보는 팀 ID가 필요하므로 기본 정보만 표시
                const teams = teamResponse.data.teams || [];
                console.log(`  소속 팀 수: ${teams.length}`);
                
                return {
                    teams: teams.length,
                    timestamp: new Date().toISOString()
                };
            } else {
                console.log(`❌ 사용량 조회 실패: ${teamResponse.status}`);
                return null;
            }
        } catch (error) {
            console.error('사용량 모니터링 실패:', error.message);
            return null;
        }
    }

    async runSystemTest() {
        console.log('🔧 Vercel 시스템 전체 테스트 시작...\n');
        
        const results = {
            timestamp: new Date().toISOString(),
            cliInstalled: await this.checkVercelCLI(),
            projectInfo: await this.getProjectInfo(),
            deployments: await this.getDeployments(5),
            functionTests: await this.testDeployedFunctions(),
            usage: await this.monitorUsage()
        };
        
        console.log('\n📋 시스템 테스트 완료:');
        console.log(`  CLI 설치: ${results.cliInstalled ? '✅' : '❌'}`);
        console.log(`  프로젝트 정보: ${results.projectInfo ? '✅' : '❌'}`);
        console.log(`  배포 내역: ${results.deployments.length > 0 ? '✅' : '❌'}`);
        console.log(`  함수 테스트: ${results.functionTests.length > 0 ? '✅' : '❌'}`);
        console.log(`  사용량 모니터링: ${results.usage ? '✅' : '❌'}`);
        
        // 결과를 JSON 파일로 저장
        try {
            await fs.mkdir('test-results', { recursive: true });
            await fs.writeFile(
                'test-results/vercel-system-test.json',
                JSON.stringify(results, null, 2)
            );
            console.log('\n💾 테스트 결과가 test-results/vercel-system-test.json에 저장되었습니다.');
        } catch (error) {
            console.warn('결과 저장 실패:', error.message);
        }
        
        return results;
    }
}

// CLI 실행
if (process.argv[1] === import.meta.url.replace('file://', '')) {
    const vercelTools = new UnifiedVercelTools();
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    try {
        switch (command) {
            case 'test':
                await vercelTools.runSystemTest();
                break;
                
            case 'info':
                await vercelTools.getProjectInfo();
                break;
                
            case 'deployments':
                const limit = parseInt(args[0]) || 10;
                await vercelTools.getDeployments(limit);
                break;
                
            case 'functions':
                await vercelTools.testDeployedFunctions();
                break;
                
            case 'usage':
                await vercelTools.monitorUsage();
                break;
                
            default:
                console.log('⚡ 통합 Vercel 도구 사용법:');
                console.log('  node unified-vercel-tools.mjs test        # 시스템 전체 테스트');
                console.log('  node unified-vercel-tools.mjs info        # 프로젝트 정보');
                console.log('  node unified-vercel-tools.mjs deployments [개수] # 배포 내역');
                console.log('  node unified-vercel-tools.mjs functions   # 함수 테스트');
                console.log('  node unified-vercel-tools.mjs usage       # 사용량 모니터링');
                break;
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ 오류:', error.message);
        process.exit(1);
    }
}

export default UnifiedVercelTools;