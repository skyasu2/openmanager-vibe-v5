/**
 * Standard-version updater for PWA manifest.json
 * Updates "version" field in public/manifest.json
 */
module.exports.readVersion = function (contents) {
  const json = JSON.parse(contents);
  return json.version || null;
};

module.exports.writeVersion = function (contents, version) {
  const json = JSON.parse(contents);
  json.version = version;
  return JSON.stringify(json, null, 2) + '\n';
};
