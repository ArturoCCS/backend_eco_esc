import bcrypt from 'bcryptjs'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as MicrosoftStrategy } from 'passport-microsoft'
import User from '../models/user.js'

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:3000'
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
  callbackURL: `${BACKEND_BASE_URL}/auth/google/callback`,
  passReqToCallback: false
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = getGoogleEmail(profile)
    if (!email) return done(null, false, { message: 'No se pudo obtener el email del perfil de Google' })

    let user = await User.findOne({ where: { email } })
    if (!user) {
      const id_rol = await resolveRoleForEmail(email) ?? normalizeRoleId(process.env.ROL_USER, 1)
      const isConfirmed = isGoogleEmailVerified(profile)
      user = await User.create({
        nombre: profile.displayName || email.split('@')[0],
        email,
        password: null,
        id_rol,
        isConfirmed
      })
      user = await User.findOne({ where: { email } })
    }
    if (!user?.id_usuario) return done(new Error('El usuario no tiene un ID válido después de Google Auth'))
    return done(null, user)
  } catch (err) {
    return done(err, null)
  }
}))

passport.use(new MicrosoftStrategy({
  clientID: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  callbackURL: `${BACKEND_BASE_URL}/auth/microsoft/callback`,
  scope: ['openid', 'User.Read', 'offline_access'],
  authorizationURL: `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/authorize`,
  tokenURL: `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/token`,
  passReqToCallback: false
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = getMsEmail(profile)
    if (!email) return done(null, false, { message: 'No se pudo obtener el email de Microsoft' })

    const isInstitutional = email.toLowerCase().endsWith('@zitacuaro.tecnm.mx')

    let idRolEstudiante = Number(process.env.ROL_ESTUDIANTE) || Number(process.env.ROL_USER) || 1
    if (EmailDomainRole) {
      const map = await EmailDomainRole.findOne({ where: { domain: 'zitacuaro.tecnm.mx' } })
      if (map?.id_rol) idRolEstudiante = Number(map.id_rol)
    }

    let user = await User.findOne({ where: { email } })
    if (!user) {
      user = await User.create({
        nombre: profile.displayName || email.split('@')[0],
        email,
        password: null,
        id_rol: isInstitutional ? idRolEstudiante : (Number(process.env.ROL_USER) || 1),
        isConfirmed: isInstitutional ? true : false
      })
      user = await User.findOne({ where: { email } })
    } else {
      const ROL_ADMIN = Number(process.env.ROL_ADMIN)
      const ROL_DOCENTE = Number(process.env.ROL_ENCARGADO)
      const privileged = [ROL_ADMIN, ROL_DOCENTE].includes(Number(user.id_rol))

      if (isInstitutional && !privileged && user.id_rol !== idRolEstudiante) {
        user.id_rol = idRolEstudiante
      }
      if (isInstitutional && !user.isConfirmed) {
        user.isConfirmed = true
        user.confirmationToken = null
        user.confirmationExpires = null
      }
      await user.save()
    }

    if (!user?.id_usuario) return done(new Error('El usuario no tiene ID válido tras Microsoft Auth'))
    return done(null, user)
  } catch (err) {
    return done(err, null)
  }
}))

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

export default passport