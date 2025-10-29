# 403 Authentication Error Fix - Vercel Deployment Protection

**Date**: 2025-10-29
**Status**: ✅ RESOLVED
**Issue**: Playwright E2E tests failing with 403 error on `/api/test/vercel-test-auth` endpoint
**Root Cause**: Environment variables not loaded for Playwright tests
**Solution**: Created `.env` file for Playwright's automatic loading

---

## Problem Summary

### Symptoms

- E2E tests failing with 403 error: "Received text/html; charset=utf-8 instead of JSON (status 403)"
- Error occurred at `/api/test/vercel-test-auth` endpoint
- Vercel Deployment Protection blocking API requests before reaching Next.js code

### Error Message

```
❌ [Admin Helper] 게스트 로그인 실패: Error: 게스트 로그인 API 실패:
   Received text/html; charset=utf-8 instead of JSON (status 403)
```

---

## Root Cause Analysis

### Investigation Steps

1. **Verified Bypass Header Implementation** ✅
   - Code in `tests/e2e/helpers/admin.ts` correctly implemented `x-vercel-protection-bypass` header
   - Header sent on lines 159, 520 with value from `process.env.VERCEL_AUTOMATION_BYPASS_SECRET`

2. **Confirmed Vercel Documentation** ✅
   - Implementation matched official Vercel Protection Bypass for Automation pattern
   - Header name and mechanism were correct

3. **Checked Environment Variables** ❌ **ROOT CAUSE FOUND**
   - `VERCEL_AUTOMATION_BYPASS_SECRET=ee2aGggamAVy7ti2iycFOXamwgjIhuhr` exists in `.env.local`
   - Secret value matches Vercel project bypass key ID
   - **BUT** Playwright doesn't automatically load `.env.local`
   - Playwright only loads `.env` by default

4. **Verified Playwright Configuration**
   - `playwright.config.ts` had no explicit environment variable loading
   - Test script (`test:vercel:e2e`) only set `PLAYWRIGHT_BASE_URL` and `VERCEL_PRODUCTION_URL` inline

5. **Traced Variable Flow**

   ```typescript
   // In tests/e2e/helpers/admin.ts:114
   const vercelBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '';

   // When VERCEL_AUTOMATION_BYPASS_SECRET is undefined:
   // - Falls back to empty string
   // - Bypass header sent as: 'x-vercel-protection-bypass': ''
   // - Vercel rejects because header value doesn't match secret
   // - Returns 403 HTML page instead of JSON
   ```

### Why It Failed

**Chain of Events**:

1. ✅ Code correctly implements bypass header
2. ✅ Secret exists in `.env.local` with correct value
3. ❌ Playwright doesn't load `.env.local` (only loads `.env`)
4. ❌ `process.env.VERCEL_AUTOMATION_BYPASS_SECRET` returns `undefined`
5. ❌ Code defaults to empty string: `|| ''`
6. ❌ Bypass header sent with empty value
7. ❌ Vercel's protection layer rejects request (403)
8. ❌ Returns HTML error page instead of JSON

---

## Solution Implemented

### Created `.env` File

**File**: `/mnt/d/cursor/openmanager-vibe-v5/.env`

**Contents**:

```bash
# Playwright E2E Test Environment Variables
# This file is loaded automatically by Playwright

# Vercel Deployment Protection Bypass for Automated Testing
# This secret allows E2E tests to bypass Vercel's SSO protection layer
VERCEL_AUTOMATION_BYPASS_SECRET=ee2aGggamAVy7ti2iycFOXamwgjIhuhr

# Test Secret Key for API Authentication
# Used by /api/test/vercel-test-auth endpoint to validate test requests
TEST_SECRET_KEY=test-secret-key-please-change-in-env

# Base URLs for Playwright Tests (can be overridden via CLI)
PLAYWRIGHT_BASE_URL=https://openmanager-vibe-v5.vercel.app
VERCEL_PRODUCTION_URL=https://openmanager-vibe-v5.vercel.app
```

### Why This Works

1. **Playwright's Default Behavior**: Playwright automatically loads `.env` file from project root
2. **Environment Variable Availability**: `process.env.VERCEL_AUTOMATION_BYPASS_SECRET` now has correct value
3. **Bypass Header Valid**: Header sent with actual secret value that matches Vercel configuration
4. **Protection Bypassed**: Vercel allows request through to Next.js API
5. **API Responds**: Returns JSON with 200 status instead of 403 HTML

### Security

- `.env` file already in `.gitignore` (lines 89, 100)
- File won't be committed to repository
- Secrets remain local only

---

## Verification Results

### Tests Passing

#### 1. Basic Smoke Tests ✅

```bash
PLAYWRIGHT_BASE_URL="https://openmanager-vibe-v5.vercel.app" \
  npx playwright test tests/e2e/basic-smoke.spec.ts --project=chromium --reporter=line
```

**Result**: **7/7 passed (19.6s)**

- ✅ Login page loads correctly
- ✅ Main dashboard redirect works
- ✅ 404 page works for non-existent routes
- ✅ API endpoint responds
- ✅ Server API provides basic response
- ✅ Static assets load
- ✅ No critical browser console errors

#### 2. Admin Mode PIN API Test ✅

```bash
PLAYWRIGHT_BASE_URL="https://openmanager-vibe-v5.vercel.app" \
  npx playwright test tests/e2e/admin-mode-pin-api-test.spec.ts --project=chromium --reporter=line
```

**Result**: **1/1 passed (43.2s)**

**Key Evidence of Fix**:

```
🌐 API 응답: 200 - {"success":true}
✅ admin_mode 쿠키 발견: true
✅ 관리자 모드 활성화
✅ /admin 페이지 접근 성공
```

**Complete Workflow Verified**:

1. ✅ Guest login (no 403 error)
2. ✅ API response 200 OK (bypass header working)
3. ✅ PIN 4231 authentication
4. ✅ Admin mode activation
5. ✅ Dashboard verification
6. ✅ AI assistant sidebar check
7. ✅ Admin page access successful

---

## Technical Details

### Vercel Protection Bypass Configuration

**Project Settings** (from Vercel):

```json
{
  "protectionBypass": {
    "ee2aGggamAVy7ti2iycFOXamwgjIhuhr": {
      "scope": "automation-bypass"
    }
  }
}
```

### HTTP Header Implementation

**Request Header**:

```http
POST /api/test/vercel-test-auth HTTP/1.1
Content-Type: application/json
User-Agent: Playwright Test Agent
x-vercel-protection-bypass: ee2aGggamAVy7ti2iycFOXamwgjIhuhr
```

**Code Location**: `tests/e2e/helpers/admin.ts`

- Lines 113-114: Environment variable loading
- Lines 150-179: `activateAdminMode()` function
- Lines 496-552: `ensureGuestLogin()` function

---

## Lessons Learned

### 1. Environment Variable Loading Differences

**Next.js** (production):

- Automatically loads `.env.local` during build/runtime
- Environment variables available to server components and API routes

**Playwright** (testing):

- Only loads `.env` by default (not `.env.local`)
- Requires explicit configuration for other env files
- Test scripts need environment variables to be available to Node.js process

### 2. Debugging HTTP 403 Errors

**When debugging 403 from Vercel Deployment Protection**:

1. ✅ Verify code implementation (header name, value source)
2. ✅ Confirm environment variable exists in config files
3. ✅ **CHECK IF VARIABLES ARE ACTUALLY LOADED AT RUNTIME** ⭐ Key step
4. ✅ Verify variable value matches Vercel bypass key
5. ✅ Test with simple script to confirm loading

### 3. Test Environment Setup

**Best Practice**:

- Keep test environment variables in `.env` (Playwright's default)
- Copy required values from `.env.local`
- Document in comments why each variable is needed
- Ensure `.env` is in `.gitignore`

---

## Related Files

### Modified Files

- ✅ `/mnt/d/cursor/openmanager-vibe-v5/.env` (created)

### No Changes Required

- ✅ `tests/e2e/helpers/admin.ts` (implementation was already correct)
- ✅ `playwright.config.ts` (uses Playwright's default .env loading)
- ✅ `package.json` (test scripts work as-is)
- ✅ `.gitignore` (already includes .env)

---

## Status

**Resolution**: ✅ **COMPLETE**

**Evidence**:

- 7/7 basic smoke tests passing
- 1/1 admin authentication test passing
- Full admin workflow verified end-to-end
- API returning 200 OK instead of 403
- Bypass header successfully validated by Vercel

**Next Steps**:

- Monitor test stability in CI/CD
- Consider documenting this pattern for future projects
- Update test documentation with environment setup requirements

---

## References

- [Vercel Deployment Protection Documentation](https://vercel.com/docs/security/deployment-protection)
- [Vercel Protection Bypass for Automation](https://vercel.com/docs/security/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)
- [Playwright Environment Variables](https://playwright.dev/docs/test-configuration#environment-variables)
- Test Helper: `tests/e2e/helpers/admin.ts`
- Test Spec: `tests/e2e/admin-mode-pin-api-test.spec.ts`
