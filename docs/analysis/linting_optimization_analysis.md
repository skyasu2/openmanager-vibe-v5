# Linting Workflow Optimization Analysis

## 1. Current Status & Pain Points

### Current Setup

- **Tools**: ESLint (v9), Prettier (v3), Husky (v9), lint-staged (v15).
- **Workflow**:
  - **Pre-commit**: Runs `lint-staged` via Husky.
  - **Pre-push**: Runs `npm run validate` (Type Check + Lint).
- **Configuration**:
  - `eslint.config.mjs`: Supports `FAST_MODE` (skips type-checking) for speed.
  - `package.json`: Defines scripts for `lint`, `lint:fix`, `lint:fast`.

### Pain Points

1.  **Performance**: Linting is slow, causing delays in commits and pushes.
2.  **Stability**: Recurring OOM (Out of Memory) errors despite 8GB memory allocation.
3.  **Environment**: Windows/WSL hybrid environment causes encoding issues and file access slowness.
4.  **Developer Experience**: `pre-push` hooks are blocking and prone to failure, leading to frustration (e.g., bypassing with `--no-verify`).

## 2. Best Practices & Comparison

### Industry Standards (2025)

| Feature           | Current Setup (ESLint + Prettier)        | Modern Standard (Biome)                                |
| :---------------- | :--------------------------------------- | :----------------------------------------------------- |
| **Speed**         | Slow (Node.js, single-threaded)          | **Extremely Fast** (Rust, multi-threaded, ~25x faster) |
| **Memory**        | High usage (OOM risk)                    | **Low usage** (Efficient memory management)            |
| **Configuration** | Complex (multiple config files, plugins) | **Simple** (Single `biome.json`)                       |
| **Type Checking** | Slow (requires `typescript-eslint`)      | **None** (Relies on `tsc` separately)                  |
| **Ecosystem**     | Huge (thousands of plugins)              | Growing (covers 95% of common needs)                   |

### WSL Specifics

- **Filesystem**: Storing project files on the Windows mount (`/mnt/c`, `/mnt/d`) and accessing them from WSL is a **major performance bottleneck**.
- **Recommendation**: Move the project to the WSL root filesystem (`~/projects/...`) for near-native Linux performance.

## 3. Recommendations

### 🚀 Strategic: Migrate to Biome (Recommended)

Replacing ESLint and Prettier with **Biome** is the most effective way to solve performance and memory issues permanently.

- **Pros**: Instant linting/formatting, no OOM errors, simple config.
- **Cons**: Migration effort, loss of some niche ESLint rules.

### 🛠️ Immediate: Optimize Current Setup

If migrating to Biome is not immediately feasible, apply these optimizations:

1.  **Optimize `lint-staged`**:
    - Ensure it runs **concurrently** (default is true, but check config).
    - Use specific globs to avoid scanning unnecessary files.
    - **Critical**: Ensure `lint-staged` config uses `eslint --fix` and `prettier --write` efficiently.

2.  **Separate Concerns**:
    - **Pre-commit**: Run **only** Formatting (Prettier) and Fast Linting (ESLint without type-check).
    - **Pre-push**: Run Type Checking (`tsc`) and Full Linting.
    - **CI**: Run everything (Type Check, Lint, Test).

3.  **Environment Fix**:
    - **Move to WSL Root**: This is the single biggest performance upgrade for WSL users.
    - **Fix Wrappers**: Ensure scripts handle encoding (UTF-8) correctly to prevent `lint-staged` failures.

## 4. Proposed Action Plan

1.  **Short Term**:
    - Verify and optimize `lint-staged` configuration.
    - Enforce `FAST_MODE` in `pre-commit` hook.
    - Fix encoding issues in wrapper scripts.

2.  **Long Term**:
    - **Migrate to Biome**.
    - Move project to WSL filesystem.
