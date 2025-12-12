const endpoint = "/api";

/**
 * Sends a api request.
 * @param method The http method.
 * @param path The api path.
 * @param body The optional request body data.
 */
const apiFetch = async <TResponse, TRequest>(
  method: string,
  path: string,
  body?: TRequest,
): Promise<TResponse> => {
  const response = await fetch(`${endpoint}${path}`, {
    method: method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return (await response.json()) as TResponse;
};

/**
 * Sends a GET request to the api and returns the given JSON result.
 * @param path The api path.
 */
export const apiGet = async <T>(path: string): Promise<T> => {
  return apiFetch<T, void>("GET", path);
};
