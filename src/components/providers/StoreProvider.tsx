'use client';

import React from 'react'; // 🧪 테스트 환경에서 JSX 트랜스폼을 위해 명시적 import 필요
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useStore } from 'zustand';

import {
  type ServerDataStore,
  type ServerDataState,
  createServerDataStore,
} from '@/stores/serverDataStore';

export const ServerDataStoreContext = createContext<ServerDataStore | null>(
  null
);

export interface ServerDataStoreProviderProps {
  children: ReactNode;
}

// 🎯 모듈 레벨 싱글톤 - SSR/CSR 환경에서 진정한 싱글톤 보장
let globalStore: ServerDataStore | null = null;

// 🧪 테스트 격리를 위한 리셋 함수 (Critical 사이드 이펙트 해결)
export const resetGlobalStore = () => {
  globalStore = null;
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Zustand 스토어 리셋 완료 (테스트 격리)');
  }
};

// 🛡️ 에러 처리 강화된 스토어 생성 함수 (High Priority 사이드 이펙트 해결)
const getStore = (): ServerDataStore => {
  if (!globalStore) {
    try {
      globalStore = createServerDataStore();

      // 🔧 환경별 로깅 분리 (Medium Priority 사이드 이펙트 해결)
      if (process.env.NODE_ENV === 'development') {
        console.log('📦 Zustand 스토어 최초 생성 (모듈 싱글톤)');
        console.log('✅ Zustand 스토어 생성 완료 - 메모리 안전');

        // 🛠️ 개발자 도구 연동 (개발 편의성 향상)
        if (typeof window !== 'undefined') {
          (window as unknown as Record<string, unknown>).__ZUSTAND_STORE__ = globalStore;
        }
      }
    } catch (error) {
      // 🚨 프로덕션 에러 처리 (앱 크래시 방지)
      console.error('❌ Zustand 스토어 생성 실패:', error);
      throw new Error('스토어 초기화에 실패했습니다. 페이지를 새로고침 해주세요.');
    }
  }
  return globalStore;
};

export const ServerDataStoreProvider = ({
  children,
}: ServerDataStoreProviderProps) => {
  const store = getStore();

  return (
    <ServerDataStoreContext.Provider value={store}>
      {children}
    </ServerDataStoreContext.Provider>
  );
};

export const useServerDataStore = <T,>(
  selector: (store: ServerDataState) => T
): T => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 useServerDataStore 호출됨');
  }

  const serverDataStoreContext = useContext(ServerDataStoreContext);

  if (!serverDataStoreContext) {
    console.error('❌ ServerDataStoreProvider 컨텍스트가 없습니다!');
    throw new Error(
      `useServerDataStore must be use within ServerDataStoreProvider`
    );
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ ServerDataStoreProvider 컨텍스트 사용 가능');
  }

  return useStore(serverDataStoreContext, selector);
};
