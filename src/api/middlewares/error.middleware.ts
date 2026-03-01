import { ApiError } from '../errors/ApiError';

export function errorHandler(err: any, _req: any, res: any, _next: any) {
  const apiErr = err instanceof ApiError ? err : null;

  const status = apiErr?.status ?? 500;
  res.status(status).json({
    error: apiErr?.message ?? 'Internal Server Error',
    code: apiErr?.code ?? 'INTERNAL',
    details: apiErr?.details,
  });
}