const SERVER_BASE_URL = 'http://localhost:3001';

/**
 * Resolves an image URL. If the URL is a relative path (e.g. /uploads/...),
 * it prepends the server base URL. If it's already an absolute URL, it returns as-is.
 */
export const resolveImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${SERVER_BASE_URL}${url}`;
};
