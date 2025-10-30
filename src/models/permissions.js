import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rolesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../config/roles.json"), "utf8")
);

class Permissions {
  constructor() {
    this.roles = rolesData.roles;
  }

  getPermissionsByRoleName(roleName) {
    const role = this.roles.find((r) => r.name === roleName);
    return role ? role.permissions : [];
  }
}

export default Permissions;
