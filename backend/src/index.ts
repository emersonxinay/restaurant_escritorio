import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import sequelize from './config/database';
import { specs } from './config/swagger';
import { setupAssociations } from './models/index';
import Reservation from './models/Reservation';
import User from './models/User';
import { Op } from 'sequelize';
import { createServer } from 'http';
import { socketService } from './services/socket';
import path from 'path';
import { fileURLToPath } from 'url';




// Import routes
import authRoutes from './routes/auth';
import publicRoutes from './routes/public';
import reservationRoutes from './routes/reservations';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import discountRoutes from './routes/discounts';
import stationRoutes from './routes/stations';
import tableRoutes from './routes/tables';
import paymentRoutes from './routes/payments';
import kdsRoutes from './routes/kds';
import waiterRoutes from './routes/waiter';
import cashierRoutes from './routes/cashier';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
socketService.init(httpServer);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false // Allow CORS for static files
}));
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files with proper CORS headers
app.use('/uploads', cors(), express.static(process.env.UPLOAD_DIR || 'uploads'));

// Serve React Frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    displayOperationId: true
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/kds', kdsRoutes);
app.use('/api/waiter', waiterRoutes);
app.use('/api/cashier', cashierRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Swagger UI redirect
app.get('/api-docs', (req, res) => {
  res.redirect('/api/docs');
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// React Router fallback (for all non-API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Initialize database and start server
sequelize
  .authenticate()
  .then(() => {
    console.log('✓ Database connection successful');
    // Setup associations before syncing
    setupAssociations();
    return sequelize.sync();
  })
  .then(() => {
    console.log('✓ Database models synchronized');
    
    
    // Check and seed admin user if not exists
    User.findOne({ where: { role: 'admin' } }).then(async (adminUser) => {
      if (!adminUser) {
        console.log('No admin user found. Creating default admin...');
        const admin = await User.create({ username: 'admin', password_hash: '', role: 'admin' });
        await admin.setPassword('admin123');
        await admin.save();
        console.log('Default admin created: admin / admin123');
      }
    }).catch(err => console.error('Error seeding admin:', err));
    
    // Start background job to check no-show reservations
    const checkNoShowReservations = async () => {
      try {
        const reservations = await Reservation.findAll({
          where: {
            status: {
              [Op.in]: ['pending', 'confirmed']
            }
          }
        });

        const now = new Date();
        const fourHoursInMs = 4 * 60 * 60 * 1000;

        for (const res of reservations) {
          const resDate = new Date(res.date);
          const [hours, minutes] = res.time.split(':').map(Number);
          resDate.setHours(hours, minutes, 0, 0);

          if (now.getTime() - resDate.getTime() > fourHoursInMs) {
            res.status = 'no_show';
            await res.save();
            console.log(`Reservation ${res.id} marked as no_show (4 hours passed)`);
          }
        }
      } catch (error) {
        console.error('Error checking no-show reservations:', error);
      }
    };
    
    // Run immediately and then every 15 minutes
    checkNoShowReservations();
    setInterval(checkNoShowReservations, 15 * 60 * 1000);

    httpServer.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`✓ Server running on http://0.0.0.0:${PORT}`);
      console.log(`✓ API Documentation available at http://localhost:${PORT}/api/docs`);
      console.log(`✓ CORS enabled for ${process.env.CORS_ORIGIN}`);
    });
  })
  .catch((error) => {
    console.error('✗ Database connection failed:', error); console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  });

export default app;
