const DEFAULT_STRAPI_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const baseUrl = ( DEFAULT_STRAPI_URL ?? "").replace(/\/$/, "");
const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;

type Primitive = string | number | boolean;
type QueryValueRecord = { [key: string]: QueryValue | undefined };
type QueryValue = Primitive | Primitive[] | QueryValueRecord;

type StrapiFetchOptions = RequestInit & {
  params?: Record<string, QueryValue | undefined>;
  /**
   * Append /api automatically when true (default).
   */
  useApiPrefix?: boolean;
  /**
   * Next.js specific cache options
   */
  next?: { revalidate?: number | false; tags?: string[] };
};

export function getStrapiURL(path = "") {
  return `${baseUrl}${path}`;
}

export async function strapiFetch<TResponse>(
  path: string,
  { params, headers, useApiPrefix = true, ...init }: StrapiFetchOptions = {}
): Promise<TResponse> {
  // Gracefully handle missing base URL during build/runtime
  if (!baseUrl) {
    console.warn(
      "NEXT_PUBLIC_API_BASE_URL is not set. Returning empty response. Please configure your Strapi URL in environment variables."
    );
    // Return a structure that matches typical Strapi responses
    return { data: null, meta: {} } as TResponse;
  }

  try {
    // Construct the path
    const apiPath = `${useApiPrefix ? "/api" : ""}/${path}`.replace(/\/{2,}/g, "/");
    
    // Build the full URL
    let url: URL;
    try {
      url = new URL(apiPath, baseUrl);
    } catch (urlError) {
      throw new Error(
        `Invalid URL construction: baseUrl="${baseUrl}", path="${apiPath}". ${urlError instanceof Error ? urlError.message : String(urlError)}`
      );
    }

    if (params) {
      const searchParams = toSearchParams(params);
      if (searchParams) {
        url.search = searchParams;
      }
    }

    // Build headers object - convert Headers to plain object if needed
    const headerEntries: Record<string, string> = {};
    if (headers) {
      if (headers instanceof Headers) {
        headers.forEach((value, key) => {
          headerEntries[key] = value;
        });
      } else if (Array.isArray(headers)) {
        headers.forEach(([key, value]) => {
          headerEntries[key] = value;
        });
      } else {
        Object.assign(headerEntries, headers);
      }
    }
    
    headerEntries["Content-Type"] = "application/json";
    if (apiToken) {
      headerEntries["Authorization"] = `Bearer ${apiToken}`;
    }

    const fullUrl = url.toString();
    
    // Extract next option separately (Next.js specific cache option)
    const { next, ...restInit } = init;
    
    // Build fetch options - use spread but override headers with our plain object
    const fetchOptions: RequestInit & { next?: StrapiFetchOptions['next'] } = {
      ...restInit,
      headers: headerEntries,
    };
    
    // Add Next.js specific next option if provided
    if (next) {
      fetchOptions.next = next;
    }

    const response = await fetch(fullUrl, fetchOptions);

    if (!response.ok) {
      const errorBody = await safeReadJson(response);
      throw new Error(
        `Strapi request failed: ${response.status} ${response.statusText} - URL: ${fullUrl}${
          errorBody ? ` - ${JSON.stringify(errorBody)}` : ""
        }`
      );
    }

    return response.json();
  } catch (error) {
    // Log error but return empty response structure to allow build/runtime to continue
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = {
      path,
      baseUrl,
      error: errorMessage,
    };
    
    // Only log in development to avoid cluttering production logs
    if (process.env.NODE_ENV === "development") {
      console.warn(`Failed to fetch from Strapi:`, errorDetails);
      if (error instanceof Error && error.stack) {
        console.warn("Error stack:", error.stack);
      }
    }
    
    return { data: null, meta: {} } as TResponse;
  }
}

async function safeReadJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function toSearchParams(params: Record<string, QueryValue | undefined>) {
  const searchParams = new URLSearchParams();

  const appendValue = (key: string, value: QueryValue | undefined) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => appendValue(`${key}[${index}]`, item));
      return;
    }
    if (typeof value === "object") {
      Object.entries(value).forEach(([childKey, childValue]) => {
        appendValue(`${key}[${childKey}]`, childValue);
      });
      return;
    }
    searchParams.append(key, String(value));
  };

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    appendValue(key, value);
  });

  return searchParams.toString();
}

/**
 * Fetch from internal Next.js API routes (server-side only)
 * Automatically handles base URL construction and cookie forwarding for session auth
 */
type InternalApiFetchOptions = RequestInit & {
  params?: Record<string, QueryValue | undefined>;
  /**
   * Next.js specific cache options
   */
  next?: { revalidate?: number | false; tags?: string[] };
  /**
   * Headers object from next/headers (for cookie forwarding)
   */
  requestHeaders?: Headers;
};

export async function internalApiFetch<TResponse>(
  path: string,
  { params, headers, requestHeaders, next, ...init }: InternalApiFetchOptions = {}
): Promise<TResponse> {
  try {
    // Get base URL from headers (server component) or environment
    let baseUrl: string;
    if (requestHeaders) {
      const host = requestHeaders.get("host") || "localhost:3000";
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
      baseUrl = `${protocol}://${host}`;
    } else {
      // Fallback to environment variable or localhost
      baseUrl = process.env.NEXT_PUBLIC_APP_URL 
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    }

    // Construct the path
    const apiPath = path.startsWith("/") ? path : `/${path}`;
    
    // Build the full URL
    const url = new URL(apiPath, baseUrl);

    if (params) {
      const searchParams = toSearchParams(params);
      if (searchParams) {
        url.search = searchParams;
      }
    }

    // Build headers object - convert Headers to plain object if needed
    const headerEntries: Record<string, string> = {};
    if (headers) {
      if (headers instanceof Headers) {
        headers.forEach((value, key) => {
          headerEntries[key] = value;
        });
      } else if (Array.isArray(headers)) {
        headers.forEach(([key, value]) => {
          headerEntries[key] = value;
        });
      } else {
        Object.assign(headerEntries, headers);
      }
    }
    
    headerEntries["Content-Type"] = "application/json";
    
    // Forward cookies for session authentication
    if (requestHeaders) {
      const cookie = requestHeaders.get("cookie");
      if (cookie) {
        headerEntries["Cookie"] = cookie;
      }
    }

    const fullUrl = url.toString();
    
    // Build fetch options
    const fetchOptions: RequestInit & { next?: InternalApiFetchOptions['next'] } = {
      ...init,
      headers: headerEntries,
    };
    
    // Add Next.js specific next option if provided
    if (next) {
      fetchOptions.next = next;
    }

    const response = await fetch(fullUrl, fetchOptions);

    if (!response.ok) {
      const errorBody = await safeReadJson(response);
      throw new Error(
        `Internal API request failed: ${response.status} ${response.statusText} - URL: ${fullUrl}${
          errorBody ? ` - ${JSON.stringify(errorBody)}` : ""
        }`
      );
    }

    return response.json();
  } catch (error) {
    // Log error but return null to allow graceful handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = {
      path,
      error: errorMessage,
    };
    
    // Only log in development to avoid cluttering production logs
    if (process.env.NODE_ENV === "development") {
      console.warn(`Failed to fetch from internal API:`, errorDetails);
      if (error instanceof Error && error.stack) {
        console.warn("Error stack:", error.stack);
      }
    }
    
    throw error; // Re-throw to allow caller to handle
  }
}

