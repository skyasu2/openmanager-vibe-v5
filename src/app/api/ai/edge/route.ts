/**
 * 🔄 Edge AI API Route (리다이렉트)
 * 
 * v2 엔드포인트로 자동 리다이렉트
 * - 하위 호환성 유지
 * - Redis → Supabase 마이그레이션 완료
 */

// v2 엔드포인트로 POST와 OPTIONS 리다이렉트
export { POST, OPTIONS } from '../edge-v2/route';