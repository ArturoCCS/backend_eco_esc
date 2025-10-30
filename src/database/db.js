import dotenv from 'dotenv'
import { Sequelize } from 'sequelize'

dotenv.config()

const sequelize = new Sequelize(
  process.env.DB_NAME || 'base_de_datos',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    dialect: 'mysql',
    logging: false,
    timezone: '+00:00',
    dialectOptions: {
      dateStrings: true,
      typeCast: true
    }
  }
)

export default sequelize