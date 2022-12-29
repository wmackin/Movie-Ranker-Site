const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 8000;

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.send('Hello world!');
  });

app.listen(port, () => {
  console.log(`Success! Your application is running on port ${port}.`);
});