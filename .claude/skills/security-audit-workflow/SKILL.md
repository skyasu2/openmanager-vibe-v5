---
name: security-audit-workflow
description: Automated security audit for pre-deployment. Use for OWASP Top 10, RLS policies, and secrets exposure checks.
version: v1.1.0
user-invocable: true
allowed-tools: Bash, Read, Grep
---

# Security Audit Workflow

**Target Token Efficiency**: 70% (400 tokens → 120 tokens)

## Purpose

Automated security scanning and vulnerability detection before deployment without manual security review.

## Trigger Keywords

- "security check"
- "security audit"
- "vulnerability scan"
- "배포 전 보안"
- "보안 체크"
- "OWASP check"
- "RLS 검증"
- "security scan"
- "pre-deployment security"
- "보안 감사"

## Context

- **Project**: OpenManager VIBE v5.85.0
- **Stack**: Next.js 16 + Supabase PostgreSQL + Vercel
- **Security Framework**: OWASP Top 10 compliance
- **Critical Assets**: API keys, JWT secrets, RLS policies
- **Compliance Level**: 99.9% SLA requirement

## Workflow

### 1. OWASP Top 10 Check

**Automated Vulnerability Scanning**:

```bash
# Check for common OWASP vulnerabilities

# A01: Broken Access Control
echo "🔒 Checking Access Control..."
grep -r "bypassAuth" src/ --include="*.ts" --include="*.tsx"
grep -r "skipAuth" src/ --include="*.ts" --include="*.tsx"

# A02: Cryptographic Failures
echo "🔐 Checking Cryptographic Practices..."
grep -r "crypto" src/ --include="*.ts" | grep -v "import"

# A03: Injection
echo "💉 Checking SQL Injection Risks..."
grep -r "SELECT.*\${" src/ --include="*.ts"
grep -r "WHERE.*\${" src/ --include="*.ts"

# A05: Security Misconfiguration
echo "⚙️  Checking Security Configuration..."
grep -r "process.env" src/ --include="*.ts" | wc -l
```

**Vulnerability Categories**:

| Category                  | Priority | Check                                          |
| ------------------------- | -------- | ---------------------------------------------- |
| **A01: Access Control**   | CRITICAL | Verify all API routes have auth middleware     |
| **A02: Crypto Failures**  | HIGH     | Check JWT secret strength, encryption usage    |
| **A03: Injection**        | CRITICAL | Scan for SQL injection, XSS vulnerabilities    |
| **A04: Insecure Design**  | MEDIUM   | Review authentication flow, session management |
| **A05: Misconfiguration** | HIGH     | Verify environment variables, CORS settings    |
| **A07: Auth Failures**    | CRITICAL | Test authentication bypass, weak passwords     |
| **A08: Data Integrity**   | MEDIUM   | Check API signature validation                 |
| **A09: Logging Failures** | LOW      | Verify security event logging                  |
| **A10: SSRF**             | MEDIUM   | Check external API calls validation            |

### 2. Environment Variables Security

**Check for Exposed Secrets**:

```bash
# Scan for hardcoded secrets
echo "🔑 Scanning for Hardcoded Secrets..."

# Check for API keys in code
grep -r "API_KEY" src/ --include="*.ts" --include="*.tsx" | grep -v "process.env"
grep -r "SECRET" src/ --include="*.ts" --include="*.tsx" | grep -v "process.env"

# Check for JWT tokens
grep -r "eyJ" src/ --include="*.ts" --include="*.tsx"

# Check for credentials
grep -r "password.*=.*['\"]" src/ --include="*.ts" --include="*.tsx"
```

**Expected Results**:

- ✅ All secrets must use `process.env.*`
- ❌ No hardcoded API keys, tokens, or passwords
- ✅ `.env` files in `.gitignore`

### 3. Supabase RLS Policy Verification

**Check Row Level Security**:

```bash
# Verify RLS is enabled on all tables
echo "🛡️  Verifying RLS Policies..."

# Check migration files for RLS
grep -r "ENABLE ROW LEVEL SECURITY" supabase/migrations/ --include="*.sql"

# Check for tables without RLS
grep -r "CREATE TABLE" supabase/migrations/ --include="*.sql" | \
  grep -v "ENABLE ROW LEVEL SECURITY"
```

**RLS Policy Checklist**:

- [ ] All user-facing tables have RLS enabled
- [ ] Service role access explicitly defined
- [ ] Anonymous access properly restricted
- [ ] Policies tested with different user roles

**Expected Policies**:

```sql
-- All tables should have RLS enabled
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Service role access
CREATE POLICY "Service role access" ON table_name
  FOR ALL USING (auth.role() = 'service_role');

-- User access (example)
CREATE POLICY "Users can read own data" ON table_name
  FOR SELECT USING (auth.uid() = user_id);
```

### 4. API Endpoint Security

**Check API Route Protection**:

```bash
# Verify all API routes have authentication
echo "🔐 Checking API Route Protection..."

# List all API routes
find src/app/api -name "route.ts" -o -name "*.ts" | while read -r file; do
  echo "Checking: $file"

  # Check for auth middleware
  if ! grep -q "verifyAuth\|requireAuth\|authenticate" "$file"; then
    echo "⚠️  WARNING: No auth middleware found in $file"
  fi
done
```

**Security Requirements**:

- ✅ All `/api/*` routes must have authentication
- ✅ Rate limiting enabled (see: rate-limiter.ts)
- ✅ CORS configured properly
- ✅ Input validation on all endpoints

### 5. Dependency Vulnerability Scan

**Check for Known Vulnerabilities**:

```bash
# Run npm audit
echo "📦 Running npm audit..."
npm audit --production

# Check for high/critical vulnerabilities
AUDIT_RESULT=$(npm audit --json --production 2>/dev/null)
CRITICAL_COUNT=$(echo "$AUDIT_RESULT" | grep -c '"severity":"critical"' || echo "0")
HIGH_COUNT=$(echo "$AUDIT_RESULT" | grep -c '"severity":"high"' || echo "0")

echo "Critical vulnerabilities: $CRITICAL_COUNT"
echo "High vulnerabilities: $HIGH_COUNT"

# Threshold checks
if [ "$CRITICAL_COUNT" -gt 0 ]; then
  echo "❌ CRITICAL: Found $CRITICAL_COUNT critical vulnerabilities"
  exit 1
fi

if [ "$HIGH_COUNT" -gt 5 ]; then
  echo "⚠️  WARNING: Found $HIGH_COUNT high vulnerabilities (threshold: 5)"
fi
```

**Vulnerability Thresholds**:

- **CRITICAL**: 0 allowed (immediate fix required)
- **HIGH**: ≤ 5 allowed (fix before next deployment)
- **MEDIUM**: ≤ 20 allowed (plan fix in sprint)
- **LOW**: Acceptable (monitor)

### 6. Report Format

```
🔒 Security Audit Report

📊 OWASP Top 10 Check:
├─ A01 Access Control: ✅ Pass / ❌ N issues
├─ A02 Crypto Failures: ✅ Pass / ❌ N issues
├─ A03 Injection: ✅ Pass / ❌ N issues
├─ A05 Misconfiguration: ✅ Pass / ❌ N issues
└─ Overall: ✅ PASS / ⚠️ REVIEW / ❌ FAIL

🔑 Secrets Exposure:
├─ Hardcoded Keys: ✅ None / ❌ N found
├─ Environment Vars: ✅ Proper / ❌ Exposed
└─ Status: ✅ SECURE / ❌ VULNERABLE

🛡️  RLS Policies:
├─ Tables with RLS: N/M (target: 100%)
├─ Missing Policies: ✅ None / ❌ N tables
└─ Status: ✅ COMPLIANT / ⚠️ REVIEW

🔐 API Security:
├─ Protected Routes: N/M (target: 100%)
├─ Rate Limiting: ✅ Enabled / ❌ Disabled
└─ Status: ✅ SECURE / ❌ EXPOSED

📦 Dependencies:
├─ Critical: N (threshold: 0)
├─ High: N (threshold: ≤5)
└─ Status: ✅ SAFE / ⚠️ UPDATE / ❌ CRITICAL

🎯 Deployment Readiness:
└─ ✅ APPROVED / ⚠️ FIX WARNINGS / ❌ BLOCKED
```

## Token Optimization Strategy

**Before (Manual)**:

```
User: "배포 전 보안 체크해줘"
Assistant: [reads security docs, runs npm audit, checks RLS, scans code, explains findings]
Tokens: ~400
```

**After (Skill)**:

```
User: "security check"
Skill: [executes audit workflow, reports vulnerabilities, provides fixes]
Tokens: ~120 (70% reduction)
```

**Efficiency Gains**:

- ❌ No need to explain OWASP Top 10
- ❌ No need to read security docs
- ✅ Direct vulnerability scanning
- ✅ Structured security report
- ✅ Actionable fix recommendations

## Common Fixes

### Fix 1: Add RLS Policy

```sql
-- Enable RLS on table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Add service role policy
CREATE POLICY "Service role full access" ON table_name
  FOR ALL USING (auth.role() = 'service_role');
```

### Fix 2: Protect API Route

```typescript
// Add auth middleware
import { verifyAuth } from '@/lib/auth/api-auth';

export async function GET(req: Request) {
  // Verify authentication
  const authResult = await verifyAuth(req);
  if (!authResult.authenticated) {
    return new Response('Unauthorized', { status: 401 });
  }

  // ... rest of handler
}
```

### Fix 3: Fix Hardcoded Secret

```typescript
// Before
const API_KEY = 'sk_live_1234567890abcdef';

// After
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error('API_KEY not configured');
}
```

## Edge Cases

**Case 1: False Positives**

- Action: Review manually, add exceptions to scan
- Example: Test files with mock secrets

**Case 2: RLS Policy Migration**

- Check: Existing tables may need RLS added
- Action: Create migration for retroactive RLS

**Case 3: Third-Party Vulnerabilities**

- Check: npm audit may report unmaintained packages
- Action: Consider alternatives or accept risk with documentation

## Success Criteria

- OWASP Top 10: No critical issues
- Secrets: 100% use environment variables
- RLS: 100% coverage on user-facing tables
- API Security: 100% routes protected
- Dependencies: 0 critical, ≤5 high vulnerabilities
- Execution time: < 3 minutes

## Related Skills

- `lint-smoke` - For code quality verification
- `playwright-triage` - For E2E security testing

## Changelog

- 2025-12-12: v1.1.0 - Tech stack upgrade alignment
  - Next.js 15 → 16 framework version update
- 2025-11-24: v1.0.0 - Initial implementation (Phase 2)
  - OWASP Top 10 automated scanning
  - RLS policy verification
  - Secrets exposure detection
  - API route security check
  - Dependency vulnerability scan
