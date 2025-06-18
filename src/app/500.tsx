/**
 * 🚨 500 Internal Server Error 페이지
 * Next.js 15 App Router 규격
 */

import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '500 - 서버 오류',
    description: '내부 서버 오류가 발생했습니다.',
};

export default function InternalServerError() {
    return (
        <html lang="ko">
            <body>
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-gray-900 to-red-900">
                    <div className="text-center space-y-6 p-8">
                        <div className="space-y-2">
                            <h1 className="text-6xl font-bold text-white">500</h1>
                            <h2 className="text-2xl font-semibold text-red-300">내부 서버 오류</h2>
                            <p className="text-gray-400 max-w-md mx-auto">
                                서버에서 예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Link
                                href="/"
                                className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                            >
                                홈으로 돌아가기
                            </Link>

                            <div className="text-sm text-gray-500">
                                <p>문제가 지속되면 관리자에게 문의하세요.</p>
                                <p className="mt-2">오류 코드: 500</p>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
} 