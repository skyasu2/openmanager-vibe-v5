#!/usr/bin/env node
/**
 * 🔐 GCP VM 설정 암호화 저장 스크립트
 * 
 * GCP VM 관련 모든 정보를 통합 암복호화 시스템에 안전하게 저장
 * 
 * 작성일: 2025-07-04 17:35 KST
 */

import { createHash } from 'crypto';
import { writeFileSync } from 'fs';
import { join } from 'path';

// 🔑 GCP VM 설정 정보 (2025년 7월 4일 현재)
const GCP_VM_CONFIG = {
    // 기본 VM 정보
    vm: {
        name: 'openmanager-vm',
        region: 'asia-northeast3-a', // 서울 리전
        zone: 'asia-northeast3-a',
        machine_type: 'e2-micro', // 무료 티어
        external_ip: '104.154.205.25',
        internal_ip: '10.146.0.2', // 추정값 (확인 필요)
        project_id: 'openmanager-free-tier',
        network: 'default',
        subnet: 'default'
    },

    // MCP 서버 설정
    mcp_server: {
        port: 10000,
        protocol: 'http',
        full_url: 'http://104.154.205.25:10000',
        health_endpoint: '/health',
        api_endpoint: '/mcp',
        status: 'active',
        startup_script: 'gcp-simplified-mcp-server.js',
        process_name: 'node-mcp-server',
        auto_restart: true
    },

    // 방화벽 설정
    firewall: {
        name: 'openmanager-mcp-server',
        target_tags: ['mcp-server'],
        source_ranges: ['0.0.0.0/0'],
        allowed_ports: ['10000'],
        protocol: 'tcp',
        direction: 'INGRESS'
    },

    // 서비스 연결 정보
    services: {
        data_generation: {
            enabled: true,
            mode: 'vm_persistent',
            generator_class: 'VMPersistentDataManager',
            orchestrator_class: 'VMMultiServiceOrchestrator',
            server_count: 15,
            update_interval: '35-40 seconds',
            continuous_operation: true
        },
        baseline_storage: {
            provider: 'gcp_cloud_storage',
            bucket_name: 'openmanager-baseline-data',
            retention_policy: '24_hours',
            compression: true
        },
        monitoring: {
            health_check_interval: 30000,
            metrics_collection: true,
            log_retention: '7_days',
            alert_threshold: '3_consecutive_failures'
        }
    },

    // 환경 변수 매핑
    environment_variables: {
        GCP_MCP_SERVER_URL: 'http://104.154.205.25:10000',
        GCP_VM_EXTERNAL_IP: '104.154.205.25',
        GCP_VM_ZONE: 'asia-northeast3-a',
        GCP_PROJECT_ID: 'openmanager-free-tier',
        MCP_SERVER_PORT: '10000',
        VM_MODE: 'production',
        GCP_OPTIMIZED: 'true'
    },

    // 비용 최적화 설정
    cost_optimization: {
        tier: 'free',
        monthly_usage_hours: 744, // 24/7 운영
        estimated_cost: '$0.00', // e2-micro 무료 티어
        auto_shutdown: false, // 연속 운영 필요
        preemptible: false, // 안정성 우선
        savings_vs_render: '$7/month'
    },

    // 보안 설정
    security: {
        ssh_keys: 'managed_by_gcp',
        service_account: 'default',
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        metadata_concealment: true,
        ip_forwarding: false,
        secure_boot: true
    },

    // 마이그레이션 정보
    migration: {
        from: 'render.com',
        migration_date: '2025-07-03',
        migration_reason: 'cost_optimization',
        rollback_plan: 'render_fallback_available',
        data_transfer: 'completed',
        dns_update: 'completed',
        testing_status: 'verified'
    },

    // 메타데이터
    metadata: {
        created: '2025-07-03T14:30:00Z',
        last_updated: '2025-07-04T08:35:00Z',
        version: '1.2.0',
        managed_by: 'openmanager_vibe_v5',
        documentation: 'docs/gcp-migration-complete-report.md',
        verified: true,
        operational_status: 'stable'
    }
};

// 🔐 암호화 함수
function encryptConfig(config, password) {
    const crypto = require('crypto');

    // 고정 salt 생성 (재현 가능)
    const salt = createHash('sha256').update('openmanager-gcp-vm-salt-2025').digest();

    // 키 도출
    const key = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256');

    // 암호화
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    cipher.setAutoPadding(true);

    let encrypted = cipher.update(JSON.stringify(config), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
        encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        algorithm: 'aes-256-cbc',
        iterations: 10000
    };
}

// 📝 설정 파일 저장
function saveEncryptedConfig(encryptedData, filename) {
    const configPath = join(process.cwd(), 'config', filename);

    const output = {
        ...encryptedData,
        metadata: {
            created: new Date().toISOString(),
            description: 'GCP VM 설정 (암호화됨)',
            version: '1.0.0',
            kst_time: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
        }
    };

    writeFileSync(configPath, JSON.stringify(output, null, 2));
    console.log(`✅ 암호화된 GCP VM 설정 저장: ${configPath}`);
}

// 🔓 복호화 테스트 함수
function testDecryption(encryptedData, password) {
    try {
        const crypto = require('crypto');

        const salt = Buffer.from(encryptedData.salt, 'hex');
        const key = crypto.pbkdf2Sync(password, salt, encryptedData.iterations, 32, 'sha256');

        const decipher = crypto.createDecipher('aes-256-cbc', key);
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        const parsed = JSON.parse(decrypted);
        console.log('🔓 복호화 테스트 성공');
        console.log(`📊 복호화된 데이터 크기: ${Object.keys(parsed).length}개 섹션`);
        return true;
    } catch (error) {
        console.error('❌ 복호화 테스트 실패:', error.message);
        return false;
    }
}

// 📋 설정 요약 출력
function printConfigSummary(config) {
    console.log('\n📋 GCP VM 설정 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🖥️  VM 이름: ${config.vm.name}`);
    console.log(`🌏 리전/존: ${config.vm.region}`);
    console.log(`🌐 외부 IP: ${config.vm.external_ip}`);
    console.log(`📡 MCP 서버: ${config.mcp_server.full_url}`);
    console.log(`💰 비용: ${config.cost_optimization.estimated_cost} (월 $7 절약)`);
    console.log(`🔄 데이터 생성: ${config.services.data_generation.server_count}개 서버, ${config.services.data_generation.update_interval}`);
    console.log(`📅 마이그레이션: ${config.migration.migration_date} (${config.migration.from}에서 이전)`);
    console.log(`✅ 운영 상태: ${config.metadata.operational_status}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// 🎯 메인 실행 함수
async function main() {
    console.log('🔐 GCP VM 설정 암호화 저장 스크립트 시작...\n');

    // 설정 요약 출력
    printConfigSummary(GCP_VM_CONFIG);

    // 비밀번호 입력
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const password = await new Promise(resolve => {
        readline.question('\n🔑 암호화 비밀번호를 입력하세요: ', resolve);
    });
    readline.close();

    if (!password.trim()) {
        console.error('❌ 비밀번호를 입력해야 합니다.');
        process.exit(1);
    }

    // 암호화 실행
    console.log('\n🔄 GCP VM 설정 암호화 중...');
    const encryptedData = encryptConfig(GCP_VM_CONFIG, password);

    // 파일 저장
    saveEncryptedConfig(encryptedData, 'gcp-vm-encrypted-config.json');

    // 복호화 테스트
    console.log('\n🧪 암복호화 테스트 중...');
    const testSuccess = testDecryption(encryptedData, password);

    if (testSuccess) {
        console.log('\n🎉 GCP VM 설정 암호화 저장 완료!');
        console.log('\n📝 사용법:');
        console.log('  - 복호화: npm run decrypt-gcp-vm');
        console.log('  - 설정 조회: scripts/view-gcp-vm-config.mjs');
        console.log('  - 환경변수 추출: scripts/export-gcp-env.mjs');
    } else {
        console.error('\n❌ 암복호화 테스트 실패. 다시 시도해주세요.');
        process.exit(1);
    }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { encryptConfig, GCP_VM_CONFIG };
