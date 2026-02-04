// /api/servers/all과 동일한 핸들러 재사용 (308 redirect 제거 → round-trip 절감)
// @deprecated /api/servers/all 직접 사용 권장
export { GET } from './all/route';

export const dynamic = 'force-dynamic';
