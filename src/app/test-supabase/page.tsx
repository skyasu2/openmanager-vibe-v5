import { createClient } from '@/utils/supabase/server';

export default async function TestSupabasePage() {
  const supabase = await createClient();

  // 테스트용 instruments 테이블에서 데이터 조회
  const { data: instruments, error } = await supabase
    .from('instruments')
    .select('*');

  if (error) {
    console.error('Supabase 오류:', error);
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='bg-white p-8 rounded-lg shadow-lg max-w-md w-full'>
          <h1 className='text-2xl font-bold text-red-600 mb-4'>
            🚨 Supabase 연결 오류
          </h1>
          <p className='text-gray-600 mb-4'>
            데이터베이스 연결에 실패했습니다.
          </p>
          <div className='bg-red-50 p-4 rounded border border-red-200'>
            <p className='text-sm text-red-700'>오류: {error.message}</p>
          </div>
          <div className='mt-6 space-y-2'>
            <h3 className='font-semibold text-gray-800'>해결 방법:</h3>
            <ol className='text-sm text-gray-600 list-decimal list-inside space-y-1'>
              <li>Supabase 프로젝트에서 instruments 테이블 생성</li>
              <li>RLS 정책 설정</li>
              <li>환경변수 확인</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-100 p-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-800 mb-8'>
          ✅ Supabase 연결 성공!
        </h1>

        <div className='bg-white rounded-lg shadow-lg p-6'>
          <h2 className='text-xl font-semibold text-gray-700 mb-4'>
            Instruments 테이블 데이터:
          </h2>

          {instruments && instruments.length > 0 ? (
            <div className='space-y-2'>
              {instruments.map((instrument: any) => (
                <div
                  key={instrument.id}
                  className='bg-blue-50 p-3 rounded border border-blue-200'
                >
                  <span className='font-medium text-blue-800'>
                    ID: {instrument.id}
                  </span>
                  <span className='ml-4 text-blue-600'>
                    Name: {instrument.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className='bg-yellow-50 p-4 rounded border border-yellow-200'>
              <p className='text-yellow-700'>
                테이블이 비어있습니다. 데이터를 추가해주세요.
              </p>
            </div>
          )}
        </div>

        <div className='mt-8 bg-green-50 p-6 rounded-lg border border-green-200'>
          <h3 className='text-lg font-semibold text-green-800 mb-2'>
            🎉 연결 정보
          </h3>
          <div className='text-sm text-green-700 space-y-1'>
            <p>• Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p>• 연결 상태: 성공</p>
            <p>• 데이터 개수: {instruments?.length || 0}개</p>
          </div>
        </div>

        <div className='mt-6 text-center'>
          <a
            href='/dashboard'
            className='inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'
          >
            대시보드로 이동
          </a>
        </div>
      </div>
    </div>
  );
}
