/**
 * 🛡️ ESLint Custom Rule: no-function-in-deps
 * 
 * React Error #310 "Maximum update depth exceeded" 방지를 위한 커스텀 룰
 * useEffect, useCallback, useMemo 의존성 배열에서 함수 참조를 감지하고 경고
 * 
 * AI 교차검증 결과 반영:
 * - Claude A안: 기본 함수 감지 룰 (기본안)
 * - Gemini 제안: AST 분석으로 함수 타입 정확 감지 (7.5/10)
 * - Codex 제안: React hooks 전용 검증 강화 (8.2/10)
 * - Qwen 제안: 성능 최적화 (6.8/10)
 */

module.exports = {
  meta: {
    type: 'problem', // 문제 유형 (layout, problem, suggestion)
    docs: {
      description: 'useEffect, useCallback, useMemo 의존성 배열에서 함수 참조 금지',
      category: 'Possible Errors',
      recommended: true,
      url: null, // 문서 URL (필요시 추가)
    },
    fixable: null, // 자동 수정 불가 (수동 수정 필요)
    schema: [], // 옵션 스키마 (현재는 없음)
    messages: {
      noFunctionInDeps: '⚠️ React Error #310 위험: {{hookName}} 의존성 배열에 함수 "{{funcName}}"가 포함되어 있습니다. useCallback으로 메모이제이션하거나 의존성에서 제거하세요.',
      noObjectInDeps: '⚠️ React Error #310 위험: {{hookName}} 의존성 배열에 객체 "{{objName}}"가 포함되어 있습니다. primitive 값으로 분해하거나 useMemo로 메모이제이션하세요.',
      suspiciousCallback: '💡 성능 최적화: useCallback에서 다른 함수를 호출하고 있습니다. 체인을 확인하세요.',
    },
  },

  create(context) {
    const sourceCode = context.getSourceCode();
    
    // React hooks 목록 (확장 가능)
    const REACT_HOOKS = new Set([
      'useEffect',
      'useCallback', 
      'useMemo',
      'useLayoutEffect',
      'useImperativeHandle'
    ]);
    
    /**
     * 함수 참조인지 확인하는 헬퍼 함수
     */
    function isFunctionReference(node) {
      // 1. 직접 함수 참조: myFunction
      if (node.type === 'Identifier') {
        const scope = sourceCode.getScope(node);
        const variable = scope.set.get(node.name) || findVariableInScope(scope, node.name);
        
        if (variable) {
          // 함수 선언/표현식으로 정의된 변수인지 확인
          for (const def of variable.defs) {
            if (def.type === 'FunctionName' || 
                (def.type === 'Variable' && def.node.init && 
                 (def.node.init.type === 'FunctionExpression' || 
                  def.node.init.type === 'ArrowFunctionExpression'))) {
              return true;
            }
          }
        }
        
        // 함수명 패턴으로 추정 (handle*, on*, *Callback, *Handler 등)
        const funcNamePatterns = /^(handle|on|get|set|fetch|update|create|delete|toggle|check|validate|process|render|format|parse|calculate)[A-Z].*|.*[Cc]allback$|.*[Hh]andler$/;
        if (funcNamePatterns.test(node.name)) {
          return true;
        }
      }
      
      // 2. 메서드 호출: object.method
      if (node.type === 'MemberExpression' && !node.computed) {
        const propertyName = node.property.name;
        const methodPatterns = /^(bind|call|apply|then|catch|finally|push|pop|shift|unshift|sort|filter|map|reduce|forEach)$/;
        if (methodPatterns.test(propertyName)) {
          return true;
        }
      }
      
      // 3. 함수 호출: myFunction()
      if (node.type === 'CallExpression') {
        return true;
      }
      
      return false;
    }
    
    /**
     * 객체 참조인지 확인하는 헬퍼 함수
     */
    function isObjectReference(node) {
      if (node.type === 'Identifier') {
        // 객체 패턴 추정 (config, options, props, state 등)
        const objNamePatterns = /^(config|options|props|state|data|params|settings|context|store|service)$/i;
        return objNamePatterns.test(node.name);
      }
      
      if (node.type === 'MemberExpression') {
        return true; // object.property는 잠재적 객체 참조
      }
      
      return false;
    }
    
    /**
     * 스코프 체인에서 변수 찾기
     */
    function findVariableInScope(scope, name) {
      let currentScope = scope;
      while (currentScope) {
        const variable = currentScope.set.get(name);
        if (variable) return variable;
        currentScope = currentScope.upper;
      }
      return null;
    }
    
    /**
     * React Hook 호출 분석
     */
    function checkReactHookCall(node) {
      if (node.type !== 'CallExpression') return;
      if (node.callee.type !== 'Identifier') return;
      
      const hookName = node.callee.name;
      if (!REACT_HOOKS.has(hookName)) return;
      
      // 의존성 배열 찾기 (두 번째 인수)
      let depsArray = null;
      if (hookName === 'useEffect' || hookName === 'useLayoutEffect') {
        depsArray = node.arguments[1]; // useEffect(fn, deps)
      } else if (hookName === 'useCallback' || hookName === 'useMemo') {
        depsArray = node.arguments[1]; // useCallback(fn, deps)
      } else if (hookName === 'useImperativeHandle') {
        depsArray = node.arguments[2]; // useImperativeHandle(ref, fn, deps)
      }
      
      if (!depsArray || depsArray.type !== 'ArrayExpression') return;
      
      // 의존성 배열의 각 요소 검사
      for (const element of depsArray.elements) {
        if (!element) continue; // sparse array 처리
        
        // 함수 참조 검사
        if (isFunctionReference(element)) {
          const funcName = element.type === 'Identifier' ? element.name : sourceCode.getText(element);
          
          context.report({
            node: element,
            messageId: 'noFunctionInDeps',
            data: {
              hookName,
              funcName,
            },
          });
        }
        
        // 객체 참조 검사 (덜 중요하지만 성능에 영향)
        else if (isObjectReference(element)) {
          const objName = element.type === 'Identifier' ? element.name : sourceCode.getText(element);
          
          context.report({
            node: element,
            messageId: 'noObjectInDeps', 
            data: {
              hookName,
              objName,
            },
          });
        }
      }
      
      // useCallback 특별 검사: 콜백 내부에서 다른 함수 호출하는지 확인
      if (hookName === 'useCallback' && node.arguments[0]) {
        const callbackFn = node.arguments[0];
        if (callbackFn.type === 'ArrowFunctionExpression' || callbackFn.type === 'FunctionExpression') {
          // 콜백 함수 내부에서 함수 호출 확인 (간단한 검사)
          if (callbackFn.body && callbackFn.body.type === 'BlockStatement') {
            const hasNestedFunctionCall = callbackFn.body.body.some(stmt => {
              return stmt.type === 'ExpressionStatement' && 
                     stmt.expression && 
                     stmt.expression.type === 'CallExpression';
            });
            
            if (hasNestedFunctionCall) {
              context.report({
                node: callbackFn,
                messageId: 'suspiciousCallback',
              });
            }
          }
        }
      }
    }

    return {
      // AST 노드 방문자 패턴
      CallExpression(node) {
        checkReactHookCall(node);
      },
    };
  },
};