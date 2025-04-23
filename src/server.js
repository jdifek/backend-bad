const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 'http://localhost:5000';
app.listen(PORT, () => {
  console.log(`${HOST}`);
});
