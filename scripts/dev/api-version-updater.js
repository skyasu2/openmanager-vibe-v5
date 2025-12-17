/**
 * Standard-version updater for API version route
 * Updates VERSION_INFO.version in src/app/api/version/route.ts
 */
module.exports.readVersion = function (contents) {
  // Regex to match: version: 'X.Y.Z'
  const match = contents.match(/version:\s*['"](\d+\.\d+\.\d+)['"]/);
  return match ? match[1] : null;
};

module.exports.writeVersion = function (contents, version) {
  // Replace version in VERSION_INFO object
  return contents.replace(
    /version:\s*['"][\d\.]+['"]/,
    `version: '${version}'`
  );
};
