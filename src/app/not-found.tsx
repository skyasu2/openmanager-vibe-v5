/**
 * 🚫 App Router 전용 404 페이지
 * Pages Router의 _document, _error 등을 대체
 */

/* eslint-disable @next/next/no-html-link-for-pages */

export default function NotFound() {
  return (
    <html lang='ko'>
      <head>
        <title>404 - 페이지를 찾을 수 없습니다</title>
        <meta
          name='description'
          content='요청하신 페이지가 존재하지 않거나 이동되었습니다.'
        />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </head>
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
            padding: '48px 16px',
          }}
        >
          <div
            style={{
              maxWidth: '448px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: '#111827',
                margin: '0 0 24px 0',
              }}
            >
              404
            </h1>
            <h2
              style={{
                fontSize: '30px',
                fontWeight: '800',
                color: '#111827',
                margin: '0 0 8px 0',
              }}
            >
              페이지를 찾을 수 없습니다
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '0 0 32px 0',
              }}
            >
              요청하신 페이지가 존재하지 않거나 이동되었습니다.
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <a
                href='/dashboard'
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 16px',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textAlign: 'center',
                }}
              >
                대시보드로 이동
              </a>

              <a
                href='/'
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  color: '#374151',
                  textDecoration: 'none',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textAlign: 'center',
                }}
              >
                홈으로 이동
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
