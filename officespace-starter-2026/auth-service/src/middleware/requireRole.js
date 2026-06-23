// Middleware de autorización por rol.
// Úsalo DESPUÉS del middleware `auth` (que llena req.user con el JWT).
//   router.post('/', auth, requireRole(ROLES.ADMINISTRADOR), controller.create)
module.exports = function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!allowed.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    next();
  };
};
