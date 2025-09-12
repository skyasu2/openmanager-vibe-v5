#!/usr/bin/env bash
set -euo pipefail

echo "=== WSL Environment Check ==="

echo "[SYSTEM]"
uname -a || true
cat /proc/version 2>/dev/null | head -n 1 || true
echo

echo "[DISTRO]"
if command -v lsb_release >/dev/null 2>&1; then
  lsb_release -a || true
else
  cat /etc/os-release 2>/dev/null || true
fi
echo

echo "[LOCALE]"
echo "LANG=${LANG:-}"
echo "LC_ALL=${LC_ALL:-}"
echo "LC_CTYPE=${LC_CTYPE:-}"
locale 2>/dev/null | sed -n '1,20p' || true
echo

echo "[SHELL PROFILE (duplicates check)]"
for f in "$HOME/.bashrc" "$HOME/.zshrc"; do
  if [ -f "$f" ]; then
    echo "- $f"
    grep -nE '^(export )?(LANG|LC_ALL|LC_CTYPE|PYTHONIOENCODING|NODE_OPTIONS)=' "$f" || echo "  (no related exports)"
  fi
done
echo

echo "[NODE & NPM]"
which node || true
node -v || true
npm -v || true
echo "npm prefix (global): $(npm config get prefix 2>/dev/null || echo '-')"
echo "npm root   (global): $(npm root -g 2>/dev/null || echo '-')"
echo "PATH contains npm-global/bin: $(echo "$PATH" | grep -q "\.npm-global/bin" && echo yes || echo no)"
echo "NODE_OPTIONS=${NODE_OPTIONS:-}"
echo

echo "[CLAUDE CODE & OTHER AI CLI]"
if command -v claude >/dev/null 2>&1; then
  echo "claude path: $(command -v claude)"
  claude --version || true
  npm ls -g @anthropic-ai/claude-code --depth=0 2>/dev/null || true
else
  echo "claude: not found"
fi

if command -v ccusage >/dev/null 2>&1; then
  ccusage --version || true
fi

if command -v gemini >/dev/null 2>&1; then
  gemini --version || true
fi

if command -v qwen >/dev/null 2>&1; then
  qwen --version || true
fi
echo

echo "[RIPGREP]"
rg --version 2>/dev/null || echo "rg (ripgrep) not found"
echo

echo "[GIT NEWLINE SETTINGS]"
git config --global core.autocrlf || echo "(unset)"
git config --global core.eol || echo "(unset)"
echo

echo "[WSL CONFIG]"
if [ -f /etc/wsl.conf ]; then
  echo "/etc/wsl.conf present:"
  sed -n '1,120p' /etc/wsl.conf
else
  echo "/etc/wsl.conf not found"
fi
echo

echo "[SYSTEMD-RESOLVED]"
if command -v systemd-resolve >/dev/null 2>&1; then
  systemd-resolve --status | sed -n '1,60p' || true
else
  echo "systemd-resolve not found (OK on some distros)"
fi
echo

echo "[DNS FILES]"
for f in /etc/resolv.conf /etc/systemd/resolved.conf; do
  if [ -f "$f" ]; then
    echo "- $f"; sed -n '1,60p' "$f"; echo
  fi
done
echo

echo "[PROJECT .claude STATUS]"
if [ -d .claude ]; then
  echo ".claude exists in project. Listing JSON files:"
  ls -1 .claude/*.json 2>/dev/null || echo "(none)"
else
  echo ".claude dir not found in current project"
fi
echo

echo "=== End of WSL Environment Check ==="

