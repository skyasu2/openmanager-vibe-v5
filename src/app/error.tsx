'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <div className="mb-4">
          <h1 className="text-6xl font-bold text-red-500 mb-2">500</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">
            예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            다시 시도
          </button>

          <Link
            href="/"
            className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>OpenManager Vibe v5</p>
          {error.digest && <p className="mt-2">Error ID: {error.digest}</p>}
        </div>
      </div>
    </div>
  )
}
