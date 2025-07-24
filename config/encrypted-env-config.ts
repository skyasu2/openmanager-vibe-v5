/**
 * 🔐 암호화된 환경변수 설정 (런타임 전용)
 * 생성일: 2025-07-10T10:34:56.885Z
 * 버전: 2.0.0
 *
 * ⚠️ 주의: 이 파일은 백업/복원 용도가 아닙니다!
 * - 백업/복원은 env-backup-manager.cjs를 사용하세요
 * - 이 파일은 런타임에 환경변수를 암호화하여 로드하는 용도입니다
 *
 * 이 파일은 Git에 안전하게 커밋할 수 있습니다.
 * 런타임에 자동으로 복호화되어 사용됩니다.
 */

export interface EncryptedEnvVar {
  encrypted: string;
  salt: string;
  iv: string;
  authTag: string;
  timestamp: string;
  version: string;
  originalName: string;
  isPublic: boolean;
  category: string;
}

export interface EncryptedEnvironmentConfig {
  version: string;
  createdAt: string;
  teamPasswordHash: string;
  variables: { [key: string]: EncryptedEnvVar };
}

export const ENCRYPTED_ENV_CONFIG: EncryptedEnvironmentConfig = {
  version: '2.0.0',
  createdAt: '2025-07-10T10:34:56.885Z',
  teamPasswordHash:
    '7e346817b5382d72b3860a1aa9d6abc0263e2ddcea9e78c18724dfa2c1f575f5',
  variables: {
    NEXT_PUBLIC_SUPABASE_URL: {
      encrypted: 'YZJ0ox7d0QL29yP98s816QFvnkFx87st9FEVyJhvbWFTDVmYIbSLvA==',
      salt: '059529a60c92cdb52e975b0387caec74fce6c9cee463a6b0a4ca8d0370bb362b',
      iv: 'ea693ef48e9e76c23760ba74eada4d8a',
      authTag: '8c2a984e1a0fec8b82e2f7836124fcde',
      timestamp: '2025-07-10T10:34:56.678Z',
      version: '2.0.0',
      originalName: 'NEXT_PUBLIC_SUPABASE_URL',
      isPublic: true,
      category: 'database',
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      encrypted:
        'd4PAdci58NX9dDy1o6ejmk3gOJKOuGUJzO6T3JLOeUM8Ot+2wqpHBO7SKOan/CunjRzrDoswYmUpbw31JQ8hMq3SLJBWTjc6RSXlSVoaBDTifq38n6m9lphp2EJR3lC8W6gD0UMVu+II5s2TOVsKKG//Oe4L2AyRPGSjv2qbJnaqbYFSwAmWqYW2hpSlfH2YnCgIvU4stKBoEtIr5f3WfK+MbdTwVcvwdE971W9vMtUxmU1xXCtxc+71OwTFd+M0/6u3RcjN29eu29P3hMyLog==',
      salt: '7c6fbc5de25484513f6b186b1ede3aa6e863d1245217bc3e2b3c5a546095ee4f',
      iv: 'f7b39c438e9e9011cb2cc64962c3e37f',
      authTag: '09e21a4c6c7a01935c073503a2df97d7',
      timestamp: '2025-07-10T10:34:56.700Z',
      version: '2.0.0',
      originalName: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      isPublic: true,
      category: 'database',
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      encrypted:
        'l1SMNc7SDBE6ckn7x95EvTeGrIvSeDaPhmwEso9RZNX4ZVIBnkedQYc+W4chv3mXsDLug18hniW64VLPjolG2BOmc89JdQn8S81yjQmUmgf9E5ZZv2TG4MKUorJaxSgRomLLuyDMuL4JiAzJZNiLP3uO+cTXyfaw+NpJ7FlW2w+4Tl4N17ih6DjMZ8yIVBWjqj8du/v+01oHErwfVsZZKci97/+VpH3s6hdNhrovETsQ63DEEvdG2E4yY0hPGxTunSvtVYZ9b4D4YVMC0Xf/7juUtxlXVmj9aJmr',
      salt: '8307bb4ffcf3a48534b05d2a51abcb8c2928b180fcb78bf067e897f8de46206e',
      iv: 'd699d6e5b157098fc281c1775cd77fe0',
      authTag: '1929377f6ac07c299de55f4a0bce1a3a',
      timestamp: '2025-07-10T10:34:56.724Z',
      version: '2.0.0',
      originalName: 'SUPABASE_SERVICE_ROLE_KEY',
      isPublic: false,
      category: 'database',
    },
    UPSTASH_REDIS_REST_URL: {
      encrypted: 'fEdYgf7++fadBebko0LNXE0CBCi0QbrH5SPSS0+XJQJ416rZfnDyJg==',
      salt: '3a7fdd51c6377e9cc7ccb86e9558cbb97a82fc65da233f638585d9d605fb2cc5',
      iv: '1648e877ddc5e0a4f1447b96e3f7535a',
      authTag: 'f37323807b6aa95c16b7641d94cb09be',
      timestamp: '2025-07-10T10:34:56.748Z',
      version: '2.0.0',
      originalName: 'UPSTASH_REDIS_REST_URL',
      isPublic: false,
      category: 'cache',
    },
    UPSTASH_REDIS_REST_TOKEN: {
      encrypted:
        '3S7Au5YUQ+81P5N15iQ7NsnLixvmkFQfBShZBbJHWj6JXYHRTPSPoCrs62Kv9n0BCgj8O9kw55AFlA==',
      salt: '636d6b9aee225042f4c4566e267f8989c90dab9a8cd6c82174f6c818e0060752',
      iv: '428274faa14e3ec723f46cdf7cd5cf4b',
      authTag: 'b775ed722117cf2c96e1d3e650f288ed',
      timestamp: '2025-07-10T10:34:56.770Z',
      version: '2.0.0',
      originalName: 'UPSTASH_REDIS_REST_TOKEN',
      isPublic: false,
      category: 'cache',
    },
    GOOGLE_AI_API_KEY: {
      encrypted: '+ykwXK2N5g8j5ztPdMVIghKOiMZYJqrQKZRGP2X37EmqRHYyZx1l',
      salt: '2390d6d465cd0723db9c67c0608b7d8100cd77662e6c147b6273ba23b1d35a7a',
      iv: '8c9cdb89d177b68370f665dd654e8c9a',
      authTag: '9d7b400dc54ed18e541c1755e1166cba',
      timestamp: '2025-07-10T10:34:56.794Z',
      version: '2.0.0',
      originalName: 'GOOGLE_AI_API_KEY',
      isPublic: false,
      category: 'ai',
    },
    GCP_MCP_SERVER_URL: {
      encrypted: 'g7AvUpbY65s7AYB3vXIvIeg44AxJONsIvMMfUf7krUAiOaTzr9mpIw==',
      salt: '6e5f62ab900c88ff499b811f203b9856e05af99b9a629a33bc17756df730a75d',
      iv: '68d6bec0af885b736963b7e6ef0d33a1',
      authTag: '3f75a01ffd834a277b1ad8b280010f61',
      timestamp: '2025-07-10T10:34:56.815Z',
      version: '2.0.0',
      originalName: 'GCP_MCP_SERVER_URL',
      isPublic: false,
      category: 'services',
    },
    NEXTAUTH_SECRET: {
      encrypted: 'gV86cuiWGCEce6uxfC/AwU42MvqMIHRWr8cZgVKMnZ4=',
      salt: '7dd065a6678e3d3967d260170a931fd1c8911328f5f19210afa71f17aa7adf37',
      iv: '9e81ded1be860b218e82a26eb7deac50',
      authTag: 'd66adcfc9066c10ffed089103096f3b1',
      timestamp: '2025-07-10T10:34:56.838Z',
      version: '2.0.0',
      originalName: 'NEXTAUTH_SECRET',
      isPublic: false,
      category: 'auth',
    },
    NEXTAUTH_URL: {
      encrypted: 'qooCJw+hy/hGmL69nmRwkO4hcHoC0Nd0I75wdVOWHMm3/WOvF/k=',
      salt: '25f9928776d81bc8f6b5ac2a9ffeeffc12e8fef02327e7e5eadada120e508903',
      iv: '78b44d480322d5c4435ecef39b87e0d0',
      authTag: 'd9f383a0b395ef2468a7943ff4d03b10',
      timestamp: '2025-07-10T10:34:56.860Z',
      version: '2.0.0',
      originalName: 'NEXTAUTH_URL',
      isPublic: false,
      category: 'auth',
    },
    GITHUB_TOKEN: {
      encrypted: '/QicOZMb+iWj/PVPX2rVAdzoONvrpqqVVojsT1r5JmRESCeZdY3nMA==',
      salt: 'f0fc8502f4bb0794e273c8bf36690cc2f5ce82fa18625b6561567a01d2dbcc21',
      iv: '302ec0da21e06ad329630c45da681ca6',
      authTag: 'a6b11ae85a232e90c76ee43db3b5a2da',
      timestamp: '2025-07-12T12:50:36.594Z',
      version: '2.0.0',
      originalName: 'GITHUB_TOKEN',
      isPublic: false,
      category: 'vcs',
    },
  },
};

// 배포 설정
export const DEPLOYMENT_CONFIG = {
  autoDecrypt: true,
  fallbackToPlaintext: process.env.NODE_ENV === 'development',
  cacheDecrypted: true,
  services: {
    supabase: { enabled: true },
    redis: { enabled: true },
    googleAI: { enabled: true },
    mcp: { enabled: true },
  },
};
