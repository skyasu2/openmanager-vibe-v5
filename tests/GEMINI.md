# GEMINI.md for `tests` directory

This directory contains all the test files for the project.

## Testing Frameworks:

- **Jest:** Used for unit and integration tests.
- **Playwright:** Used for end-to-end tests.

## Test File Naming Conventions:

- Unit tests: `*.test.ts` or `*.spec.ts`
- End-to-end tests: `*.e2e.ts`

## Running Tests:

- To run all tests: `npm test`
- To run unit tests: `npm run test:unit`
- To run end-to-end tests: `npm run test:e2e`

## Best Practices:

- Write clear and concise test descriptions.
- Ensure tests are isolated and do not depend on the order of execution.
- Mock external dependencies to ensure tests are fast and reliable.
- Aim for high code coverage, especially for critical paths.
