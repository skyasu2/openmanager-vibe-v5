/**
 * Standard-version updater for src/config/versions.ts
 * Updates system_version in getCurrentVersions()
 */
module.exports.readVersion = function (contents) {
  // Match: system_version: '5.37.0'
  const match = contents.match(/system_version:\s*['"](\d+\.\d+\.\d+)['"]/);
  return match ? match[1] : null;
};

module.exports.writeVersion = function (contents, version) {
  return contents.replace(
    /system_version:\s*['"][\d\.]+['"]/,
    `system_version: '${version}'`
  );
};
