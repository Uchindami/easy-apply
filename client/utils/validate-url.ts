/**
 * Validates a URL by calling the backend /validate-url endpoint.
 * @param url The URL to validate
 * @returns The backend's JSON response (e.g. { valid: boolean, ... })
 */
export async function validateUrlWithBackend(url: string): Promise<any> {
  const endpoint = `http://localhost:8080/validate-url?url=${encodeURIComponent(
    url
  )}`;
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      valid: false,
      error: "Unable to reach backend for URL validation",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}
