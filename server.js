const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('500 Internal Server Error');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent(req.url.split('?')[0]);
  const normalizedPath = path.normalize(requestPath).replace(/^([.]{2}[\/])+/, '');
  const trimmedPath = normalizedPath.startsWith(path.sep)
    ? normalizedPath.slice(1)
    : normalizedPath;
  const targetPath = trimmedPath === '' ? 'index.html' : trimmedPath;
  const filePath = path.join(ROOT, targetPath);

  // Prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (requestPath !== '/' && !requestPath.includes('.')) {
        // fallback to index.html for routes without extension
        sendFile(res, path.join(ROOT, 'index.html'));
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Not Found');
      return;
    }

    if (stats.isDirectory()) {
      sendFile(res, path.join(filePath, 'index.html'));
      return;
    }

    sendFile(res, filePath);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Markdown Studio available at http://${HOST}:${PORT}`);
});
