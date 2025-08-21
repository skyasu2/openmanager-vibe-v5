/**
 * 🧪 AI 교차 검증 시스템 테스트 파일
 * 
 * 의도적으로 포함된 문제들:
 * 1. 보안 취약점 (eval, dangerouslySetInnerHTML)
 * 2. 타입 안전성 문제 (any 사용)
 * 3. 성능 문제 (중첩 루프)
 * 4. 아키텍처 문제 (단일 책임 원칙 위반)
 * 5. 메모리 누수 위험
 * 
 * 각 AI가 찾아야 할 문제:
 * - Claude: TypeScript 타입 문제, Next.js 최적화
 * - Gemini: 아키텍처 및 SOLID 원칙 위반
 * - Codex: 보안 취약점 및 실무 문제
 * - Qwen: 알고리즘 비효율성
 */

import { useState, useEffect } from 'react';

// 🚨 문제 1: any 타입 사용 (Claude가 찾아야 함)
export function processUserData(data: any): any {
  // 🚨 문제 2: eval 사용 - 보안 취약점 (Codex가 찾아야 함)
  const result = eval(data.expression);
  
  // 🚨 문제 3: 하드코딩된 API 키 (모든 AI가 찾아야 함)
  const API_KEY = 'sk_live_123456789abcdef';
  
  return result;
}

// 🚨 문제 4: 단일 책임 원칙 위반 (Gemini가 찾아야 함)
export class UserManagerAndEmailSenderAndLogger {
  private users: any[] = [];
  private eventListeners: Map<string, Function> = new Map();
  
  constructor() {
    // 🚨 문제 5: 메모리 누수 - 이벤트 리스너 정리 안 함 (Codex가 찾아야 함)
    window.addEventListener('resize', this.handleResize);
    setInterval(() => this.checkUsers(), 1000);
  }
  
  // 너무 많은 책임을 가진 메서드들
  createUser(name: string) { /* ... */ }
  sendEmail(to: string, subject: string) { /* ... */ }
  logActivity(activity: string) { /* ... */ }
  generateReport() { /* ... */ }
  calculateStatistics() { /* ... */ }
  
  private handleResize = () => {
    console.log('Resized');
  }
  
  // 🚨 문제 6: O(n^3) 복잡도 - 성능 문제 (Qwen이 찾아야 함)
  findDuplicates(items: number[]): number[] {
    const duplicates = [];
    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items.length; j++) {
        for (let k = 0; k < items.length; k++) {
          if (i !== j && j !== k && items[i] === items[j]) {
            duplicates.push(items[i]);
          }
        }
      }
    }
    return duplicates;
  }
  
  private checkUsers() {
    // 타이머가 계속 실행됨 - 정리 안 함
  }
}

// 🚨 문제 7: React 컴포넌트 내 보안 취약점 (Codex가 찾아야 함)
export function UnsafeComponent({ htmlContent }: { htmlContent: string }) {
  const [state, setState] = useState<any>(null); // any 타입
  
  useEffect(() => {
    // 🚨 문제 8: useEffect 의존성 배열 누락 (Claude가 찾아야 함)
    fetch('/api/data')
      .then(res => res.json())
      .then(setState);
  }); // 의존성 배열 없음 - 무한 루프
  
  return (
    <div>
      {/* 🚨 문제 9: XSS 취약점 (Codex가 찾아야 함) */}
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      
      {/* 🚨 문제 10: 인라인 스크립트 주입 가능 */}
      <div innerHTML={htmlContent} />
    </div>
  );
}

// 🚨 문제 11: 비효율적인 알고리즘 (Qwen이 찾아야 함)
export function inefficientSort(arr: number[]): number[] {
  // Bubble sort - O(n^2)
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

// 🚨 문제 12: 환경변수 직접 노출 (보안 문제)
export const config = {
  // process.env를 클라이언트에 노출
  apiKey: process.env.STRIPE_SECRET_KEY,
  dbPassword: process.env.DATABASE_PASSWORD,
};

// 예상 교차 검증 결과:
// - Claude: 5개 문제 발견 (타입, useEffect, Next.js)
// - Gemini: 3개 문제 발견 (아키텍처, SOLID)
// - Codex: 6개 문제 발견 (보안, 메모리 누수)
// - Qwen: 3개 문제 발견 (알고리즘 효율성)
// 
// 교차 발견:
// - API 키 하드코딩: 모든 AI가 발견해야 함
// - 일부 문제는 특정 AI만 발견 가능