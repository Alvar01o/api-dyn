import { WebSocketServer } from 'ws';
import IORedis from 'ioredis';
import { progressChannel } from '../../core/queue/publisher';

export function attachWs(server: any) {
  if (process.env.SCHEMA_ENABLE_WS_PROGRESS !== 'true') return;

  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const sub = new IORedis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT ?? 6379),
      maxRetriesPerRequest: null,
    });

    let currentChannel: string | null = null;

    ws.on('message', async (msg) => {
      try {
        const data = JSON.parse(String(msg));
        if (data.type === 'subscribe' && data.jobId) {
          if (currentChannel) await sub.unsubscribe(currentChannel);
          currentChannel = progressChannel(data.jobId);
          await sub.subscribe(currentChannel);
          ws.send(JSON.stringify({ type: 'subscribed', channel: currentChannel }));
        }
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
      }
    });

    sub.on('message', (_channel, payload) => {
      ws.send(payload);
    });

    ws.on('close', async () => {
      try {
        if (currentChannel) await sub.unsubscribe(currentChannel);
      } finally {
        sub.disconnect();
      }
    });
  });
}