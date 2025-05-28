const express = require('express');
const router = express.Router();
const db = require('../connection/connection');

// Ruta para probar la conexión
router.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ ok: true, time: result.rows[0].now });
  } catch (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
