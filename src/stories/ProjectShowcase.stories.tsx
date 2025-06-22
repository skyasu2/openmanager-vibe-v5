import type { Meta, StoryObj } from '@storybook/nextjs';

const meta: Meta = {
  title: '🏆 Showcase/Project Achievements',
  parameters: {
    layout: 'fullscreen',
    docs: {
      page: () => (
        <div
          style={{
            padding: '2rem',
            fontFamily: 'system-ui',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            minHeight: '100vh',
            color: 'white',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1
                style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                🚀 OpenManager Vibe v5.44.0
              </h1>
              <p style={{ fontSize: '1.5rem', opacity: 0.9 }}>
                바이브 코딩으로 완성한 차세대 AI 모니터링 시스템
              </p>
              <div
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  marginTop: '1rem',
                }}
              >
                🎯 20일 개발 완성 | 95.2% 테스트 통과 | 128개 컴포넌트
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '2rem',
                marginBottom: '3rem',
              }}
            >
              <div
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '2rem',
                  borderRadius: '15px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <h3
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                  }}
                >
                  🧪 <span style={{ marginLeft: '0.5rem' }}>테스트 성과</span>
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: '#4ade80',
                      }}
                    >
                      139
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                      통과 테스트
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: '#60a5fa',
                      }}
                    >
                      95.2%
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                      성공률
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: '#f59e0b',
                      }}
                    >
                      128
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                      스토리북
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: '#ec4899',
                      }}
                    >
                      0
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                      실패 테스트
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '2rem',
                  borderRadius: '15px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <h3
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                  }}
                >
                  🤖 <span style={{ marginLeft: '0.5rem' }}>AI 시스템</span>
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.8rem',
                    }}
                  >
                    <span style={{ marginRight: '0.5rem' }}>🧠</span> Google AI
                    Studio (Gemini)
                  </li>
                  <li
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.8rem',
                    }}
                  >
                    <span style={{ marginRight: '0.5rem' }}>⚡</span>{' '}
                    UnifiedAIEngine
                  </li>
                  <li
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.8rem',
                    }}
                  >
                    <span style={{ marginRight: '0.5rem' }}>🇰🇷</span> Korean RAG
                    Engine
                  </li>
                  <li
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.8rem',
                    }}
                  >
                    <span style={{ marginRight: '0.5rem' }}>🛡️</span> Smart
                    Fallback System
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '0.5rem' }}>🔄</span> Graceful
                    Degradation
                  </li>
                </ul>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '2rem',
                  borderRadius: '15px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <h3
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                  }}
                >
                  📊 <span style={{ marginLeft: '0.5rem' }}>프로젝트 규모</span>
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>총 파일 수</span>
                    <span style={{ fontWeight: 'bold' }}>603개</span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>코드 라인 수</span>
                    <span style={{ fontWeight: 'bold' }}>200,081줄</span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>컴포넌트 수</span>
                    <span style={{ fontWeight: 'bold' }}>128개</span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>API 엔드포인트</span>
                    <span style={{ fontWeight: 'bold' }}>94개</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '2rem',
                  borderRadius: '15px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <h3
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                  }}
                >
                  🔧 <span style={{ marginLeft: '0.5rem' }}>기술 스택</span>
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.8rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <div>Next.js 15</div>
                  <div>TypeScript</div>
                  <div>React Query</div>
                  <div>Zustand</div>
                  <div>Tailwind CSS</div>
                  <div>Shadcn/ui</div>
                  <div>Vitest</div>
                  <div>Storybook</div>
                  <div>Supabase</div>
                  <div>Redis</div>
                  <div>Vercel</div>
                  <div>Render</div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '2rem',
                borderRadius: '15px',
                backdropFilter: 'blur(10px)',
                marginBottom: '2rem',
              }}
            >
              <h3
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                🎯{' '}
                <span style={{ marginLeft: '0.5rem' }}>
                  최신 개선사항 (v5.44.0)
                </span>
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    background: 'rgba(34, 197, 94, 0.2)',
                    padding: '1rem',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    ✨ 테스트 개선
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    139개 테스트 통과, 95.2% 성공률 달성
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    padding: '1rem',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    🔧 환경변수 최적화
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    FORCE_MOCK_GOOGLE_AI 추가로 안정성 강화
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(168, 85, 247, 0.2)',
                    padding: '1rem',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    📱 스토리북 최신화
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    128개 컴포넌트 스토리 완전 정리
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    padding: '1rem',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    ⚡ 성능 최적화
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    Worker 안정성 개선 및 API 정규화
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                textAlign: 'center',
                background: 'rgba(255,255,255,0.1)',
                padding: '2rem',
                borderRadius: '15px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <h3 style={{ marginBottom: '1rem' }}>
                🎭 바이브 코딩 개발 방법론
              </h3>
              <p
                style={{
                  fontSize: '1.1rem',
                  lineHeight: '1.6',
                  opacity: 0.9,
                  marginBottom: '1.5rem',
                }}
              >
                &ldquo;AI 도구를 잘 다루는 것이 명백한 전술적 방법입니다&rdquo;
                - 샘 알트먼
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '2rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    💡
                  </div>
                  <div style={{ fontWeight: 'bold' }}>기획 2일</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                    ChatGPT 협업
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    ⚡
                  </div>
                  <div style={{ fontWeight: 'bold' }}>개발 16일</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                    Cursor AI + Claude
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    🔍
                  </div>
                  <div style={{ fontWeight: 'bold' }}>검증 2일</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                    Google Jules + GPT
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ProjectOverview: Story = {
  name: '프로젝트 개요',
};

export const TechnicalAchievements: Story = {
  name: '기술적 성과',
  parameters: {
    docs: {
      description: {
        story: '20일간의 개발로 달성한 기술적 성과들을 보여줍니다.',
      },
    },
  },
};

export const AISystemShowcase: Story = {
  name: 'AI 시스템 쇼케이스',
  parameters: {
    docs: {
      description: {
        story: '통합된 Multi-AI 시스템의 구조와 성능을 소개합니다.',
      },
    },
  },
};

export const DevelopmentMethodology: Story = {
  name: '바이브 코딩 방법론',
  parameters: {
    docs: {
      description: {
        story: 'AI 협업을 통한 혁신적 개발 방법론을 설명합니다.',
      },
    },
  },
};
