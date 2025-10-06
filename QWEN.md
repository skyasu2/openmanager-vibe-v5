# QWEN.md

**Qwen Code CLI Guide** | Specialized Sub-Agent for WSL Development Environment with Claude Code Focus

## 🔷 Overview

**Qwen Code CLI** is a specialized AI tool for performance optimization and algorithm analysis that can be used as a **specialized sub-agent** during development processes primarily focused on **Claude Code in WSL environments**. It is typically used as a **supporting tool for Claude Code**, but can also be used **independently** in specific situations.

### 🇰🇷 Korean Language Usage Policy

- **Primary Language**: All conversations and outputs should be in Korean
- **Technical Terms**: English technical terms are allowed and encouraged when necessary
- **Project Context**: This policy applies when engaging in conversations or providing assistance

### 📊 2025 Benchmark Performance (Qwen 2.5 Coder v0.0.14)
- **HumanEval**: 88.4% (7B), 92.7% (32B) - Open-source leader
- **MBPP**: 84.5% - Python code generation specialized
- **Math**: 57.2% (32B) - Mathematical optimization
- **Open-source SOTA**: Best performance in same-size models
- **Plan Mode**: Safe code planning before execution

### Key Features

- **Advanced AI Model** - Efficient resource usage
- **Large Context Window** - Large codebase processing capabilities
- **Apache 2.0 Open Source** - Fully free and self-hostable
- **Integration with Claude Code** - Smooth collaboration in WSL environments
- **Independent Usage Possible** - Can be called directly when needed
- **Qwen-Coder Specialized Parser/Tool Support** - Specialized for coding tasks
- **Multi API Backend** - Various API endpoints available

## 🚀 Usage Methods (Combining Claude Code Collaboration and Independent Use)

### 🔄 **Calling Qwen as a Sub-Agent from Claude Code**

#### **1. Explicit Qwen Call in Claude Code** (For complex analysis)
```
# Requesting algorithm optimization or performance analysis from Qwen in Claude Code
"I've checked with Claude Code and think this part can be further optimized. Could you use the qwen-specialist sub-agent to analyze system performance optimization?"

"Please use the qwen-specialist sub-agent to suggest improvements to algorithm complexity. This is for performance verification of Claude Code's option A."
```

### 🔄 **Independent Direct Usage** (Direct call in specific situations)

#### **2. Direct CLI Usage in WSL Environment** (Independent analysis unrelated to Claude Code)
```bash
# For independent performance analysis in WSL
qwen -p "What is the time complexity of this function?"
timeout 60 qwen -p "Methods of optimizing memory usage"

# For specific algorithm analysis unrelated to Claude Code work
qwen -p "Please analyze the BigO complexity of this algorithm"

# For direct algorithm optimization requests for specific problems
qwen -p "How to improve the search performance of BST?"
```

### Main Usage Scenarios

1. **Performance Optimization** - Analysis of Claude Code's Option A and independent algorithm improvements
2. **Mathematical Complexity** - BigO analysis and optimization proposals (Claude Code code or independent analysis)
3. **Memory Management** - Memory leak and usage optimization analysis
4. **AI Cross-Verification** - Independent verification from performance perspective of Claude Code's Option A
5. **Independent Algorithm Analysis** - Solving specific algorithm problems without Claude Code

## 📊 Free Tier Limits

| Item | Limit | Notes |
| ---- | ----- | ----- |
| **Daily Requests** | 2,000/day | Sufficient daily usage |
| **Per Minute Limit** | 60/minute | Parallel processing possible |
| **Token Limit** | 256K (default) | Up to 1M expandable |
| **Concurrent Sessions** | 10 | Parallel jobs supported |

## 💻 Installation and Execution

### WSL Environment Installation

```bash
# Install in WSL (recommended)
wsl
npm install -g @qwen-code/qwen-code

# Check current installed Qwen CLI version
qwen --version

# Update to latest version
npm update -g @qwen-code/qwen-code

# Or clone from GitHub (inside WSL)
wsl
git clone https://github.com/QwenLM/qwen-code
cd qwen-code && npm install
```

### Environment Setup

```bash
# Create .env file
QWEN_API_KEY=your_api_key  # Optional
QWEN_ENDPOINT=https://api.qwen.alibaba.com  # Or local
QWEN_MODEL=qwen3  # Model selection
```

## 🎯 Claude-Centric Development Strategy with Independent Qwen Analysis

### Claude Code + Qwen Collaboration Pattern

```typescript
// 1. Claude Code: Main architecture design and core logic implementation
const mainSystem = await claudeCode.design();

// 2. Qwen: Analysis and supplementation of Claude Code's decisions
const performanceAnalysis = await qwenCode.analyze('mainSystem performance');
const algorithmOptimization = await qwenCode.optimize('criticalPath algorithm');

// 3. Claude Code: Final decision and integration based on Qwen's analysis
const integrated = await claudeCode.integrate([mainSystem, algorithmOptimization]);
```

### Qwen's Independent Usage Patterns

```typescript
// 1. Independent analysis for specific algorithm problems (without Claude Code)
const algorithmSolution = await qwenCode.solve('graph traversal optimization');

// 2. Independent diagnosis of performance bottlenecks
const bottleneckAnalysis = await qwenCode.analyze('performance bottleneck in data processing');
```

### Practical Usage Examples (Claude Code Centric + Independent Qwen Usage in WSL Environment)

```bash
# Performance analysis of systems proposed in Claude Code (using Qwen sub-agent)
qwen-code analyze --type "performance-review" \
  --target "src/system/mainSystem.ts" \
  --context "Performance verification of Claude Code's Option A"

# Specific algorithm optimization request during Claude Code development
qwen-code optimize --algorithm "criticalPath" \
  --from "Claude Code's proposal A" \
  --output "src/optimizations/criticalPath-optimization.md"

# Cross-verification through Qwen (Performance analysis of Claude Code's Option A)
qwen-code verify --solution "Claude Code's Option A" \
  --metrics "time complexity, space complexity" \
  --report "performance-verification-report.md"

# Independent algorithm analysis (direct usage without Claude Code)
qwen-code analyze --algorithm "binary search tree optimization" \
  --context "independent analysis" \
  --output "src/analysis/bst-optimization.md"
```

## ⚠️ Zero Tolerance Policy for Chinese Characters and Hanja

### Project Rules (Strictly Enforced)

```javascript
// Automatic check of all Qwen outputs (for Chinese characters and Hanja)
const CHINESE_HANJA_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\u31f0-\u31ff\u3200-\u32ff]/g;

function validateQwenOutput(output) {
  if (CHINESE_HANJA_REGEX.test(output)) {
    throw new Error("Chinese characters or Hanja detected! Converting to English/Korean...");
  }
  return output;
}

// package.json script
"check:chinese-hanja": "node scripts/check-chinese-hanja-characters.js"
```

### 🇰🇷 English First Principle (with Korean when needed)

1. **All outputs written in English or Korean only**
2. **Chinese characters, Hanja, Japanese, and other languages strictly forbidden**
3. **Technology terms allowed in English** (e.g., API, UI, CLI, etc.)
4. **English is the primary language, with Korean used only when necessary**

## 🔧 Advanced Features

### Agentic Coding Specialization

1. **Automatic Codebase Understanding** - Immediate grasp of project structure
2. **Pattern Recognition and Application** - Automatic compliance with existing code styles
3. **Automatic Dependency Resolution** - Auto-manage import/export
4. **Automatic Document Generation** - Automatic JSDoc, README generation

### Team Collaboration Scenarios

```bash
# Frontend team: UI/UX development with Claude
claude-code "Design user authentication system and implement core logic"

# Backend team: API and service development with Qwen
qwen-code "Develop email notification service module independently"

# DevOps team: Infrastructure and deployment automation with Gemini
gemini-cli "Entire codebase performance optimization and bundle size analysis"

# Integration and testing
claude-code "Integrate developed modules and execute E2E tests"
```

### Parallel Job Optimization

```bash
# Multiple jobs executed simultaneously
qwen-code batch --tasks "
  - create: auth service
  - refactor: database layer
  - optimize: API endpoints
  - generate: unit tests
" --parallel --max-workers 4
```

## 🤝 Claude Code-Centric Collaboration

### Claude Code (Main Developer - WSL Environment)

- Complete architecture design
- Core business logic implementation
- System integration and final coordination
- Final decision making

### Qwen Code (Specialized Sub-Agent)

- Performance analysis of Claude Code's Option A
- Algorithm complexity verification and optimization proposals
- Code quality verification and supplementation
- Cross-verification implementation

### Gemini CLI (Large-Scale Analysis Tool)

- Complete codebase analysis
- Large-scale refactoring advice
- Google service integration

## 📊 Competitive Advantages

| Aspect | Qwen Strength | Usage Method |
| ------ | -------------- | ------------ |
| **Cost** | Fully open source and free | 0 API cost |
| **Privacy** | Local execution possible | Secure sensitive code |
| **Speed** | Parallel processing optimized | 70% faster development |
| **Customization** | Source modification possible | Team-specific configuration |

## 🚦 Usage Guidelines in Claude-Centric Development Environment

### DO ✅

- Use when explicitly requested as "Please analyze with Qwen" in Claude Code
- Use for performance/efficiency verification of Claude Code's decisions
- Use in conjunction with Claude Code in WSL environment
- Use as a third-party perspective for validating Claude Code's Option A
- Use for algorithm optimization and mathematical complexity analysis

### DON'T ❌

- Don't automatically call Qwen without Claude Code
- Main architecture design to be done only with Claude Code
- Don't use in directions that contradict Claude Code's main decisions
- Absolutely no Chinese output allowed
- Be careful not to exceed free tier limits

## 📈 Real-World Performance

### Performance Monitoring Module Development Case

- **Development time**: As per actual usage
- **Lines of code**: As per actual usage
- **Number of files**: As per actual usage
- **Quality**: TypeScript 100%, ESLint 0 errors

## 🤖 AI Cross-Verification in Claude-Centric Development Environment 

### 🎯 Qwen's Role in Claude-Centric Workflow

**Role**: Specialized supporting tool for performance optimization and algorithm analysis of Claude Code's decisions (Validated at 9.17/10 approval rating for cross-verification in WSL environment)

#### **Explicit Qwen Call in Claude Code**
```
# Complex performance analysis (Based on Claude Code's Option A)
"I think Claude Code could optimize the algorithm performance of this part. Could you use the qwen-specialist sub-agent to analyze it?"

# Cross-verification request for Claude Code's Option A
"Please use the qwen-specialist sub-agent to verify the performance and efficiency of my Option A. This is needed for performance optimization in the WSL environment."
```

#### **Direct CLI Method in WSL Environment**
```bash
# Simple performance question during Claude Code work
qwen -p "What is the time complexity of this algorithm?"
timeout 120 qwen -p "Methods of memory optimization"
```

### 📊 Qwen Cross-Verification Characteristics (In Claude-Centric Environment)

- **⚡ Algorithm Optimization**: Specialized in performance analysis and improvement suggestions for Claude Code's Option A
- **🔍 Third-Party Perspective**: Finding efficiency issues Claude Code might miss
- **🆓 Free Verification**: Cost savings on cross-verification with 2,000/day limit
- **📈 Independent Analysis**: Providing objective improvement points for Claude Code's Option A

### 🔄 Claude Code-Led Decision Flow

1. **Claude Code**: Present Option A (solution) for the problem
2. **Qwen Sub-Agent**: Algorithm efficiency analysis and optimization proposal for Option A
3. **Claude Code**: Review Qwen's improvement points and decide to accept/reject
4. **Claude Code**: Implement with final decision rationale

## 🔮 Future Plans

1. **AI Cross-Verification Enhancement** - v5.0 automation system
2. **GitHub Actions Integration** - CI/CD automation
3. **VS Code Extension** - Direct IDE integration
4. **Team Collaboration Features** - Real-time code sharing
5. **AI Model Upgrade** - More powerful performance

## 📚 References

- [Qwen Official Documentation](https://github.com/QwenLM/qwen-code)
- [Parallel Development Guide](./docs/ai-tools/qwen-cli-guide.md)
- [AI Tools Comparison](./docs/ai-tools/ai-tools-comparison.md)

---

**⚡ Zero Tolerance for Chinese Characters**  
**🚀 Efficient Collaboration Focused on Claude Code**  
**💰 100% Free Open Source**

_Last Updated: 2024-10-04_