import { NextRequest } from "next/server";

const TEST_BASE_URL = "http://localhost:3000";

export function createTestRequest(
  path: string,
  init: ConstructorParameters<typeof NextRequest>[1] = {},
): NextRequest {
  return new NextRequest(new URL(path, TEST_BASE_URL), init);
}

export function createJsonPostRequest(
  path: string,
  body: unknown,
): NextRequest {
  return createJsonRequest(path, "POST", body);
}

export function createJsonPatchRequest(
  path: string,
  body: unknown,
): NextRequest {
  return createJsonRequest(path, "PATCH", body);
}

export function createJsonPutRequest(
  path: string,
  body: unknown,
): NextRequest {
  return createJsonRequest(path, "PUT", body);
}

export function createFormDataPutRequest(
  path: string,
  formData: FormData,
): NextRequest {
  return createTestRequest(path, {
    method: "PUT",
    body: formData,
  });
}

export function createJsonRequest(
  path: string,
  method: string,
  body: unknown,
): NextRequest {
  return createTestRequest(path, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function readJsonResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}
