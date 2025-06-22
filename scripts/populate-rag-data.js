#!/usr/bin/env node

/**
 * 🚀 RAG 시스템용 실제 데이터 추가 스크립트
 * 
 * Linux/Windows/Kubernetes 명령어 데이터를 벡터화하여 저장합니다.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 로컬 임베딩 생성 함수 (SupabaseRAGEngine과 동일)
function generateLocalEmbedding(text) {
    // 텍스트 해시 생성
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    // 선형 합동 생성기로 384차원 벡터 생성
    const seed = Math.abs(hash);
    let rng = seed;
    const embedding = [];

    for (let i = 0; i < 384; i++) {
        rng = (rng * 1664525 + 1013904223) % Math.pow(2, 32);
        embedding.push((rng / Math.pow(2, 32)) * 2 - 1);
    }

    // 벡터 정규화
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
}

async function populateRAGData() {
    console.log('🚀 RAG 시스템 데이터 추가 시작...\n');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase 환경변수가 설정되지 않았습니다');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 실제 명령어 데이터
    const commandData = [
        // Linux 기본 명령어
        {
            id: 'linux-ls',
            content: 'ls 명령어는 디렉토리의 파일과 폴더 목록을 표시합니다. ls -la로 상세 정보를 볼 수 있습니다.',
            metadata: {
                category: 'linux',
                tags: ['file', 'directory', 'list'],
                commands: ['ls', 'ls -la', 'ls -l'],
                difficulty: 'beginner'
            }
        },
        {
            id: 'linux-top',
            content: 'top 명령어는 실시간으로 실행 중인 프로세스를 모니터링합니다. CPU, 메모리 사용량을 확인할 수 있습니다.',
            metadata: {
                category: 'linux',
                tags: ['process', 'monitoring', 'cpu', 'memory'],
                commands: ['top', 'htop'],
                difficulty: 'intermediate'
            }
        },
        {
            id: 'linux-grep',
            content: 'grep 명령어는 파일에서 특정 패턴을 검색합니다. grep -r로 재귀 검색, grep -i로 대소문자 무시 검색이 가능합니다.',
            metadata: {
                category: 'linux',
                tags: ['search', 'text', 'pattern', 'regex'],
                commands: ['grep', 'grep -r', 'grep -i'],
                difficulty: 'intermediate'
            }
        },
        {
            id: 'linux-docker',
            content: 'docker 명령어는 컨테이너를 관리합니다. docker run으로 컨테이너 실행, docker ps로 실행 중인 컨테이너 확인이 가능합니다.',
            metadata: {
                category: 'docker',
                tags: ['container', 'virtualization', 'deployment'],
                commands: ['docker run', 'docker ps', 'docker stop'],
                difficulty: 'advanced'
            }
        },

        // Windows 명령어
        {
            id: 'windows-dir',
            content: 'dir 명령어는 Windows에서 디렉토리의 파일 목록을 표시합니다. dir /a로 숨김 파일도 볼 수 있습니다.',
            metadata: {
                category: 'windows',
                tags: ['file', 'directory', 'list'],
                commands: ['dir', 'dir /a'],
                difficulty: 'beginner'
            }
        },
        {
            id: 'windows-tasklist',
            content: 'tasklist 명령어는 Windows에서 실행 중인 프로세스 목록을 표시합니다. taskkill로 프로세스를 종료할 수 있습니다.',
            metadata: {
                category: 'windows',
                tags: ['process', 'monitoring', 'task'],
                commands: ['tasklist', 'taskkill'],
                difficulty: 'intermediate'
            }
        },

        // Kubernetes 명령어
        {
            id: 'k8s-kubectl-get',
            content: 'kubectl get 명령어는 Kubernetes 리소스를 조회합니다. kubectl get pods로 파드 목록, kubectl get services로 서비스 목록을 확인할 수 있습니다.',
            metadata: {
                category: 'kubernetes',
                tags: ['k8s', 'cluster', 'resource', 'monitoring'],
                commands: ['kubectl get pods', 'kubectl get services', 'kubectl get nodes'],
                difficulty: 'advanced'
            }
        },
        {
            id: 'k8s-kubectl-describe',
            content: 'kubectl describe 명령어는 Kubernetes 리소스의 상세 정보를 표시합니다. 문제 해결 시 매우 유용합니다.',
            metadata: {
                category: 'kubernetes',
                tags: ['k8s', 'debugging', 'troubleshooting'],
                commands: ['kubectl describe pod', 'kubectl describe service'],
                difficulty: 'advanced'
            }
        },

        // 네트워크 명령어
        {
            id: 'network-ping',
            content: 'ping 명령어는 네트워크 연결을 테스트합니다. ping google.com으로 인터넷 연결 상태를 확인할 수 있습니다.',
            metadata: {
                category: 'network',
                tags: ['connectivity', 'testing', 'troubleshooting'],
                commands: ['ping', 'ping -c 4'],
                difficulty: 'beginner'
            }
        },
        {
            id: 'network-netstat',
            content: 'netstat 명령어는 네트워크 연결 상태를 표시합니다. netstat -an으로 모든 연결을 숫자로 표시할 수 있습니다.',
            metadata: {
                category: 'network',
                tags: ['connection', 'port', 'monitoring'],
                commands: ['netstat', 'netstat -an', 'ss'],
                difficulty: 'intermediate'
            }
        }
    ];

    try {
        console.log(`📚 ${commandData.length}개 명령어 데이터 벡터화 시작...\n`);

        for (const data of commandData) {
            console.log(`🔄 처리 중: ${data.id}`);

            // 로컬 임베딩 생성
            const embedding = generateLocalEmbedding(data.content + ' ' + data.metadata.commands.join(' '));

            // Supabase에 저장
            const { error } = await supabase
                .from('command_vectors')
                .upsert([{
                    ...data,
                    embedding: embedding,
                    updated_at: new Date().toISOString()
                }]);

            if (error) {
                console.error(`❌ ${data.id} 저장 실패:`, error.message);
            } else {
                console.log(`✅ ${data.id} 저장 완료`);
            }
        }

        // 최종 통계 확인
        console.log('\n📊 최종 통계 확인...');
        const { data: stats, error: statsError } = await supabase
            .from('command_vectors')
            .select('*');

        if (statsError) {
            console.error('❌ 통계 확인 실패:', statsError.message);
        } else {
            console.log(`✅ 총 ${stats.length}개 문서가 벡터 DB에 저장됨`);

            // 카테고리별 통계
            const categories = {};
            stats.forEach(item => {
                const category = item.metadata.category;
                categories[category] = (categories[category] || 0) + 1;
            });

            console.log('\n📈 카테고리별 통계:');
            Object.entries(categories).forEach(([category, count]) => {
                console.log(`   ${category}: ${count}개`);
            });
        }

        console.log('\n🎉 RAG 데이터 추가 완료!');
        console.log('   → 이제 /api/test-supabase-rag에서 다양한 검색을 테스트해보세요');

    } catch (error) {
        console.error('❌ RAG 데이터 추가 실패:', error.message);
    }
}

populateRAGData(); 