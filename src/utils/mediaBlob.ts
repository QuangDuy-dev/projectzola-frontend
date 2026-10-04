import { useEffect, useState } from 'react';

// In-memory cache to prevent redundant fetches across components
const blobCache = new Map<string, string>();
const activeRequests = new Map<string, Promise<string>>();

/**
 * Checks if a given URL is hosted on an ngrok tunnel.
 */
export function isNgrokUrl(url?: string | null): boolean {
  if (!url) return false;
  return (
    url.includes('ngrok-free.app') ||
    url.includes('ngrok-free.dev') ||
    url.includes('ngrok.io') ||
    url.includes('ngrok.app') ||
    url.includes('ngrok')
  );
}

/**
 * Fetches a media URL with ngrok-skip-browser-warning header and converts to Blob URL.
 * Solves ngrok free-tier HTML interstitial page blocking <img> and <video> tags on web.
 */
export async function fetchMediaBlobUrl(url: string): Promise<string> {
  if (!url) throw new Error('Invalid URL');

  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  const cached = blobCache.get(url);
  if (cached) {
    return cached;
  }

  const inFlight = activeRequests.get(url);
  if (inFlight) {
    return inFlight;
  }

  const request = fetch(url, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const contentType = res.headers.get('content-type') || '';
      // If ngrok returned HTML warning despite header or invalid media
      if (contentType.includes('text/html')) {
        throw new Error('Received HTML instead of media content');
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobCache.set(url, blobUrl);
      activeRequests.delete(url);
      return blobUrl;
    })
    .catch((err) => {
      activeRequests.delete(url);
      throw err;
    });

  activeRequests.set(url, request);
  return request;
}

/**
 * React hook to safely resolve and load media URLs in the browser.
 * For ngrok URLs, transparently bypasses ngrok browser warning interstitials.
 * For standard direct URLs, returns them directly without overhead.
 */
export function useMediaBlobUrl(resolvedUrl: string | null | undefined): {
  blobUrl: string | null;
  isLoading: boolean;
  isError: boolean;
} {
  const needsBlob = Boolean(resolvedUrl && isNgrokUrl(resolvedUrl));

  const [state, setState] = useState<{
    url: string | null | undefined;
    blobUrl: string | null;
    isLoading: boolean;
    isError: boolean;
  }>(() => {
    if (!resolvedUrl) {
      return { url: resolvedUrl, blobUrl: null, isLoading: false, isError: false };
    }
    if (resolvedUrl.startsWith('blob:') || resolvedUrl.startsWith('data:') || !needsBlob) {
      return { url: resolvedUrl, blobUrl: resolvedUrl, isLoading: false, isError: false };
    }
    const cached = blobCache.get(resolvedUrl);
    return {
      url: resolvedUrl,
      blobUrl: cached || null,
      isLoading: !cached,
      isError: false,
    };
  });

  // Adjust state during render when resolvedUrl prop changes (React recommended pattern)
  if (state.url !== resolvedUrl) {
    if (!resolvedUrl) {
      setState({ url: resolvedUrl, blobUrl: null, isLoading: false, isError: false });
    } else if (resolvedUrl.startsWith('blob:') || resolvedUrl.startsWith('data:') || !needsBlob) {
      setState({ url: resolvedUrl, blobUrl: resolvedUrl, isLoading: false, isError: false });
    } else {
      const cached = blobCache.get(resolvedUrl);
      setState({
        url: resolvedUrl,
        blobUrl: cached || null,
        isLoading: !cached,
        isError: false,
      });
    }
  }

  useEffect(() => {
    if (!resolvedUrl || !needsBlob) return;
    if (blobCache.has(resolvedUrl)) return;

    let isMounted = true;

    fetchMediaBlobUrl(resolvedUrl)
      .then((url) => {
        if (isMounted) {
          setState((prev) => (prev.url === resolvedUrl ? { ...prev, blobUrl: url, isLoading: false } : prev));
        }
      })
      .catch(() => {
        if (isMounted) {
          setState((prev) => (prev.url === resolvedUrl ? { ...prev, isError: true, isLoading: false } : prev));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [resolvedUrl, needsBlob]);

  return { blobUrl: state.blobUrl, isLoading: state.isLoading, isError: state.isError };
}

