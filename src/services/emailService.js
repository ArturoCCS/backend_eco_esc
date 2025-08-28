import ejs from 'ejs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import transporter from '../config/emailConfig.js';

const __filename = fileURLToPath(import.meta.url); 
const __dirname = dirname(__filename); 

export const sendConfirmationEmail = (to, confirmationToken) => {
  ejs.renderFile(join(__dirname, '../views/emailTemplates/confirmationEmail.ejs'), { 
    confirmationUrl: `http://localhost:8080/confirm/${confirmationToken}`
  }, (err, html) => {
    if (err) {
      return;
    }

    const mailOptions = {
      from: 'correo@example.com',
      to,
      subject: 'Confirmación de correo electrónico',
      html
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error al enviar el correo:', error);
      } else {
        console.log('Correo enviado:', info.response);
      }
    });
  });
};

export const sendPasswordResetEmail = (to, recoveryToken) => {
  ejs.renderFile(join(__dirname, '../views/emailTemplates/passwordReset.ejs'), { 
    resetLink: `http://localhost:8080/reset-password/${recoveryToken}`
  }, (err, html) => {
    if (err) {
      console.error('Error al renderizar el template de correo:', err);
      return;
    }

    const mailOptions = {
      from: 'correo@example.com',
      to,
      subject: 'Recuperación de contraseña',
      html
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error al enviar el correo de recuperación:', error);
      } else {
        console.log('Correo de recuperación enviado:', info.response);
      }
    });
  });
};
