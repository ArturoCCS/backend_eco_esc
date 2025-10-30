import crypto from 'crypto';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import EmailDomainRole from '../models/EmailDomainRole.js';
import User from '../models/user.js';

const URL_BACKEND = process.env.URL_BACKEND || 'http://localhost:3000';
const MS_TENANT = process.env.MICROSOFT_TENANT_ID || 'common';
const ROL_USER = Number(process.env.ROL_USER);
const ROL_ESTUDIANTE = Number(process.env.ROL_ESTUDIANTE);

function getGoogleEmail(profile) {
  return profile?.emails?.[0]?.value || null;
}
function isGoogleEmailVerified(profile) {
  return !!(profile?._json?.email_verified || profile?.emails?.[0]?.verified);
}
function getMsEmail(profile) {
  return profile?.emails?.[0]?.value || profile?._json?.mail || profile?._json?.userPrincipalName || null;
}

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${URL_BACKEND}/auth/google/callback`,
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = getGoogleEmail(profile);
    if (!email) return done(null, false, { message: 'No se pudo obtener el email de Google' });

    const domain = email.split('@')[1].toLowerCase();
    let idRol = ROL_USER;
    let isConfirmed = isGoogleEmailVerified(profile);

    if (domain === 'zitacuaro.tecnm.mx') {
      idRol = 1;
      isConfirmed = true;
    }

    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        nombre: profile.displayName || email.split('@')[0],
        email,
        password: null,
        id_rol: idRol,
        isConfirmed,
        confirmationToken: isConfirmed ? null : crypto.randomBytes(20).toString('hex'),
        confirmationExpires: isConfirmed ? null : new Date(Date.now() + 3600000)
      });
    } else {
      if (!user.isConfirmed && isConfirmed) {
        user.isConfirmed = true;
        user.confirmationToken = null;
        user.confirmationExpires = null;
        await user.save();
      }
      if (user.id_rol !== idRol) {
        user.id_rol = idRol;
        await user.save();
      }
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.use(new MicrosoftStrategy({
  clientID: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  callbackURL: `${URL_BACKEND}/auth/microsoft/callback`,
  scope: ['openid', 'User.Read', 'offline_access'],
  authorizationURL: `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/authorize`,
  tokenURL: `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/token`,
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = getMsEmail(profile);
    if (!email) return done(null, false, { message: 'No se pudo obtener el email de Microsoft' });

    const domain = email.split('@')[1].toLowerCase();
    let idRol = ROL_USER;
    let isConfirmed = false;

    if (domain === 'zitacuaro.tecnm.mx') {
      idRol = ROL_ESTUDIANTE;
      isConfirmed = true;
    } else {
      const map = await EmailDomainRole.findOne({ where: { domain } });
      if (map?.id_rol) idRol = Number(map.id_rol);
    }

    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        nombre: profile.displayName || email.split('@')[0],
        email,
        password: null,
        id_rol: idRol,
        isConfirmed,
        confirmationToken: isConfirmed ? null : crypto.randomBytes(20).toString('hex'),
        confirmationExpires: isConfirmed ? null : new Date(Date.now() + 3600000)
      });
    } else {
      if (!user.isConfirmed && isConfirmed) {
        user.isConfirmed = true;
        user.confirmationToken = null;
        user.confirmationExpires = null;
        await user.save();
      }
      if (user.id_rol !== idRol) {
        user.id_rol = idRol;
        await user.save();
      }
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id_usuario));
passport.deserializeUser(async (id, done) => {
  try {
    const usuario = await User.findByPk(id);
    done(null, usuario || false);
  } catch (err) {
    done(err);
  }
});

export default passport;
