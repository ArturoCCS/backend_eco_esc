import { User } from '../boot/models.js';

export async function assignRoleForEmail(email) {
  const { id_rol, require_verified } = await User.resolveRoleForEmail(email)
  return { id_rol, require_verified }
}