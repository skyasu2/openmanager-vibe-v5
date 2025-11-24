import type { EnhancedServerMetrics } from '@/types/server';
import type { EnrichedMetrics } from '../EnrichedMetricsGenerator';

export interface MetricsSource {
  generateMetrics(server: EnhancedServerMetrics): Promise<EnrichedMetrics>;
}
