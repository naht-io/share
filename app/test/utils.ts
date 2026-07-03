/**
 * Awaits a promise expected to reject with a thrown `Response` (the way React
 * Router loaders/actions signal HTTP errors) and returns that response so the
 * caller can assert on its status. Fails if nothing, or something other than a
 * `Response`, is thrown.
 */
export async function catchResponse(promise: Promise<unknown>): Promise<Response> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    throw error;
  }
  throw new Error("Expected a Response to be thrown, but the call resolved");
}
