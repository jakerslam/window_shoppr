/**
 * Placeholder email capture submission handler for future SQL/API wiring.
 */
export const submitEmailCapture = async (email: string) => {
  void email; // TODO: send to SQL, ESP, or serverless endpoint.
  return { ok: true } as const; // Stubbed success response.
};
