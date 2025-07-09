'use client';

import { type ReactNode, createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';

import {
    type ServerDataStore,
    type ServerDataState,
    createServerDataStore,
} from '@/stores/serverDataStore';

export const ServerDataStoreContext =
    createContext<ServerDataStore | null>(null);

export interface ServerDataStoreProviderProps {
    children: ReactNode;
}

export const ServerDataStoreProvider = ({
    children,
}: ServerDataStoreProviderProps) => {
    const storeRef = useRef<ServerDataStore>();
    if (!storeRef.current) {
        storeRef.current = createServerDataStore();
    }

    return (
        <ServerDataStoreContext.Provider value={storeRef.current}>
            {children}
        </ServerDataStoreContext.Provider>
    );
};

export const useServerDataStore = <T,>(
    selector: (store: ServerDataState) => T,
): T => {
    const serverDataStoreContext = useContext(ServerDataStoreContext);

    if (!serverDataStoreContext) {
        throw new Error(
            `useServerDataStore must be use within ServerDataStoreProvider`
        );
    }

    return useStore(serverDataStoreContext, selector);
}; 