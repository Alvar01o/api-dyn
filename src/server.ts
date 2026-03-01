import http from 'http';
import app from './app';
import { attachWs } from './api/ws/ws.server';

const server = http.createServer(app);
attachWs(server);

server.listen(3000);