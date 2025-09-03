require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { validateEnvironment } = require('./config/environment');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Validate environment before starting
validateEnvironment();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'capacitor://localhost', 'ionic://localhost'],
  methods: ['GET', 'POST'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Middleware for parsing JSON (except for webhooks)
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());

// Routes
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/webhooks', require('./routes/webhooks'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use(notFoundHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SportDogLog API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});