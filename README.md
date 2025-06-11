# 🚀 OpenManager Vibe v5

<div align="center">

![OpenManager Logo](https://img.shields.io/badge/OpenManager-v5.43.4-blue?style=for-the-badge&logo=nextdotjs)
![AI Powered](https://img.shields.io/badge/AI%20Powered-Gemini%201.5%20Flash-green?style=for-the-badge&logo=google)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**🧠 AI-Driven Server Monitoring & Management Platform**

_Built with Next.js 15, TypeScript, and Google AI Studio_

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🔧 Installation](#-installation) • [💡 Features](#-features) • [🤝 Contributing](#-contributing)

</div>

---

## ✨ What is OpenManager Vibe v5?

OpenManager Vibe v5는 **AI 기반 서버 모니터링 및 관리 플랫폼**입니다. Google AI Studio (Gemini)와 MCP(Model Context Protocol)를 활용하여 지능적인 서버 분석과 자동화된 운영 관리를 제공합니다.

### 🎯 핵심 특징

- **🧠 AI 기반 분석**: Gemini 1.5 Flash로 서버 상태 지능 분석
- **🔄 실시간 모니터링**: WebSocket 기반 실시간 데이터 업데이트
- **🤖 자동화**: MCP 프로토콜 기반 자동 서버 관리
- **📊 시각화**: 직관적인 대시보드와 차트
- **🔒 보안**: 강화된 보안 체계와 에러 핸들링
- **⚡ 성능**: 최적화된 Next.js 15 기반 고성능 웹앱

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js**: 18.0+
- **npm**: 9.0+
- **Google AI Studio API Key**: [Get yours here](https://aistudio.google.com/)

### ⚡ Installation

```bash
# Clone the repository
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# Install dependencies
npm install

# Set up environment variables
cp vercel.env.template .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

### 🔧 MCP Setup (Optional)

```bash
# Quick MCP setup
npm run mcp:perfect:setup

# Start MCP servers
npm run mcp:dev
```

**🎉 That's it!** Open [http://localhost:3000](http://localhost:3000) to see your dashboard.

---

## 💡 Features

<table>
<tr>
<td width="50%">

### 🧠 AI Analytics

- **Smart Server Analysis**: AI-powered insights
- **Predictive Monitoring**: Anomaly detection
- **Natural Language Queries**: Ask questions in Korean/English
- **Automated Recommendations**: AI-suggested optimizations

</td>
<td width="50%">

### 📊 Dashboard & Monitoring

- **Real-time Metrics**: Live server statistics
- **Interactive Charts**: Beautiful data visualization
- **Custom Alerts**: Configurable notifications
- **Multi-server Support**: Manage multiple servers

</td>
</tr>
<tr>
<td width="50%">

### 🔧 Automation & Management

- **MCP Integration**: Model Context Protocol support
- **Auto-scaling**: Dynamic resource management
- **Backup Management**: Automated backup scheduling
- **Health Checks**: Continuous system monitoring

</td>
<td width="50%">

### 🚀 Performance & Security

- **Next.js 15**: Latest React features
- **TypeScript**: Type-safe development
- **Edge Runtime**: Optimized for Vercel
- **Security Headers**: Enhanced security configuration

</td>
</tr>
</table>

---

## 📖 Documentation

### 🚀 Getting Started

- [🔧 Installation Guide](docs/INSTALLATION.md) - Detailed setup instructions
- [⚡ Quick Start](docs/QUICK_START.md) - Get running in 5 minutes
- [🤖 AI Setup](docs/AI_SETUP.md) - Google AI Studio configuration

### 🏗️ Development

- [🛠️ Development Guide](docs/DEVELOPMENT.md) - Development workflow
- [🧪 Testing](docs/TESTING.md) - Testing strategies
- [🏗️ Architecture](docs/ARCHITECTURE.md) - System design overview

### 🚀 Deployment

- [☁️ Vercel Deployment](docs/DEPLOYMENT.md) - Production deployment
- [📊 Monitoring](docs/MONITORING.md) - Production monitoring setup

### 🔧 API Reference

- [📚 API Documentation](docs/API.md) - Complete API reference

---

## 🛠️ Tech Stack

<div align="center">

| Category       | Technologies                                      |
| -------------- | ------------------------------------------------- |
| **Frontend**   | Next.js 15, React 19, TypeScript, Tailwind CSS    |
| **Backend**    | Next.js API Routes, Edge Runtime                  |
| **AI/ML**      | Google AI Studio (Gemini 1.5 Flash), MCP Protocol |
| **Database**   | Supabase (PostgreSQL), Redis (Upstash)            |
| **Deployment** | Vercel, Docker                                    |
| **Monitoring** | Custom Dashboard, Prometheus metrics              |

</div>

---

## 📊 Project Status

<div align="center">

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-35/35%20Passing-green?style=flat-square)
![Coverage](https://img.shields.io/badge/Coverage-85%25-yellow?style=flat-square)
![Performance](https://img.shields.io/badge/Lighthouse-98/100-brightgreen?style=flat-square)

**Current Version**: v5.43.4 | **Last Updated**: 2025-01-31

</div>

### 🎯 Development Progress

- ✅ AI Engine Architecture Complete
- ✅ Real-time Dashboard Implementation
- ✅ MCP Integration
- ✅ Security Enhancements
- ✅ Performance Optimizations
- 🔄 Advanced Analytics (In Progress)
- 📋 Mobile App (Planned)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### 🚀 Development Workflow

```bash
# Fork the repository
git fork https://github.com/your-username/openmanager-vibe-v5.git

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes
npm run validate:all  # Run tests and linting

# Commit your changes
git commit -m 'feat: add amazing feature'

# Push to your fork
git push origin feature/amazing-feature

# Create a Pull Request
```

### 🧪 Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run linting
npm run lint

# Full validation
npm run validate:all
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google AI Studio** for powerful AI capabilities
- **Vercel** for amazing deployment experience
- **Next.js Team** for the incredible framework
- **Open Source Community** for inspiration and tools

---

<div align="center">

**⭐ If you find this project helpful, please consider giving it a star!**

[⬆ Back to Top](#-openmanager-vibe-v5)

</div>
