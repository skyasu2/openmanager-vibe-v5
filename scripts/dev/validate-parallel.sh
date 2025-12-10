#!/bin/bash

# Parallel Validation Script
# Runs Type Check and Lint in parallel to save time
# QUICK_PUSH mode: TypeScript only (lint skipped for speed)

echo "🚀 Starting Parallel Validation..."
start_time=$(date +%s)

# Check if QUICK_PUSH is enabled (lint will be skipped)
SKIP_LINT="${SKIP_LINT:-${QUICK_PUSH:-false}}"

# Function to run type check
run_type_check() {
  echo "  📘 TypeScript..."
  npm run type-check > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "  ✅ TypeScript Passed"
    return 0
  else
    echo "  ❌ TypeScript Failed"
    npm run type-check # Run again to show output
    return 1
  fi
}

# Function to run lint (Biome)
run_lint() {
  echo "  🔍 Biome..."
  npm run lint:quick > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "  ✅ Biome Passed"
    return 0
  else
    echo "  ❌ Biome Failed"
    npm run lint:quick # Run again to show output
    return 1
  fi
}

# Run type check (always required)
run_type_check &
PID_TYPE=$!

# Run lint only if not skipped
if [ "$SKIP_LINT" = "true" ]; then
  echo "  ⚪ Biome lint skipped (QUICK_PUSH mode)"
  STATUS_LINT=0
else
  run_lint &
  PID_LINT=$!
fi

# Wait for type check
wait $PID_TYPE
STATUS_TYPE=$?

# Wait for lint if it was started
if [ "$SKIP_LINT" != "true" ]; then
  wait $PID_LINT
  STATUS_LINT=$?
fi

end_time=$(date +%s)
duration=$((end_time - start_time))

if [ $STATUS_TYPE -eq 0 ] && [ $STATUS_LINT -eq 0 ]; then
  echo "🎉 Validation Successful in ${duration}s"
  exit 0
else
  echo "💥 Validation Failed in ${duration}s"
  exit 1
fi
