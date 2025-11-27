---
id: auth-github-oauth
title: 'GitHub OAuth Setup'
keywords: ['github', 'oauth', 'supabase', 'authentication']
ai_optimized: true
priority: high
updated: '2025-09-09'
related: ['auth-supabase', 'auth-session', 'troubleshoot-auth']
code_snippets: true
---

# GitHub OAuth Setup

**AI Context**: Essential authentication system for GitHub login integration with Supabase backend.

## Quick Implementation

```typescript
// 1. Supabase Client Setup
import { supabase } from '@/lib/supabase';

// 2. GitHub Sign-In
export async function signInWithGitHub() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
}

// 3. Sign Out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
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
