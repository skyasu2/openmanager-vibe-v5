/**
 * 🔐 OpenManager Vibe v5 - 암호화된 환경변수 설정
 * 
 * 이 파일은 민감한 환경변수들을 AES 암호화하여 저장합니다.
 * Git에 커밋해도 안전하며, 팀 비밀번호로만 복호화할 수 있습니다.
 * 
 * 생성일: 2025-06-18T23:24:08.349Z
 * 암호화된 변수: 7개
 */

export const ENCRYPTED_ENV_CONFIG = {
  version: '2.0.0',
  createdAt: '2025-06-18T23:24:08.349Z',
  teamPasswordHash: '7e346817b5382d72b3860a1aa9d6abc0263e2ddcea9e78c18724dfa2c1f575f5',
  variables: {
    "NEXT_PUBLIC_SUPABASE_URL": {
      "encrypted": "ErKN0MSvIAlf9gR68mzem7hxkFAfdBRQTBeeBJVyygugv9rlSAZhMT/HG78eR3Vp",
      "salt": "cfb4cedc4d32e1f20dbf79babda54361",
      "iv": "4e4cfaa1e2a178f48c4c54fe67610268",
      "timestamp": "2025-06-18T23:24:07.819Z",
      "originalName": "NEXT_PUBLIC_SUPABASE_URL",
      "isPublic": true,
      "rotateSchedule": "manual"
    },
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": {
      "encrypted": "3CMQu3v07n2COzXiV63Ts9NFuVtV2dy/+dLC/indJyrlAzEv63yhBtWBMSkZ1/qDF2FIK3f570F3RLexR4yGWtzJYAwU5++F1YmTmf5Woznm7ps1CJwO9iBv9RkKMmzfRhJNLd8QwgSxWITvOcuMHPynd0sVt/roqKvc46ZP4cCY5n3riwqIo6uLiNldDQQMFoo2T6h1QZy7VbH9PHE/ywiMa2yVOYGhHdrg3deHWalXQiLNg8SAbUvX20gXGZqG0MT7246JxeNOAr/MjcmauQHA/ejHtvqmaNp7oHI+tQY=",
      "salt": "b515e1b60aa017693a641b345cec8586",
      "iv": "2b24f8591ecc6890cd6093c5c72c048f",
      "timestamp": "2025-06-18T23:24:07.914Z",
      "originalName": "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "isPublic": true,
      "rotateSchedule": "manual"
    },
    "SUPABASE_SERVICE_ROLE_KEY": {
      "encrypted": "Z0TCFaM3orm+GIHDEWH1vGSwiBaIDsDcEtMmTx3K0Wbgfjmh0uHVj1uCD4ty9O0W9zKjII86vsPLXEl9SD2uqDzFB5yeSP+eR39wd09bu0QvN1NW8g0EvBaVL9RkA0K0L1535l+JxNX/LGByMXRoG0slTTJJS8JMYfFiZnHty9qSEkbJGxnJ/idQFMcLmQq2/bCaq4ANRqLXGWm0mf5SovfL8RBKW7d4QduXEFxy+efLTOgEyE0QXcrqzs+kyiWWIrSNeAFz9v+WtzAFk1KKxXGe8WQLxTAsm0+zT9tkaiU=",
      "salt": "9245aa7519814994485b663abfbd032b",
      "iv": "e4849b54fd9e9b84eef2669eacd76547",
      "timestamp": "2025-06-18T23:24:08.000Z",
      "originalName": "SUPABASE_SERVICE_ROLE_KEY",
      "isPublic": false,
      "rotateSchedule": "manual"
    },
    "UPSTASH_REDIS_REST_URL": {
      "encrypted": "9c86DAVxwMmum1CRTGQlzE1/0QtUm2T+DvNTnPfetl02W9BxBb17cJm4TCvQNYTM",
      "salt": "d0047e315f3329b269ef15f8eb135207",
      "iv": "457777a8bb1ebd422ed559b208dcf20d",
      "timestamp": "2025-06-18T23:24:08.083Z",
      "originalName": "UPSTASH_REDIS_REST_URL",
      "isPublic": false,
      "rotateSchedule": "manual"
    },
    "UPSTASH_REDIS_REST_TOKEN": {
      "encrypted": "6loFOt/I0HlBaB6Ds0hL0T0OJVw8TZQhXZDZXzyPSpY0frDsGg4+IvqEKojVgFybmAI3//5uSOtDu3RfuVe5og==",
      "salt": "e7ebd6ee2e53b72bc027a7598768109a",
      "iv": "d89bda01209941992d5f6b9516abefe8",
      "timestamp": "2025-06-18T23:24:08.183Z",
      "originalName": "UPSTASH_REDIS_REST_TOKEN",
      "isPublic": false,
      "rotateSchedule": "quarterly"
    },
    "RENDER_MCP_SERVER_URL": {
      "encrypted": "plTmj8an+jM+tneI026GiwWVrRKdnoA+5JsSoalOJDjywb4KYcPDlFYbneUtkDXs",
      "salt": "1d5939c975fef05407acb9420f8e02a7",
      "iv": "4d6f76f39e56b627d29786a1cfe590bc",
      "timestamp": "2025-06-18T23:24:08.270Z",
      "originalName": "RENDER_MCP_SERVER_URL",
      "isPublic": false,
      "rotateSchedule": "manual"
    },
    "GOOGLE_AI_API_KEY": {
      "encrypted": "waHQ/XUFlL8UB98tzvet0ylNjszQNjycJKXGT8vNOtC5leMnGAN8Za6iW9s8fTgG",
      "salt": "834ce4c4cbc37fd67e0893612f460fcb",
      "iv": "8d63f626197208e9ecb562f92d642ed3",
      "timestamp": "2025-06-18T23:24:08.349Z",
      "originalName": "GOOGLE_AI_API_KEY",
      "isPublic": false,
      "rotateSchedule": "manual"
    }
  }
};

export const DEPLOYMENT_CONFIG = {
  supabase: {
    enabled: true,
    region: 'ap-southeast-1',
    project: 'vnswjnltnhpsueosfhmw'
  },
  renderMCP: {
    enabled: true,
    region: 'singapore',
    loadBalanced: true
  },
  redis: {
    enabled: true,
    provider: 'upstash',
    region: 'ap-southeast-1'
  },
  googleAI: {
    enabled: true,
    model: 'gemini-1.5-flash',
    betaMode: true
  }
};