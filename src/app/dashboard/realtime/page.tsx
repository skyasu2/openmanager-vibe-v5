/**
 * 📊 실시간 모니터링 대시보드 페이지
 * /dashboard/realtime
 */

import { RealTimeMonitoringDashboard } from '../../../components/dashboard/RealTimeMonitoringDashboard';

export default function RealTimeDashboardPage() {
  return <RealTimeMonitoringDashboard />;
}

// 메타데이터
export const metadata = {
  title: 'OpenManager - 실시간 모니터링 대시보드',
  description: 'Grafana 스타일 실시간 서버 모니터링 인터페이스',
}; 