const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const API_BASE = process.env.API_BASE || process.env.REACT_APP_API_BASE || 'http://13.222.79.184:8001';

app.use(express.static(path.join(__dirname, 'build')));

app.get('/config', (req, res) => {
  res.json({ API_BASE });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on ${port}, API_BASE=${API_BASE}`);
});
