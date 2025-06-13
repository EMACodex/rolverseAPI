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
        
        // Obtener roles del usuario
        const rolesResult = await db.query(`
        SELECT r.name 
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
        `, [user.id]);

        const userRoles = rolesResult.rows.map(row => row.name);

        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                roles: userRoles 
            },
            'prueba',
            { expiresIn: '1h' }
        );

        
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
        return res.status(400).json({ code: 400, message: 'Todos los campos son obligatorios' });
    }

    try {
        // 1. Verificar si el usuario ya existe
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ code: 409, message: 'El usuario ya existe' });
        }

        // 2. Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Insertar el nuevo usuario y obtener su ID
        const insertResult = await db.query(
        'INSERT INTO users (name, email, password, creation_date) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, email, hashedPassword, creation_date]
        );
        const userId = insertResult.rows[0].id;

        // 4. Obtener el ID del rol "user"
        const roleResult = await db.query(
        'SELECT id FROM roles WHERE name = $1',
        ['user']
        );
        const roleId = roleResult.rows[0]?.id;

        if (!roleId) {
        return res.status(500).json({ code: 500, message: 'El rol por defecto "user" no existe en la base de datos' });
        }

        // 5. Insertar en user_roles (asignar rol al usuario)
        await db.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
        [userId, roleId]
        );

        // 6. Enviar correo de bienvenida
        const emailContent = {
            to: email,
            subject: 'Bienvenido a Rolverse',
            text: `Hola ${name},\n\nGracias por registrarte en Rolverse. Estamos emocionados de tenerte con nosotros.\n\nSaludos,\nEl equipo de Rolverse`,
        };
        await sendEmail(emailContent);


        res.status(201).json({ code: 201, message: 'Usuario registrado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ENVIAR CORREO DE RECUPERACIÓN DE CONTRASEÑA
router.post('/sendrecover', (req, res) => {
    const { email } = req.body;
    db.query('SELECT id FROM users WHERE email = $1', [email], (err, result) => {
        if (!err) {
            const idUsuario = result.rows[0]?.id; // ✅ Extraes el ID correctamente

            if (!idUsuario) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            const token = jwt.sign({ id: idUsuario }, 'prueba', { expiresIn: '1h' });
            const url = `http://localhost:4200/recover/${token}`;

            const emailContent = {
                to: email,
                subject: 'Bienvenido a Rolverse',
                text: `Buenas,\n\nPara recuperar tu contraseña, haz clic en el siguiente enlace:\n${url}.\n\nSi no has solicitado la recuperación de tu contraseña, ignora este mensaje.\n\nEl equipo de Rolverse`,
            };

            sendEmail(emailContent);
            console.log('Correo enviado.');
            res.json(true);
        } else {
            console.error(err);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });
});

// MODIFICAR CONTRASEÑA
router.put('/recover', (req, res) => {
    const { token, password } = req.body;

    jwt.verify(token, 'prueba', (err, decoded) => {
        if (err) {
            return res.status(400).json('Token inválido o expirado.');
        }

        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                return res.status(500).json('Error al encriptar la contraseña.');
            }

            db.query(
                'UPDATE users SET password = $1 WHERE id = $2',
                [hash, decoded.id],
                (err, result) => {
                    if (!err) {
                        console.log('Contraseña modificada.');
                        res.json('Contraseña modificada.');
                    } else {
                        console.error('Error al actualizar la contraseña:', err);
                        res.status(500).json('Error al actualizar la contraseña.');
                    }
                }
            );
        });
    });
});


module.exports = router;
