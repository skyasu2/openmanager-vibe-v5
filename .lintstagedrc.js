module.exports = {
  '*.{ts,tsx}': ['prettier --write', 'eslint --cache --fix'],
  '*.{js,jsx}': ['prettier --write', 'eslint --cache --fix'],
  '*.{json,md,mdx,css,scss}': ['prettier --write'],
};
