const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const HOST = process.env.HOST || 'http://localhost:5000';
app.listen(HOST, () => {
  console.log(`${HOST}`);
});
