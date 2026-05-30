export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

type JsonBody = Record<string, unknown> | unknown[] | null;

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackError = "Requête impossible.",
): Promise<T> {
  const response = await fetch(input, init);
  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new ApiError(data.error ?? fallbackError);
  }

  return data;
}

export async function fetchJsonVoid(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackError = "Requête impossible.",
) {
  const response = await fetch(input, init);

  if (!response.ok) {
    let message = fallbackError;

    try {
      const data = (await response.json()) as { error?: string };
      message = data.error ?? fallbackError;
    } catch {
      // Empty or non-JSON error bodies fall back to the default message.
    }

    throw new ApiError(message);
  }
}

export type { JsonBody };
