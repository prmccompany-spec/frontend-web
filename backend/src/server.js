import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import authRoutes from './routes/authRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import addressProofRoutes from './routes/addressProofRoutes.js';
import userTypeRoutes from './routes/userTypeRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import routePermissionRoutes from './routes/routePermissionRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import serviceRequestRoutes from './routes/serviceRequestRoutes.js';
import pendingPaymentRoutes from './routes/pendingPaymentRoutes.js';
import rentalProductRoutes from './routes/rentalProductRoutes.js';
import rentalRoutes from './routes/rentalRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import memberStatusRoutes from './routes/memberStatusRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
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
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/address-proofs', addressProofRoutes);
app.use('/api/user-types', userTypeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/route-permissions', routePermissionRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/pending-payments', pendingPaymentRoutes);
app.use('/api/rental-products', rentalProductRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/member-statuses', memberStatusRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/branches', branchRoutes);

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
