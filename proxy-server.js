const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({
  target: 'http://localhost:8081',
  changeOrigin: true,
  ws: true,
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (res && res.writeHead) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Proxy error occurred');
  }
});

const server = http.createServer((req, res) => {
  proxy.web(req, res);
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on port ${PORT}, forwarding to 8081`);
});
