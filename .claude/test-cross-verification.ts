// 테스트 파일: AI 교차 검증 시스템 테스트용
// 의도적으로 여러 문제를 포함시켜 각 AI가 다른 문제를 발견하는지 확인

import { useState } from 'react';

// 🔴 보안 문제: eval 사용 (모든 AI가 감지해야 함)
function dangerousEval(code: string) {
  return eval(code);  // 절대 사용하면 안됨
}

// 🟡 TypeScript strict 문제: any 타입 사용 (Claude가 주로 감지)
function processData(data: any) {
  return data.value * 2;  // any 타입은 strict 모드 위반
}

// 🟡 아키텍처 문제: 싱글톤 패턴 잘못 구현 (Gemini가 주로 감지)
class DatabaseConnection {
  private static instance: DatabaseConnection;
  
  constructor() {
    // 메모리 누수 가능성: 이벤트 리스너 정리 안함
    window.addEventListener('resize', this.handleResize);
  }
  
  private handleResize = () => {
    console.log('resized');
  }
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new DatabaseConnection();
    }
    return this.instance;
  }
}

// 🟡 실무 문제: 에러 핸들링 미흡 (Codex가 주로 감지)
async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();  // 에러 처리 없음
  return data;
}

// 🟡 알고리즘 문제: 비효율적인 중첩 루프 (Qwen이 주로 감지)
function findDuplicates(arr: number[]) {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) {
        duplicates.push(arr[i]);  // O(n²) 복잡도
      }
    }
  }
  return duplicates;
}

// 🟢 Next.js 최적화 문제 (Claude가 주로 감지)
export default function UserProfile({ userId }: { userId: string }) {
  // useState 대신 서버 컴포넌트 사용 가능
  const [user, setUser] = useState(null);
  
  // useEffect 대신 서버사이드 데이터 페칭 가능
  useEffect(() => {
    fetchUserData(userId).then(setUser);
  }, [userId]);
  
  return <div>{user?.name}</div>;
}

// 🔴 환경변수 노출 (모든 AI가 감지해야 함)
const API_KEY = "sk_live_51234567890abcdef";  // Stripe 프로덕션 키 노출

export { dangerousEval, processData, DatabaseConnection, fetchUserData, findDuplicates, API_KEY };