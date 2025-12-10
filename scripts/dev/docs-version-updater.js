const fs = require('fs');
const path = require('path');

/**
 * Standard-version updater for Markdown docs
 */
module.exports.readVersion = function (contents) {
  // Regex to match: > **버전**: vX.Y.Z
  const match = contents.match(/> \*\*버전\*\*: v([\d\.]+)/);
  return match ? match[1] : null;
};

module.exports.writeVersion = function (contents, version) {
  // Replace: > **버전**: vX.Y.Z with new version
  // Also update Last Updated date if present: > **최종 갱신**: YYYY-MM-DD
  let newContents = contents.replace(
    /> \*\*버전\*\*: v[\d\.]+.*/g, 
    `> **버전**: v${version}`
  );

  const today = new Date().toISOString().split('T')[0];
  newContents = newContents.replace(
    /> \*\*최종 갱신\*\*: \d{4}-\d{2}-\d{2}/g,
    `> **최종 갱신**: ${today}`
  );

  return newContents;
};
