const express = require('express');
const router = express.Router();
const db = require('../connection/connection');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/messages');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

router.get('/all/:forum_id', async (req, res) => {
  const forum_id = req.params.forum_id;

  try {
    const result = await db.query('SELECT * FROM messages WHERE forum_id = $1', [forum_id]);

    // Mapear los mensajes y añadirles el user_name
    const messagesWithUserNames = await Promise.all(result.rows.map(async (message) => {
      try {
        const userResult = await db.query('SELECT name FROM users WHERE id = $1', [message.user_id]);
        return {
          ...message,
          user_name: userResult.rows[0] ? userResult.rows[0].name : 'Desconocido'
        };
      } catch (err) {
        console.error('Error obteniendo el usuario:', err);
        return {
          ...message,
          user_name: 'Desconocido'
        };
      }
    }));

    res.status(200).json({ message: 'Mensajes obtenidos exitosamente.', data: messagesWithUserNames });

  } catch (error) {
    console.error('Error en la consulta de mensajes:', error);
    res.status(500).json({ message: 'Error obteniendo los mensajes.' });
  }
});

router.get('/last/:user_id', async (req, res) => {
  const user_id = req.params.user_id;

  try {
    const result = await db.query(
      `SELECT m.*, u.name AS user_name 
       FROM messages m 
       JOIN users u ON m.user_id = u.id 
       WHERE m.user_id = $1 
       ORDER BY m.creation_date DESC 
       LIMIT 5`, 
      [user_id]
    );
    res.status(200).json({ message: 'Últimos mensajes obtenidos exitosamente.', data: result.rows });
  } catch (error) {
    console.error('Error obteniendo los últimos mensajes:', error);
    res.status(500).json({ message: 'Error obteniendo los últimos mensajes.' });
  }
});

// ✅ POST crear mensaje (con imagen opcional)
router.post('/new', upload.single('image'), async (req, res) => {
  const { forum_id, text, user_id } = req.body;


  if (!forum_id || !text) {
    return res.status(400).json({ message: 'Texto y foro son obligatorios.' });
  }

  const imageFileName = req.file ? req.file.filename : null;

  try {
    const result = await db.query(
      'INSERT INTO messages (forum_id, user_id, text, image_path, creation_date) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [forum_id, user_id, text, imageFileName]
    );

    const message = result.rows[0];
    const userRes = await db.query('SELECT name FROM users WHERE id = $1', [user_id]);

    message.user_name = userRes.rows[0]?.name || 'Desconocido';
    message.image_path = imageFileName ? `/uploads/messages/${imageFileName}` : null;

    res.status(201).json({ message: 'Mensaje creado exitosamente.', data: message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el mensaje.' });
  }
});

module.exports = router;