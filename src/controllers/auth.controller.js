import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import passport from "../auth/passport.js";
import User from "../models/user.js";
import { sendConfirmationEmail } from '../services/emailService.js';

export const register = async (req, res) => {
  let { nombre, email, password, id_rol } = req.body;

  if (!nombre || !email || !password) {
    return res
      .status(400)
      .json({ status: "error", message: "Faltan datos requeridos" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ status: "error", message: "Correo electrónico no válido" });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      status: "error",
      message:
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial",
    });
  }

  const id_rol_usuario_autenticado = req.user ? req.user.id_rol : null;
  id_rol = id_rol || process.env.ROL_USER;

  if ([process.env.ROL_ADMIN, process.env.ROL_ENCARGADO].includes(id_rol)) {
    if (
      !id_rol_usuario_autenticado ||
      id_rol_usuario_autenticado !== process.env.ROL_ADMIN
    ) {
      return res
        .status(403)
        .json({
          status: "error",
          message: "No tienes permisos para asignar este rol",
        });
    }
  }

  try {
    const usuarioExistente = await User.findOne({ where: { email } });
    if (usuarioExistente) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "El correo electrónico ya está registrado.",
        });
    }

    const confirmationToken = crypto.randomBytes(20).toString("hex");
    const confirmationExpires = Date.now() + 3600000; 

    const usuarioCreado = await User.create({
      nombre,
      email,
      password,
      id_rol,
      confirmationToken,
      confirmationExpires,
    });

    sendConfirmationEmail(email, confirmationToken);

    return res
      .status(201)
      .json({
        status: "success",
        message:
          "Usuario registrado con éxito. Verifica tu correo para confirmar tu cuenta.",
      });
  } catch (error) {
    return res
      .status(500)
      .json({
        status: "error",
        message: "Error interno del servidor",
        error: error.message,
      });
  }
};

export const confirmEmail = async (req, res) => {
    const { token } = req.params;
  
    try {
      const user = await User.findOne({ 
        where: { 
          confirmationToken: token, 
          confirmationExpires: { [Op.gt]: Date.now() } 
        }
      });
  
      if (!user) {
        return res.status(400).json({ status: "error", message: "Token inválido o expirado" });
      }
  
      user.isConfirmed = true;
      user.confirmationToken = null;  
      user.confirmationExpires = null;  
      await user.save();
  
      return res.status(200).json({ status: "success", message: "Correo confirmado exitosamente" });
    } catch (error) {
      return res.status(500).json({ status: "error", message: "Error interno del servidor", error: error.message });
    }
  };

  export const login = async (req, res, next) => {
    passport.authenticate("local", async (err, usuario, info) => {
      if (err) {
        return res.status(500).json({ message: "Error interno del servidor" });
      }
  
      if (!usuario) {
        return res.status(400).json({ message: info.message });
      }

      if (!usuario.isConfirmed) {
        return res.status(400).json({
          message: "Por favor, confirma tu correo electrónico antes de iniciar sesión.",
        });
      }
  
      const token = usuario.generateAuthToken();
  
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 24 * 60 * 60 * 1000,
      });
  
      return res.status(200).json({ status: "success", message: "Autenticado correctamente", token });
    })(req, res, next);
  };
  

export const withGoogle = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const callbackGoogle = async (req, res, next) => {
  passport.authenticate("google", { failureRedirect: "/" }, async (err, user) => {
    if (err || !user) {
      return res.redirect("/");
    }

    if (!user.isConfirmed) {
      const confirmationToken = crypto.randomBytes(20).toString("hex");
      const confirmationExpires = Date.now() + 3600000; 

      user.confirmationToken = confirmationToken;
      user.confirmationExpires = confirmationExpires;
      await user.save();

      sendConfirmationEmail(user.email, confirmationToken);

      return res.redirect("http://localhost:8080/confirmation-required");
    }

    const token = user.generateAuthToken();
    res.cookie("token", token, { httpOnly: true, secure: true });

    return res.redirect("http://localhost:8080/protected-route");
  })(req, res, next);
};


export const withMicrosoft = passport.authenticate("microsoft", {
  scope: ["openid", "User.Read", "offline_access"],
});

export const callbackMicrosoft = async (req, res, next) => {
  passport.authenticate("microsoft", { failureRedirect: "/" }, async (err, user) => {
    if (err || !user) {
      return res.redirect("/");
    }

    if (!user.isConfirmed) {
      const confirmationToken = crypto.randomBytes(20).toString("hex");
      const confirmationExpires = Date.now() + 3600000; 

      user.confirmationToken = confirmationToken;
      user.confirmationExpires = confirmationExpires;
      await user.save();

      sendConfirmationEmail(user.email, confirmationToken);

      return res.redirect("http://localhost:8080/confirmation-required");
    }

    const token = user.generateAuthToken();
    res.cookie("token", token, { httpOnly: true, secure: true });

    return res.redirect("http://localhost:8080/protected-route");
  })(req, res, next);
};


export const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  return res
    .status(200)
    .json({ status: "success", message: "Sesión cerrada correctamente" });
};

export const checkAuth = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .json({ status: "error", message: "No autenticado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await User.findByPk(decoded.id);
    if (!usuario) {
      return res
        .status(401)
        .json({ status: "error", message: "Usuario no encontrado" });
    }

    return res.status(200).json({
      status: "success",
      message: "Autenticado correctamente",
      user: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        email: usuario.email,
        id_rol: usuario.id_rol,
        token: token,
      },
    });
  } catch (error) {
    return res
      .status(401)
      .json({ status: "error", message: "Token inválido o expirado" });
  }
};