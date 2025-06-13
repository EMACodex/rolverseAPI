const express = require('express');
const router = express.Router();
const db = require('../connection/connection');
const authenticateToken = require('../middleware/authenticateToken');
const authorizeAdmin = require('../middleware/authorizeAdmin');
const multer = require('multer');
const path = require('path');


// Configuración del almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Asegúrate de que esta carpeta exista
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Crear una nueva noticia (solo para administradores)
router.post('/', authenticateToken, authorizeAdmin, upload.single('image'), async (req, res) => {
  const { title, summary, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'El título y el contenido son obligatorios.' });
  }

  try {
    const authorId = req.user.id;
    const image_path = req.file ? `/uploads/${req.file.filename}` : null;

    await db.query(
      `INSERT INTO news (title, summary, content, image_path, author_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [title, summary, content, image_path, authorId]
    );

    res.status(201).json({ message: 'Noticia creada correctamente.' });

  } catch (error) {
    console.error('Error al insertar noticia:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear la noticia.' });
  }
});

// Obtener todas las noticias creadas por administradores
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM news ORDER BY created_at DESC LIMIT 5`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    res.status(500).json({ error: 'Error al obtener las noticias.' });
  }
});


module.exports = router;
