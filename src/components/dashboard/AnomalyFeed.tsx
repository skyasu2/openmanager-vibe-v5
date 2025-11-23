// 🔄 통합된 AnomalyFeed 컴포넌트 사용
// Dashboard에서는 dashboard variant 사용
import { type FC } from 'react';
import { AnomalyFeed as UnifiedAnomalyFeed } from '@/components/shared/AnomalyFeed';

interface DashboardAnomalyFeedProps {
  className?: string;
  maxItems?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const AnomalyFeed: FC<DashboardAnomalyFeedProps> = (props) => {
  return <UnifiedAnomalyFeed {...props} />;
};

export default AnomalyFeed;
