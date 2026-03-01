import { Router } from 'express';
import { getJobHandler } from '../controllers/job.controller';

const router = Router();
router.get('/schema/job/:id', getJobHandler);
export default router;