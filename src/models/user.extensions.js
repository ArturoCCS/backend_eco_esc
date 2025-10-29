import bcrypt from 'bcryptjs'
import EmailDomainRole from './email_Domain_Role.js'
import Rol from './roles.js'

export function extendUserModel(User) {
  if (!User.prototype.verifyPassword) {
    User.prototype.verifyPassword = async function (plain) {
      if (!this.password) return false
      return bcrypt.compare(plain, this.password)
    }
  }

  if (!User.resolveRoleForEmail) {
    User.resolveRoleForEmail = async function (email) {
      const domain = String(email.split('@')[1] || '').toLowerCase()
      if (!domain) return { id_rol: null, require_verified: false }

      const map = await EmailDomainRole.findOne({ where: { domain } })
      if (map) {
        return { id_rol: map.id_rol, require_verified: !!map.require_verified }
      }

      const fallback = await Rol.findOne({ where: { nombre: 'Usuario' } })
      return { id_rol: fallback?.id_rol || null, require_verified: false }
    }
  }
}