import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import passport from '../auth/passport.js';
import EmailDomainRole from '../models/email_Domain_Role.js';
import Rol from '../models/roles.js';
import User from '../models/user.js';
import { sendConfirmationEmail } from '../services/emailService.js';

const URL_FRONTEND = process.env.URL_FRONTEND || 'http://localhost:5173';

function tokenCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    maxAge: 24 * 60 * 60 * 1000
  };
}

async function resolveRoleForEmail(email) {
  try {
    const domain = String(email.split('@')[1] || '').toLowerCase();
    if (!domain) return null;
    const map = await EmailDomainRole.findOne({ where: { domain } });
    if (map) return { id_rol: Number(map.id_rol), require_verified: !!map.require_verified };
  } catch (_) {}

  if (process.env.ROL_USER) return { id_rol: Number(process.env.ROL_USER), require_verified: false };
  try {
    const r = await Rol.findOne({ where: { nombre: 'Usuario' } });
    if (r) return { id_rol: Number(r.id_rol), require_verified: false };
  } catch (_) {}
  return null;
}

export const register = async (req, res) => {
  const { nombre, email, password, id_rol } = req.body;
  if (!nombre || !email || !password)
    return res.status(400).json({ status: 'error', message: 'Faltan datos requeridos' });

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ status: 'error', message: 'Contraseña inválida' });
  }

  try {
    const usuarioExistente = await User.findOne({ where: { email } });
    if (usuarioExistente) return res.status(400).json({ status: 'error', message: 'Email ya registrado' });

    let idRolFinal = Number(process.env.ROL_USER);
    let requireVerifiedByDomain = false;

    const domainMap = await resolveRoleForEmail(email);
    if (domainMap?.id_rol) {
      idRolFinal = domainMap.id_rol;
      requireVerifiedByDomain = !!domainMap.require_verified;
    }

    const confirmationToken = crypto.randomBytes(20).toString('hex');
    const confirmationExpires = new Date(Date.now() + 3600000);

    const usuarioCreado = await User.create({
      nombre, email, password,
      id_rol: idRolFinal,
      confirmationToken,
      confirmationExpires,
      isConfirmed: requireVerifiedByDomain ? false : true
    });

    try { await sendConfirmationEmail(email, confirmationToken); } catch (_) {}

    return res.status(201).json({ status: 'success', message: 'Usuario registrado, revisa tu correo.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Error interno', error: err.message });
  }
};

export const login = async (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) return res.status(500).json({ message: 'Error interno' });
    if (!user) return res.status(400).json({ message: info.message });
    if (!user.isConfirmed) return res.status(400).json({ message: 'Confirma tu correo primero.' });

    const token = user.generateAuthToken();
    res.cookie('token', token, tokenCookieOptions());
    return res.status(200).json({ status: 'success', message: 'Autenticado', token, user });
  })(req, res, next);
};

export const confirmEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({
      where: { confirmationToken: token, confirmationExpires: { [Op.gt]: new Date() } }
    });
    if (!user) return res.status(400).json({ status: 'error', message: 'Token inválido o expirado' });

    user.isConfirmed = true;
    user.confirmationToken = null;
    user.confirmationExpires = null;
    await user.save();
    return res.status(200).json({ status: 'success', message: 'Correo confirmado' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Error interno', error: err.message });
  }
};

export const withGoogle = passport.authenticate('google', { scope: ['profile', 'email'] });

export const callbackGoogle = (req, res, next) => {
  passport.authenticate('google', { failureRedirect: '/' }, async (err, user) => {
    if (err || !user) return res.redirect('/');
    
    if (!user.isConfirmed) {
      user.isConfirmed = true;
      user.confirmationToken = null;
      user.confirmationExpires = null;
      await user.save();
    }

    const token = user.generateAuthToken();
    res.cookie('token', token, tokenCookieOptions());
    return res.redirect(`${URL_FRONTEND}/protected-route`);
  })(req, res, next);
};

export const withMicrosoft = passport.authenticate('microsoft', { scope: ['openid', 'User.Read', 'offline_access'] });

export const callbackMicrosoft = (req, res, next) => {
  passport.authenticate('microsoft', { failureRedirect: '/' }, async (err, user) => {
    if (err || !user) return res.redirect('/');

    if (!user.isConfirmed) {
      user.isConfirmed = true;
      user.confirmationToken = null;
      user.confirmationExpires = null;
      await user.save();
    }

    const token = user.generateAuthToken();
    res.cookie('token', token, tokenCookieOptions());
    return res.redirect(`${URL_FRONTEND}/protected-route`);
  })(req, res, next);
};

export const checkAuth = async (req, res) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ status: 'error', message: 'No autenticado' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ status: 'error', message: 'Usuario no encontrado' });

    return res.status(200).json({
      status: 'success',
      message: 'Autenticado correctamente',
      user: { id_usuario: user.id_usuario, nombre: user.nombre, email: user.email, id_rol: user.id_rol },
      token
    });
  } catch {
    return res.status(401).json({ status: 'error', message: 'Token inválido o expirado' });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token', tokenCookieOptions());
  return res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
};
