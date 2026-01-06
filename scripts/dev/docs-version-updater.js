const fs = require('fs');
const path = require('path');

/**
 * Standard-version updater for Markdown docs
 */
module.exports.readVersion = function (contents) {
  // Regex to match: > **버전**: vX.Y.Z OR > **Version**: vX.Y.Z
  const koreanMatch = contents.match(/> \*\*버전\*\*: v([\d\.]+)/);
  if (koreanMatch) return koreanMatch[1];

  // Also try English pattern with version number or 'x' placeholder
  const englishMatch = contents.match(/> \*\*Version\*\*: v([\d\.]+|[\d\.]+x)/);
  if (englishMatch) {
    // If it's like "5.83.x", extract major.minor
    const ver = englishMatch[1];
    if (ver.endsWith('x')) {
      return ver.replace('x', '0');
    }
    return ver;
  }
  return null;
};

module.exports.writeVersion = function (contents, version) {
  // Replace both Korean and English patterns
  let newContents = contents;

  // Korean: > **버전**: vX.Y.Z
  newContents = newContents.replace(
    /> \*\*버전\*\*: v[\d\.]+.*/g,
    `> **버전**: v${version}`
  );

  // English: > **Version**: vX.Y.Z or vX.Y.x (with any suffix)
  newContents = newContents.replace(
    /> \*\*Version\*\*: v[\d\.x]+.*/g,
    `> **Version**: v${version}`
  );

  const today = new Date().toISOString().split('T')[0];

  // Korean date: > **최종 갱신**: YYYY-MM-DD
  newContents = newContents.replace(
    /> \*\*최종 갱신\*\*: \d{4}-\d{2}-\d{2}/g,
    `> **최종 갱신**: ${today}`
  );

  // English date: | **Updated**: YYYY-MM-DD
  newContents = newContents.replace(
    /\| \*\*Updated\*\*: \d{4}-\d{2}-\d{2}/g,
    `| **Updated**: ${today}`
  );

  return newContents;
};
