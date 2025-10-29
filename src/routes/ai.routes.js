import express from 'express'
import { chat, health } from '../controllers/ai.controller.js'

const router = express.Router()

router.get('/health', health)

router.post('/chat', chat)

export default router