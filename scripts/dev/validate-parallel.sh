#!/bin/bash

# Parallel Validation Script
# Runs Type Check and Lint in parallel to save time

echo "🚀 Starting Parallel Validation (Type Check + Lint)..."
start_time=$(date +%s)

# Function to run type check
run_type_check() {
  echo "typescript..."
  npm run type-check > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ TypeScript Passed"
    return 0
  else
    echo "❌ TypeScript Failed"
    npm run type-check # Run again to show output
    return 1
  fi
}

# Function to run lint (Biome)
run_lint() {
  echo "biome..."
  npm run lint:quick > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ Biome Passed"
    return 0
  else
    echo "❌ Biome Failed"
    npm run lint:quick # Run again to show output
    return 1
  fi
}

# Run in parallel
run_type_check &
PID_TYPE=$!

run_lint &
PID_LINT=$!

# Wait for both
wait $PID_TYPE
STATUS_TYPE=$?

wait $PID_LINT
STATUS_LINT=$?

end_time=$(date +%s)
duration=$((end_time - start_time))

if [ $STATUS_TYPE -eq 0 ] && [ $STATUS_LINT -eq 0 ]; then
  echo "🎉 Validation Successful in ${duration}s"
  exit 0
else
  echo "💥 Validation Failed in ${duration}s"
  exit 1
fi
