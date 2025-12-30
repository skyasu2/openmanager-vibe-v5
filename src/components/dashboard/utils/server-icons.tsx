/**
 * 🎯 서버 타입별 아이콘 매핑
 *
 * 실제 기업 환경 기반 서버 타입별 아이콘 반환
 *
 * @refactored 2025-12-30 - EnhancedServerCard.tsx에서 분리
 */

import {
  BarChart3,
  Box,
  Cloud,
  Code,
  Cpu,
  Database,
  FileText,
  GitBranch,
  HardDrive,
  Layers,
  Mail,
  Network,
  Search,
  Server,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';
import type React from 'react';

export type ServerType =
  | 'nginx'
  | 'apache'
  | 'iis'
  | 'web'
  | 'nodejs'
  | 'api'
  | 'springboot'
  | 'django'
  | 'php'
  | 'dotnet'
  | 'app'
  | 'mysql'
  | 'postgresql'
  | 'oracle'
  | 'mssql'
  | 'database'
  | 'mongodb'
  | 'redis'
  | 'cache'
  | 'rabbitmq'
  | 'kafka'
  | 'queue'
  | 'elasticsearch'
  | 'jenkins'
  | 'prometheus'
  | 'monitoring'
  | 'security'
  | 'mail'
  | 'load-balancer'
  | 'storage'
  | 'backup'
  | 'default';

/**
 * 서버 타입에 따른 아이콘 컴포넌트 반환
 */
export function getServerIcon(
  serverType: string | undefined,
  className = 'w-5 h-5'
): React.ReactElement {
  const type = (serverType || 'default').toLowerCase();

  // 🌐 웹서버
  if (
    type === 'nginx' ||
    type === 'apache' ||
    type === 'iis' ||
    type === 'web'
  ) {
    return <Server className={className} />;
  }

  // 🚀 애플리케이션 서버
  if (type === 'nodejs' || type === 'api') {
    return <GitBranch className={className} />;
  }
  if (type === 'springboot') {
    return <Settings className={className} />;
  }
  if (type === 'django' || type === 'php') {
    return <Code className={className} />;
  }
  if (type === 'dotnet' || type === 'app') {
    return <Box className={className} />;
  }

  // 🗄️ 데이터베이스
  if (
    type === 'mysql' ||
    type === 'postgresql' ||
    type === 'oracle' ||
    type === 'mssql' ||
    type === 'database'
  ) {
    return <Database className={className} />;
  }
  if (type === 'mongodb') {
    return <FileText className={className} />;
  }

  // ⚙️ 인프라 서비스
  if (type === 'redis' || type === 'cache') {
    return <Zap className={className} />;
  }
  if (type === 'rabbitmq' || type === 'kafka' || type === 'queue') {
    return <Network className={className} />;
  }
  if (type === 'elasticsearch') {
    return <Search className={className} />;
  }
  if (type === 'jenkins') {
    return <Cpu className={className} />;
  }
  if (type === 'prometheus' || type === 'monitoring') {
    return <BarChart3 className={className} />;
  }
  if (type === 'security') {
    return <Shield className={className} />;
  }
  if (type === 'mail') {
    return <Mail className={className} />;
  }
  if (type === 'load-balancer') {
    return <Layers className={className} />;
  }
  if (type === 'storage' || type === 'backup') {
    return <HardDrive className={className} />;
  }

  return <Cloud className={className} />;
}

export default getServerIcon;
