export const getErrorMessage = (err: unknown): string => {
  const e: any = err;

  // Axios-style response body
  const resp = e?.response?.data ?? e?.response;

  // If the server returns a 'message' field
  if (resp?.message) return String(resp.message);
  // Common places for errors
  if (resp?.error) return String(resp.error);

  // If it's an object with validation errors
  if (resp?.errors) {
    // errors could be array or object
    if (Array.isArray(resp.errors)) return resp.errors.map((it: any) => it?.message || it).join(', ');
    if (typeof resp.errors === 'object') return Object.values(resp.errors).flat().join(', ');
  }

  // If response is a string
  if (typeof resp === 'string') return resp;

  // Fallback to status / statusText
  if (e?.response?.status || e?.response?.statusText) {
    const s = e?.response?.status ? ` (${e.response.status})` : '';
    return `${e.response?.statusText ?? 'Error'}${s}`;
  }

  // Generic message
  return e?.message ?? 'An unexpected error occurred';
};