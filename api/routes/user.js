const express = require('express');
const router = express.Router();
const db = require('../connection/connection');
const jwt = require('jsonwebtoken');


router.get('/all', async (req, res) => {
    
    db.query('SELECT * FROM users', (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ code: 500, message: 'Error obteniendo los usuarios.' });
        }
        res.status(200).json({ message: 'Usuarios obtenidos exitosamente.', data: result.rows });
    });

});

router.get('/:id', async (req, res) => {
    const userId = req.params.id;

    db.query('SELECT name, email, message_count FROM users WHERE id = $1', [userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error obteniendo el usuario.' });
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.status(200).json({ message: 'Usuario obtenido exitosamente.', data: result.rows[0] });
    });

});

module.exports = router;