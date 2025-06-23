/**
 * 🔧 React 19 호환성 레이어
 * OpenManager Vibe v5 - React 19 호환성 업데이트
 */

import { act as reactAct } from 'react';

export interface ReactCompatOptions {
    suppressWarnings?: boolean;
    timeoutMs?: number;
}

export function compatAct<T>(
    callback: () => T | Promise<T>,
    options: ReactCompatOptions = {}
): Promise<T> {
    const { timeoutMs = 5000, suppressWarnings = false } = options;

    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error(`React.act timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        try {
            const result = reactAct(() => {
                const callbackResult = callback();

                if (callbackResult && typeof callbackResult === 'object' && 'then' in callbackResult) {
                    return callbackResult as Promise<T>;
                }

                return callbackResult as T;
            });

            if (result && typeof result === 'object' && 'then' in result) {
                result.then(
                    (value: T) => {
                        clearTimeout(timeoutId);
                        resolve(value);
                    },
                    (error: Error) => {
                        clearTimeout(timeoutId);
                        reject(error);
                    }
                );
            } else {
                clearTimeout(timeoutId);
                resolve(result as T);
            }
        } catch (error) {
            clearTimeout(timeoutId);
            if (!suppressWarnings) {
                console.warn('React.act compatibility warning:', error);
            }
            reject(error);
        }
    });
}

export function getReactVersion(): string {
    try {
        const React = require('react');
        return React.version || '18.0.0';
    } catch {
        return '18.0.0';
    }
}

export function isReact19(): boolean {
    const version = getReactVersion();
    const majorVersion = parseInt(version.split('.')[0], 10);
    return majorVersion >= 19;
}

export function setupReactTestCompat(): void {
    if (process.env.NODE_ENV === 'test') {
        const originalConsoleWarn = console.warn;
        console.warn = (...args: any[]) => {
            const message = args.join(' ');

            if (
                message.includes('ReactDOMTestUtils.act') ||
                message.includes('React.act') ||
                message.includes('act(...)')
            ) {
                return;
            }

            originalConsoleWarn.apply(console, args);
        };
    }
}

export async function safeRenderAct<T>(renderFn: () => T | Promise<T>): Promise<T> {
    try {
        return await compatAct(renderFn, { suppressWarnings: true, timeoutMs: 10000 });
    } catch (error) {
        console.warn('Safe render act failed, falling back to direct execution:', error);
        return renderFn() as T;
    }
}

if (typeof window !== 'undefined' || process.env.NODE_ENV === 'test') {
    setupReactTestCompat();
}
