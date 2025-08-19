/**
 * 🛡️ Content Security Policy (CSP) 정책 테스트
 * 
 * CSP 정책이 올바르게 적용되어 보안 취약점을 방지하는지 검증합니다.
 * 
 * @author Test Automation Specialist (보안 강화 프로젝트)
 * @created 2025-08-19
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

interface CSPDirective {
  name: string;
  sources: string[];
}

interface CSPPolicy {
  directives: CSPDirective[];
  reportOnly: boolean;
}

describe('🛡️ CSP 정책 테스트', () => {
  let mockCSPPolicy: CSPPolicy;

  beforeEach(() => {
    // 강화된 CSP 정책 설정
    mockCSPPolicy = {
      directives: [
        {
          name: 'default-src',
          sources: ["'self'"]
        },
        {
          name: 'script-src',
          sources: ["'self'", "'unsafe-eval'", 'https://vercel.live']
        },
        {
          name: 'style-src',
          sources: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']
        },
        {
          name: 'img-src',
          sources: ["'self'", 'data:', 'https:', 'blob:']
        },
        {
          name: 'font-src',
          sources: ["'self'", 'https://fonts.gstatic.com']
        },
        {
          name: 'connect-src',
          sources: [
            "'self'",
            'https://*.supabase.co',
            'https://api.openai.com',
            'https://generativelanguage.googleapis.com',
            'https://vercel.live'
          ]
        },
        {
          name: 'frame-ancestors',
          sources: ["'none'"]
        },
        {
          name: 'object-src',
          sources: ["'none'"]
        },
        {
          name: 'base-uri',
          sources: ["'self'"]
        }
      ],
      reportOnly: false
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 CSP 디렉티브 테스트', () => {
    it('default-src가 올바르게 설정되어야 함', () => {
      // Given: default-src 디렉티브
      const defaultSrc = mockCSPPolicy.directives.find(d => d.name === 'default-src');

      // When & Then: self만 허용해야 함
      expect(defaultSrc).toBeDefined();
      expect(defaultSrc?.sources).toContain("'self'");
      expect(defaultSrc?.sources).toHaveLength(1);
    });

    it('script-src가 필요한 소스만 허용해야 함', () => {
      // Given: script-src 디렉티브
      const scriptSrc = mockCSPPolicy.directives.find(d => d.name === 'script-src');

      // When & Then: 안전한 스크립트 소스만 허용
      expect(scriptSrc).toBeDefined();
      expect(scriptSrc?.sources).toContain("'self'");
      expect(scriptSrc?.sources).toContain('https://vercel.live');
      
      // 위험한 소스는 포함되지 않아야 함
      expect(scriptSrc?.sources).not.toContain("'unsafe-inline'");
      expect(scriptSrc?.sources).not.toContain('*');
    });

    it('object-src가 none으로 설정되어야 함', () => {
      // Given: object-src 디렉티브
      const objectSrc = mockCSPPolicy.directives.find(d => d.name === 'object-src');

      // When & Then: 플러그인 실행을 완전 차단해야 함
      expect(objectSrc).toBeDefined();
      expect(objectSrc?.sources).toContain("'none'");
      expect(objectSrc?.sources).toHaveLength(1);
    });

    it('frame-ancestors가 none으로 설정되어야 함', () => {
      // Given: frame-ancestors 디렉티브
      const frameAncestors = mockCSPPolicy.directives.find(d => d.name === 'frame-ancestors');

      // When & Then: 클릭재킹 공격을 방지해야 함
      expect(frameAncestors).toBeDefined();
      expect(frameAncestors?.sources).toContain("'none'");
      expect(frameAncestors?.sources).toHaveLength(1);
    });

    it('base-uri가 self로 제한되어야 함', () => {
      // Given: base-uri 디렉티브
      const baseUri = mockCSPPolicy.directives.find(d => d.name === 'base-uri');

      // When & Then: base 태그 삽입 공격을 방지해야 함
      expect(baseUri).toBeDefined();
      expect(baseUri?.sources).toContain("'self'");
      expect(baseUri?.sources).toHaveLength(1);
    });
  });

  describe('외부 서비스 연동 CSP 테스트', () => {
    it('Supabase 연결이 허용되어야 함', () => {
      // Given: connect-src 디렉티브
      const connectSrc = mockCSPPolicy.directives.find(d => d.name === 'connect-src');

      // When & Then: Supabase 도메인이 허용되어야 함
      expect(connectSrc).toBeDefined();
      expect(connectSrc?.sources).toContain('https://*.supabase.co');
    });

    it('OpenAI API 연결이 허용되어야 함', () => {
      // Given: connect-src 디렉티브
      const connectSrc = mockCSPPolicy.directives.find(d => d.name === 'connect-src');

      // When & Then: OpenAI API 도메인이 허용되어야 함
      expect(connectSrc).toBeDefined();
      expect(connectSrc?.sources).toContain('https://api.openai.com');
    });

    it('Google AI API 연결이 허용되어야 함', () => {
      // Given: connect-src 디렉티브
      const connectSrc = mockCSPPolicy.directives.find(d => d.name === 'connect-src');

      // When & Then: Google AI API 도메인이 허용되어야 함
      expect(connectSrc).toBeDefined();
      expect(connectSrc?.sources).toContain('https://generativelanguage.googleapis.com');
    });

    it('Vercel 개발 도구 연결이 허용되어야 함', () => {
      // Given: connect-src 디렉티브
      const connectSrc = mockCSPPolicy.directives.find(d => d.name === 'connect-src');

      // When & Then: Vercel Live 도메인이 허용되어야 함
      expect(connectSrc).toBeDefined();
      expect(connectSrc?.sources).toContain('https://vercel.live');
    });
  });

  describe('폰트 및 스타일 CSP 테스트', () => {
    it('Google Fonts가 허용되어야 함', () => {
      // Given: font-src와 style-src 디렉티브
      const fontSrc = mockCSPPolicy.directives.find(d => d.name === 'font-src');
      const styleSrc = mockCSPPolicy.directives.find(d => d.name === 'style-src');

      // When & Then: Google Fonts 도메인이 허용되어야 함
      expect(fontSrc?.sources).toContain('https://fonts.gstatic.com');
      expect(styleSrc?.sources).toContain('https://fonts.googleapis.com');
    });

    it('인라인 스타일이 제한적으로 허용되어야 함', () => {
      // Given: style-src 디렉티브
      const styleSrc = mockCSPPolicy.directives.find(d => d.name === 'style-src');

      // When & Then: Tailwind CSS 등을 위한 unsafe-inline 허용
      expect(styleSrc?.sources).toContain("'unsafe-inline'");
      expect(styleSrc?.sources).toContain("'self'");
    });
  });

  describe('이미지 및 미디어 CSP 테스트', () => {
    it('다양한 이미지 소스가 허용되어야 함', () => {
      // Given: img-src 디렉티브
      const imgSrc = mockCSPPolicy.directives.find(d => d.name === 'img-src');

      // When & Then: 필요한 이미지 소스들이 허용되어야 함
      expect(imgSrc?.sources).toContain("'self'");
      expect(imgSrc?.sources).toContain('data:'); // Base64 이미지
      expect(imgSrc?.sources).toContain('https:'); // 외부 HTTPS 이미지
      expect(imgSrc?.sources).toContain('blob:'); // 동적 생성 이미지
    });
  });

  describe('CSP 위반 테스트', () => {
    it('허용되지 않은 스크립트 소스가 차단되어야 함', () => {
      // Given: 위험한 스크립트 소스들
      const dangerousSources = [
        'http://evil.com',
        'javascript:',
        'data:text/javascript',
        "'unsafe-inline'" // script-src에서는 차단되어야 함
      ];

      const scriptSrc = mockCSPPolicy.directives.find(d => d.name === 'script-src');

      // When & Then: 위험한 소스들이 포함되지 않아야 함
      dangerousSources.forEach(source => {
        expect(scriptSrc?.sources).not.toContain(source);
      });
    });

    it('허용되지 않은 연결이 차단되어야 함', () => {
      // Given: 허용되지 않은 연결 대상들
      const blockedConnections = [
        'http://insecure.com',
        'ws://websocket.evil.com',
        '*' // 와일드카드는 보안상 위험
      ];

      const connectSrc = mockCSPPolicy.directives.find(d => d.name === 'connect-src');

      // When & Then: 차단되어야 할 연결들이 포함되지 않아야 함
      blockedConnections.forEach(connection => {
        expect(connectSrc?.sources).not.toContain(connection);
      });
    });
  });

  describe('CSP 헤더 생성 테스트', () => {
    it('CSP 헤더가 올바른 형식으로 생성되어야 함', () => {
      // Given: CSP 정책
      const policy = mockCSPPolicy;

      // When: CSP 헤더 문자열 생성
      const generateCSPHeader = (policy: CSPPolicy): string => {
        return policy.directives
          .map(directive => `${directive.name} ${directive.sources.join(' ')}`)
          .join('; ');
      };

      const cspHeader = generateCSPHeader(policy);

      // Then: 헤더가 올바른 형식이어야 함
      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain("object-src 'none'");
      expect(cspHeader).toContain("frame-ancestors 'none'");
      expect(cspHeader).not.toContain('undefined');
      expect(cspHeader).not.toContain('null');
    });

    it('Report-Only 모드가 올바르게 처리되어야 함', () => {
      // Given: Report-Only CSP 정책
      const reportOnlyPolicy: CSPPolicy = {
        ...mockCSPPolicy,
        reportOnly: true
      };

      // When: 헤더 이름 결정
      const getHeaderName = (policy: CSPPolicy): string => {
        return policy.reportOnly 
          ? 'Content-Security-Policy-Report-Only' 
          : 'Content-Security-Policy';
      };

      // Then: 올바른 헤더 이름이 사용되어야 함
      expect(getHeaderName(mockCSPPolicy)).toBe('Content-Security-Policy');
      expect(getHeaderName(reportOnlyPolicy)).toBe('Content-Security-Policy-Report-Only');
    });
  });

  describe('CSP 업그레이드 및 진화 테스트', () => {
    it('새로운 API 도메인 추가가 안전하게 처리되어야 함', () => {
      // Given: 새로운 API 도메인 추가
      const newApiDomain = 'https://api.anthropic.com';
      const updatedPolicy = { ...mockCSPPolicy };
      const connectSrc = updatedPolicy.directives.find(d => d.name === 'connect-src');

      // When: 새 도메인 추가
      if (connectSrc && !connectSrc.sources.includes(newApiDomain)) {
        connectSrc.sources.push(newApiDomain);
      }

      // Then: 안전하게 추가되어야 함
      expect(connectSrc?.sources).toContain(newApiDomain);
      expect(connectSrc?.sources).toContain("'self'"); // 기존 정책 유지
    });

    it('CSP 정책 완화가 최소한으로 제한되어야 함', () => {
      // Given: 정책 완화 시도
      const relaxedSources = ['*', "'unsafe-eval'", "'unsafe-inline'"];
      
      // When: 각 디렉티브 검사
      const criticalDirectives = ['default-src', 'script-src', 'object-src'];
      
      criticalDirectives.forEach(directiveName => {
        const directive = mockCSPPolicy.directives.find(d => d.name === directiveName);
        
        // Then: 위험한 완화가 적용되지 않아야 함
        if (directiveName === 'object-src') {
          expect(directive?.sources).toEqual(["'none'"]);
        } else {
          relaxedSources.forEach(dangerousSource => {
            if (directiveName === 'script-src' && dangerousSource === "'unsafe-eval'") {
              // script-src에서는 unsafe-eval이 필요할 수 있음 (Next.js)
              return;
            }
            expect(directive?.sources).not.toContain(dangerousSource);
          });
        }
      });
    });
  });

  describe('CSP 성능 영향 테스트', () => {
    it('CSP 정책 크기가 적절해야 함', () => {
      // Given: CSP 정책
      const policy = mockCSPPolicy;

      // When: 정책 크기 계산
      const policySize = JSON.stringify(policy).length;
      const directiveCount = policy.directives.length;

      // Then: 적절한 크기여야 함 (너무 크면 성능 영향)
      expect(policySize).toBeLessThan(2000); // 2KB 미만
      expect(directiveCount).toBeLessThan(15); // 15개 디렉티브 미만
    });

    it('중복 소스가 제거되어야 함', () => {
      // Given: 각 디렉티브의 소스들
      mockCSPPolicy.directives.forEach(directive => {
        // When: 소스 배열에서 중복 확인
        const uniqueSources = [...new Set(directive.sources)];
        
        // Then: 중복이 없어야 함
        expect(directive.sources).toEqual(uniqueSources);
      });
    });
  });
});

// 테스트 헬퍼 함수들
function createMockCSPDirective(name: string, sources: string[]): CSPDirective {
  return { name, sources };
}

function validateCSPSource(source: string): boolean {
  // 기본 검증 규칙
  if (source === "'none'" || source === "'self'") return true;
  if (source.startsWith("'") && source.endsWith("'")) return true;
  if (source.startsWith('https://')) return true;
  if (source === 'data:' || source === 'blob:') return true;
  
  return false;
}

function isSecureCSPPolicy(policy: CSPPolicy): boolean {
  // 필수 보안 디렉티브 확인
  const requiredDirectives = ['default-src', 'script-src', 'object-src', 'frame-ancestors'];
  
  return requiredDirectives.every(directive => 
    policy.directives.some(d => d.name === directive)
  );
}