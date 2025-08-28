import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
    const token = req.cookies.token; 
    if (!token) {
        return res.status(401).json({ message: "Acceso denegado" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  
        next();  
    } catch (error) {
        res.status(400).json({ message: "Token no válido" });
    }
};

