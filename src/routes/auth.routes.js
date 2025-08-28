import express from 'express';
import {
    callbackGoogle,
    callbackMicrosoft,
    checkAuth,
    confirmEmail,
    login,
    logout,
    register,
    withGoogle,
    withMicrosoft
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.get('/confirm/:token', confirmEmail); 
router.post('/login', login);
router.post('/logout', logout);
router.get('/check-auth', checkAuth);
router.get('/google', withGoogle);
router.get('/microsoft', withMicrosoft);
router.get('/google/callback', callbackGoogle);
router.get('/microsoft/callback', callbackMicrosoft);

export default router;