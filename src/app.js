const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { setupSwagger } = require('./config/swagger');
const logger = require('./utils/logger');
const ApiError = require('./utils/apiError');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const basketRoutes = require('./routes/basket.routes');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
      imgSrc: ['\'self\'', 'data:', 'https:', 'http:', 'blob:'],
      connectSrc: ['\'self\''],
      fontSrc: ['\'self\'', 'https://fonts.gstatic.com', 'https://fonts.googleapis.com'],
      objectSrc: ['\'none\''],
      mediaSrc: ['\'self\''],
      frameSrc: ['\'none\'']
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false
}));

app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Setup Swagger
setupSwagger(app);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/basket', basketRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ignore Chrome DevTools requests
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).send();
});

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Error handler (Виправлено: додано коментар для eslint)
 
app.use((err, req, res, _next) => {
  logger.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: err.isOperational ? message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(err.errors && { details: err.errors })
  });
});

module.exports = app;