const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Importa las rutas
const testRoute = require('./api/routes/testRoute');
const authRoute = require('./api/routes/auth');
const userRoute = require('./api/routes/user');
const newsRoutes = require('./api/routes/news');
const forumRoute = require('./api/routes/forum');

// Configura las rutas
app.use('/api/test', testRoute);
app.use('/auth', authRoute);
app.use('/user', userRoute);
app.use('/news', newsRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/forum', forumRoute);

module.exports = app;