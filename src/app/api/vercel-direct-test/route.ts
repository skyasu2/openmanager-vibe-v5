/**
 * 🚀 Vercel 직접 Google AI 테스트 API
 * 의존성 최소화로 서버리스 환경에서 안전하게 작동
 */

import { NextRequest, NextResponse } from 'next/server';

// 하드코딩된 API 키 (테스트용)
const GOOGLE_AI_API_KEY = 'AIzaSyABFUHbGGtjs6S_y756H4SYJmFNuNoo3fY';
const GOOGLE_AI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export async function GET() {
    const startTime = Date.now();

    try {
        // 1. 환경변수 상태 확인
        const envStatus = {
            hasEnvKey: !!process.env.GOOGLE_AI_API_KEY,
            envKeyValue: process.env.GOOGLE_AI_API_KEY ?
                `${process.env.GOOGLE_AI_API_KEY.substring(0, 8)}...${process.env.GOOGLE_AI_API_KEY.substring(process.env.GOOGLE_AI_API_KEY.length - 4)}` :
                null,
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV,
            timestamp: new Date().toISOString(),
        };

        // 2. 사용할 API 키 결정
        const apiKey = process.env.GOOGLE_AI_API_KEY || GOOGLE_AI_API_KEY;
        const keySource = process.env.GOOGLE_AI_API_KEY ? 'environment' : 'hardcoded';

        // 3. Google AI API 직접 호출 테스트
        const testPrompt = 'OpenManager Vibe v5 AI 엔진 상태 점검 완료!';
        const url = `${GOOGLE_AI_BASE_URL}/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: testPrompt
                }]
            }]
        };

        console.log('🔑 Google AI 직접 테스트 시작:', {
            keySource,
            url: url.replace(apiKey, 'HIDDEN'),
            prompt: testPrompt
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const processingTime = Date.now() - startTime;

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

            return NextResponse.json({
                success: false,
                error: {
                    status: response.status,
                    statusText: response.statusText,
                    message: errorData.error?.message || 'Google AI API 호출 실패',
                    details: errorData,
                },
                debug: {
                    envStatus,
                    keySource,
                    processingTime: `${processingTime}ms`,
                    timestamp: new Date().toISOString(),
                }
            }, { status: 200 }); // 디버깅을 위해 200으로 반환
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

        return NextResponse.json({
            success: true,
            data: {
                prompt: testPrompt,
                response: aiResponse,
                tokensUsed: data.usageMetadata?.totalTokenCount || 0,
                model: 'gemini-1.5-flash',
                processingTime: `${processingTime}ms`,
            },
            debug: {
                envStatus,
                keySource,
                responseStatus: response.status,
                timestamp: new Date().toISOString(),
            },
            vercel: {
                message: '✅ Vercel 서버리스에서 Google AI 직접 연결 성공!',
                environment: process.env.VERCEL_ENV || 'development',
                region: process.env.VERCEL_REGION || 'unknown',
            }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;

        console.error('❌ Vercel Google AI 테스트 실패:', error);

        return NextResponse.json({
            success: false,
            error: {
                message: error.message || 'Unknown error',
                type: error.constructor.name,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            debug: {
                processingTime: `${processingTime}ms`,
                timestamp: new Date().toISOString(),
                nodeEnv: process.env.NODE_ENV,
                vercelEnv: process.env.VERCEL_ENV,
            },
            fallback: {
                message: '🚀 Vercel 서버리스 환경에서 실행 중',
                hardcodedKeyAvailable: !!GOOGLE_AI_API_KEY,
                envKeyAvailable: !!process.env.GOOGLE_AI_API_KEY,
            }
        }, { status: 200 }); // 디버깅을 위해 200으로 반환
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prompt = 'Vercel에서 Google AI 테스트 중입니다!' } = body;

        // GET과 동일한 로직이지만 커스텀 프롬프트 사용
        const startTime = Date.now();
        const apiKey = process.env.GOOGLE_AI_API_KEY || GOOGLE_AI_API_KEY;
        const url = `${GOOGLE_AI_BASE_URL}/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const processingTime = Date.now() - startTime;

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Google AI API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

        return NextResponse.json({
            success: true,
            data: {
                prompt,
                response: aiResponse,
                tokensUsed: data.usageMetadata?.totalTokenCount || 0,
                processingTime: `${processingTime}ms`,
                confidence: 0.95,
            },
            vercel: {
                message: '✅ Vercel POST 요청으로 Google AI 성공!',
                timestamp: new Date().toISOString(),
            }
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: {
                message: error.message,
                timestamp: new Date().toISOString(),
            }
        }, { status: 200 });
    }
} 