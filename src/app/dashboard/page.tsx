/**
 * Dashboard Page - Server Component with SSR Data Fetching
 *
 * Phase 2: Server-side data pre-fetching for improved performance.
 * - FCP/LCP improvement via server-side data loading
 * - Eliminates client-side waterfall
 *
 * NOTE: Dynamic rendering is configured in layout.tsx
 */

import { getDashboardData } from '@/lib/dashboard/server-data';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const { servers, stats } = await getDashboardData();

  return <DashboardClient initialServers={servers} initialStats={stats} />;
}
