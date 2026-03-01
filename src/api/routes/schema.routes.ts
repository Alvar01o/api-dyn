import { Router } from 'express';
import { uploadSchema } from '../middlewares/upload.middleware';
import { uploadSchemaHandler } from '../controllers/schema.controller';
import { schemaRateLimiter } from '../middlewares/rateLimit.middleware';
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware';

const router = Router();

router.post(
  '/schema/upload',
  schemaRateLimiter,
  idempotencyMiddleware,
  uploadSchema.single('schema'),
  uploadSchemaHandler
);

export default router;