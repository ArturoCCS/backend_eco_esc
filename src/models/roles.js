import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Rol = sequelize.define("Rol", {
    id_rol: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "rol",
    timestamps: false,
  }
);

export default Rol;
