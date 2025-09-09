import express from 'express';
import { getUserNameById, requestPasswordReset, resetPassword } from '../controllers/user.controller.js';
const router = express.Router();

router.post('/password-reset', requestPasswordReset);
router.post('/reset-password/:recoveryToken', resetPassword);
router.get('/:id', getUserNameById);
export default router;