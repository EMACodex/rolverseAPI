const express = require('express');
const router = express.Router();
const db = require('../connection/connection');

router.get('/all', async (req, res) => {
    
    db.query('SELECT * FROM forums', (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ code: 500, message: 'Error obteniendo los foros.' });
        }
        res.status(200).json({ message: 'Foros obtenidos exitosamente.', data: result.rows });
    });

});

router.get('/:id', async (req, res) => {
    const forum_id = req.params.id;

    db.query('SELECT title, description FROM forums WHERE id = $1', [forum_id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error obteniendo el foro.' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Foro no encontrado.' });
        }
        res.status(200).json({ message: 'Foro obtenido exitosamente.', data: result.rows[0] });
    });

});

// POST: Crear un nuevo foro
router.post('/new', async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'El título y la descripción son necesarios.' });
    }

    try {
        db.query(
            'INSERT INTO forums(title, description) VALUES($1, $2) RETURNING *',
            [title, description],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Error al crear el foro.' });
                }
                res.status(201).json({ message: 'Foro creado exitosamente.', data: result.rows[0] });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error del servidor.' });
    }
});

// PUT: Actualizar un foro existente
router.put('/:id', async (req, res) => {
    const forum_id = req.params.id;
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'El título y la descripción son necesarios.' });
    }

    try {
        db.query(
            'UPDATE forums SET title = $1, description = $2 WHERE id = $3 RETURNING *',
            [title, description, forum_id],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Error actualizando el foro.' });
                }
                if (result.rows.length === 0) {
                    return res.status(404).json({ message: 'Foro no encontrado.' });
                }
                res.status(200).json({ message: 'Foro actualizado exitosamente.', data: result.rows[0] });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error del servidor.' });
    }
});

// DELETE: Eliminar un foro
router.delete('/:id', async (req, res) => {
    const forum_id = req.params.id;

    try {
        db.query(
            'DELETE FROM forums WHERE id = $1 RETURNING *',
            [forum_id],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Error eliminando el foro.' });
                }
                if (result.rows.length === 0) {
                    return res.status(404).json({ message: 'Foro no encontrado.' });
                }
                res.status(200).json({ message: 'Foro eliminado exitosamente.', data: result.rows[0] });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error del servidor.' });
    }
});

module.exports = router;