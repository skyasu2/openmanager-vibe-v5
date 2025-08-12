#!/usr/bin/env node

/**
 * 🚀 번들 크기 최적화 자동화 스크립트
 * 1.1MB → 250KB 목표 달성을 위한 자동 최적화
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BundleOptimizer {
  constructor() {
    this.rootDir = process.cwd();
    this.backupDir = path.join(this.rootDir, 'backup-bundle-optimization');
    this.optimizations = [];
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[Bundle Optimizer] ${message}${colors.reset}`);
  }

  async createBackup() {
    this.log('Creating backup...');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const filesToBackup = [
      'package.json',
      'next.config.mjs',
      'tailwind.config.js',
      'src/app/main/page.tsx'
    ];

    for (const file of filesToBackup) {
      if (fs.existsSync(file)) {
        const backupPath = path.join(this.backupDir, file.replace('/', '_'));
        fs.copyFileSync(file, backupPath);
        this.log(`Backed up: ${file}`);
      }
    }
  }

  async optimizePackageJson() {
    this.log('Optimizing package.json dependencies...');
    
    const packageJsonPath = path.join(this.rootDir, 'package.json');
    const optimizedPath = path.join(this.rootDir, 'package.optimized.json');
    
    if (fs.existsSync(optimizedPath)) {
      // 현재 package.json과 비교하여 중요한 의존성 유지
      const current = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const optimized = JSON.parse(fs.readFileSync(optimizedPath, 'utf8'));
      
      // 중요한 의존성 보존
      const criticalDeps = [
        '@supabase/supabase-js',
        '@supabase/ssr',
        'next',
        'react',
        'react-dom',
      ];
      
      for (const dep of criticalDeps) {
        if (current.dependencies[dep]) {
          optimized.dependencies[dep] = current.dependencies[dep];
        }
      }
      
      // scripts 섹션 보존
      optimized.scripts = { ...optimized.scripts, ...current.scripts };
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(optimized, null, 2));
      this.log('Package.json optimized', 'success');
      this.optimizations.push('Dependencies optimized');
    }
  }

  async optimizeNextConfig() {
    this.log('Optimizing Next.js configuration...');
    
    const configPath = path.join(this.rootDir, 'next.config.mjs');
    const optimizedPath = path.join(this.rootDir, 'next.config.optimized.mjs');
    
    if (fs.existsSync(optimizedPath)) {
      fs.copyFileSync(optimizedPath, configPath);
      this.log('Next.js config optimized', 'success');
      this.optimizations.push('Next.js config optimized');
    }
  }

  async optimizeTailwindConfig() {
    this.log('Optimizing TailwindCSS configuration...');
    
    const tailwindConfigPath = path.join(this.rootDir, 'tailwind.config.js');
    
    if (fs.existsSync(tailwindConfigPath)) {
      const optimizedConfig = `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // 번들 크기 최적화
  corePlugins: {
    // 사용하지 않는 기능 비활성화
    preflight: true,
    container: false,
    accessibility: false,
    screenReaders: false,
  },
  // CSS 파일 크기 최소화
  experimental: {
    optimizeUniversalDefaults: true,
  },
}`;
      
      fs.writeFileSync(tailwindConfigPath, optimizedConfig);
      this.log('TailwindCSS config optimized', 'success');
      this.optimizations.push('TailwindCSS optimized');
    }
  }

  async analyzeBundleSize() {
    this.log('Analyzing current bundle size...');
    
    try {
      // 빌드 실행
      execSync('npm run build', { stdio: 'pipe' });
      
      // 번들 크기 분석
      const nextDir = path.join(this.rootDir, '.next');
      const staticDir = path.join(nextDir, 'static', 'chunks');
      
      if (fs.existsSync(staticDir)) {
        const files = fs.readdirSync(staticDir);
        let totalSize = 0;
        let largestFiles = [];
        
        files.forEach(file => {
          const filePath = path.join(staticDir, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
          
          if (file.endsWith('.js')) {
            largestFiles.push({
              name: file,
              size: (stats.size / 1024).toFixed(2) + 'KB'
            });
          }
        });
        
        largestFiles.sort((a, b) => parseFloat(b.size) - parseFloat(a.size));
        
        this.log(`Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`, 'info');
        this.log('Top 5 largest chunks:', 'info');
        largestFiles.slice(0, 5).forEach(file => {
          this.log(`  ${file.name}: ${file.size}`, 'info');
        });
      }
    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'error');
    }
  }

  async generateOptimizationReport() {
    this.log('Generating optimization report...');
    
    const report = `
# 🚀 Bundle Optimization Applied

## Optimizations Applied:
${this.optimizations.map(opt => `- ${opt}`).join('\\n')}

## Next Steps:
1. Test the optimized build: \`npm run build:analyze\`
2. Compare bundle sizes with previous version
3. Run performance tests: \`npm run perf:analyze\`
4. Deploy to staging environment

## Rollback Instructions:
If issues occur, restore from backup:
\`\`\`bash
# Restore backup files
cp backup-bundle-optimization/package.json package.json
cp backup-bundle-optimization/next.config.mjs next.config.mjs
npm install
\`\`\`

Generated at: ${new Date().toISOString()}
`;

    fs.writeFileSync('OPTIMIZATION_REPORT.md', report);
    this.log('Report generated: OPTIMIZATION_REPORT.md', 'success');
  }

  async run() {
    try {
      this.log('🚀 Starting bundle optimization process...', 'info');
      
      await this.createBackup();
      await this.optimizePackageJson();
      await this.optimizeNextConfig();
      await this.optimizeTailwindConfig();
      
      this.log('Installing optimized dependencies...', 'info');
      execSync('npm install', { stdio: 'inherit' });
      
      await this.analyzeBundleSize();
      await this.generateOptimizationReport();
      
      this.log('✅ Bundle optimization complete!', 'success');
      this.log('Run "npm run build:analyze" to see detailed results', 'info');
      
    } catch (error) {
      this.log(`❌ Optimization failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  const optimizer = new BundleOptimizer();
  optimizer.run();
}

module.exports = BundleOptimizer;