'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Custom500() {
  // Hydration 에러 방지: 클라이언트에서만 시간 설정
  const [errorTime, setErrorTime] = useState<string>('');

  useEffect(() => {
    setErrorTime(new Date().toLocaleString());
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <div className="mb-6">
          <h1 className="mb-2 text-6xl font-bold text-red-500">500</h1>
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">
            서버 오류가 발생했습니다
          </h2>
          <p className="mb-6 text-gray-600">
            잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의하세요.
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full rounded bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600"
          >
            페이지 새로고침
          </button>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full rounded bg-gray-500 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-600"
          >
            이전 페이지로
          </button>

          <Link
            href="/"
            className="block w-full rounded bg-green-500 px-4 py-2 font-medium text-white transition-colors hover:bg-green-600"
          >
            홈으로 이동
          </Link>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>OpenManager</p>
          <p>오류 시간: {errorTime || '확인 중...'}</p>
        </div>
      </div>
    </div>
  );
}
