const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Importa las rutas
const testRoute = require('./api/routes/testRoute');

// Configura las rutas
app.use('/api/test', testRoute);

module.exports = app;