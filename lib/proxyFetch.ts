import { ProxyAgent, Agent, fetch as undiciFetch, Dispatcher } from 'undici';

let cachedDispatcher: Dispatcher | null = null;

export function getAppDispatcher(): Dispatcher {
  if (!cachedDispatcher) {
    const proxyUrl =
      process.env.HTTPS_PROXY ||
      process.env.HTTP_PROXY ||
      process.env.ALL_PROXY ||
      process.env.https_proxy ||
      process.env.http_proxy ||
      process.env.GOOGLE_PROXY;

    if (proxyUrl) {
      cachedDispatcher = new ProxyAgent(proxyUrl);
    } else {
      cachedDispatcher = new Agent({
        keepAliveTimeout: 30000,
        keepAliveMaxTimeout: 60000,
        connections: 10,
      });
    }
  }
  return cachedDispatcher;
}

/**
 * Proxy-aware fetch helper for external API calls (e.g. Google OAuth in restricted network environments).
 * Automatically reads HTTPS_PROXY, HTTP_PROXY, ALL_PROXY, or GOOGLE_PROXY if present in environment.
 */
export async function proxyFetch(url: string | URL, init?: RequestInit): Promise<Response> {
  const dispatcher = getAppDispatcher();
  try {
    const res = await undiciFetch(url.toString(), {
      method: init?.method,
      headers: init?.headers as Record<string, string>,
      body: init?.body as any,
      dispatcher,
    });
    return res as unknown as Response;
  } catch (err) {
    console.warn(`proxyFetch failed:`, err);
    throw err;
  }
}

