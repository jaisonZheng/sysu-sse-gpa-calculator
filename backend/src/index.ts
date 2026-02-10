import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { initDatabase, cleanupOldData } from './database';
import manualRoutes from './routes/manual';
import autoRoutes from './routes/auto';
import courseRoutes from './routes/courses';

const app = express();
const PORT = process.env.PORT || 3002;

// Trust proxy (needed for express-rate-limit behind Nginx)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: '请求过于频繁，请稍后重试' }
});
app.use(limiter);

// Stricter rate limiting for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: '登录尝试次数过多，请15分钟后再试' }
});
app.use('/api/auto/login', loginLimiter);

// Routes
app.use('/api/manual', manualRoutes);
app.use('/api/auto', autoRoutes);
app.use('/api/courses', courseRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// Initialize database
initDatabase();

// Cleanup old data every hour
setInterval(() => {
  cleanupOldData(24);
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
