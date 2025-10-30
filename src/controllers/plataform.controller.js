import { verificarToken } from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/rbacMiddlewares.js';

export const metodoPrueba = async (req, res, next) => {
    try {
        await verificarToken(req, res, async () => {
            console.log("Token verificado");
            await checkPermission('read_record')(req, res, async () => {
                console.log("Tiene permiso");
                res.status(200).json({ status: 'success',message: 'Acceso permitido', user: req.user, permissions: req.permissions });
            });
        });
    } catch (error) {
        next(error);
    }
};
