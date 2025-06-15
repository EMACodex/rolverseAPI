function authorizeAdmin(req, res, next) {
  // Construimos un array de roles a partir de roles[] o de role singular
  let rolesArray = [];

  if (Array.isArray(req.user?.roles)) {
    rolesArray = req.user.roles;
  } else if (typeof req.user?.role === 'string') {
    rolesArray = [req.user.role];
  }

  if (!rolesArray.includes('admin')) {
    return res
      .status(403)
      .json({ error: 'Acceso denegado: se requiere rol de administrador' });
  }

  next();
}

module.exports = authorizeAdmin;

