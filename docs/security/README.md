---
category: security
purpose: Security best practices and guidelines
ai_optimized: true
query_triggers:
  - 'Security'
  - 'API Keys'
  - 'Authentication'
  - 'Secrets Management'
  - 'RLS'
related_docs:
  - 'docs/architecture/SYSTEM-ARCHITECTURE-REVIEW.md'
  - 'docs/deploy/vercel.md'
last_updated: '2025-12-01'
---

# 🔒 Security Guidelines

This document outlines key security principles and best practices for the OpenManager VIBE project.

## Core Principles

1.  **Principle of Least Privilege**: Services and users should only have the minimum permissions required to perform their functions.
2.  **Defense in Depth**: Employ multiple layers of security controls.
3.  **Secure by Default**: Configure systems to be secure out-of-the-box.

## 🛡️ Data Security (RLS)

### Row Level Security (RLS)

All tables in Supabase must have RLS enabled.

- **Public Access**: Disabled by default.
- **Authenticated Access**: Users can only access their own data (`auth.uid() = user_id`).
- **Service Role**: Only used in secure server-side contexts (Edge Functions) for admin tasks.

### Authentication

- **Supabase Auth**: Handles all user authentication (JWT).
- **Next.js Middleware**: Protects routes (`/dashboard/*`) by verifying the session before rendering.

## Secrets Management

### 🚨 Never Pass Secrets as Command-Line Arguments

A critical security vulnerability was discovered and fixed where API keys and other secrets were being passed as command-line arguments to a server process (specifically, the `Context7` MCP server).

**The Problem:**
Passing secrets on the command line exposes them to other users on the system who can view the running process list (e.g., using `ps aux`).

```bash
# VULNERABLE PATTERN - DO NOT USE
node server.js --api-key="ctx7sk-aa497c7f-f6b0-46c4-9490-1bba844b4f13"
```

**The Solution:**
All secrets, API keys, and other sensitive configuration **must** be passed via environment variables. This prevents them from being exposed in the process list.

```bash
# SECURE PATTERN - USE THIS
export CONTEXT7_API_KEY="ctx7sk-aa497c7f-f6b0-46c4-9490-1bba844b4f13"
node server.js
```

This lesson was learned from the `mcp-improvement-analysis-report.md` (2025-09-20) and is a strict policy for all services in this project.

## File Permissions

Due to limitations of the WSL file system when interacting with Windows, some file permissions may appear overly permissive (e.g., `777`). While not ideal, the risk is considered low in the context of a local development environment. However, on any production Linux system, file permissions for sensitive files like `.env.local` should be set to `600`.
