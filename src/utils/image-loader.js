/**
 * 🖼️ OpenManager Vibe v5 - 기본 이미지 로더
 * Sharp 모듈 없이 작동하는 안전한 이미지 로더
 */

export default function imageLoader({ src, width, quality }) {
  // 개발 환경에서는 원본 이미지 반환
  if (process.env.NODE_ENV === 'development') {
    return src;
  }

  // 프로덕션에서는 기본 최적화 파라미터 적용
  const params = new URLSearchParams();
  params.set('url', src);
  params.set('w', width.toString());
  params.set('q', (quality || 75).toString());

  return `/_next/image?${params}`;
}
