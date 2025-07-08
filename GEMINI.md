# GEMINI.md

This file is used to provide context and instructions to the Gemini AI.

## Purpose

- **Context:** Describe the purpose and overall architecture of this project or directory.
- **Instructions:** Provide specific guidelines for Gemini when interacting with files in this directory, such as preferred coding styles, testing methodologies, or common pitfalls to avoid.
- **Key Information:** Highlight important files, configurations, or dependencies.

## Usage

- Place `GEMINI.md` files in any directory where you want to provide specific context or instructions for Gemini.
- Gemini will read the `GEMINI.md` file in the current working directory and any parent directories to gather relevant information.

## Example Content

```markdown
# My Project Root

This project is a Next.js application with a Node.js backend. We use TypeScript for all our code.

## Coding Style

- Prefer functional components for React.
- Use `const` over `let` where possible.
- Follow Airbnb style guide.

## Testing

- All new features require unit tests.
- Use Jest for unit testing and Playwright for end-to-end tests.

## Important Files

- `src/` - Contains all application source code.
- `public/` - Static assets.
- `next.config.mjs` - Next.js configuration.
```
