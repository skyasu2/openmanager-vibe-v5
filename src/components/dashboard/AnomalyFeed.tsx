// 🔄 통합된 AnomalyFeed 컴포넌트 사용
// Dashboard에서는 dashboard variant 사용
import React from 'react';
import { AnomalyFeed as UnifiedAnomalyFeed } from '@/components/shared/AnomalyFeed';

interface DashboardAnomalyFeedProps {
  className?: string;
  maxItems?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const AnomalyFeed: React.FC<DashboardAnomalyFeedProps> = (props) => {
  return (
    <UnifiedAnomalyFeed
      {...props}
      variant="dashboard"
    />
  );
};

export default AnomalyFeed;