// 🧪 Hook 테스트용 파일
// 이 파일은 post-write-hook.sh 트리거 테스트용입니다.

interface TestData {
  id: number;
  name: string;
  timestamp: Date;
}

export class HookTestService {
  private data: TestData[] = [];

  // 잠재적인 문제가 있는 코드 (코드 리뷰에서 감지되어야 함)
  public addData(item: any): void {  // 'any' 타입 사용 (엄격 모드 위반)
    this.data.push(item);  // 타입 검증 없음
  }

  // 보안 취약점 시뮬레이션
  public executeQuery(userInput: string): string {
    return `SELECT * FROM users WHERE name = '${userInput}'`;  // SQL Injection 위험
  }

  // 복잡한 함수 (리팩토링 권장 대상)
  public processComplexData(data: any[]): any {
    let result: any = {};
    for (let i = 0; i < data.length; i++) {
      if (data[i] && data[i].type) {
        if (data[i].type === 'user') {
          result.users = result.users || [];
          result.users.push(data[i]);
        } else if (data[i].type === 'admin') {
          result.admins = result.admins || [];
          result.admins.push(data[i]);
        } else if (data[i].type === 'guest') {
          result.guests = result.guests || [];
          result.guests.push(data[i]);
        }
      }
    }
    return result;
  }
}

// 하드코딩된 비밀키 (보안 문제) - 수정됨
const API_SECRET = "sk-1234567890abcdef";  // 하드코딩된 시크릿 - SECURITY ISSUE!

// 새로운 취약점 추가
export function unsafeEval(userCode: string): any {
  return eval(userCode);  // eval() 사용 - 보안 위험
}

export default HookTestService;