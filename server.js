const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const API_BASE = process.env.API_BASE || process.env.REACT_APP_API_BASE || 'http://13.222.79.184:8001';

app.use(express.static(path.join(__dirname, 'build')));

app.get('/config', (req, res) => {
  res.json({ API_BASE });
});

// Simple proxy for API routes so the production server can forward requests
// to the real backend and avoid CORS and accidental serving of index.html.
// This proxy currently supports GET requests (the app calls the catalog and
// claims endpoints with GET). It will forward the request and stream the
// response back to the client preserving status and content-type.
const shouldProxy = (url) => url.startsWith('/reclamos') || url.startsWith('/catalogos');

app.get(['/reclamos', '/reclamos/*', '/catalogos/*'], async (req, res) => {
  try {
    if (!API_BASE) {
      return res.status(502).send('API_BASE not configured on server');
    }
    const target = `${API_BASE}${req.originalUrl}`;
    // forward GET request
    const proxied = await fetch(target, {
      method: 'GET',
      headers: {
        // Copy accept header if present
        accept: req.headers.accept || 'application/json',
      },
    });

    const contentType = proxied.headers.get('content-type') || 'text/plain';
    const body = await proxied.text();
    res.status(proxied.status).set('content-type', contentType).send(body);
  } catch (err) {
    console.error('Proxy error for', req.originalUrl, err);
    res.status(502).send('Bad gateway');
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on ${port}, API_BASE=${API_BASE}`);
});
