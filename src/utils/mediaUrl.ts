import { APP_CONFIG } from '../app/config';

/**
 * Resolves a media URL safely against the configured backend base URL.
 * Never exposes local physical paths (e.g. D:\Projectzola\storage).
 */
export function resolveMediaUrl(path?: string | null): string | null {
  if (!path || typeof path !== 'string') {
    return null;
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return null;
  }

  // Already an absolute web URL or blob/data URI
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Sanitize any backslashes from legacy or Windows path artifacts
  const normalized = trimmed.replace(/\\/g, '/');

  // Relative path (e.g. /media/posts/... or media/posts/...)
  if (normalized.startsWith('/')) {
    return `${APP_CONFIG.apiBaseUrl}${normalized}`;
  }

  return `${APP_CONFIG.apiBaseUrl}/${normalized}`;
}
