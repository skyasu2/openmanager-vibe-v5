---
id: auth-github-oauth
title: 'GitHub OAuth & Guest Authentication'
keywords: ['github', 'oauth', 'supabase', 'authentication', 'guest', 'jwt']
ai_optimized: true
priority: high
updated: '2025-12-03'
related: ['auth-supabase', 'auth-session', 'troubleshoot-auth']
code_snippets: true
---

# GitHub OAuth & Guest Authentication

**AI Context**: Dual authentication system (GitHub OAuth + Guest) with JWT validation security.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Login Page (/login)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐          ┌─────────────────┐          │
│  │  GitHub OAuth   │          │   Guest Login   │          │
│  │  (Supabase)     │          │  (localStorage) │          │
│  └────────┬────────┘          └────────┬────────┘          │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌─────────────────┐          ┌─────────────────┐          │
│  │ JWT Validation  │          │ crypto.randomUUID│          │
│  │ (getUser())     │          │ (secure ID gen) │          │
│  └────────┬────────┘          └────────┬────────┘          │
│           │                            │                    │
│           └────────────┬───────────────┘                    │
│                        ▼                                    │
│              ┌─────────────────┐                           │
│              │ AuthStateManager│                           │
│              │ (통합 세션 관리)  │                           │
│              └────────┬────────┘                           │
│                       ▼                                     │
│              ┌─────────────────┐                           │
│              │   /main 페이지   │                           │
│              └─────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## Quick Implementation

```typescript
// 1. Supabase Client Setup
import { supabase } from '@/lib/supabase/client';

// 2. GitHub Sign-In (with PKCE flow)
export async function signInWithGitHub() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) throw error;
}

// 3. Secure Session Check (JWT Validation) ⚠️ IMPORTANT
export async function getSecureSession() {
  // 🔐 getUser() validates JWT signature on server
  // getSession() only checks local cache (insecure)
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('⚠️ JWT validation failed:', error.message);
    return null;
  }
  return user;
}

// 4. Sign Out
export async function signOut() {
  await supabase.auth.signOut();
  clearAuthData(); // AuthStateManager cleanup
}
```

## Security: getSession() vs getUser()

| Method | JWT Validation | Use Case |
|--------|----------------|----------|
| `getSession()` | ❌ Local cache only | Quick UI checks |
| `getUser()` | ✅ Server-side | **Recommended for security** |

```typescript
// ❌ INSECURE - only checks local cache
const { data: { session } } = await supabase.auth.getSession();

// ✅ SECURE - validates JWT signature on server
const { data: { user } } = await supabase.auth.getUser();
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# GitHub OAuth App
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

## GitHub OAuth App Setup

1. **GitHub Settings** → **Developer settings** → **OAuth Apps**
2. **Application details**:
   ```
   Name: OpenManager VIBE v5
   Homepage: https://your-domain.vercel.app
   Callback: https://your-supabase-project.supabase.co/auth/v1/callback
   ```

## Supabase Configuration

1. **Dashboard** → **Authentication** → **Providers** → **GitHub**
2. **Enable GitHub** + **Add Client ID/Secret**
3. **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   https://your-domain.vercel.app/auth/callback
   ```

## Common Issues

| Problem                 | Solution                         |
| ----------------------- | -------------------------------- |
| `redirect_uri_mismatch` | Check callback URL in GitHub app |
| Session not persisting  | Verify `persistSession: true`    |
| PKCE flow errors        | Use `flowType: 'pkce'`           |

## Related Files

- `src/lib/supabase-singleton.ts` - Main client
- `src/hooks/useSupabaseSession.ts` - Session management
- `docs-ai-optimized/auth/session-management.md` - Session handling
- `docs-ai-optimized/troubleshoot/auth-issues.md` - Troubleshooting

---

**AI Note**: This file is optimized for AI tools. All code snippets are copy-paste ready.
