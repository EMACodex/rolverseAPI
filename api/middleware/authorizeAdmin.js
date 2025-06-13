function authorizeAdmin(req, res, next) {
  const roles = req.user?.roles;

  if (!roles || !roles.includes('admin')) {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' });
  }

  next(); // continúa si el usuario es admin
}

module.exports = authorizeAdmin;
