// connection.js
const { Pool } = require('pg');

// Configura tu conexión aquí
const pgConnection = new Pool({
  user: 'postgres', // Usuario por defecto de PostgreSQL
  host: 'localhost',
  database: 'rolverse',
  password: 'root',
  port: 5432, // Puerto por defecto de PostgreSQL
});

// Probar conexión (opcional pero útil)
pgConnection.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error al conectar con PostgreSQL:', err.stack);
  }
  console.log('✅ Conexión exitosa a PostgreSQL');
  release();
});

// Exporta el pool para usarlo en otros archivos
module.exports = pgConnection;