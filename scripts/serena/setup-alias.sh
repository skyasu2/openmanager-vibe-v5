#!/bin/bash

# Serena MCP alias 설정 스크립트

echo "Setting up Serena MCP optimized startup alias..."

# bashrc에 alias 추가
if ! grep -q "alias serena-start" ~/.bashrc 2>/dev/null; then
    echo "" >> ~/.bashrc
    echo "# Serena MCP optimized startup" >> ~/.bashrc
    echo "alias serena-start='python3 ~/.serena/startup_wrapper.py'" >> ~/.bashrc
    echo "✓ Added serena-start alias to ~/.bashrc"
else
    echo "✓ serena-start alias already exists"
fi

# zshrc에도 추가 (zsh 사용자용)
if [ -f ~/.zshrc ]; then
    if ! grep -q "alias serena-start" ~/.zshrc 2>/dev/null; then
        echo "" >> ~/.zshrc
        echo "# Serena MCP optimized startup" >> ~/.zshrc
        echo "alias serena-start='python3 ~/.serena/startup_wrapper.py'" >> ~/.zshrc
        echo "✓ Added serena-start alias to ~/.zshrc"
    else
        echo "✓ serena-start alias already exists in ~/.zshrc"
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To use the optimized startup:"
echo "  1. Reload your shell: source ~/.bashrc"
echo "  2. Run: serena-start"
echo ""
echo "This provides a cleaner, more informative startup compared to the default verbose output."