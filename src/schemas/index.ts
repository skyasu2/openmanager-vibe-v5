/**
 * 🔒 중앙화된 Zod 스키마 모음
 * 
 * 모든 Zod 스키마를 중앙에서 관리하여 재사용성과 일관성 향상
 */

// Common schemas
export * from './common.schema';

// Server schemas (분할된 스키마)
export * from './server-schemas';

// AI schemas (분할된 스키마)
export * from './ai-schemas/ai-performance.schema';

// 기존 스키마들 (점진적 마이그레이션 대상)
// TODO: 중복 export 문제 해결 필요 - 이미 server-schemas와 ai-schemas에서 export됨
// export * from './api.schema';
// export * from './server.schema';
export * from './auth.schema';
// export * from './ai.schema';
export * from './monitoring.schema';
export * from './utils.schema';