/**
 * 🎭 Node 환경 전용 Mock 관리 (Redis-Free)
 * 브라우저 API를 제외한 순수 Node 환경 Mock
 */

// 서비스별 Mock 모듈들 (브라우저 의존성 없음)
import './ai-services';
import './external-apis';
import './supabase';

// 데이터 관련 exports
export * from './test-data';
