/**
 * 🔐 OpenManager Vibe v5 - 암호화된 환경변수 설정
 * 
 * 이 파일은 민감한 환경변수들을 AES 암호화하여 저장합니다.
 * Git에 커밋해도 안전하며, 팀 비밀번호로만 복호화할 수 있습니다.
 * 
 * 생성일: 2025-06-18T07:09:29.199Z
 * 암호화된 변수: 6개
 */

export const ENCRYPTED_ENV_CONFIG = {
    version: '2.0.0',
    createdAt: '2025-06-18T07:09:29.199Z',
    teamPasswordHash: '7e346817b5382d72b3860a1aa9d6abc0263e2ddcea9e78c18724dfa2c1f575f5',
    variables: {
        "NEXT_PUBLIC_SUPABASE_URL": {
            "encrypted": "qrNAX8Fpfgv2Fr4KkrEl3f1aYfNMRsoSXLQ7vCl4fcNngW2EXXxUkrahAy9gmagw",
            "salt": "18ed63863a9ea8ba74c8bb650616163a",
            "iv": "ad487d20bcba0de967d0dcce415e921d",
            "timestamp": "2025-06-18T07:09:28.287Z",
            "originalName": "NEXT_PUBLIC_SUPABASE_URL",
            "isPublic": true,
            "rotateSchedule": "manual"
        },
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": {
            "encrypted": "+Yp9WaAEMXytrisydc/jeX/NMjacWibNalDeIJqhzwBBrjY6chR/pNBGcmE1SJ62NCIQPL+Zpy48UcjQ+NmqPCd+BOX9VKsxQEap1ifSz1EPn2MPzwJZDhoHqOTdan2xRA388MwwWLZF4DyqOk4BTH4gg80ptTsWDPIO4CMYlF6+nutC43xo8t3WyFyzqy/+ICksecyKT/8iFKqFP/iTvHSLijD+FlPIHtW+CAX0syk4ZrsmYJ0L+Gt83bydYlbxqRcHyQDAACzRORxPUJ9xtf/0pLrQ4pOIfNb3th5YzGU=",
            "salt": "38a0dcfbb15a32d91d25d44c8f9ca6b7",
            "iv": "185337099f96406a4e97f641a81301c0",
            "timestamp": "2025-06-18T07:09:28.522Z",
            "originalName": "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            "isPublic": true,
            "rotateSchedule": "manual"
        },
        "SUPABASE_SERVICE_ROLE_KEY": {
            "encrypted": "f3o0DWJlsRB6RWsDxcMW+5Szh6l3GJiFncMMs7YTLW27XBCIW6e8dnTN17Dl8d0mNC6aFUHdCpM6Vms9MfmYN8cYb8ktlYdHiGdWkr+aJJ37CcrvtyrMJiKH1WYC/kAr/FCNWrRuOsnLooZBPalKUFhFCe/bDXanj9AubWDg0q3JTV6aYWMS8hM4dPapv/kjgCeC4YWHP3HRDDNyvTzQlGHn+Z/rg113bsw6UhPpQ7D8uQZmHkbNfdwgLDnSlCkIb5YPSmD0ohGtAoAwaGoW589RGBbZ0IeAYB753/K4CwM=",
            "salt": "c38c0069ddb5d210fe87b8a420b243f1",
            "iv": "a164812171bd7f890483001f49f7b1c2",
            "timestamp": "2025-06-18T07:09:28.681Z",
            "originalName": "SUPABASE_SERVICE_ROLE_KEY",
            "isPublic": false,
            "rotateSchedule": "manual"
        },
        "UPSTASH_REDIS_REST_URL": {
            "encrypted": "JDlH0NaOUedOUIbMiFIGgF0axuj0GJ1S140w/X8KNcWpgFg75aareY3CmEyf8dNF",
            "salt": "8afa564fca5d2faa8e3bac4a11befa25",
            "iv": "0e02608ac656f316aa2040dc37222858",
            "timestamp": "2025-06-18T07:09:28.827Z",
            "originalName": "UPSTASH_REDIS_REST_URL",
            "isPublic": false,
            "rotateSchedule": "manual"
        },
        "UPSTASH_REDIS_REST_TOKEN": {
            "encrypted": "Z8FnNPvs+03sFxtUBRyohe74AnOQnY1Z0ELbJ88xWWjLV3mUzBbuxT8FN6RqqS1DrKEhr9Zm/ld/N8oGS4hgfA==",
            "salt": "b52670cc90863288930b41f6e7ecbbd0",
            "iv": "c2e5a654e8fced4fca4e83adea96c7f2",
            "timestamp": "2025-06-18T07:09:28.998Z",
            "originalName": "UPSTASH_REDIS_REST_TOKEN",
            "isPublic": false,
            "rotateSchedule": "quarterly"
        },
        "RENDER_MCP_SERVER_URL": {
            "encrypted": "l4Udq86RTTeM6u7BJipVHCPNSpP3kWADZMoCSyXSD64pjSeSHfqDCFIcD5r8Kpl7",
            "salt": "e972f57047b3f473889b4bf703bfb131",
            "iv": "e6a27780a7d812ce3d12262e6af0bc85",
            "timestamp": "2025-06-18T07:09:29.199Z",
            "originalName": "RENDER_MCP_SERVER_URL",
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