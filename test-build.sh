#!/bin/bash

# Simulate GitHub Actions environment
export SKIP_ENV_VALIDATION=true

echo "Testing build with environment similar to GitHub Actions..."
echo "SKIP_ENV_VALIDATION=$SKIP_ENV_VALIDATION"

# Run the build
npm run build

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed"
    exit 1
fi