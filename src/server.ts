import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// CORS origins - support both with and without trailing slash
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  'https://crm.immersivetrips.in',
  'http://localhost:3000'
].filter(Boolean);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,  // Disable CSP for React app compatibility
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ fileStatus: 'OK', message: 'Travel CRM API is running' });
});

// API Routes
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import bookingRoutes from './routes/booking.routes';
import ticketRoutes from './routes/ticket.routes';
import tourFileRoutes from './routes/tourfile.routes';
import guideRoutes from './routes/guide.routes';
import hotelRoutes from './routes/hotel.routes';
import documentRoutes from './routes/document.routes';
import emailRoutes from './routes/email.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reminderRoutes from './routes/reminder.routes';
import notificationRoutes from './routes/notification.routes';
import importRoutes from './routes/import.routes';

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/tourfiles', tourFileRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/import', importRoutes);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});
