const ws = new WebSocket('ws://localhost:3000/ws');
ws.onopen = () => ws.send(JSON.stringify({ type: 'subscribe', jobId: '...' }));
ws.onmessage = (e) => console.log('progress:', JSON.parse(e.data));