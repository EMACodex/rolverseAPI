const http = require('http');
const app = require('./app');

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});