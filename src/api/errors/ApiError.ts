export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, code = 'BAD_REQUEST', details?: unknown) =>
  new ApiError(400, msg, code, details);

export const unsupported = (msg: string, code = 'UNSUPPORTED', details?: unknown) =>
  new ApiError(422, msg, code, details);