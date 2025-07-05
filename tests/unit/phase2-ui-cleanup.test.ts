/**
 * 🧪 Phase 2: MCP UI 정리 + API 최적화 테스트
 *
 * ✅ MCP 관련 UI에서 Render → Google VM 변경 검증
 * ✅ API 엔드포인트 최적화 검증
 * ✅ 성능 개선 검증
 */

import fs from 'fs';
import path from 'path';
import { beforeEach, describe, expect, test } from 'vitest';

describe('Phase 2: MCP UI 정리 및 최적화', () => {
  // 환경변수 설정
  beforeEach(() => {
    (process.env as any).NODE_ENV = 'test';
    (process.env as any).GCP_MCP_SERVER_URL = 'http://104.154.205.25:10000';
    (process.env as any).GCP_MCP_SERVER_ENABLED = 'true';
  });

  describe('🎨 UI 텍스트 정리', () => {
    test('MCP 모니터링 페이지에서 "Render" 텍스트가 제거되어야 함', () => {
      const mcpMonitoringPath = path.join(
        process.cwd(),
        'src/app/admin/mcp-monitoring/page.tsx'
      );

      if (fs.existsSync(mcpMonitoringPath)) {
        const content = fs.readFileSync(mcpMonitoringPath, 'utf-8');

        // "Render" 관련 텍스트가 없어야 함
        expect(content).not.toMatch(/render\s+서버/i);
        expect(content).not.toMatch(/render\s+mcp/i);
        expect(content).not.toMatch(/렌더\s+서버/i);

        // Google VM 관련 텍스트가 있어야 함
        expect(content).toMatch(/google\s+vm|gcp\s+서버|구글\s+vm/i);
      }
    });

    test('MCPServerStatusPanel에서 renderServer 변수명이 변경되어야 함', () => {
      const statusPanelPath = path.join(
        process.cwd(),
        'src/domains/ai-sidebar/components/MCPServerStatusPanel.tsx'
      );

      if (fs.existsSync(statusPanelPath)) {
        const content = fs.readFileSync(statusPanelPath, 'utf-8');

        // renderServer 변수명이 없어야 함
        expect(content).not.toMatch(/renderServer/);
        expect(content).not.toMatch(/servers\.render/);

        // gcpServer 또는 vmServer 변수명이 있어야 함
        expect(content).toMatch(/gcpServer|vmServer|servers\.gcp|servers\.vm/);
      }
    });

    test('MCP 관련 컴포넌트에서 일관된 명명 규칙 사용', () => {
      const componentPaths = [
        'src/domains/ai-sidebar/components/MCPServerStatusPanel.tsx',
        'src/app/admin/mcp-monitoring/page.tsx',
        'src/hooks/api/useMCPQuery.ts',
      ];

      componentPaths.forEach(filePath => {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');

          // 일관된 명명: "Google VM MCP 서버" 또는 "GCP MCP 서버"
          if (content.includes('mcp') || content.includes('MCP')) {
            // Render 관련 레거시 텍스트가 없어야 함
            expect(content).not.toMatch(/render.*mcp.*서버/i);
            expect(content).not.toMatch(/mcp.*render.*서버/i);
          }
        }
      });
    });
  });

  describe('🔗 API 엔드포인트 최적화', () => {
    test('남은 RENDER_MCP_SERVER_URL 참조가 완전히 제거되어야 함', () => {
      const searchPaths = ['src/config', 'src/lib', 'src/services', 'src/core'];

      searchPaths.forEach(searchPath => {
        const fullSearchPath = path.join(process.cwd(), searchPath);
        if (fs.existsSync(fullSearchPath)) {
          const files = getAllTsFiles(fullSearchPath);

          files.forEach(filePath => {
            const content = fs.readFileSync(filePath, 'utf-8');

            // RENDER_MCP_SERVER_URL 참조가 없어야 함
            expect(content).not.toMatch(/RENDER_MCP_SERVER_URL/);
            expect(content).not.toMatch(/render-mcp/);
            expect(content).not.toMatch(/renderMcp/);
          });
        }
      });
    });

    test('중복된 MCP 상태 조회 API가 통합되어야 함', () => {
      const apiPaths = [
        'src/app/api/mcp/status/route.ts',
        'src/app/api/system/mcp-status/route.ts',
        'src/app/api/health/route.ts',
      ];

      let activeApiCount = 0;
      apiPaths.forEach(apiPath => {
        const fullPath = path.join(process.cwd(), apiPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');

          // MCP 상태를 반환하는 API 카운트
          if (content.includes('mcp') && content.includes('status')) {
            activeApiCount++;
          }
        }
      });

      // 중복 API가 3개 이하여야 함 (통합 완료)
      expect(activeApiCount).toBeLessThanOrEqual(2);
    });
  });

  describe('⚡ 성능 최적화', () => {
    test('불필요한 import 문이 정리되어야 함', () => {
      const componentPaths = [
        'src/app/admin/mcp-monitoring/page.tsx',
        'src/domains/ai-sidebar/components/MCPServerStatusPanel.tsx',
      ];

      componentPaths.forEach(filePath => {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');

          // import 문 추출
          const imports = content.match(/^import.*from.*$/gm) || [];
          const usedImports = new Set();

          imports.forEach(importLine => {
            const matches = importLine.match(/import\s+{([^}]+)}/);
            if (matches) {
              const namedImports = matches[1].split(',').map(s => s.trim());
              namedImports.forEach(namedImport => {
                // 실제 사용되는지 확인
                if (content.includes(namedImport)) {
                  usedImports.add(namedImport);
                }
              });
            }
          });

          // 사용되지 않는 import가 있으면 실패
          const allImports = imports.join('\n');
          const unusedImports = imports.filter(importLine => {
            const matches = importLine.match(/import\s+{([^}]+)}/);
            if (matches) {
              const namedImports = matches[1].split(',').map(s => s.trim());
              return namedImports.some(
                namedImport => !content.includes(namedImport)
              );
            }
            return false;
          });

          expect(unusedImports.length).toBe(0);
        }
      });
    });

    test('컴포넌트 파일 크기가 적정 수준이어야 함', () => {
      const componentPaths = [
        'src/app/admin/mcp-monitoring/page.tsx',
        'src/domains/ai-sidebar/components/MCPServerStatusPanel.tsx',
      ];

      componentPaths.forEach(filePath => {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          const fileSizeKB = stats.size / 1024;

          // 컴포넌트 파일이 100KB 이하여야 함
          expect(fileSizeKB).toBeLessThan(100);
        }
      });
    });
  });
});

// 헬퍼 함수: 디렉토리에서 모든 .ts/.tsx 파일 찾기
function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];

  function traverse(currentDir: string) {
    try {
      const items = fs.readdirSync(currentDir);

      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          files.push(fullPath);
        }
      });
    } catch (error) {
      // 디렉토리 접근 실패 시 무시
    }
  }

  traverse(dir);
  return files;
}
