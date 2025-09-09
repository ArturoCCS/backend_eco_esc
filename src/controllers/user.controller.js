import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Op } from 'sequelize';
import User from '../models/user.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

export const getUserNameById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id, {
      attributes: ['id_usuario', 'nombre']
    });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({nombre: user.nombre });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const recoveryToken = crypto.randomBytes(32).toString('hex');
    const recoveryExpires = new Date(Date.now() + 3600000);

    user.recoveryToken = recoveryToken;
    user.recoveryExpires = recoveryExpires;
    await user.save();

    sendPasswordResetEmail(user.email, recoveryToken);

    res.json({ message: 'Correo de recuperación enviado' });

  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};


export const resetPassword = async (req, res) => {
    const { recoveryToken } = req.params; 
    const { password } = req.body;  
  
    try {
        const user = await User.findOne({
            where: {
              recoveryToken,
              recoveryExpires: { [Op.gt]: new Date() }  
            }
        });

        if (!user) {
          return res.status(400).json({ message: 'Token inválido o expirado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.recoveryToken = null;  
        user.recoveryExpires = null;  
        await user.save();

        res.json({ message: 'Contraseña restablecida con éxito' });
    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        res.status(500).json({ message: 'Error en el servidor', error });
    }
};

export const verifyResetToken = async (req, res) => {
    const { recoveryToken } = req.params; 

    try {
        const user = await User.findOne({
            where: {
                recoveryToken, 
                recoveryExpires: { [Op.gt]: new Date() }, 
            },
        });

        if (!user) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }

        res.json({ message: 'Token válido', status: 'success' });
    } catch (error) {
        console.error('Error al verificar el token:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
