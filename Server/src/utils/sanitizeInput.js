const sanitizeString = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

module.exports = {
  sanitizeString,
};
