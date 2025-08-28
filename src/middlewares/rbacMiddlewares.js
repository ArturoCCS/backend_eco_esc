import Permissions from '../models/permissions.js';
import Rol from '../models/roles.js';
import User from '../models/user.js';

export const checkPermission = (permission) => {
  return async (req, res, next) => {
    
    const user = await User.findByPk(req.user.id);

    
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const role = await Rol.findByPk(user.id_rol);

    const permissions = new Permissions().getPermissionsByRoleName(role.nombre);

    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    req.permissions = permissions;
    next();
  };
};
