import cron from 'node-cron';
import { Op } from 'sequelize';
import User from '../models/user.js';

const deleteUnconfirmedUsers = async () => {
  const expiredUsers = await User.findAll({
    where: {
      confirmationExpires: { [Op.lt]: Date.now() },
      isConfirmed: false
    }
  });

  expiredUsers.forEach(async (user) => {
    await user.destroy();
    console.log(`Usuario no confirmado eliminado: ${user.email}`);
  });
};

// Programar la tarea para eliminar usuarios no confirmados cada día a las 00:00
cron.schedule('0 0 * * *', deleteUnconfirmedUsers);  // Ejecución diaria a las 00:00

export default cron;
