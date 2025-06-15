export interface MigrationStatus {
    success: boolean;
    migrated_items: number;
    summary: {
        userLogs: number;
        patterns: number;
        abTests: number;
        performanceMetrics: number;
    };
    errors: string[];
}

export interface EngineStatus {
    name: string;
    type: 'opensource' | 'custom';
    status: 'active' | 'inactive' | 'error' | 'training';
    requests: number;
    accuracy: number;
    responseTime: number;
    lastUsed: string;
}

export interface ServerStats {
    total: number;
    online: number;
    warning: number;
    offline: number;
}

export interface OverallStats {
    totalRequests: number;
    avgResponseTime: number;
    activeEngines: number;
    avgAccuracy: number;
}

export interface AIEngineTabProps {
    engines: EngineStatus[];
    serverStats: ServerStats;
    overallStats: OverallStats;
    isLoading: boolean;
    error: string | null;
    refreshEngineStatus: () => Promise<void>;
}

export interface MigrationTabProps extends AIEngineTabProps {
    migrationStatus: MigrationStatus | null;
    migrationProgress: number;
    isMigrating: boolean;
    startMigration: () => Promise<void>;
} 