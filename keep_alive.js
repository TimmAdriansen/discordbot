const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Botten er i live!');
});

function keepAlive() {
  app.listen(3000, () => {
    console.log('✅ Keep-alive server kører på port 3000');
  });
}

module.exports = keepAlive();
