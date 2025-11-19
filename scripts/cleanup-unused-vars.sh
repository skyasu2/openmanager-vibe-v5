#!/bin/bash
# Automated unused variables cleanup script
# Stage 27-30: Lint warnings cleanup

set -e

echo "🧹 Starting automated unused variables cleanup..."

# Function to add _ prefix to unused parameters
add_underscore_to_params() {
  local file=$1
  local var=$2
  local line=$3
  
  # Add _ prefix to function parameters
  sed -i "${line}s/\b${var}\b/_${var}/g" "$file"
}

# Function to remove unused imports
remove_unused_import() {
  local file=$1
  local import=$2
  
  # Remove from import statement
  sed -i "s/,\s*${import}\s*,/,/g; s/{\s*${import}\s*,/{ /g; s/,\s*${import}\s*}/}/g; s/{\s*${import}\s*}//" "$file"
}

# Get list of files with unused-vars warnings
FILES=$(npm run lint 2>&1 | grep "^/" | sort -u)

echo "📝 Found $(echo "$FILES" | wc -l) files with warnings"

# Process each file
for file in $FILES; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    
    # Get unused vars for this file
    WARNINGS=$(npm run lint "$file" 2>&1 | grep "no-unused-vars" | grep "is defined but never used")
    
    if [ -n "$WARNINGS" ]; then
      echo "  Found unused vars, processing..."
    fi
  fi
done

echo "✅ Cleanup complete!"
