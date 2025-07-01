import React from 'react';
import { GoogleAIStatusCard as UnifiedGoogleAIStatusCard } from '@/components/shared/GoogleAIStatusCard';

interface AdminGoogleAIStatusCardProps {
    className?: string;
}

export const GoogleAIStatusCard: React.FC<AdminGoogleAIStatusCardProps> = (props) => {
    return (
        <UnifiedGoogleAIStatusCard
            {...props}
            variant="admin"
        />
    );
};

export default GoogleAIStatusCard;