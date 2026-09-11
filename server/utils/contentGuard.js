const blockedPatterns = [
  { name: "email", pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i },
  { name: "phone", pattern: /(?:\+?84|0)(?:[\s.-]?\d){8,10}/ },
  { name: "link", pattern: /(https?:\/\/|www\.|zalo\.me|facebook\.com|fb\.com|t\.me|telegram\.me|wa\.me)/i },
];

const hasBlockedContact = (text = "") =>
  blockedPatterns.some((item) => item.pattern.test(String(text)));

module.exports = { hasBlockedContact };
