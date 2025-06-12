/**
 * 🧪 서버 데이터 생성기 설계 검증 테스트
 * 
 * RealServerDataGenerator가 설계 명세에 맞게 동작하는지 확인
 */

async function testServerDataGenerator() {
    console.log('🧪 서버 데이터 생성기 설계 검증 시작...\n');

    try {
        // API 호출로 서버 데이터 가져오기
        const response = await fetch('http://localhost:3000/api/servers/realtime?type=servers');
        const result = await response.json();

        if (!result.success) {
            throw new Error(`API 호출 실패: ${result.error}`);
        }

        const servers = result.data;
        console.log(`✅ 총 ${servers.length}개 서버 데이터 수신\n`);

        // 설계 명세 검증
        const validationResults = {
            serverCount: servers.length === 30,
            serverTypes: [],
            serverNames: [],
            roles: [],
            environments: [],
            locations: [],
            statuses: [],
            cpuCores: [],
            memoryRanges: [],
            healthScores: [],
        };

        // 각 서버 데이터 검증
        servers.forEach((server, index) => {
            // 서버 타입 검증
            const validTypes = ['web', 'api', 'database', 'cache', 'queue'];
            validationResults.serverTypes.push(validTypes.includes(server.type));

            // 서버 이름 형식 검증 (타입-숫자)
            const namePattern = new RegExp(`^${server.type}-\\d+$`);
            validationResults.serverNames.push(namePattern.test(server.name));

            // 역할 검증
            const validRoles = ['primary', 'replica', 'worker', 'standalone'];
            validationResults.roles.push(validRoles.includes(server.role));

            // 환경 검증
            const validEnvironments = ['production', 'staging', 'development'];
            validationResults.environments.push(validEnvironments.includes(server.environment));

            // 위치 검증
            const validLocations = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
            validationResults.locations.push(validLocations.includes(server.location));

            // 상태 검증
            const validStatuses = ['running', 'warning', 'error'];
            validationResults.statuses.push(validStatuses.includes(server.status));

            // CPU 코어 수 검증 (4-19개)
            const cpuCores = server.specs?.cpu?.cores || 0;
            validationResults.cpuCores.push(cpuCores >= 4 && cpuCores <= 19);

            // 메모리 범위 검증 (8GB-64GB)
            const memoryGB = (server.specs?.memory?.total || 0) / 1024;
            validationResults.memoryRanges.push(memoryGB >= 8 && memoryGB <= 64);

            // 건강도 검증 (60-100점)
            const healthScore = server.health?.score || 0;
            validationResults.healthScores.push(healthScore >= 60 && healthScore <= 100);

            // 첫 5개 서버 상세 정보 출력
            if (index < 5) {
                console.log(`📊 서버 ${index + 1}: ${server.name}`);
                console.log(`   타입: ${server.type}, 역할: ${server.role}`);
                console.log(`   환경: ${server.environment}, 위치: ${server.location}`);
                console.log(`   상태: ${server.status}, 건강도: ${Math.round(healthScore)}%`);
                console.log(`   CPU: ${cpuCores}코어, 메모리: ${Math.round(memoryGB)}GB`);
                console.log('');
            }
        });

        // 검증 결과 출력
        console.log('🔍 설계 명세 검증 결과:');
        console.log(`   서버 개수 (30개): ${validationResults.serverCount ? '✅' : '❌'}`);
        console.log(`   서버 타입: ${validationResults.serverTypes.every(v => v) ? '✅' : '❌'}`);
        console.log(`   서버 이름 형식: ${validationResults.serverNames.every(v => v) ? '✅' : '❌'}`);
        console.log(`   역할: ${validationResults.roles.every(v => v) ? '✅' : '❌'}`);
        console.log(`   환경: ${validationResults.environments.every(v => v) ? '✅' : '❌'}`);
        console.log(`   위치: ${validationResults.locations.every(v => v) ? '✅' : '❌'}`);
        console.log(`   상태: ${validationResults.statuses.every(v => v) ? '✅' : '❌'}`);
        console.log(`   CPU 코어 수: ${validationResults.cpuCores.every(v => v) ? '✅' : '❌'}`);
        console.log(`   메모리 범위: ${validationResults.memoryRanges.every(v => v) ? '✅' : '❌'}`);
        console.log(`   건강도 범위: ${validationResults.healthScores.every(v => v) ? '✅' : '❌'}`);

        // 통계 정보
        const statusCounts = servers.reduce((acc, server) => {
            acc[server.status] = (acc[server.status] || 0) + 1;
            return acc;
        }, {});

        const typeCounts = servers.reduce((acc, server) => {
            acc[server.type] = (acc[server.type] || 0) + 1;
            return acc;
        }, {});

        console.log('\n📈 통계 정보:');
        console.log(`   상태별 분포: ${JSON.stringify(statusCounts)}`);
        console.log(`   타입별 분포: ${JSON.stringify(typeCounts)}`);

        // 실시간 업데이트 테스트
        console.log('\n🔄 실시간 업데이트 테스트 (5초 후 재확인)...');

        setTimeout(async () => {
            try {
                const response2 = await fetch('http://localhost:3000/api/servers/realtime?type=servers');
                const result2 = await response2.json();

                if (result2.success) {
                    const servers2 = result2.data;

                    // 첫 번째 서버의 메트릭 변화 확인
                    const server1_before = servers[0];
                    const server1_after = servers2[0];

                    const cpuChanged = Math.abs(server1_before.metrics.cpu - server1_after.metrics.cpu) > 0.1;
                    const memoryChanged = Math.abs(server1_before.metrics.memory - server1_after.metrics.memory) > 0.1;

                    console.log(`   실시간 업데이트: ${cpuChanged || memoryChanged ? '✅' : '❌'}`);
                    console.log(`   CPU 변화: ${server1_before.metrics.cpu.toFixed(1)}% → ${server1_after.metrics.cpu.toFixed(1)}%`);
                    console.log(`   메모리 변화: ${server1_before.metrics.memory.toFixed(1)}% → ${server1_after.metrics.memory.toFixed(1)}%`);
                }
            } catch (error) {
                console.log(`   실시간 업데이트 테스트 실패: ${error.message}`);
            }

            console.log('\n🎉 서버 데이터 생성기 검증 완료!');
        }, 5000);

    } catch (error) {
        console.error('❌ 테스트 실패:', error.message);
    }
}

// 브라우저에서 실행
testServerDataGenerator(); 