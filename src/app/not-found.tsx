/**
 * 🚫 404 Not Found 페이지
 * Next.js 15 App Router 규격
 */

'use client';

import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - 페이지를 찾을 수 없습니다',
  description: '요청하신 페이지가 존재하지 않습니다.',
};

export default function NotFound() {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
          <div className="text-center space-y-6 p-8">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-white">404</h1>
              <h2 className="text-2xl font-semibold text-blue-300">페이지를 찾을 수 없습니다</h2>
              <p className="text-gray-400 max-w-md mx-auto">
                요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                홈으로 돌아가기
              </Link>

              <div className="text-sm text-gray-500">
                <p>문제가 지속되면 관리자에게 문의하세요.</p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 