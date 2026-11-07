/**
 * Single place where an HTTP response body becomes a typed value. The API is
 * our own contract and the response is a JSON body we control, so callers name
 * the wire type they expect; `Response.json()` itself is untyped, which is why
 * the read is funnelled through here instead of repeated at every call site.
 */
export const readJson = <T>(response: Response): Promise<T> => response.json();
