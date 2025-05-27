#!/usr/bin/env python3
"""
Python Analysis Engine Runner
통합 분석 엔진 실행기 - 모든 분석 모듈을 통합 관리
"""

import sys
import json
import importlib
import traceback
from pathlib import Path

# 현재 디렉터리를 Python 경로에 추가
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

class EngineRunner:
    """통합 분석 엔진 실행기"""
    
    def __init__(self):
        self.modules = {
            'forecast': None,
            'anomaly': None,
            'classification': None,
            'clustering': None,
            'correlation': None
        }
        self.load_modules()
    
    def load_modules(self):
        """분석 모듈들을 동적으로 로드"""
        try:
            # 각 분석 모듈 로드
            for module_name in self.modules.keys():
                try:
                    module = importlib.import_module(module_name)
                    self.modules[module_name] = module
                except ImportError as e:
                    print(f"Warning: Failed to load {module_name} module: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error loading modules: {e}", file=sys.stderr)
    
    def execute_analysis(self, request):
        """분석 요청 실행"""
        try:
            method = request.get('method')
            if not method or method not in self.modules:
                return {
                    'error': f'Unknown analysis method: {method}',
                    'available_methods': list(self.modules.keys())
                }
            
            module = self.modules[method]
            if module is None:
                return {
                    'error': f'Module {method} not available',
                    'reason': 'Module failed to load or dependencies missing'
                }
            
            # 모듈의 main 함수 호출
            if hasattr(module, 'main'):
                # 임시로 stdin을 요청 데이터로 설정
                original_stdin = sys.stdin
                sys.stdin = MockStdin(json.dumps(request))
                
                try:
                    # 모듈 실행 (stdout 캡처)
                    import io
                    from contextlib import redirect_stdout
                    
                    output_buffer = io.StringIO()
                    with redirect_stdout(output_buffer):
                        module.main()
                    
                    result_str = output_buffer.getvalue()
                    return json.loads(result_str) if result_str.strip() else {}
                    
                finally:
                    sys.stdin = original_stdin
            else:
                return {
                    'error': f'Module {method} does not have main function'
                }
                
        except json.JSONDecodeError as e:
            return {
                'error': f'JSON decode error: {str(e)}',
                'traceback': traceback.format_exc()
            }
        except Exception as e:
            return {
                'error': f'Analysis execution failed: {str(e)}',
                'traceback': traceback.format_exc()
            }
    
    def run(self):
        """메인 실행 루프"""
        try:
            # stdin에서 요청 읽기
            input_data = sys.stdin.read()
            if not input_data.strip():
                print(json.dumps({'error': 'No input data provided'}))
                return
            
            request = json.loads(input_data)
            result = self.execute_analysis(request)
            
            # 결과 출력
            print(json.dumps(result))
            
        except json.JSONDecodeError as e:
            print(json.dumps({
                'error': f'Invalid JSON input: {str(e)}',
                'traceback': traceback.format_exc()
            }))
        except Exception as e:
            print(json.dumps({
                'error': f'Engine runner failed: {str(e)}',
                'traceback': traceback.format_exc()
            }))

class MockStdin:
    """stdin을 모킹하기 위한 클래스"""
    
    def __init__(self, data):
        self.data = data
        self.pos = 0
    
    def read(self, size=-1):
        if size == -1:
            result = self.data[self.pos:]
            self.pos = len(self.data)
            return result
        else:
            result = self.data[self.pos:self.pos + size]
            self.pos += len(result)
            return result
    
    def readline(self):
        newline_pos = self.data.find('\n', self.pos)
        if newline_pos == -1:
            result = self.data[self.pos:]
            self.pos = len(self.data)
        else:
            result = self.data[self.pos:newline_pos + 1]
            self.pos = newline_pos + 1
        return result

if __name__ == '__main__':
    runner = EngineRunner()
    runner.run() 