# GitHub OAuth & Guest Authentication

**AI Context**: Dual authentication system (GitHub OAuth + Guest) with JWT validation security.

## Architecture Overview

> **v5.83+ Flow Update**: 미인증 사용자도 `/main` 페이지에 접근 가능.
> 로그인 버튼을 통해 `/login`으로 이동 후 인증 진행.

```
┌─────────────────────────────────────────────────────────────┐
│                   Main Page (/main)                         │
│           [비로그인 시 로그인 버튼 표시]                       │
├─────────────────────────────────────────────────────────────┤
│                         │                                   │
│              (로그인 버튼 클릭)                               │
│                         ▼                                   │
│              ┌─────────────────┐                           │
│              │  Login Page     │                           │
│              │  (/login)       │                           │
│              └────────┬────────┘                           │
│                       │                                     │
│       ┌───────────────┴───────────────┐                    │
│       ▼                               ▼                    │
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
│              │   /main 복귀    │                           │
│              │ (시스템 시작 가능)│                           │
│              └─────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## Quick Implementation

```typescript
// 1. Imports
import { supabase } from '@/lib/supabase/client';
import { clearAuthData } from '@/lib/auth/auth-state-manager';

// 2. GitHub Sign-In (with PKCE flow - handled by Supabase)
export async function signInWithGitHub(): Promise<void> {
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
export async function getSecureSession(): Promise<User | null> {
  // 🔐 getUser() sends request to Supabase Auth server to validate JWT
  // getSession() only checks local storage (insecure for sensitive ops)
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('⚠️ JWT validation failed:', error.message);
    return null;
  }
  return user;
}

// 4. Sign Out (with cleanup)
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  clearAuthData(); // Clears localStorage auth data via AuthStateManager
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

## Guest Authentication Security

> **⚠️ Security Note**: Guest mode uses `localStorage` intentionally for demo/temporary access.

| Aspect | Guest Mode | GitHub OAuth |
|--------|------------|--------------|
| Storage | localStorage | Supabase (secure cookies) |
| Token Type | UUID session ID | JWT with server validation |
| Permissions | Read-only, limited | Full access |
| Use Case | Quick demo, trials | Production users |

**Why localStorage for Guest?**
- Guest sessions are **temporary** and have **limited permissions**
- No sensitive data is stored (only session identifier)
- Acceptable for demo/trial scenarios
- **Not used for production authentication**

```typescript
// Guest ID generation (secure random)
const guestId = `guest_${crypto.randomUUID()}`; // 128-bit entropy
localStorage.setItem('auth_user', JSON.stringify({ id: guestId, ... }));
localStorage.setItem('auth_type', 'guest');
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
