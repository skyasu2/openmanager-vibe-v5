// Babel 설정 - Jest 전용으로 제한
module.exports = function (api) {
  // 환경 캐싱 활성화
  api.cache(true);

  // Jest 환경이 아니면 빈 설정 반환 (Next.js가 SWC 사용하도록)
  if (process.env.NODE_ENV !== 'test') {
    return {};
  }

  // Jest 환경에서만 Babel 사용
  return {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      '@babel/preset-typescript',
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
    plugins: [
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-object-rest-spread',
    ],
  };
};
