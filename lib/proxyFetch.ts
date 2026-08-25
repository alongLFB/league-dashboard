import { ProxyAgent, fetch as undiciFetch } from 'undici';

/**
 * Proxy-aware fetch helper for external API calls (e.g. Google OAuth in restricted network environments).
 * Automatically reads HTTPS_PROXY, HTTP_PROXY, ALL_PROXY, or GOOGLE_PROXY if present in environment.
 */
export async function proxyFetch(url: string | URL, init?: RequestInit): Promise<Response> {
  const proxyUrl =
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.ALL_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy ||
    process.env.GOOGLE_PROXY;

  if (proxyUrl) {
    try {
      const dispatcher = new ProxyAgent(proxyUrl);
      const res = await undiciFetch(url.toString(), {
        ...(init as any),
        dispatcher,
      });
      return res as unknown as Response;
    } catch (err) {
      console.warn(`proxyFetch via ${proxyUrl} failed:`, err);
      throw err;
    }
  }

  return fetch(url, init);
}
