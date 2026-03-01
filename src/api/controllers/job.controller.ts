import { getJob } from '../../shared/jobStore.service';

export async function getJobHandler(req: any, res: any) {
  const job = await getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
}