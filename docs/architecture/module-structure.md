---
id: module-structure
title: Module Structure
keywords: [architecture, modules, structure, features]
priority: high
ai_optimized: true
related_docs:
  - 'architecture/SYSTEM-ARCHITECTURE-CURRENT.md'
  - 'architecture/domain-driven-design.md'
updated: '2025-11-24'
---

# 🧩 Module Structure

The `src/modules` directory is used for feature-specific logic, shared utilities, and pluggable components that do not necessarily constitute a full "domain" or are cross-cutting concerns packaged as modules.

## 📂 `src/modules` Directory

Modules are functional units that provide specific capabilities to the application. They are often more focused on technical or specific functional features compared to the broader business domains.

### Current Modules

- **`advanced-features`**: Contains advanced or experimental features that can be toggled or selectively enabled.
- **`ai-agent`**: Logic related to autonomous AI agents or background tasks.
- **`data-generation`**: Tools and logic for generating mock data or simulation scenarios.
- **`performance-monitor`**: Components and logic for tracking and displaying system performance metrics.
- **`shared`**: Shared utilities and components used across multiple modules or domains.
- **`third-party-ai-chat`**: Integration logic for external AI chat providers.

### Module vs. Domain

| Feature        | Domain (`src/domains`)                                        | Module (`src/modules`)                                                         |
| :------------- | :------------------------------------------------------------ | :----------------------------------------------------------------------------- |
| **Scope**      | Broad business capability (e.g., User Management, AI Sidebar) | Specific feature or technical capability (e.g., Performance Monitor, Data Gen) |
| **Components** | Full vertical slice (UI, Logic, State)                        | Often logic-heavy or specific UI widgets                                       |
| **Coupling**   | Loosely coupled, high cohesion                                | Can be used by multiple domains or apps                                        |
| **Usage**      | Represents a major part of the user experience                | Provides tools or specific functionality                                       |

## 🏗️ Module Anatomy

A typical module might contain:

```
src/modules/[module-name]/
├── components/   # Module-specific UI
├── lib/          # Core logic and helper functions
├── store/        # State management (if needed)
└── index.ts      # Public API
```

## 🚀 Best Practices

- **Keep it Focused**: A module should do one thing well.
- **Reusability**: Design modules to be reusable where possible.
- **Clear Interface**: Use `index.ts` to define a clear boundary.
