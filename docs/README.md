---
id: docs-index
title: Documentation Index
keywords: [documentation, guide, index, navigation, cross-reference]
priority: critical
ai_optimized: true
related_docs:
  [
    'ai/workflow.md',
    'development/README.md',
    'testing/README.md',
    'performance/README.md',
    'meta/README.md',
    'troubleshooting/README.md',
  ]
updated: '2025-11-20'
---

# 📚 Documentation Index

This document is the master index for the project's documentation. The documentation is designed to be token-efficient and optimized for AI-assisted development workflows.

## 🚀 Quick Navigation

### 🏆 Core Guides

- **[🤖 AI Workflow](ai/workflow.md)**: The primary guide for the 4-AI cross-verification development workflow. **(Core Reading)**
- **[🚀 Development Environment](development/README.md)**: How to set up the WSL-based development environment, including Multi-AI tools and MCP servers. **(Setup Guide)**
- **[🏗️ System Architecture](architecture/SYSTEM-ARCHITECTURE-REVIEW.md)**: A high-level overview of the project's technical stack and architecture.
- **[🧩 UI Components](design/ui/components.md)**: Guide to the shadcn/ui component library.
- **[⚡ Performance](performance/README.md)**: Guidelines and reports on performance optimization.
- **[📊 Testing](testing/README.md)**: The project's testing strategy, including the 98.2% coverage goal and E2E automation.
- **[🔧 Common Issues](troubleshooting/common.md)**: A collection of solutions for common debugging scenarios.

### 🗄️ Key Technical References

- **[🌐 API Routes](architecture/api/routes.md)**: A complete reference for the 76+ API endpoints.
- **[📊 Database Schema](architecture/db/schema.md)**: The Supabase PostgreSQL database schema.
- **[🚀 Vercel Deployment](deploy/vercel.md)**: Guide to deploying the application to production on Vercel.
- **[🔒 Security Standards](security/README.md)**: Security protocols and best practices.
- **[✍️ Coding Standards](standards/README.md)**: TypeScript, Git, and file organization conventions.

## 🎯 AI Optimization Features

### 📋 Standardized YAML frontmatter

```yaml
---
id: unique-id
title: 'Document Title'
keywords: [key1, key2, key3]
priority: high|medium|low
ai_optimized: true
related_docs: ['category/doc1.md', 'category/doc2.md']
updated: '2025-09-09'
---
```

### 🔗 Cross-Reference System

- **15-char filenames** for quick reference
- **`related_docs`** field for connecting documents
- **Code-first examples** over lengthy explanations
- **Token-efficient structure** for AI processing
- **Workflow-based connections**: Document chains for specific development scenarios

## 🔄 Quick Commands

```bash
# Find documentation
grep -r "keyword" docs/

# Validate structure
npm run docs:validate

# Generate TOC
npm run docs:toc
```

## 🤖 AI Cross-Verification System

### 🚀 4-AI Integrated Collaboration System

**✅ Practical Solution Implemented** - Claude Max + Codex + Gemini + Qwen

#### 📊 3-Level System

- **Level 1** (Under 50 lines): Claude alone → Instant result
- **Level 2** (50-200 lines): Claude + Codex(GPT-5) → 30-60 seconds
- **Level 3** (Over 200 lines): Claude + Codex + Gemini + Qwen → 45-90 seconds

#### 🎯 AI Specializations (Weighted)

- **Codex CLI (0.99)**: Practical code review, bug detection
- **Gemini CLI (0.98)**: Architecture analysis, structural improvements
- **Qwen CLI (0.97)**: Performance optimization, algorithm analysis

## 🎲 Mock Simulation System

### 🎯 FNV-1a Hash-Based Server Metric Generation

**Replaces GCP VMs Entirely** - $57/month → $0 monthly cost + 300% improvement in AI analysis quality

#### 🔬 Core Architecture

- **Deterministic Metrics**: `Math.random()` replaced with FNV-1a hash for deterministic generation.
- **10 Server Types**: Specialized profiles for web (2), database (3), api (4), and cache (1).
- **15+ Failure Scenarios**: Simulates traffic spikes (15%), DDoS (3%), memory leaks (8%), etc.
- **CPU-Memory Correlation**: Realistic 0.6 coefficient.

#### 📊 Performance vs. GCP VMs

| Metric          | GCP VM (Old)    | Mock Simulation (Current)  | Savings/Gain |
| --------------- | --------------- | -------------------------- | ------------ |
| **Monthly Cost**| $57             | $0                         | 100% savings |
| **Stability**   | 99.5% (VM failures) | 99.95% (Code-based)        | 0.45% gain   |
| **Scalability** | 1 VM limit      | Unlimited server simulation| Unlimited    |
| **Response Time**| Unstable          | Consistent 272ms           | Stabilized   |
| **AI Analysis** | Simple metrics    | Failure scenarios + metadata | 300% better  |

#### 🛠️ Usage

```bash
# Run in mock mode
npm run dev:mock

# Check mock status
npm run mock:status

# Check free tier usage
npm run check:usage
```

---

**Status**: Documentation has been refactored and unified.
**Last Updated**: 2025-11-20
**AI Compatibility**: 100% token-optimized
