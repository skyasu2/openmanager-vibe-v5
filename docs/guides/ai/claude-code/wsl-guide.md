# Claude Code in WSL Best Practices

This guide outlines the optimal setup and best practices for using **Claude Code** within the Windows Subsystem for Linux (WSL).

## 🚀 Key Takeaways (Performance Critical)

> [!IMPORTANT]
> **1. File System Location**
> ALWAYS store your project files in the Linux file system (e.g., `~/projects/`), **NEVER** in the mounted Windows file system (`/mnt/c/`).
> * **Linux FS**: Blazing fast disk I/O (required for AI analysis).
> * **Windows Mount**: 10-20x slower, causing timeouts and sluggish AI responses.

> [!TIP]
> **2. Resource Allocation**
> Ensure `.wslconfig` provides enough memory (16GB+) for Claude Code's extensive context processing.
> * See [WSL Best Practices](../../best-practices/wsl-vibe-coding-best-practices.md) for configuration details.

---

## 🛠️ Installation & Setup

### 1. Prerequisites
* **WSL 2**: Ubuntu 22.04 LTS or later recommended.
* **Node.js**: Version 18+ (LTS). Use `nvm` to manage versions to avoid permission issues.
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    nvm install --lts
    ```
* **npm**: Version 10.x+.

### 2. Install Claude Code
Run the installation command **inside your WSL terminal**:

```bash
npm install -g @anthropic-ai/claude-code
# Verify installation
claude --version
```

### 3. Authentication
Authenticate directly from WSL. This will open your default browser in Windows for login.
```bash
claude login
```

---

## 💻 Development Workflow

### VS Code Integration
1. Install the **WSL** extension in VS Code on Windows.
2. Open your project directory in WSL:
    ```bash
    cd ~/projects/my-app
    code .
    ```
3. Use the VS Code integrated terminal (WSL) to run `claude` commands.

### Performance Optimization Checklist
* [x] **Project Location**: Confirmed inside `~/` (not `/mnt/c/`).
* [x] **Network**: 'Mirrored' mode enabled in `.wslconfig` (fixes VPN/proxy issues).
* [x] **Memory**: Allocated sufficient RAM (e.g., `memory=16GB` in `.wslconfig`).
* [x] **Node Modules**: `node_modules` must be installed inside WSL (do not share with Windows).

## 🛑 Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Slow Performance** | Files in `/mnt/c/...` | Move project to `~/...` inside WSL. |
| **Permission EACCES** | Global npm install needing root | Use `nvm` to manage Node.js without sudo. |
| **Network Timeout** | VPN or Firewall | Enable `networkingMode=mirrored` in `.wslconfig`. |
| **Browser Not Opening** | `wslview` missing | Install `wslu`: `sudo apt install wslu`. |

## 📚 Related Documentation
* [WSL Best Practices](../../best-practices/wsl-vibe-coding-best-practices.md): System-level tuning.
* [Official Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code)
