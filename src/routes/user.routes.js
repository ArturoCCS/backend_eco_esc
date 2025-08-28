import express from 'express';
import { requestPasswordReset, resetPassword } from '../controllers/user.controller.js';
const router = express.Router();

router.post('/password-reset', requestPasswordReset);
router.post('/reset-password/:recoveryToken', resetPassword);

export default router;