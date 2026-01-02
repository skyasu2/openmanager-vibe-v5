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
 * @param serverType - 서버 타입 (ServerType 유니언 또는 기타 문자열)
 * @param className - 아이콘 CSS 클래스
 */
export function getServerIcon(
  serverType: ServerType | (string & NonNullable<unknown>) | undefined,
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

/**
 * 서버 타입에 따른 사용자 친화적 라벨 반환
 * @param serverType - 서버 타입
 */
export function getServerTypeLabel(
  serverType: ServerType | (string & NonNullable<unknown>) | undefined
): string {
  const type = (serverType || 'default').toLowerCase();

  // 🌐 웹서버
  if (type === 'nginx') return 'Nginx 웹서버';
  if (type === 'apache') return 'Apache 웹서버';
  if (type === 'iis') return 'IIS 웹서버';
  if (type === 'web') return '웹 서버';

  // 🚀 애플리케이션 서버
  if (type === 'nodejs') return 'Node.js API';
  if (type === 'api') return 'API 서버';
  if (type === 'springboot') return 'Spring Boot WAS';
  if (type === 'django') return 'Django 서버';
  if (type === 'php') return 'PHP 서버';
  if (type === 'dotnet') return '.NET 서버';
  if (type === 'app') return '애플리케이션 서버';

  // 🗄️ 데이터베이스
  if (type === 'mysql') return 'MySQL DB';
  if (type === 'postgresql') return 'PostgreSQL DB';
  if (type === 'oracle') return 'Oracle DB';
  if (type === 'mssql') return 'MSSQL DB';
  if (type === 'database') return '데이터베이스';
  if (type === 'mongodb') return 'MongoDB';

  // ⚙️ 인프라 서비스
  if (type === 'redis') return 'Redis 캐시';
  if (type === 'cache') return '캐시 서버';
  if (type === 'rabbitmq') return 'RabbitMQ 메시징';
  if (type === 'kafka') return 'Kafka 브로커';
  if (type === 'queue') return '메시지 큐';
  if (type === 'elasticsearch') return 'Elasticsearch';
  if (type === 'jenkins') return 'Jenkins CI/CD';
  if (type === 'prometheus') return 'Prometheus 모니터링';
  if (type === 'monitoring') return '모니터링 서버';
  if (type === 'security') return '보안 서버';
  if (type === 'mail') return '메일 서버';
  if (type === 'load-balancer') return 'HAProxy 로드밸런서';
  if (type === 'storage') return '스토리지 서버';
  if (type === 'backup') return '백업 서버';

  // 기본값: 원본 타입명 반환 (첫글자 대문자)
  if (type === 'default' || !serverType) return '서버';
  return serverType.charAt(0).toUpperCase() + serverType.slice(1);
}

export default getServerIcon;
