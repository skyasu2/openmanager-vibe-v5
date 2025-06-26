// Babel 설정 - Jest 전용으로 제한
module.exports = {
  // Jest 환경에서만 Babel 사용
  env: {
    test: {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
      plugins: [
        '@babel/plugin-transform-class-properties',
        '@babel/plugin-transform-object-rest-spread',
      ],
    },
  },
};
