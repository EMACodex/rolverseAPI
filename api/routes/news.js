const express = require("express");
const router = express.Router();
const db = require("../connection/connection");
const authenticateToken = require("../middleware/authenticateToken");
const authorizeAdmin = require("../middleware/authorizeAdmin");
const multer = require("multer");
const path = require("path");

// Configuración del almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Asegúrate de que esta carpeta exista
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Crear una nueva noticia (solo para administradores)
router.post(
  "/",
  authenticateToken,
  authorizeAdmin,
  upload.single("image"),
  async (req, res) => {
    const { title, summary, content } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ error: "El título y el contenido son obligatorios." });
    }

    try {
      const authorId = req.user.id;
      const image_path = req.file ? `/uploads/${req.file.filename}` : null;

      await db.query(
        `INSERT INTO news (title, summary, content, image_path, author_id)
       VALUES ($1, $2, $3, $4, $5)`,
        [title, summary, content, image_path, authorId]
      );

      res.status(201).json({ message: "Noticia creada correctamente." });
    } catch (error) {
      console.error("Error al insertar noticia:", error);
      res
        .status(500)
        .json({ error: "Error interno del servidor al crear la noticia." });
    }
  }
);

// Obtener todas las noticias creadas por administradores
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        n.id,
        n.title,
        n.summary,
        n.content,
        n.image_path,
        n.created_at,
        u.name AS author
      FROM news n
      LEFT JOIN users u
        ON n.author_id = u.id
      ORDER BY n.created_at DESC
      `
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener noticias:", error);
    res.status(500).json({ error: "Error al obtener las noticias." });
  }
});

// BORRAR UNA NOTICIA POR ID (solo Admins)
router.delete("/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Ejecutamos el DELETE y devolvemos la fila borrada
    const result = await db.query(
      `DELETE FROM news
         WHERE id = $1
         RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Noticia no encontrada." });
    }

    res.json({
      message: "Noticia eliminada correctamente.",
      deleted: result.rows[0],
    });
  } catch (error) {
    console.error("Error al eliminar noticia:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al eliminar la noticia." });
  }
});

// Obtener UNA sola noticia por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `SELECT
         n.id, n.title, n.summary, n.content, n.image_path, n.created_at,
         u.name AS author
       FROM news n
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Noticia no encontrada." });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener noticia:", error);
    res.status(500).json({ error: "Error interno al obtener la noticia." });
  }
});

// Añadir comentario a una noticia (usuario autenticado)
router.post("/:id/comments", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  if (!comment || comment.trim() === "") {
    return res
      .status(400)
      .json({ error: "El comentario no puede estar vacío." });
  }

  try {
    await db.query(
      `INSERT INTO news_comments (news_id, user_id, comment)
       VALUES ($1, $2, $3)`,
      [id, req.user.id, comment]
    );
    res.status(201).json({ message: "Comentario añadido." });
  } catch (error) {
    console.error("Error al guardar comentario:", error);
    res.status(500).json({ error: "Error al guardar el comentario." });
  }
});

// Obtener comentarios de una noticia
router.get("/:id/comments", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT nc.id, nc.comment, nc.created_at, u.name AS author
      FROM news_comments nc
      LEFT JOIN users u ON u.id = nc.user_id
      WHERE nc.news_id = $1
      ORDER BY nc.created_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener comentarios:", error);
    res.status(500).json({ error: "Error al obtener los comentarios." });
  }
});

// Eliminar un comentario de noticia (solo admin)
router.delete(
  "/comments/:id",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await db.query(
        `DELETE FROM news_comments WHERE id = $1 RETURNING *`,
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Comentario no encontrado." });
      }

      res.json({ message: "Comentario eliminado.", deleted: result.rows[0] });
    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      res.status(500).json({ error: "Error al eliminar el comentario." });
    }
  }
);

module.exports = router;
