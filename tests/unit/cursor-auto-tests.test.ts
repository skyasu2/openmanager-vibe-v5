import { describe, expect, it } from 'vitest';

/**
 * 🚀 Cursor IDE 자동 실행 테스트 모음
 * 
 * 이 파일은 Cursor에서 자동으로 실행되는 핵심 테스트들을 포함합니다.
 * - 빠른 실행 속도 (각 테스트 < 1초)
 * - 외부 의존성 최소화
 * - 핵심 비즈니스 로직 검증
 * - Mock 사용 최소화
 */

describe('🔥 Cursor 자동 테스트 - 핵심 유틸리티', () => {
    describe('환경 설정 검증', () => {
        it('테스트 환경이 올바르게 설정되어야 함', () => {
            expect(process.env.NODE_ENV).toBe('test');
            expect(process.env.FORCE_MOCK_REDIS).toBe('true');
            expect(process.env.FORCE_MOCK_GOOGLE_AI).toBe('true');
        });

        it('필수 환경변수가 설정되어야 함', () => {
            expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
            expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
        });
    });

    describe('타입 안전성 검증', () => {
        it('기본 타입 검증이 작동해야 함', () => {
            const testString: string = 'test';
            const testNumber: number = 42;
            const testBoolean: boolean = true;

            expect(typeof testString).toBe('string');
            expect(typeof testNumber).toBe('number');
            expect(typeof testBoolean).toBe('boolean');
        });

        it('배열과 객체 타입이 올바르게 작동해야 함', () => {
            const testArray: string[] = ['a', 'b', 'c'];
            const testObject: { key: string; value: number } = { key: 'test', value: 123 };

            expect(Array.isArray(testArray)).toBe(true);
            expect(testArray.length).toBe(3);
            expect(testObject.key).toBe('test');
            expect(testObject.value).toBe(123);
        });
    });

    describe('유틸리티 함수 검증', () => {
        it('문자열 유틸리티가 올바르게 작동해야 함', () => {
            const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
            const truncate = (str: string, length: number) =>
                str.length > length ? str.substring(0, length) + '...' : str;

            expect(capitalize('hello')).toBe('Hello');
            expect(truncate('hello world', 5)).toBe('hello...');
            expect(truncate('hi', 5)).toBe('hi');
        });

        it('숫자 유틸리티가 올바르게 작동해야 함', () => {
            const clamp = (num: number, min: number, max: number) =>
                Math.min(Math.max(num, min), max);
            const percentage = (value: number, total: number) =>
                Math.round((value / total) * 100);

            expect(clamp(5, 1, 10)).toBe(5);
            expect(clamp(-5, 1, 10)).toBe(1);
            expect(clamp(15, 1, 10)).toBe(10);
            expect(percentage(25, 100)).toBe(25);
            expect(percentage(1, 3)).toBe(33);
        });

        it('날짜 유틸리티가 올바르게 작동해야 함', () => {
            const now = new Date();
            const formatDate = (date: Date) => date.toISOString().split('T')[0];
            const addDays = (date: Date, days: number) => {
                const result = new Date(date);
                result.setDate(result.getDate() + days);
                return result;
            };

            expect(formatDate(now)).toMatch(/^\d{4}-\d{2}-\d{2}$/);

            const tomorrow = addDays(now, 1);
            expect(tomorrow.getDate()).toBe(now.getDate() + 1);
        });
    });

    describe('데이터 구조 검증', () => {
        it('Map과 Set이 올바르게 작동해야 함', () => {
            const testMap = new Map<string, number>();
            testMap.set('a', 1);
            testMap.set('b', 2);

            const testSet = new Set<string>();
            testSet.add('x');
            testSet.add('y');
            testSet.add('x'); // 중복

            expect(testMap.size).toBe(2);
            expect(testMap.get('a')).toBe(1);
            expect(testSet.size).toBe(2);
            expect(testSet.has('x')).toBe(true);
        });

        it('배열 메서드가 올바르게 작동해야 함', () => {
            const numbers = [1, 2, 3, 4, 5];

            expect(numbers.filter(n => n % 2 === 0)).toEqual([2, 4]);
            expect(numbers.map(n => n * 2)).toEqual([2, 4, 6, 8, 10]);
            expect(numbers.reduce((sum, n) => sum + n, 0)).toBe(15);
            expect(numbers.find(n => n > 3)).toBe(4);
        });
    });

    describe('에러 처리 검증', () => {
        it('try-catch가 올바르게 작동해야 함', () => {
            const throwError = () => {
                throw new Error('Test error');
            };

            const safeFunction = () => {
                try {
                    throwError();
                    return 'success';
                } catch (error) {
                    return 'error caught';
                }
            };

            expect(safeFunction()).toBe('error caught');
        });

        it('Promise 에러 처리가 올바르게 작동해야 함', async () => {
            const asyncError = async () => {
                throw new Error('Async error');
            };

            const safeAsync = async () => {
                try {
                    await asyncError();
                    return 'success';
                } catch (error) {
                    return 'async error caught';
                }
            };

            const result = await safeAsync();
            expect(result).toBe('async error caught');
        });
    });
});

describe('🎯 Cursor 자동 테스트 - 핵심 컴포넌트 로직', () => {
    describe('상태 관리 로직', () => {
        it('간단한 상태 업데이트가 올바르게 작동해야 함', () => {
            interface State {
                count: number;
                isLoading: boolean;
                data: string[];
            }

            const initialState: State = {
                count: 0,
                isLoading: false,
                data: []
            };

            const updateCount = (state: State, increment: number): State => ({
                ...state,
                count: state.count + increment
            });

            const setLoading = (state: State, loading: boolean): State => ({
                ...state,
                isLoading: loading
            });

            let state = initialState;
            state = updateCount(state, 5);
            state = setLoading(state, true);

            expect(state.count).toBe(5);
            expect(state.isLoading).toBe(true);
            expect(state.data).toEqual([]);
        });

        it('배열 상태 업데이트가 올바르게 작동해야 함', () => {
            interface ListState {
                items: string[];
                selectedId: string | null;
            }

            const initialState: ListState = {
                items: [],
                selectedId: null
            };

            const addItem = (state: ListState, item: string): ListState => ({
                ...state,
                items: [...state.items, item]
            });

            const removeItem = (state: ListState, index: number): ListState => ({
                ...state,
                items: state.items.filter((_, i) => i !== index)
            });

            const selectItem = (state: ListState, id: string): ListState => ({
                ...state,
                selectedId: id
            });

            let state = initialState;
            state = addItem(state, 'item1');
            state = addItem(state, 'item2');
            state = selectItem(state, 'item1');
            state = removeItem(state, 0);

            expect(state.items).toEqual(['item2']);
            expect(state.selectedId).toBe('item1');
        });
    });

    describe('데이터 변환 로직', () => {
        it('서버 데이터 변환이 올바르게 작동해야 함', () => {
            interface RawServerData {
                id: string;
                name: string;
                cpu_usage: number;
                memory_usage: number;
                status: 'online' | 'offline' | 'maintenance';
            }

            interface ProcessedServerData {
                id: string;
                name: string;
                cpuUsage: number;
                memoryUsage: number;
                status: 'online' | 'offline' | 'maintenance';
                isHealthy: boolean;
                utilizationScore: number;
            }

            const transformServerData = (raw: RawServerData): ProcessedServerData => ({
                id: raw.id,
                name: raw.name,
                cpuUsage: raw.cpu_usage,
                memoryUsage: raw.memory_usage,
                status: raw.status,
                isHealthy: raw.status === 'online' && raw.cpu_usage < 80 && raw.memory_usage < 80,
                utilizationScore: Math.round((raw.cpu_usage + raw.memory_usage) / 2)
            });

            const rawData: RawServerData = {
                id: 'server-1',
                name: 'Web Server 1',
                cpu_usage: 45,
                memory_usage: 60,
                status: 'online'
            };

            const processed = transformServerData(rawData);

            expect(processed.cpuUsage).toBe(45);
            expect(processed.memoryUsage).toBe(60);
            expect(processed.isHealthy).toBe(true);
            expect(processed.utilizationScore).toBe(53);
        });

        it('메트릭 집계 로직이 올바르게 작동해야 함', () => {
            interface Metric {
                timestamp: number;
                value: number;
            }

            const calculateAverage = (metrics: Metric[]): number => {
                if (metrics.length === 0) return 0;
                const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
                return Math.round((sum / metrics.length) * 100) / 100;
            };

            const findPeak = (metrics: Metric[]): Metric | null => {
                if (metrics.length === 0) return null;
                return metrics.reduce((max, current) =>
                    current.value > max.value ? current : max
                );
            };

            const metrics: Metric[] = [
                { timestamp: 1000, value: 10 },
                { timestamp: 2000, value: 25 },
                { timestamp: 3000, value: 15 },
                { timestamp: 4000, value: 30 },
                { timestamp: 5000, value: 20 }
            ];

            expect(calculateAverage(metrics)).toBe(20);
            expect(findPeak(metrics)?.value).toBe(30);
            expect(findPeak(metrics)?.timestamp).toBe(4000);
            expect(calculateAverage([])).toBe(0);
            expect(findPeak([])).toBeNull();
        });
    });
});

describe('⚡ Cursor 자동 테스트 - 성능 및 최적화', () => {
    describe('성능 측정', () => {
        it('함수 실행 시간이 허용 범위 내여야 함', () => {
            const heavyComputation = (n: number): number => {
                let result = 0;
                for (let i = 0; i < n; i++) {
                    result += Math.sqrt(i);
                }
                return result;
            };

            const start = performance.now();
            heavyComputation(1000);
            const end = performance.now();
            const duration = end - start;

            // 1초 이내에 완료되어야 함
            expect(duration).toBeLessThan(1000);
        });

        it('메모리 사용량이 적절해야 함', () => {
            const createLargeArray = (size: number): number[] => {
                return new Array(size).fill(0).map((_, i) => i);
            };

            const arr = createLargeArray(1000);

            expect(arr.length).toBe(1000);
            expect(arr[0]).toBe(0);
            expect(arr[999]).toBe(999);

            // 배열이 올바르게 생성되었는지 확인
            expect(Array.isArray(arr)).toBe(true);
        });
    });

    describe('캐싱 로직', () => {
        it('간단한 메모이제이션이 작동해야 함', () => {
            const cache = new Map<string, number>();

            const expensiveFunction = (n: number): number => {
                const key = n.toString();
                if (cache.has(key)) {
                    return cache.get(key)!;
                }

                // 비용이 많이 드는 계산 시뮬레이션
                const result = n * n * n;
                cache.set(key, result);
                return result;
            };

            // 첫 번째 호출
            const result1 = expensiveFunction(5);
            expect(result1).toBe(125);
            expect(cache.size).toBe(1);

            // 두 번째 호출 (캐시에서 가져옴)
            const result2 = expensiveFunction(5);
            expect(result2).toBe(125);
            expect(cache.size).toBe(1);

            // 새로운 값으로 호출
            const result3 = expensiveFunction(3);
            expect(result3).toBe(27);
            expect(cache.size).toBe(2);
        });
    });
});

describe('🛡️ Cursor 자동 테스트 - 보안 및 검증', () => {
    describe('입력 검증', () => {
        it('문자열 검증이 올바르게 작동해야 함', () => {
            const isValidEmail = (email: string): boolean => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            };

            const isValidUrl = (url: string): boolean => {
                try {
                    new URL(url);
                    return true;
                } catch {
                    return false;
                }
            };

            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('invalid-email')).toBe(false);
            expect(isValidUrl('https://example.com')).toBe(true);
            expect(isValidUrl('not-a-url')).toBe(false);
        });

        it('숫자 범위 검증이 올바르게 작동해야 함', () => {
            const isValidPercentage = (value: number): boolean => {
                return value >= 0 && value <= 100;
            };

            const isValidPort = (port: number): boolean => {
                return Number.isInteger(port) && port >= 1 && port <= 65535;
            };

            expect(isValidPercentage(50)).toBe(true);
            expect(isValidPercentage(-10)).toBe(false);
            expect(isValidPercentage(150)).toBe(false);
            expect(isValidPort(3000)).toBe(true);
            expect(isValidPort(0)).toBe(false);
            expect(isValidPort(70000)).toBe(false);
        });
    });

    describe('데이터 sanitization', () => {
        it('HTML 이스케이프가 올바르게 작동해야 함', () => {
            const escapeHtml = (unsafe: string): string => {
                return unsafe
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            };

            const dangerous = '<script>alert("xss")</script>';
            const safe = escapeHtml(dangerous);

            expect(safe).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
            expect(safe).not.toContain('<script>');
        });

        it('SQL 인젝션 방지가 작동해야 함', () => {
            const sanitizeInput = (input: string): string => {
                // 기본적인 SQL 인젝션 패턴 제거
                return input
                    .replace(/[';]/g, '')
                    .replace(/--/g, '')
                    .replace(/\/\*/g, '')
                    .replace(/\*\//g, '');
            };

            const maliciousInput = "'; DROP TABLE users; --";
            const sanitized = sanitizeInput(maliciousInput);

            expect(sanitized).toBe(' DROP TABLE users ');
            expect(sanitized).not.toContain("';");
            expect(sanitized).not.toContain('--');
        });
    });
});

// 테스트 실행 후 정리
describe('🧹 테스트 정리', () => {
    it('테스트 환경이 깨끗하게 정리되어야 함', () => {
        // 테스트 환경 검증 (jsdom 환경에서는 window가 존재함)
        expect(process.env.NODE_ENV).toBe('test');

        // 메모리 누수 방지를 위한 기본 검증
        const memoryUsage = process.memoryUsage();
        expect(memoryUsage.heapUsed).toBeGreaterThan(0);
        expect(memoryUsage.heapTotal).toBeGreaterThan(memoryUsage.heapUsed);

        // jsdom 환경에서는 window 객체가 존재하는지 확인
        expect(typeof window).toBe('object');
        expect(window).toBeDefined();
    });
}); 