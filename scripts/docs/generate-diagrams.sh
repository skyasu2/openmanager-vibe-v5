#!/bin/bash
# scripts/generate-diagrams.sh

# Define possible paths for mmdc
PATHS=(
    "$HOME/.npm-global/bin/mmdc"
    "/usr/local/bin/mmdc"
    "$(which mmdc 2>/dev/null)"
)

MMDC=""

# Find the first valid mmdc executable
for path in "${PATHS[@]}"; do
    if [ -n "$path" ] && [ -f "$path" ] && [ -x "$path" ]; then
        MMDC="$path"
        break
    fi
done

if [ -z "$MMDC" ]; then
    echo "❌ Mermaid CLI (mmdc) not found."
    echo "Please install it globally: npm install -g @mermaid-js/mermaid-cli"
    echo "Or ensure it is in your PATH."
    exit 1
fi

echo "🎨 Using Mermaid CLI at: $MMDC"

# Function to generate diagram
generate() {
    local input="$1"
    local output="${input%.*}.png"
    
    if [ -f "$input" ]; then
        echo "Generating $output..."
        "$MMDC" -i "$input" -o "$output"
    else
        echo "⚠️ Input file not found: $input"
    fi
}

# Check if arguments are provided
if [ "$#" -gt 0 ]; then
    # Process provided files
    for file in "$@"; do
        generate "$file"
    done
else
    # Default: Find all .mmd files in docs/ and generate pngs
    echo "🔍 Searching for .mmd files in docs/..."
    find docs -name "*.mmd" | while read -r file; do
        generate "$file"
    done
fi

echo "✅ Done!"
