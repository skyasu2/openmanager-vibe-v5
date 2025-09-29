'use client';

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

const getStore = (): ServerDataStore => {
  if (!globalStore) {
    console.log('📦 Zustand 스토어 최초 생성 (모듈 싱글톤)');
    globalStore = createServerDataStore();
    console.log('✅ Zustand 스토어 생성 완료 - 메모리 안전');
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
