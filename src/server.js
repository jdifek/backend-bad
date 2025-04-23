const express = require('express');
require('dotenv').config();

const app = express();

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 5000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3214';
app.listen(PORT, () => {
  console.log(`Server running on ${BACKEND_URL}`);
});
