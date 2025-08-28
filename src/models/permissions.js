import roles from "../config/roles.json" assert { type: "json" };

class Permissions {
  constructor() {
    this.roles = roles.roles;
  }

  getPermissionsByRoleName(roleName) {
    const role = this.roles.find((r) => r.name === roleName);
    return role ? role.permissions : [];
  }
}

export default Permissions;
