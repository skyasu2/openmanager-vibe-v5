'use client';

import { Cloud, Cpu, Info } from 'lucide-react';
import type React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AIEngineIndicatorProps {
  currentEngine?: string;
  routingReason?: string;
  className?: string;
}

export const AIEngineIndicator: React.FC<AIEngineIndicatorProps> = ({
  currentEngine = 'LOCAL',
  routingReason,
  className = '',
}) => {
  const isGoogle = currentEngine?.toUpperCase().includes('GOOGLE');
  const isUnified = currentEngine?.toUpperCase().includes('UNIFIED');

  // Determine display properties based on engine
  const getEngineDisplay = () => {
    if (isGoogle || isUnified) {
      return {
        label: 'Cloud AI',
        icon: Cloud,
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        description: 'Mistral + Groq 멀티 에이전트 사용 중',
      };
    }
    return {
      label: 'Local RAG',
      icon: Cpu,
      color: 'bg-green-100 text-green-700 border-green-200',
      description: '로컬 RAG 엔진 사용 중 (비용 절약)',
    };
  };

  const { label, icon: Icon, color, description } = getEngineDisplay();

  return (
    <div className={`flex items-center ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`flex cursor-help items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${color}`}
            >
              <Icon className="h-3 w-3" />
              <span>{label}</span>
              {routingReason && <Info className="ml-0.5 h-3 w-3 opacity-50" />}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" className="max-w-[200px]">
            <div className="space-y-1">
              <p className="font-semibold">{description}</p>
              {routingReason && (
                <div className="mt-1 border-t pt-1 text-xs text-gray-500">
                  <span className="font-medium">라우팅 사유:</span>{' '}
                  {routingReason}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
