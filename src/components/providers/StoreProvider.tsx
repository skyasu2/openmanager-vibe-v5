'use client';

import { createContext, useContext, useMemo } from 'react';
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

// 🚀 싱글톤 패턴: 전역 스토어 인스턴스 (메모리 누수 완전 방지)
let globalServerDataStore: ServerDataStore | null = null;

export const ServerDataStoreProvider = ({
  children,
}: ServerDataStoreProviderProps) => {
  // 🎯 useMemo + 싱글톤으로 중복 생성 완전 차단
  const store = useMemo(() => {
    if (!globalServerDataStore) {
      console.log('📦 전역 Zustand 스토어 최초 생성...');
      globalServerDataStore = createServerDataStore();
      console.log('✅ 전역 Zustand 스토어 생성 완료 (싱글톤)');
    } else {
      console.log('🔄 기존 전역 Zustand 스토어 재사용');
    }
    return globalServerDataStore;
  }, []);

  return (
    <ServerDataStoreContext.Provider value={store}>
      {children}
    </ServerDataStoreContext.Provider>
  );
};

export const useServerDataStore = <T,>(
  selector: (store: ServerDataState) => T
): T => {
  console.log('🔍 useServerDataStore 호출됨');
  const serverDataStoreContext = useContext(ServerDataStoreContext);

  if (!serverDataStoreContext) {
    console.error('❌ ServerDataStoreProvider 컨텍스트가 없습니다!');
    throw new Error(
      `useServerDataStore must be use within ServerDataStoreProvider`
    );
  }

  console.log('✅ ServerDataStoreProvider 컨텍스트 사용 가능');
  return useStore(serverDataStoreContext, selector);
};
