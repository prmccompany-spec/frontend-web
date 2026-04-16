import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import addressProofRoutes from './routes/addressProofRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializePool } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/address-proofs', addressProofRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const startServer = async () => {
  await initializePool();

  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

export default app;
