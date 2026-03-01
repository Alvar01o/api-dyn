const store = new Map<string, any>();

export function idempotencyMiddleware(req: any, res: any, next: any) {
  if (process.env.SCHEMA_ENABLE_IDEMPOTENCY !== 'true') {
    return next();
  }

  const key = req.headers['idempotency-key'];
  if (!key) return next();

  if (store.has(key)) {
    return res.json(store.get(key));
  }

  const originalJson = res.json.bind(res);

  res.json = (body: any) => {
    store.set(key, body);
    return originalJson(body);
  };

  next();
}