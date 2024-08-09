"use strict"
const colors = {
  green: '\x1b[32m',
  reset: '\x1b[0m'
};
exports.colors = colors;

function formatFragment(fragment) {
  let formatted = '';
  let indent = 0;

  fragment.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.endsWith('{')) {
      formatted += '  '.repeat(indent) + trimmedLine + '\n';
      indent += 1;
    } else if (trimmedLine.endsWith('}')) {
      indent -= 1;
      formatted += '  '.repeat(indent) + trimmedLine + '\n';
    } else {
      formatted += '  '.repeat(indent) + trimmedLine + '\n';
    };
  });

  return formatted.trim();
};
exports.formatFragment = formatFragment;

function formatField(word) {
  const lowerWord = word.toLowerCase();
  let plural = '';

  if (lowerWord.endsWith('y')) {
    plural = word.slice(0, -1) + 'ies';
  } else if (lowerWord.endsWith('s') || 
             lowerWord.endsWith('x') ||
             lowerWord.endsWith('z') ||
             lowerWord.endsWith('sh') ||
             lowerWord.endsWith('ch') ||
             lowerWord.endsWith('ss')
            ) {
    plural = word + 'es';
  } else {
    plural = word + 's';
  };

  return plural.charAt(0).toLowerCase() + plural.slice(1);
};
exports.formatField = formatField;