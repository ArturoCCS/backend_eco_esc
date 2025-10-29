import 'dotenv/config';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import passport from '../src/auth/passport.js';
import { loadUserContext } from '../src/middlewares/access.sequelize.js';
import aiRoutes from '../src/routes/ai.routes.js';
import authRoutes from '../src/routes/auth.routes.js';
import autorRoutes from '../src/routes/autor.routes.js';
import blogsRoutes from '../src/routes/blogs.routes.js';
import categoriaRoutes from '../src/routes/categoria.routes.js';
import librosRoutes from '../src/routes/libro.routes.js';
import plataformRouter from '../src/routes/plataform.routes.js';
import userRouter from '../src/routes/user.routes.js';

import { recomputeEmergentThemes } from '../src/jobs/trending.cron.js';
import catalogRoutes from '../src/routes/catalog.routes.js';

import '../src/utils/cronJobs.js';

const PORT = process.env.PORT;
const URL_BACKEND = process.env.URL_BACKEND ;
const KEY = process.env.KEY;

const app = express();

app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/user' , userRouter);
app.use('/libros', librosRoutes);
app.use('/autor', autorRoutes);
app.use('/categoria', categoriaRoutes);
app.use('/plataform', plataformRouter);
app.use('/ai', aiRoutes);
app.use('/api/blogs', loadUserContext, blogsRoutes)
app.use('/api/catalog', catalogRoutes)

app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Servidor corriendo en ${URL_BACKEND}:${PORT}`);
  }
});


if (process.env.CRON_TRENDS !== 'off') {
  const run = async () => {
    try { await recomputeEmergentThemes({ days: 90 }) } catch {}
  }
  run()
  setInterval(run, 6 * 60 * 60 * 1000)
}

