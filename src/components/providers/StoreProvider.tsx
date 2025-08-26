'use client';

import { createContext, useContext, useRef } from 'react';
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

export const ServerDataStoreProvider = ({
  children,
}: ServerDataStoreProviderProps) => {
  console.log('🚀 ServerDataStoreProvider 렌더링 시작');
  const storeRef = useRef<ServerDataStore | undefined>(undefined);
  if (!storeRef.current) {
    console.log('📦 새로운 Zustand 스토어 생성 중...');
    storeRef.current = createServerDataStore();
    console.log('✅ Zustand 스토어 생성 완료');
  }

  return (
    <ServerDataStoreContext.Provider value={storeRef.current}>
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
