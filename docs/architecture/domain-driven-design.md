---
id: domain-driven-design
title: Domain-Driven Design (DDD) Structure
keywords: [architecture, ddd, domains, structure]
priority: high
ai_optimized: true
related_docs:
  - 'architecture/SYSTEM-ARCHITECTURE-CURRENT.md'
  - 'architecture/module-structure.md'
updated: '2025-11-24'
---

# 🏛️ Domain-Driven Design (DDD) Structure

OpenManager VIBE v5 adopts a pragmatic Domain-Driven Design (DDD) approach to organize complex business logic and UI components. This structure helps in maintaining separation of concerns and scalability.

## 📂 `src/domains` Directory

The `src/domains` directory contains self-contained business domains. Each domain encapsulates its own logic, state, and UI, exposing only what is necessary to the rest of the application.

### Structure of a Domain

Taking `ai-sidebar` as a reference implementation, a typical domain folder structure looks like this:

```
src/domains/[domain-name]/
├── components/           # Domain-specific React components
├── hooks/                # Custom hooks for domain logic
├── services/             # Business logic and API interactions
├── types/                # TypeScript type definitions
├── utils/                # Helper functions specific to the domain
└── index.ts              # Public API of the domain (exports)
```

### Key Principles

1.  **Encapsulation**: Internal details of a domain should not leak out. Use `index.ts` to explicitly export only the components and functions that other parts of the app need to use.
2.  **Cohesion**: All code related to a specific business capability (e.g., the AI Sidebar) stays together. This makes it easier to understand and modify features without jumping between disparate folders.
3.  **Independence**: Domains should ideally be loosely coupled. If one domain needs to interact with another, it should do so through well-defined interfaces or shared services/state.

## 🌟 Example: AI Sidebar Domain

The `ai-sidebar` domain handles the AI chat interface and interaction logic.

- **components**: Contains UI elements like `AISidebarV3`, `ChatMessage`, `InputArea`.
- **hooks**: Contains logic for managing chat state, e.g., `useChatHistory`, `useAIStream`.
- **services**: Handles communication with the AI backend APIs.
- **types**: Defines interfaces for `Message`, `Conversation`, `AIResponse`.

## 🔄 Migration to DDD

We are gradually migrating core features to this structure. New major features should be implemented as domains if they represent a distinct business capability.
