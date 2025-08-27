// React import 제거 - Next.js 15 자동 JSX Transform 사용
import type { FC } from 'react';
import { GoogleAIStatusCard as UnifiedGoogleAIStatusCard } from '@/components/shared/GoogleAIStatusCard';

interface AdminGoogleAIStatusCardProps {
  className?: string;
}

export const GoogleAIStatusCard: FC<AdminGoogleAIStatusCardProps> = (
  props
) => {
  return <UnifiedGoogleAIStatusCard {...props} variant="admin" />;
};

export default GoogleAIStatusCard;
