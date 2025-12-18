import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from '../src/auth/passport.js';
import { recomputeEmergentThemes } from '../src/jobs/trending.cron.js';
import { loadUserContext } from '../src/middlewares/access.sequelize.js';
import aiRoutes from '../src/routes/ai.routes.js';
import authRoutes from '../src/routes/auth.routes.js';
import autorRoutes from '../src/routes/autor.routes.js';
import blogsRoutes from '../src/routes/blogs.routes.js';
import catalogRoutes from '../src/routes/catalog.routes.js';
import categoriaRoutes from '../src/routes/categoria.routes.js';
import librosRoutes from '../src/routes/libro.routes.js';
import plataformRouter from '../src/routes/plataform.routes.js';
import psychRouter from '../src/routes/psych.routes.js';
import simRoutes from '../src/routes/sim.routes.js';
import subjectsRouter from '../src/routes/subjects.routes.js';
import userRouter from '../src/routes/user.routes.js';
import '../src/utils/cronJobs.js';



import { calcularRiesgo } from '../src/motor/core.js';

const app = express();

const PORT = process.env.PORT || 3000;
const URL_BACKEND = process.env.URL_BACKEND || `http://localhost:${PORT}`;
const KEY = process.env.KEY || 'secret';
const URL_FRONTEND = process.env.URL_FRONTEND || 'http://localhost:8080';

app.use(cors({
  origin: URL_FRONTEND,
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
app.use('/user', userRouter);
app.use('/libros', librosRoutes);
app.use('/autor', autorRoutes);
app.use('/categoria', categoriaRoutes);
app.use('/plataform', plataformRouter);
app.use('/ai', aiRoutes);
app.use('/api/blogs', loadUserContext, blogsRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/psych', loadUserContext, psychRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/simulate', simRoutes);

app.post('/api/calc', (req, res) => {
  try {
    const resultado = calcularRiesgo(req.body);
    res.json(resultado);
  } catch (err) {
    console.error('Error /api/calc:', err);
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Servidor corriendo en ${URL_BACKEND}`);
  } else {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  }
});

if (process.env.CRON_TRENDS !== 'off') {
  const run = async () => {
    try { await recomputeEmergentThemes({ days: 90 }) } catch (e) { }
  };
  run();
  setInterval(run, 6 * 60 * 60 * 1000);
}