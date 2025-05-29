const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Importa las rutas
const testRoute = require('./api/routes/testRoute');
const authRoute = require('./api/routes/auth');

// Configura las rutas
app.use('/api/test', testRoute);
app.use('/auth', authRoute);

module.exports = app;