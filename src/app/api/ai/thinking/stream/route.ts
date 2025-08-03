/**
 * 🔄 AI 생각중 상태 스트리밍 API (리다이렉트)
 * 
 * v2 엔드포인트로 자동 리다이렉트
 * - 하위 호환성 유지
 * - Redis Streams → Supabase Realtime 마이그레이션 완료
 */

// v2 엔드포인트로 모든 메서드 리다이렉트
export { GET, POST } from '../stream-v2/route';