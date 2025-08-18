/**
 * 🎭 통합 Mock 관리 (Redis-Free)
 * 도메인별 Mock 파일들을 중앙에서 관리
 */

// 기본 Mock 모듈들
import './analytics';
import './browser';
import './motion';
import './next-router';
import './react-query';

// 서비스별 Mock 모듈들
import './ai-services';
import './external-apis';
import './supabase';

// 컴포넌트별 Mock 모듈들
import './chart-libraries';
import './ui-components';

export * from './test-data';
