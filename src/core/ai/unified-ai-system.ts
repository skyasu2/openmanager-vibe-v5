/**
 * 🚧 통합 AI 시스템 (임시 비활성화)
 * 
 * 이 모듈은 구버전 AI 엔진 제거로 인해 임시 비활성화되었습니다.
 * 향후 새로운 UnifiedAIEngineRouter 기반으로 재구현 예정입니다.
 */

export class UnifiedAISystem {
    private static instance: UnifiedAISystem | null = null;

    public static getInstance(): UnifiedAISystem {
        if (!UnifiedAISystem.instance) {
            UnifiedAISystem.instance = new UnifiedAISystem();
        }
        return UnifiedAISystem.instance;
    }

    async processQuery(query: any) {
        return {
            success: false,
            message: '통합 AI 시스템은 현재 업데이트 중입니다.',
            status: 'maintenance'
        };
    }

    async getSystemHealth() {
        return {
            status: 'maintenance',
            message: '시스템 업데이트 중'
        };
    }
} 