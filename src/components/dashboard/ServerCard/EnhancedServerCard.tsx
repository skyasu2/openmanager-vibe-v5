/**
 * 🚀 Enhanced ServerCard Component with Shadcn UI
 * 
 * Shadcn UI 컴포넌트를 활용한 개선된 서버 카드
 * - Card, Badge, Progress 컴포넌트 사용
 * - 기존 기능 100% 호환성 유지
 * - OpenManager 브랜드 컬러 적용
 * - 향상된 UI/UX
 */

import React, { memo, useState, useCallback } from 'react';
import { Server } from '../../../types/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import ServerIcon from './ServerIcon';
import ActionButtons from './ActionButtons';
import { safeFormatUptime } from '../../../utils/safeFormat';
import { cn } from '@/lib/utils';

interface EnhancedServerCardProps {
  server: Server;
  onClick: (server: Server) => void;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onAction?: (action: string, server: Server) => void;
}

const EnhancedServerCard: React.FC<EnhancedServerCardProps> = memo(({
  server,
  onClick,
  variant = 'default',
  showActions = true,
  onAction
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // 서버 상태에 따른 Badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'online': 
        return 'default';
      case 'warning': 
        return 'secondary';
      case 'offline': 
        return 'destructive';
      default: 
        return 'outline';
    }
  };

  // 서버 상태에 따른 상태 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '온라인';
      case 'warning': return '주의';
      case 'offline': return '오프라인';
      default: return '알 수 없음';
    }
  };

  // 서비스 태그 색상
  const getServiceTagColor = useCallback((status: string) => {
    switch (status) {
      case 'running': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'stopped': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }, []);

  // 배리언트별 설정
  const getVariantConfig = () => {
    switch (variant) {
      case 'compact':
        return {
          showDetailedMetrics: false,
          showServices: false,
          maxServices: 0,
          cardClassName: 'min-h-[180px]',
          headerClassName: 'pb-2',
          contentClassName: 'pt-0 pb-3'
        };
      case 'detailed':
        return {
          showDetailedMetrics: true,
          showServices: true,
          maxServices: 4,
          cardClassName: 'min-h-[320px]',
          headerClassName: 'pb-4',
          contentClassName: 'pt-0 pb-6'
        };
      default:
        return {
          showDetailedMetrics: false,
          showServices: true,
          maxServices: 2,
          cardClassName: 'min-h-[240px] sm:min-h-[260px]',
          headerClassName: 'pb-3',
          contentClassName: 'pt-0 pb-4'
        };
    }
  };

  const config = getVariantConfig();

  // 카드 클릭 핸들러
  const handleCardClick = useCallback(() => {
    onClick(server);
  }, [onClick, server]);

  // 액션 핸들러
  const handleAction = useCallback((action: string, targetServer: Server) => {
    if (onAction) {
      onAction(action, targetServer);
    } else if (action === 'view') {
      onClick(targetServer);
    }
  }, [onAction, onClick]);

  return (
    <TooltipProvider>
      <Card 
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-lg',
          'group relative overflow-hidden',
          config.cardClassName,
          isHovered && 'shadow-lg ring-2 ring-primary/20'
        )}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
                 {/* 상태 인디케이터 (왼쪽 보더) */}
         <div className={cn(
           'absolute left-0 top-0 w-1 h-full transition-colors',
           server.status === 'online' 
             ? 'bg-emerald-500' 
             : server.status === 'warning' 
             ? 'bg-yellow-500' 
             : 'bg-red-500'
         )} />

        {/* 헤더 */}
        <CardHeader className={config.headerClassName}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-sm sm:text-base font-semibold">
              <ServerIcon 
                server={server} 
                size={variant === 'detailed' ? 'lg' : variant === 'compact' ? 'sm' : 'md'}
                showTooltip={variant !== 'compact'}
              />
              <span className="truncate">{server.name}</span>
            </CardTitle>
            
            <Badge 
              variant={getStatusVariant(server.status)}
              className="ml-2 shrink-0"
            >
              {getStatusText(server.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className={config.contentClassName}>
          {/* 메트릭 표시 */}
          <div className="space-y-3 mb-4">
            {/* CPU 사용률 */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CPU</span>
                <span className="font-medium">{server.cpu || 0}%</span>
              </div>
              <Progress 
                value={server.cpu || 0} 
                className="h-2"
              />
            </div>

            {/* 메모리 사용률 */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Memory</span>
                <span className="font-medium">{server.memory || 0}%</span>
              </div>
              <Progress 
                value={server.memory || 0} 
                className="h-2"
              />
            </div>

            {/* 디스크 사용률 (detailed 모드에서만) */}
            {config.showDetailedMetrics && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Disk</span>
                  <span className="font-medium">{server.disk || 0}%</span>
                </div>
                <Progress 
                  value={server.disk || 0} 
                  className="h-2"
                />
              </div>
            )}
          </div>

          <Separator className="my-3" />

          {/* 기본 정보 */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">위치</span>
              <span className="font-medium">{server.location || 'Seoul DC1'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">업타임</span>
              <span className="font-medium">{safeFormatUptime(server.uptime)}</span>
            </div>
            
            {variant !== 'compact' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP주소</span>
                  <span className="font-medium text-xs">{server.ip || '192.168.1.100'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">응답속도</span>
                  <span className="font-medium">
                    {(Math.random() * 200 + 50).toFixed(0)}ms
                  </span>
                </div>
              </>
            )}
          </div>

          {/* 상세 정보 (detailed 모드에서만) */}
          {config.showDetailedMetrics && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs mb-2">시스템 정보</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">OS</span>
                      <span className="font-medium">{server.os || 'Ubuntu 20.04'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">아키텍처</span>
                      <span className="font-medium">x86_64</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs mb-2">리소스</div>
                  <div className="space-y-1">
                                         <div className="flex justify-between">
                       <span className="text-muted-foreground">CPU 코어</span>
                       <span className="font-medium">{server.systemInfo?.processes || 4}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">RAM</span>
                       <span className="font-medium">16GB</span>
                     </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 서비스 태그 */}
          {config.showServices && server.services && server.services.length > 0 && (
            <>
              <Separator className="my-3" />
              <div>
                <div className="text-muted-foreground text-xs mb-2">서비스</div>
                <div className="flex flex-wrap gap-1">
                  {server.services.slice(0, config.maxServices).map((service, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-xs px-2 py-1 border',
                            getServiceTagColor(service.status)
                          )}
                        >
                          {service.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{service.name}: {service.status}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {server.services.length > config.maxServices && (
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      +{server.services.length - config.maxServices}
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 액션 버튼 (hover 시 표시) */}
          {showActions && (
            <div className={cn(
              'absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-white via-white to-transparent',
              'transition-all duration-200',
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}>
              <ActionButtons 
                server={server}
                onAction={handleAction}
                variant={variant}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
});

EnhancedServerCard.displayName = 'EnhancedServerCard';

export default EnhancedServerCard; 