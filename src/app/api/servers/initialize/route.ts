import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { NextResponse } from 'next/server';

/**
 * 🚀 실제 서버 데이터 생성기 초기화 API
 * 
 * 15개 서버 생성 및 실제 데이터 시스템 활성화
 */

export async function POST() {
    try {
        console.log('🚀 RealServerDataGenerator 초기화 시작...');

        // 기존 인스턴스 제거 (완전 재시작)
        const generator = RealServerDataGenerator.getInstance();

        // 강제 초기화
        await generator.initialize();

        // 자동 생성 시작
        generator.startAutoGeneration();

        // 생성된 서버 확인
        const servers = generator.getAllServers();
        const clusters = generator.getAllClusters();
        const applications = generator.getAllApplications();

        const response = {
            success: true,
            message: 'RealServerDataGenerator 초기화 완료',
            data: {
                servers: {
                    count: servers.length,
                    list: servers.map(s => ({
                        id: s.id,
                        name: s.name,
                        type: s.type,
                        status: s.status,
                        environment: s.environment,
                        location: s.location
                    }))
                },
                clusters: {
                    count: clusters.length,
                    list: clusters.map(c => ({ id: c.id, name: c.name }))
                },
                applications: {
                    count: applications.length,
                    list: applications.map(a => ({ name: a.name, version: a.version }))
                }
            },
            status: {
                initialized: true,
                autoGeneration: true,
                dataSource: 'RealServerDataGenerator'
            },
            timestamp: new Date().toISOString()
        };

        console.log(`✅ 서버 ${servers.length}개, 클러스터 ${clusters.length}개, 애플리케이션 ${applications.length}개 생성 완료`);

        return NextResponse.json(response);

    } catch (error) {
        console.error('❌ RealServerDataGenerator 초기화 실패:', error);

        return NextResponse.json({
            success: false,
            error: 'INITIALIZATION_FAILED',
            message: 'RealServerDataGenerator 초기화 중 오류 발생',
            details: error instanceof Error ? error.message : '알 수 없는 오류',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const generator = RealServerDataGenerator.getInstance();
        const status = generator.getStatus();

        return NextResponse.json({
            success: true,
            status: status,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'STATUS_CHECK_FAILED',
            message: '상태 확인 중 오류 발생',
            details: error instanceof Error ? error.message : '알 수 없는 오류',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
} 