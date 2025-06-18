'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DevelopmentProcessPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            <div className="container mx-auto px-6 py-12">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 text-white"
                >
                    <ArrowLeft className="w-4 h-4" />
                    홈으로 돌아가기
                </Link>

                <div className="text-center">
                    <h1 className="text-5xl font-bold mb-4 text-white">
                        OpenManager Vibe v5
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            개발 과정
                        </span>
                    </h1>

                    <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
                        제로베이스에서 시작하여 구축한 실시간 서버 모니터링 시스템
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                            <div className="text-3xl font-bold text-blue-400 mb-2">20일</div>
                            <div className="text-sm text-white/80">개발 기간</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                            <div className="text-3xl font-bold text-purple-400 mb-2">603</div>
                            <div className="text-sm text-white/80">총 파일 수</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                            <div className="text-3xl font-bold text-green-400 mb-2">200K+</div>
                            <div className="text-sm text-white/80">코드 라인</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                            <div className="text-3xl font-bold text-orange-400 mb-2">1명</div>
                            <div className="text-sm text-white/80">개발 인원</div>
                        </div>
                    </div>

                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
                            <h3 className="text-xl font-bold text-white mb-4">🚀 핵심 기술</h3>
                            <ul className="text-sm text-white/80 space-y-2 text-left">
                                <li>• Next.js 15.3.2 + React 19.1.0</li>
                                <li>• Claude Sonnet 3.7 AI 통합</li>
                                <li>• Supabase + Redis 데이터</li>
                                <li>• MCP Protocol 구현</li>
                                <li>• TypeScript 100% 적용</li>
                            </ul>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
                            <h3 className="text-xl font-bold text-white mb-4">⚡ 주요 성과</h3>
                            <ul className="text-sm text-white/80 space-y-2 text-left">
                                <li>• 실시간 서버 모니터링</li>
                                <li>• AI 기반 자동 분석</li>
                                <li>• 한국어 자연어 질의</li>
                                <li>• 자동 장애 보고서</li>
                                <li>• 멀티 클라우드 배포</li>
                            </ul>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
                            <h3 className="text-xl font-bold text-white mb-4">🔧 운영 환경</h3>
                            <ul className="text-sm text-white/80 space-y-2 text-left">
                                <li>• Vercel 프론트엔드</li>
                                <li>• Render MCP 서버</li>
                                <li>• Supabase 데이터베이스</li>
                                <li>• Upstash Redis 캐시</li>
                                <li>• GitHub Actions CI/CD</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 