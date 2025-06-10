import { supabase } from '@/lib/supabase';
import { Suspense } from 'react';
import Link from 'next/link';

// Notes 데이터를 가져오는 컴포넌트
async function NotesContent() {
  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return (
        <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
          <h2 className='text-red-800 font-semibold mb-2'>
            ❌ 데이터베이스 오류
          </h2>
          <p className='text-red-600 mb-4'>{error.message}</p>
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <h3 className='text-yellow-800 font-medium mb-2'>🔧 해결 방법:</h3>
            <ol className='text-yellow-700 space-y-1 text-sm'>
              <li>
                1. <code>/api/notes/setup</code>에 POST 요청 보내기
              </li>
              <li>2. 또는 Supabase 대시보드에서 직접 테이블 생성</li>
            </ol>
          </div>
        </div>
      );
    }

    if (!notes || notes.length === 0) {
      return (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
          <h2 className='text-blue-800 font-semibold mb-2'>
            📝 노트가 없습니다
          </h2>
          <p className='text-blue-600 mb-4'>첫 번째 노트를 추가해보세요!</p>
          <button
            className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
            onClick={() => (window.location.href = '/api/notes/setup')}
          >
            샘플 데이터 생성
          </button>
        </div>
      );
    }

    return (
      <div className='space-y-6'>
        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
          <h2 className='text-green-800 font-semibold'>
            ✅ Supabase 연결 성공!
          </h2>
          <p className='text-green-600'>
            총 {notes.length}개의 노트를 찾았습니다.
          </p>
        </div>

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {notes.map((note: any) => (
            <div
              key={note.id}
              className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow'
            >
              <div className='flex items-start justify-between mb-3'>
                <h3 className='font-semibold text-gray-900 flex-1'>
                  {note.title}
                </h3>
                <span className='text-xs text-gray-500 ml-2'>#{note.id}</span>
              </div>

              {note.content && (
                <p className='text-gray-600 mb-4 text-sm leading-relaxed'>
                  {note.content}
                </p>
              )}

              <div className='text-xs text-gray-400 space-y-1'>
                <div>
                  생성: {new Date(note.created_at).toLocaleString('ko-KR')}
                </div>
                {note.updated_at !== note.created_at && (
                  <div>
                    수정: {new Date(note.updated_at).toLocaleString('ko-KR')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className='mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6'>
          <h3 className='font-semibold text-gray-900 mb-3'>
            🔍 데이터 상세 정보
          </h3>
          <pre className='bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm'>
            {JSON.stringify(notes, null, 2)}
          </pre>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
        <h2 className='text-red-800 font-semibold mb-2'>❌ 예기치 않은 오류</h2>
        <p className='text-red-600'>
          {error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.'}
        </p>
      </div>
    );
  }
}

// 로딩 컴포넌트
function NotesLoading() {
  return (
    <div className='space-y-6'>
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
        <div className='animate-pulse'>
          <div className='h-4 bg-blue-200 rounded w-1/4 mb-2'></div>
          <div className='h-3 bg-blue-100 rounded w-1/2'></div>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className='bg-white border border-gray-200 rounded-lg p-6 animate-pulse'
          >
            <div className='h-4 bg-gray-200 rounded w-3/4 mb-3'></div>
            <div className='h-3 bg-gray-100 rounded w-full mb-2'></div>
            <div className='h-3 bg-gray-100 rounded w-2/3 mb-4'></div>
            <div className='h-2 bg-gray-100 rounded w-1/2'></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function NotesPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-6xl mx-auto'>
          {/* 헤더 */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              📝 Notes - Supabase 연동 테스트
            </h1>
            <p className='text-gray-600'>
              OpenManager Vibe v5에서 Supabase PostgreSQL 데이터베이스 연동을
              테스트합니다.
            </p>
          </div>

          {/* 액션 버튼들 */}
          <div className='mb-6 flex flex-wrap gap-3'>
            <button
              onClick={() => (window.location.href = '/api/notes/setup')}
              className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm'
            >
              🔧 테이블 설정
            </button>
            <button
              onClick={() => window.location.reload()}
              className='bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm'
            >
              🔄 새로고침
            </button>
            <Link
              href='/'
              className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm'
            >
              🏠 홈으로
            </Link>
          </div>

          {/* 노트 콘텐츠 */}
          <Suspense fallback={<NotesLoading />}>
            <NotesContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
