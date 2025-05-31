#!/usr/bin/env node

/**
 * 🤖 OpenManager V5 자동 문서 생성기
 * 
 * 사용법:
 * node .cursor/scripts/auto-doc-generator.js [options]
 * 
 * 옵션:
 * --type=api        # API 문서 생성
 * --type=component  # 컴포넌트 문서 생성
 * --type=module     # 모듈 문서 생성
 * --path=src/...    # 대상 경로
 */

const fs = require('fs');
const path = require('path');

class AutoDocGenerator {
  constructor() {
    this.projectRoot = process.cwd();
    this.docsDir = path.join(this.projectRoot, 'docs');
    this.templates = {
      api: this.getAPITemplate(),
      component: this.getComponentTemplate(),
      module: this.getModuleTemplate()
    };
  }

  // API 문서 템플릿
  getAPITemplate() {
    return `# 📡 {{name}} API 문서

**경로**: \`{{path}}\`
**생성일**: {{date}}

## 🎯 개요

{{description}}

## 📝 엔드포인트

### {{method}} {{endpoint}}

#### 요청
\`\`\`typescript
{{requestInterface}}
\`\`\`

#### 응답
\`\`\`typescript
{{responseInterface}}
\`\`\`

#### 예제
\`\`\`bash
curl -X {{method}} \\
  {{baseUrl}}{{endpoint}} \\
  -H "Content-Type: application/json" \\
  -d '{{requestExample}}'
\`\`\`

## 🔧 구현 세부사항

{{implementation}}

## 🧪 테스트

{{testCases}}

---
**자동 생성**: {{timestamp}}`;
  }

  // 컴포넌트 문서 템플릿
  getComponentTemplate() {
    return `# 🎨 {{name}} 컴포넌트

**경로**: \`{{path}}\`
**타입**: {{type}}

## 🎯 개요

{{description}}

## 🔧 Props

\`\`\`typescript
{{propsInterface}}
\`\`\`

## 📝 사용법

\`\`\`tsx
{{usageExample}}
\`\`\`

## 🎨 스타일링

{{stylingInfo}}

## 🧪 테스트

{{testInfo}}

---
**자동 생성**: {{timestamp}}`;
  }

  // 모듈 문서 템플릿
  getModuleTemplate() {
    return `# 🧩 {{name}} 모듈

**경로**: \`{{path}}\`
**타입**: {{type}}

## 🎯 개요

{{description}}

## 🏗️ 아키텍처

\`\`\`
{{architecture}}
\`\`\`

## 📦 주요 기능

{{features}}

## 🔧 설정

{{configuration}}

## 📚 사용 예제

{{examples}}

---
**자동 생성**: {{timestamp}}`;
  }

  // 파일 분석 및 메타데이터 추출
  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath);
    
    let metadata = {
      name: path.basename(filePath, ext),
      path: filePath,
      type: this.detectFileType(filePath, content),
      timestamp: new Date().toISOString()
    };

    if (ext === '.ts' || ext === '.tsx') {
      metadata = { ...metadata, ...this.analyzeTypeScript(content) };
    }

    return metadata;
  }

  // 파일 타입 감지
  detectFileType(filePath, content) {
    if (filePath.includes('/api/')) return 'api';
    if (filePath.includes('/components/')) return 'component';
    if (content.includes('export class') || content.includes('export interface')) return 'module';
    return 'unknown';
  }

  // TypeScript 파일 분석
  analyzeTypeScript(content) {
    const interfaces = this.extractInterfaces(content);
    const functions = this.extractFunctions(content);
    const components = this.extractComponents(content);
    
    return {
      interfaces,
      functions,
      components,
      exports: this.extractExports(content)
    };
  }

  // 인터페이스 추출
  extractInterfaces(content) {
    const interfaceRegex = /interface\s+(\w+)\s*{([^}]*)}/g;
    const interfaces = [];
    let match;
    
    while ((match = interfaceRegex.exec(content)) !== null) {
      interfaces.push({
        name: match[1],
        body: match[2].trim()
      });
    }
    
    return interfaces;
  }

  // 함수 추출
  extractFunctions(content) {
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g;
    const functions = [];
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        signature: match[0]
      });
    }
    
    return functions;
  }

  // React 컴포넌트 추출
  extractComponents(content) {
    const componentRegex = /(?:export\s+)?(?:default\s+)?function\s+(\w+)\s*\([^)]*\)(?:\s*:\s*\w+)?\s*{/g;
    const components = [];
    let match;
    
    while ((match = componentRegex.exec(content)) !== null) {
      if (match[1] && match[1][0] === match[1][0].toUpperCase()) {
        components.push({
          name: match[1],
          signature: match[0]
        });
      }
    }
    
    return components;
  }

  // export 문 추출
  extractExports(content) {
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|interface|const|let|var)\s+(\w+)/g;
    const exports = [];
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return exports;
  }

  // 문서 생성
  generateDoc(filePath, type = null) {
    try {
      const metadata = this.analyzeFile(filePath);
      const docType = type || metadata.type;
      
      if (!this.templates[docType]) {
        console.warn(`Unknown document type: ${docType}`);
        return null;
      }

      let template = this.templates[docType];
      
      // 플레이스홀더 교체
      template = template.replace(/{{name}}/g, metadata.name);
      template = template.replace(/{{path}}/g, metadata.path);
      template = template.replace(/{{type}}/g, docType);
      template = template.replace(/{{timestamp}}/g, metadata.timestamp);
      template = template.replace(/{{date}}/g, new Date().toLocaleDateString());
      
      // 타입별 특별 처리
      if (docType === 'component' && metadata.components.length > 0) {
        const component = metadata.components[0];
        template = template.replace(/{{usageExample}}/g, `<${component.name} />`);
      }
      
      if (metadata.interfaces.length > 0) {
        const interfaceCode = metadata.interfaces.map(i => 
          `interface ${i.name} {\n${i.body}\n}`
        ).join('\n\n');
        template = template.replace(/{{propsInterface}}/g, interfaceCode);
        template = template.replace(/{{requestInterface}}/g, interfaceCode);
      }
      
      // 기본값으로 채우기
      template = template.replace(/{{[^}]+}}/g, '_(자동 분석 중...)_');
      
      return template;
    } catch (error) {
      console.error(`Error generating doc for ${filePath}:`, error);
      return null;
    }
  }

  // 배치 문서 생성
  generateBatchDocs(directory, filePattern = /\.(ts|tsx|js|jsx)$/) {
    const files = this.findFiles(directory, filePattern);
    const results = [];
    
    files.forEach(file => {
      const doc = this.generateDoc(file);
      if (doc) {
        const docPath = this.getDocPath(file);
        this.ensureDirectoryExists(path.dirname(docPath));
        fs.writeFileSync(docPath, doc);
        results.push({ file, docPath });
        console.log(`Generated: ${docPath}`);
      }
    });
    
    return results;
  }

  // 파일 검색
  findFiles(directory, pattern) {
    const files = [];
    
    function walkDir(dir) {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walkDir(fullPath);
        } else if (stat.isFile() && pattern.test(item)) {
          files.push(fullPath);
        }
      });
    }
    
    walkDir(directory);
    return files;
  }

  // 문서 경로 생성
  getDocPath(filePath) {
    const relativePath = path.relative(this.projectRoot, filePath);
    const name = path.basename(filePath, path.extname(filePath));
    return path.join(this.docsDir, 'auto-generated', `${name}.md`);
  }

  // 디렉토리 생성
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // CLI 실행
  run() {
    const args = process.argv.slice(2);
    const options = this.parseArgs(args);
    
    if (options.help) {
      this.showHelp();
      return;
    }
    
    if (options.path) {
      if (fs.statSync(options.path).isDirectory()) {
        this.generateBatchDocs(options.path);
      } else {
        const doc = this.generateDoc(options.path, options.type);
        if (doc) {
          console.log(doc);
        }
      }
    } else {
      console.log('Please specify a path with --path=...');
      this.showHelp();
    }
  }

  // 인수 파싱
  parseArgs(args) {
    const options = {};
    
    args.forEach(arg => {
      if (arg.startsWith('--')) {
        const [key, value] = arg.slice(2).split('=');
        options[key] = value || true;
      }
    });
    
    return options;
  }

  // 도움말 표시
  showHelp() {
    console.log(`
🤖 OpenManager V5 자동 문서 생성기

사용법:
  node .cursor/scripts/auto-doc-generator.js [options]

옵션:
  --path=<경로>     대상 파일 또는 디렉토리
  --type=<타입>     문서 타입 (api, component, module)
  --help           이 도움말 표시

예제:
  # 단일 파일 문서 생성
  node .cursor/scripts/auto-doc-generator.js --path=src/components/Button.tsx --type=component
  
  # 디렉토리 전체 문서 생성
  node .cursor/scripts/auto-doc-generator.js --path=src/components
  
  # API 디렉토리 문서 생성
  node .cursor/scripts/auto-doc-generator.js --path=src/app/api --type=api
`);
  }
}

// CLI 실행
if (require.main === module) {
  const generator = new AutoDocGenerator();
  generator.run();
}

module.exports = AutoDocGenerator; 