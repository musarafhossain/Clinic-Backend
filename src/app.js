import express from 'express';
import cors from 'cors';
import { UserRoutes, AuthRoutes, DiseaseRoutes, PatientRoutes } from './routes/index.js';
import verifyJwtToken from './middlewares/verifyJwtToken.js';
import passport from 'passport';
import './config/passport-jwt-strategy.js';

const app = express();

const corsOptions = {
  origin: [
    'https://musaraf.org.in',
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(passport.initialize());

app.use(express.json());
app.use('/api/auth', AuthRoutes);
app.use('/api/users', verifyJwtToken, passport.authenticate('jwt', { session: false }), UserRoutes);
app.use('/api/diseases', verifyJwtToken, passport.authenticate('jwt', { session: false }), DiseaseRoutes);
app.use('/api/patients', verifyJwtToken, passport.authenticate('jwt', { session: false }), PatientRoutes);
app.all('/', (req, res) => {
  res.json({ message: 'Server is running' });
});
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;