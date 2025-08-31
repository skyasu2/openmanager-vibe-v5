/**
 * 🛡️ Custom ESLint Plugin for React Error #310 Prevention
 * 
 * OpenManager VIBE v5 전용 커스텀 ESLint 룰 모음
 * React 무한 리렌더링 및 성능 문제를 사전에 방지
 */

const noFunctionInDeps = require('./no-function-in-deps');

module.exports = {
  rules: {
    'no-function-in-deps': noFunctionInDeps,
  },
  configs: {
    recommended: {
      plugins: ['custom-react-performance'],
      rules: {
        'custom-react-performance/no-function-in-deps': 'error',
      },
    },
    strict: {
      plugins: ['custom-react-performance'],
      rules: {
        'custom-react-performance/no-function-in-deps': 'error',
      },
    },
  },
};