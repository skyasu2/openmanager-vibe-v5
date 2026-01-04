/**
 * Advisor Agent
 *
 * Specializes in troubleshooting guidance and command recommendations.
 * Uses GraphRAG to search past incidents and best practices.
 *
 * Model: Mistral mistral-small-2506 (RAG + reasoning)
 *
 * @version 1.0.0
 */

import { Agent } from '@ai-sdk-tools/agents';
import { getMistralModel } from '../model-provider';
import { searchKnowledgeBase, recommendCommands } from '../../../tools-ai-sdk';

// ============================================================================
// Advisor Agent Definition
// ============================================================================

const ADVISOR_INSTRUCTIONS = `당신은 서버 모니터링 시스템의 문제 해결 전문가입니다.

## 역할
과거 사례를 검색하고, 해결 방법을 안내하며, 적절한 CLI 명령어를 추천합니다.

## 기능

### 1. 지식베이스 검색 (GraphRAG)
- 과거 유사 장애 사례 검색
- 해결 방법 및 베스트 프랙티스 제공
- 관련 문서/가이드 참조

### 2. 명령어 추천
- 문제 해결을 위한 CLI 명령어 제안
- 단계별 실행 가이드 제공
- 주의사항 및 사전 확인 사항 안내

### 3. 트러블슈팅 가이드
- 증상별 진단 절차
- 단계적 문제 해결 방법
- 에스컬레이션 기준 안내

## 응답 형식

### 해결 방법 제안 시
\`\`\`
## 문제: [문제 설명]

### 유사 사례
- [과거 사례 1]: [해결 방법]
- [과거 사례 2]: [해결 방법]

### 권장 조치
1. [1단계 조치]
   \`명령어\`
2. [2단계 조치]
   \`명령어\`

### 주의사항
- [주의 1]
- [주의 2]
\`\`\`

### 명령어 추천 시
\`\`\`
## 추천 명령어

### 진단
\`명령어\` - 설명

### 조치
\`명령어\` - 설명

### 확인
\`명령어\` - 설명
\`\`\`

## 응답 지침
1. 항상 지식베이스 검색 후 답변
2. 명령어는 코드 블록으로 표시
3. 실행 전 확인사항 명시
4. 위험한 명령어는 경고 표시 (⚠️)
5. 단계별로 명확하게 안내
`;

// ============================================================================
// Agent Instance (Graceful Degradation)
// ============================================================================

function createAdvisorAgent() {
  try {
    const model = getMistralModel('mistral-small-2506');
    console.log('💡 [Advisor Agent] Initialized with mistral-small-2506');
    return new Agent({
      name: 'Advisor Agent',
      model,
      instructions: ADVISOR_INSTRUCTIONS,
      tools: {
        searchKnowledgeBase,
        recommendCommands,
      },
      // Description for orchestrator routing decisions
      handoffDescription: '문제 해결 방법, CLI 명령어 추천, 과거 장애 사례 검색, 트러블슈팅 가이드를 제공합니다. "어떻게 해결?", "명령어 알려줘" 질문에 적합합니다.',
      matchOn: [
        // Solution keywords
        '해결',
        '방법',
        '어떻게',
        '조치',
        // Command keywords
        '명령어',
        'command',
        '실행',
        'cli',
        // Guide keywords
        '가이드',
        '도움',
        '추천',
        '안내',
        // History keywords
        '과거',
        '사례',
        '이력',
        '비슷한',
        // Patterns
        /어떻게.*해결|해결.*방법/i,
        /명령어.*알려|추천.*명령/i,
        /\?$/, // Questions often need advice
      ],
    });
  } catch (error) {
    console.warn('⚠️ [Advisor Agent] Not available (MISTRAL_API_KEY not configured)');
    return null;
  }
}

export const advisorAgent = createAdvisorAgent();

export default advisorAgent;
