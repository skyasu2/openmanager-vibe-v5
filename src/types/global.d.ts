/**
 * 전역 객체 타입 확장
 * Node.js global 객체에 커스텀 속성들의 타입을 정의
 */

// 시스템 요청 제한 관련 타입
interface StatusRequestCount {
  count: number;
  resetTime: number;
}

// 마지막 상태 체크 관련 타입
interface LastStatusCheck {
  [userId: string]: number;
}

// 무료 티어 캐시 관련 타입
interface FreeTierCache {
  [key: string]: unknown;
}

// Polyfill 관련 타입
interface DocumentMock {
  createElement: () => Record<string, unknown>;
  getElementById: () => null;
  querySelector: () => null;
  querySelectorAll: () => unknown[];
  addEventListener: () => void;
  removeEventListener: () => void;
}

interface NavigatorMock {
  userAgent: string;
  platform: string;
  language: string;
}

interface LocationMock {
  href: string;
  origin: string;
  pathname: string;
  search: string;
  hash: string;
  hostname: string;
  port: string;
  protocol: string;
}

interface StorageMock {
  getItem: () => null;
  setItem: () => void;
  removeItem: () => void;
  clear: () => void;
  length: number;
  key: () => null;
}

declare global {
  // Node.js global 객체 확장
  namespace NodeJS {
    interface Global {
      statusRequestCount?: StatusRequestCount;
      lastStatusCheck?: LastStatusCheck;
      freeTierCache?: FreeTierCache;
      // Polyfill 속성들
      self?: typeof globalThis;
      window?: typeof globalThis;
      document?: DocumentMock;
      navigator?: NavigatorMock;
      location?: LocationMock;
      localStorage?: StorageMock;
      sessionStorage?: StorageMock;
    }
  }

  // 글로벌 스코프에서 직접 사용할 수 있도록 확장
  var statusRequestCount: StatusRequestCount | undefined;
  var lastStatusCheck: LastStatusCheck | undefined;
  var freeTierCache: FreeTierCache | undefined;

  // Window 객체 확장 (브라우저 환경)
  interface Window {
    self?: Window;
  }

  // GlobalThis 확장
  interface GlobalThis {
    self?: typeof globalThis;
  }
}

// lucide-react 모듈 타입 선언
declare module 'lucide-react' {
  import type { FC, SVGProps } from 'react';;

  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    stroke?: string;
    strokeWidth?: number | string;
  }

  export type Icon = FC<IconProps>;

  export const Activity: Icon;
  export const AlertCircle: Icon;
  export const AlertTriangle: Icon;
  export const ArrowRight: Icon;
  export const BarChart3: Icon;
  export const Brain: Icon;
  export const Check: Icon;
  export const CheckCircle: Icon;
  export const ChevronRight: Icon;
  export const Clock: Icon;
  export const Cpu: Icon;
  export const Database: Icon;
  export const Download: Icon;
  export const FileDown: Icon;
  export const Gauge: Icon;
  export const Github: Icon;
  export const HardDrive: Icon;
  export const Home: Icon;
  export const Info: Icon;
  export const Loader2: Icon;
  export const LogOut: Icon;
  export const Monitor: Icon;
  export const RefreshCw: Icon;
  export const Server: Icon;
  export const Settings: Icon;
  export const Shield: Icon;
  export const Terminal: Icon;
  export const Trash2: Icon;
  export const TrendingUp: Icon;
  export const Upload: Icon;
  export const User: Icon;
  export const Users: Icon;
  export const Wifi: Icon;
  export const X: Icon;
  export const XCircle: Icon;
  export const Zap: Icon;
}

export {};
