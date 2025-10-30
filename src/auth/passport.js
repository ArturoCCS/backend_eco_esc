import bcrypt from 'bcryptjs'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as MicrosoftStrategy } from 'passport-microsoft'
import User from '../models/user.js'

const URL_BACKEND = process.env.URL_BACKEND || 'http://localhost:3000'
const MS_TENANT = process.env.MICROSOFT_TENANT_ID || 'common'

let EmailDomainRole, Rol
try {
  EmailDomainRole = (await import('../models/EmailDomainRole.js')).default
  Rol = (await import('../models/Rol.js')).default
} catch (_) {
}

function normalizeRoleId(val, fallback = null) {
  const n = Number(val)
  return Number.isFinite(n) ? n : fallback
}

async function resolveRoleForEmail(email) {
  try {
    const domain = String(email.split('@')[1] || '').toLowerCase()
    if (!domain || !EmailDomainRole) {
      const envRol = normalizeRoleId(process.env.ROL_USER, null)
      if (envRol != null) return envRol
      if (Rol) {
        const r = await Rol.findOne({ where: { nombre: 'Usuario' } })
        if (r?.id_rol) return Number(r.id_rol)
      }
      return null
    }
    const map = await EmailDomainRole.findOne({ where: { domain } })
    if (map?.id_rol) return Number(map.id_rol)
  } catch (_) {}
  const envRol = normalizeRoleId(process.env.ROL_USER, null)
  return envRol
}

function getGoogleEmail(profile) {
  return profile?.emails?.[0]?.value || null
}
function isGoogleEmailVerified(profile) {
  return !!(profile?._json?.email_verified || profile?.emails?.[0]?.verified)
}
function getMsEmail(profile) {
  return profile?.emails?.[0]?.value || profile?._json?.mail || profile?._json?.userPrincipalName || null
}

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const usuario = await User.findOne({ where: { email } })
    if (!usuario) return done(null, false, { message: 'Credenciales incorrectas' })
    if (!usuario.password) {
      return done(null, false, {
        message: 'Verifica tu método de inicio de sesión. Si te registraste con Google o Microsoft, usa ese método para acceder.'
      })
    }
    const ok = await bcrypt.compare(password, usuario.password)
    if (!ok) return done(null, false, { message: 'Credenciales incorrectas' })
    return done(null, usuario)
  } catch (error) {
    return done(error)
  }
}))

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${URL_BACKEND}/auth/google/callback`
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = getGoogleEmail(profile);
    if (!email) return done(null, false, { message: 'No se pudo obtener el email' });

    const isVerified = isGoogleEmailVerified(profile);
    let user = await User.findOne({ where: { email } });

    user = await handleExternalUser(user, email, isVerified);

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.use(new MicrosoftStrategy({
  clientID: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  callbackURL: `${URL_BACKEND}/auth/microsoft/callback`,
  scope: ['openid','User.Read','offline_access']
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = getMsEmail(profile);
    if (!email) return done(null, false, { message: 'No se pudo obtener el email' });

    const isInstitutional = email.toLowerCase().endsWith('@zitacuaro.tecnm.mx');
    let user = await User.findOne({ where: { email } });

    user = await handleExternalUser(user, email, isInstitutional);

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));


passport.serializeUser((user, done) => {
  if (!user || !user.id_usuario) return done(new Error('El usuario no tiene un ID válido'))
  done(null, user.id_usuario)
})

passport.deserializeUser(async (id, done) => {
  try {
    const usuario = await User.findByPk(id)
    if (!usuario) return done(null, false)
    done(null, usuario)
  } catch (error) {
    done(error)
  }
})


async function handleExternalUser(user, profileEmail, isVerified = false) {
  let id_rol_final = Number(process.env.ROL_USER) || 1;
  let needsConfirmation = false;

  try {
    const domain = profileEmail.split('@')[1].toLowerCase();
    const map = await EmailDomainRole.findOne({ where: { domain } });
    if (map?.id_rol) id_rol_final = Number(map.id_rol);
    needsConfirmation = !!map?.require_verified && !isVerified;
  } catch (_) {}

  if (!user && !id_rol_final) {
    id_rol_final = Number(process.env.ROL_USER) || 1;
    needsConfirmation = !isVerified;
  }

  if (!user) {
    const confirmationToken = needsConfirmation ? crypto.randomBytes(20).toString('hex') : null;
    const confirmationExpires = needsConfirmation ? new Date(Date.now() + 3600000) : null;

    user = await User.create({
      nombre: profileEmail.split('@')[0],
      email: profileEmail,
      password: null,
      id_rol: id_rol_final,
      isConfirmed: !needsConfirmation,
      confirmationToken,
      confirmationExpires
    });

    if (needsConfirmation) await sendConfirmationEmail(profileEmail, confirmationToken);

  } else if (needsConfirmation && !user.isConfirmed) {
    user.confirmationToken = crypto.randomBytes(20).toString('hex');
    user.confirmationExpires = new Date(Date.now() + 3600000);
    await user.save();
    await sendConfirmationEmail(user.email, user.confirmationToken);
  }

  return user;
}


export default passport