const express = require('express');
const router = express.Router();
const db = require('../connection/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../nodemailer/nodemailer');

// Ruta para loguearse
router.post('/login', async (req, res) => {
    const { email, password } = req.body;


    if (!email || !password) {
        return res.status(400).json({ code: 400, message: 'Email and password are required' });
    }

    try {
        // Consulta parametrizada para PostgreSQL
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ code: 401, message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ code: 401, message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id }, 'prueba', { expiresIn: '1h' });

        
        res.json({ code: 200, message: 'Login successful', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Ruta para registrarse
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const creation_date = new Date().toISOString();


    if (!name || !email || !password) {
        return res.status(400).json({ code: 400, message: 'Name, email and password are required' });
    }

    try {
        // Verificar si el usuario ya existe
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ code: 409, message: 'User already exists' });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar el nuevo usuario
        await db.query('INSERT INTO users (name, email, password, creation_date) VALUES ($1, $2, $3, $4)', [name, email, hashedPassword, creation_date]);

        // Enviar correo de bienvenida
        const emailContent = {
            to: email,
            subject: 'Bienvenido a Rolverse',
            text: `Hola ${name},\n\nGracias por registrarte en Rolverse. Estamos emocionados de tenerte con nosotros.\n\nSaludos,\nEl equipo de Rolverse`,
            html: `<p>Hola ${name},</p><p>Gracias por registrarte en Rolverse. Estamos emocionados de tenerte con nosotros.</p><p>Saludos,<br>El equipo de Rolverse</p>`
        };
        await sendEmail(emailContent);

        res.status(201).json({ code: 201, message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
