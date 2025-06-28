import {
  AlertTriangle,
  CheckCircle,
  Database,
  Globe,
  Server,
  XCircle,
  Zap,
  Brain,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const getServiceIcon = (serviceName: string) => {
  if (serviceName.includes('Supabase')) return <Database className='w-5 h-5' />;
  if (serviceName.includes('Redis')) return <Zap className='w-5 h-5' />;
  if (serviceName.includes('Google AI')) return <Brain className='w-5 h-5' />;
  if (serviceName.includes('Render')) return <Server className='w-5 h-5' />;
  if (serviceName.includes('Vercel')) return <Globe className='w-5 h-5' />;
  return <Server className='w-5 h-5' />;
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'connected':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'connected':
      return 'default';
    case 'error':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const formatResponseTime = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'connected':
    case 'active':
      return <CheckCircle className='h-5 w-5 text-green-500' />;
    case 'error':
    case 'missing':
      return <XCircle className='h-5 w-5 text-red-500' />;
    case 'invalid':
      return <AlertTriangle className='h-5 w-5 text-yellow-500' />;
    default:
      return <AlertTriangle className='h-5 w-5 text-gray-500' />;
  }
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'connected':
    case 'active':
      return (
        <Badge variant='default' className='bg-green-100 text-green-800'>
          활성화
        </Badge>
      );
    case 'error':
    case 'missing':
      return <Badge variant='destructive'> 오류 </Badge>;
    case 'invalid':
      return (
        <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
          무효
        </Badge>
      );
    default:
      return <Badge variant='outline'> 알 수 없음 </Badge>;
  }
};

export const getSourceIcon = (source: string) => {
  switch (source) {
    case 'default':
      return '';
    case 'encrypted':
      return '🔐';
    case 'env':
    default:
      return '📝';
  }
};

export const presetQueries = [
  'CPU 사용률이 높은 서버를 찾아줘',
  '메모리 사용량이 80% 이상인 서버는?',
  '디스크 공간이 부족한 서버 분석해줘',
  '네트워크 트래픽이 많은 서버는?',
  '최근 에러가 발생한 서버를 확인해줘',
  '성능 최적화가 필요한 서버 추천해줘',
];
