# GEMINI.md for `src` directory

This directory contains the main source code for the application. It's a Next.js application written in TypeScript.

## Key Principles:

- **Modularity:** Components and modules should be small, focused, and reusable.
- **Readability:** Code should be self-documenting where possible, with clear variable names and concise logic.
- **Performance:** Optimize for fast loading times and smooth user interactions.
- **Accessibility:** Ensure all UI components are accessible to users with disabilities.

## Important Subdirectories:

- `src/components/`: Reusable UI components.
- `src/pages/`: Next.js pages (routes).
- `src/utils/`: Utility functions and helpers.
- `src/types/`: TypeScript type definitions.
- `src/api/`: API routes and client-side API interactions.

## Coding Style:

- Adhere to the ESLint and Prettier configurations defined in the project root.
- Use functional components with React hooks.
- Prefer explicit typing over implicit typing.

## Testing:

- Unit tests for individual components and utility functions should be placed in `src/__tests__/` or alongside the component (e.g., `Component.test.tsx`).
- Integration tests should cover interactions between multiple components or API endpoints.
